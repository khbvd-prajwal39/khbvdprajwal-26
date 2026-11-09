/*
# Secure KHBV.D workflow mutations

1. Security Changes
- Only accounts whose profile role is doctor may create doctor applications.
- Direct browser inserts into payment records are revoked.
- `record_khbvd_payment` computes the 20% platform brokerage and doctor payout on the database side.
- The payment function validates the method and amount and derives the patient from the signed-in session.
*/

DROP POLICY IF EXISTS "Doctors can create own application" ON doctor_profiles;
CREATE POLICY "Doctors can create own application" ON doctor_profiles FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid() AND EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'doctor'));

REVOKE INSERT ON payment_records FROM authenticated;

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
  IF p_amount IS NULL OR p_amount <= 0 OR p_amount > 100000 THEN RAISE EXCEPTION 'Invalid payment amount'; END IF;
  IF p_method NOT IN ('card', 'paytm', 'phonepe', 'netbanking', 'upi') THEN RAISE EXCEPTION 'Invalid payment method'; END IF;
  platform_fee := round((p_amount * 0.20)::numeric, 2);
  INSERT INTO payment_records (patient_id, payment_method, amount, brokerage, doctor_payout, status)
  VALUES (auth.uid(), p_method, p_amount, platform_fee, round((p_amount - platform_fee)::numeric, 2), 'paid')
  RETURNING id INTO payment_id;
  RETURN payment_id;
END;
$$;

REVOKE EXECUTE ON FUNCTION record_khbvd_payment(numeric, text) FROM anon;
GRANT EXECUTE ON FUNCTION record_khbvd_payment(numeric, text) TO authenticated;
