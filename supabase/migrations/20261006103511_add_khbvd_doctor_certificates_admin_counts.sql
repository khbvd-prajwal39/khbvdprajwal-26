/*
# Add KHBV.D doctor certificates and admin counts

1. Modified Table
- `doctor_profiles` gains separate PDF fields for degree certificate, medical license, and awards or other certificates.

2. Security
- Doctors can upload only their own certificate references.
- Admins can read profiles for owner dashboard counts without exposing profiles to patients.
*/

ALTER TABLE doctor_profiles ADD COLUMN IF NOT EXISTS degree_certificate_pdf text;
ALTER TABLE doctor_profiles ADD COLUMN IF NOT EXISTS license_certificate_pdf text;
ALTER TABLE doctor_profiles ADD COLUMN IF NOT EXISTS awards_certificate_pdf text;

GRANT UPDATE (degree_certificate_pdf, license_certificate_pdf, awards_certificate_pdf) ON doctor_profiles TO authenticated;

DROP POLICY IF EXISTS "Admins can view KHBVD profiles" ON profiles;
CREATE POLICY "Admins can view KHBVD profiles" ON profiles FOR SELECT TO authenticated
USING (auth.uid() = id OR is_khbvd_admin());
