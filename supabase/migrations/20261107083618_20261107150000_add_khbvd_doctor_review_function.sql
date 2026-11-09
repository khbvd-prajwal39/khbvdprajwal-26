/*
# Add KHBV.D doctor application review function

1. New Server Function
- `review_khbvd_doctor_application` lets an administrator approve or reject a doctor application.
- Sets the approval status and review timestamp server-side so protected columns are never written from the browser.

2. Security
- Only accounts whose profile role is admin may call the function.
- Status is constrained to approved or rejected.

3. Important Notes
- No existing records are removed or renamed.
- The browser UPDATE grant on doctor_profiles intentionally excludes approval_status and reviewed_at.
*/

CREATE OR REPLACE FUNCTION public.review_khbvd_doctor_application(
  p_doctor_profile_id uuid,
  p_status text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT is_khbvd_admin() THEN RAISE EXCEPTION 'Administrator access required'; END IF;
  IF p_status NOT IN ('approved', 'rejected') THEN RAISE EXCEPTION 'Invalid review status'; END IF;
  IF p_doctor_profile_id IS NULL THEN RAISE EXCEPTION 'Doctor profile is required'; END IF;

  UPDATE public.doctor_profiles
  SET approval_status = p_status,
      reviewed_at = now(),
      updated_at = now()
  WHERE id = p_doctor_profile_id;

  IF NOT FOUND THEN RAISE EXCEPTION 'Doctor profile not found'; END IF;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.review_khbvd_doctor_application(uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.review_khbvd_doctor_application(uuid, text) TO authenticated;
