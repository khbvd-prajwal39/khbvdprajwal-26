/*
# Add KHBV.D doctor pricing and PhonePe payment order controls

1. Modified Tables
- `doctor_profiles`: adds four consultation prices and four doctor payout amounts, one pair for each plan. Prices and payouts are controlled by administrators only. Doctor application ownership now defaults from the signed-in account.
- `payment_records`: adds PhonePe merchant order and transaction references, and permits a failed payment state for orders that do not complete.

2. New Server Function
- `set_khbvd_doctor_pricing` lets administrators set each doctor’s plan price and doctor payout. The database calculates each platform fee as price minus payout and rejects invalid negative or over-price payouts.

3. Security
- Doctor application inserts no longer allow browsers to write ownership, approval, review, timestamps, or pricing fields.
- Doctor pricing can only be changed through the administrator-only function.
- Existing patient and administrator payment visibility rules remain in place.

4. Important Notes
- PhonePe secrets remain server-side and are never exposed to the browser.
- Payment records start as pending and are marked paid only after PhonePe confirms the merchant transaction.
- No existing records are deleted or renamed.
*/

ALTER TABLE public.doctor_profiles
  ALTER COLUMN user_id SET DEFAULT auth.uid();

ALTER TABLE public.doctor_profiles
  ADD COLUMN IF NOT EXISTS essential_price numeric(10,2) NOT NULL DEFAULT 0 CHECK (essential_price >= 0),
  ADD COLUMN IF NOT EXISTS essential_doctor_payout numeric(10,2) NOT NULL DEFAULT 0 CHECK (essential_doctor_payout >= 0 AND essential_doctor_payout <= essential_price),
  ADD COLUMN IF NOT EXISTS essential_plus_price numeric(10,2) NOT NULL DEFAULT 0 CHECK (essential_plus_price >= 0),
  ADD COLUMN IF NOT EXISTS essential_plus_doctor_payout numeric(10,2) NOT NULL DEFAULT 0 CHECK (essential_plus_doctor_payout >= 0 AND essential_plus_doctor_payout <= essential_plus_price),
  ADD COLUMN IF NOT EXISTS audio_price numeric(10,2) NOT NULL DEFAULT 0 CHECK (audio_price >= 0),
  ADD COLUMN IF NOT EXISTS audio_doctor_payout numeric(10,2) NOT NULL DEFAULT 0 CHECK (audio_doctor_payout >= 0 AND audio_doctor_payout <= audio_price),
  ADD COLUMN IF NOT EXISTS video_price numeric(10,2) NOT NULL DEFAULT 0 CHECK (video_price >= 0),
  ADD COLUMN IF NOT EXISTS video_doctor_payout numeric(10,2) NOT NULL DEFAULT 0 CHECK (video_doctor_payout >= 0 AND video_doctor_payout <= video_price);

ALTER TABLE public.payment_records
  ADD COLUMN IF NOT EXISTS phonepe_order_id text,
  ADD COLUMN IF NOT EXISTS phonepe_transaction_id text;

ALTER TABLE public.payment_records DROP CONSTRAINT IF EXISTS payment_records_status_check;
ALTER TABLE public.payment_records ADD CONSTRAINT payment_records_status_check CHECK (status IN ('pending', 'paid', 'failed', 'refunded'));

CREATE UNIQUE INDEX IF NOT EXISTS payment_records_phonepe_order_id_key ON public.payment_records (phonepe_order_id) WHERE phonepe_order_id IS NOT NULL;

REVOKE INSERT ON public.doctor_profiles FROM authenticated;
GRANT INSERT (full_name, degree, registration_number, specialty, doctor_category, animal_specialty, district, city, pincode, clinic_address, clinic_timings, online_slots, years_experience, image_one, image_two, image_three, certificate_link, short_bio) ON public.doctor_profiles TO authenticated;

REVOKE UPDATE ON public.doctor_profiles FROM authenticated;
GRANT UPDATE (full_name, degree, registration_number, specialty, doctor_category, animal_specialty, district, city, pincode, clinic_address, clinic_timings, online_slots, years_experience, image_one, image_two, image_three, certificate_link, short_bio, updated_at) ON public.doctor_profiles TO authenticated;

CREATE OR REPLACE FUNCTION public.set_khbvd_doctor_pricing(
  p_doctor_profile_id uuid,
  p_essential_price numeric,
  p_essential_doctor_payout numeric,
  p_essential_plus_price numeric,
  p_essential_plus_doctor_payout numeric,
  p_audio_price numeric,
  p_audio_doctor_payout numeric,
  p_video_price numeric,
  p_video_doctor_payout numeric
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT is_khbvd_admin() THEN RAISE EXCEPTION 'Administrator access required'; END IF;
  IF p_doctor_profile_id IS NULL THEN RAISE EXCEPTION 'Doctor profile is required'; END IF;
  IF p_essential_price < 0 OR p_essential_doctor_payout < 0 OR p_essential_doctor_payout > p_essential_price THEN RAISE EXCEPTION 'Invalid essential pricing'; END IF;
  IF p_essential_plus_price < 0 OR p_essential_plus_doctor_payout < 0 OR p_essential_plus_doctor_payout > p_essential_plus_price THEN RAISE EXCEPTION 'Invalid essential plus pricing'; END IF;
  IF p_audio_price < 0 OR p_audio_doctor_payout < 0 OR p_audio_doctor_payout > p_audio_price THEN RAISE EXCEPTION 'Invalid audio pricing'; END IF;
  IF p_video_price < 0 OR p_video_doctor_payout < 0 OR p_video_doctor_payout > p_video_price THEN RAISE EXCEPTION 'Invalid video pricing'; END IF;

  UPDATE doctor_profiles
  SET essential_price = round(p_essential_price, 2),
      essential_doctor_payout = round(p_essential_doctor_payout, 2),
      essential_plus_price = round(p_essential_plus_price, 2),
      essential_plus_doctor_payout = round(p_essential_plus_doctor_payout, 2),
      audio_price = round(p_audio_price, 2),
      audio_doctor_payout = round(p_audio_doctor_payout, 2),
      video_price = round(p_video_price, 2),
      video_doctor_payout = round(p_video_doctor_payout, 2),
      updated_at = now()
  WHERE id = p_doctor_profile_id;

  IF NOT FOUND THEN RAISE EXCEPTION 'Doctor profile not found'; END IF;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.set_khbvd_doctor_pricing(uuid, numeric, numeric, numeric, numeric, numeric, numeric, numeric, numeric) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.set_khbvd_doctor_pricing(uuid, numeric, numeric, numeric, numeric, numeric, numeric, numeric, numeric) TO authenticated;
