/*
# Add safe approved doctor directory

1. New Server Function
- `list_khbvd_approved_doctors` returns only approved doctors’ public directory details and consultation prices.

2. Returned Fields
- Doctor ID, display name, specialty, category, district, city, experience, and four patient prices.
- Private registration documents, clinic address, timings, certificates, and review fields are not returned.

3. Security
- The function runs with a fixed search path and reads only approved doctor profiles.
- Anonymous access is denied; signed-in patients and doctors may read the directory.

4. Important Notes
- No table, column, or record is removed or renamed.
- Pricing remains administrator-controlled through the existing pricing function.
*/

CREATE OR REPLACE FUNCTION public.list_khbvd_approved_doctors()
RETURNS TABLE (
  id uuid,
  full_name text,
  specialty text,
  doctor_category text,
  district text,
  city text,
  years_experience integer,
  essential_price numeric,
  essential_plus_price numeric,
  audio_price numeric,
  video_price numeric
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT dp.id, dp.full_name, dp.specialty, dp.doctor_category, dp.district, dp.city, dp.years_experience,
    dp.essential_price, dp.essential_plus_price, dp.audio_price, dp.video_price
  FROM public.doctor_profiles dp
  WHERE dp.approval_status = 'approved';
$$;

REVOKE EXECUTE ON FUNCTION public.list_khbvd_approved_doctors() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.list_khbvd_approved_doctors() TO authenticated;
