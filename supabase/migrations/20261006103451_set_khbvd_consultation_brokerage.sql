/*
# Set KHBV.D consultation brokerage schedule

1. Finance Rules
- ₹99 consultation: ₹30 platform brokerage and ₹69 doctor payout.
- ₹139 consultation: ₹45 platform brokerage and ₹94 doctor payout.
- ₹289 consultation: ₹55 platform brokerage and ₹234 doctor payout.
- ₹489 consultation: ₹299 platform brokerage and ₹190 doctor payout.

2. Security
- Brokerage is calculated from the approved server-side price schedule, not trusted from the browser.
*/

CREATE OR REPLACE FUNCTION record_khbvd_payment(p_amount numeric, p_method text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  payment_id uuid;
  platform_fee numeric;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Authentication required'; END IF;
  IF p_amount NOT IN (99, 139, 289, 489) THEN RAISE EXCEPTION 'Invalid consultation price'; END IF;
  IF p_method NOT IN ('card', 'paytm', 'phonepe', 'netbanking', 'upi') THEN RAISE EXCEPTION 'Invalid payment method'; END IF;
  platform_fee := CASE p_amount WHEN 99 THEN 30 WHEN 139 THEN 45 WHEN 289 THEN 55 WHEN 489 THEN 299 END;
  INSERT INTO payment_records (patient_id, payment_method, amount, brokerage, doctor_payout, status)
  VALUES (auth.uid(), p_method, p_amount, platform_fee, p_amount - platform_fee, 'paid')
  RETURNING id INTO payment_id;
  RETURN payment_id;
END;
$$;

REVOKE EXECUTE ON FUNCTION record_khbvd_payment(numeric, text) FROM anon;
GRANT EXECUTE ON FUNCTION record_khbvd_payment(numeric, text) TO authenticated;
