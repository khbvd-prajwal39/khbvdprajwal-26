import { createClient } from "npm:@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const phonePeBaseUrl = "https://api-preprod.phonepe.com/apis/pg-sandbox";
const tierColumns = {
  essential: ["essential_price", "essential_doctor_payout"],
  essential_plus: ["essential_plus_price", "essential_plus_doctor_payout"],
  audio: ["audio_price", "audio_doctor_payout"],
  video: ["video_price", "video_doctor_payout"],
} as const;
type TierId = keyof typeof tierColumns;

type PriceRow = Record<string, number | string | null> & { id: string; full_name: string; specialty: string };

type PhonePeResponse = {
  success?: boolean;
  code?: string;
  message?: string;
  data?: { instrumentResponse?: { redirectInfo?: { url?: string } } };
};

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function sha256(value: string): Promise<string> {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest)).map(byte => byte.toString(16).padStart(2, "0")).join("");
}

function getServiceClient() {
  return createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
}

async function getUser(req: Request) {
  const authorization = req.headers.get("Authorization");
  if (!authorization?.startsWith("Bearer ")) return null;
  const client = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, { global: { headers: { Authorization: authorization } } });
  const { data } = await client.auth.getUser();
  return data.user ?? null;
}

function validateReturnUrl(value: unknown, origin: string | null): string {
  if (typeof value !== "string") throw new Error("Return URL is required");
  const url = new URL(value);
  if (!/^https?:$/.test(url.protocol)) throw new Error("Invalid return URL");
  if (origin && new URL(origin).origin !== url.origin) throw new Error("Invalid return URL origin");
  return url.toString();
}

async function createPayment(req: Request, userId: string): Promise<Response> {
  const body = await req.json() as { doctorProfileId?: string; tierId?: string; returnUrl?: string };
  const tierId = body.tierId as TierId;
  if (!body.doctorProfileId || !(tierId in tierColumns)) return json({ error: "Invalid consultation selection" }, 400);
  const returnUrl = validateReturnUrl(body.returnUrl, req.headers.get("Origin"));
  const [priceColumn, payoutColumn] = tierColumns[tierId];
  const service = getServiceClient();
  const { data: doctor, error: doctorError } = await service
    .from("doctor_profiles")
    .select(`id, full_name, specialty, ${priceColumn}, ${payoutColumn}`)
    .eq("id", body.doctorProfileId)
    .eq("approval_status", "approved")
    .maybeSingle<PriceRow>();
  if (doctorError || !doctor) return json({ error: "This doctor is not available for payment" }, 404);

  const amount = Number(doctor[priceColumn]);
  const doctorPayout = Number(doctor[payoutColumn]);
  if (!Number.isFinite(amount) || amount <= 0 || !Number.isFinite(doctorPayout) || doctorPayout < 0 || doctorPayout > amount) {
    return json({ error: "This doctor does not have a consultation price yet" }, 409);
  }

  const merchantId = Deno.env.get("PHONEPE_MERCHANT_ID");
  const saltKey = Deno.env.get("PHONEPE_SALT_KEY");
  const saltIndex = Deno.env.get("PHONEPE_SALT_INDEX");
  if (!merchantId || !saltKey || !saltIndex) return json({ error: "Payment service is not configured" }, 503);

  const merchantTransactionId = `KHBVD${crypto.randomUUID().replaceAll("-", "").slice(0, 28)}`;
  const platformFee = Math.round((amount - doctorPayout) * 100) / 100;
  const { data: payment, error: paymentError } = await service.from("payment_records").insert({
    patient_id: userId,
    doctor_id: doctor.id,
    payment_method: "phonepe",
    amount,
    brokerage: platformFee,
    doctor_payout: doctorPayout,
    status: "pending",
    phonepe_order_id: merchantTransactionId,
  }).select("id").maybeSingle<{ id: string }>();
  if (paymentError || !payment) return json({ error: "Could not create payment order" }, 500);

  const callbackUrl = `${Deno.env.get("SUPABASE_URL")}/functions/v1/phonepe-payment?action=callback`;
  const payload = {
    merchantId,
    merchantTransactionId,
    merchantUserId: userId,
    amount: Math.round(amount * 100),
    redirectUrl: `${returnUrl}${returnUrl.includes("?") ? "&" : "?"}phonepe_order=${merchantTransactionId}`,
    redirectMode: "REDIRECT",
    callbackUrl,
    paymentInstrument: { type: "PAY_PAGE" },
  };
  const encodedPayload = btoa(JSON.stringify(payload));
  const checksum = `${await sha256(`${encodedPayload}/pg/v1/pay${saltKey}`)}###${saltIndex}`;
  const response = await fetch(`${phonePeBaseUrl}/pg/v1/pay`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-VERIFY": checksum },
    body: JSON.stringify({ request: encodedPayload }),
  });
  const result = await response.json() as PhonePeResponse;
  const redirectUrl = result.data?.instrumentResponse?.redirectInfo?.url;
  if (!response.ok || !result.success || !redirectUrl) {
    await service.from("payment_records").update({ status: "failed" }).eq("id", payment.id);
    return json({ error: "PhonePe could not start this payment" }, 502);
  }
  return json({ paymentId: payment.id, merchantTransactionId, redirectUrl });
}

async function checkPayment(req: Request, userId: string, requestedOrderId?: string): Promise<Response> {
  const url = new URL(req.url);
  const merchantTransactionId = requestedOrderId ?? url.searchParams.get("merchantTransactionId");
  if (!merchantTransactionId) return json({ error: "Payment order is required" }, 400);
  const merchantId = Deno.env.get("PHONEPE_MERCHANT_ID");
  const saltKey = Deno.env.get("PHONEPE_SALT_KEY");
  const saltIndex = Deno.env.get("PHONEPE_SALT_INDEX");
  if (!merchantId || !saltKey || !saltIndex) return json({ error: "Payment service is not configured" }, 503);
  const service = getServiceClient();
  const { data: payment } = await service.from("payment_records").select("id, status, amount, doctor_payout, brokerage").eq("patient_id", userId).eq("phonepe_order_id", merchantTransactionId).maybeSingle();
  if (!payment) return json({ error: "Payment order not found" }, 404);

  const path = `/pg/v1/status/${merchantId}/${merchantTransactionId}`;
  const checksum = `${await sha256(`${path}${saltKey}`)}###${saltIndex}`;
  const response = await fetch(`${phonePeBaseUrl}${path}`, { headers: { "Content-Type": "application/json", "X-VERIFY": checksum, "X-MERCHANT-ID": merchantId } });
  const result = await response.json() as { success?: boolean; code?: string; data?: { state?: string; transactionId?: string } };
  const state = result.data?.state;
  if (state === "COMPLETED") {
    await service.from("payment_records").update({ status: "paid", phonepe_transaction_id: result.data?.transactionId ?? null }).eq("id", payment.id);
    return json({ status: "paid", amount: payment.amount, doctorPayout: payment.doctor_payout, platformFee: payment.brokerage });
  }
  if (state === "FAILED") await service.from("payment_records").update({ status: "failed" }).eq("id", payment.id);
  return json({ status: state === "FAILED" ? "failed" : "pending" });
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 200, headers: corsHeaders });
  try {
    const user = await getUser(req);
    const url = new URL(req.url);
    if (url.searchParams.get("action") === "callback") return json({ received: true });
    if (!user) return json({ error: "Authentication required" }, 401);
    if (req.method === "POST") {
      const body = await req.clone().json().catch(() => ({})) as { action?: string; merchantTransactionId?: string };
      if (body.action === "status") return await checkPayment(req, user.id, body.merchantTransactionId);
      return await createPayment(req, user.id);
    }
    if (req.method === "GET") return await checkPayment(req, user.id);
    return json({ error: "Method not allowed" }, 405);
  } catch (error) {
    console.error("PhonePe payment request failed", error);
    return json({ error: "Payment request could not be completed" }, 500);
  }
});
