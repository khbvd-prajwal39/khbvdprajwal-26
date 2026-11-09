/*
# Add KHBV.D doctor approval and finance workflows

1. Modified Tables
- `profiles.role` now supports the protected `admin` role.
- Browser registration remains limited to doctor and patient roles.

2. New Tables
- `doctor_profiles` stores council registration, specialty, human/veterinary category, practice details, up to three profile image links, and approval status.
- `payment_records` stores consultation payment method, amount, platform brokerage, and doctor payout.

3. Security
- Every table has row-level security enabled.
- Doctors can manage only their own application.
- Patients can create and view only their own payment records.
- Admin-only views and updates use a SECURITY DEFINER `is_khbvd_admin()` check.
- No password is stored in application tables.
*/

ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE profiles ADD CONSTRAINT profiles_role_check CHECK (role IN ('doctor', 'patient', 'admin'));

DROP POLICY IF EXISTS "Users can create own KHBVD profile" ON profiles;
CREATE POLICY "Users can create own KHBVD profile" ON profiles FOR INSERT
TO authenticated WITH CHECK (auth.uid() = id AND role IN ('doctor', 'patient'));

CREATE OR REPLACE FUNCTION is_khbvd_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin');
$$;

REVOKE EXECUTE ON FUNCTION is_khbvd_admin() FROM anon;
GRANT EXECUTE ON FUNCTION is_khbvd_admin() TO authenticated;

CREATE TABLE IF NOT EXISTS doctor_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL,
  degree text NOT NULL,
  registration_number text NOT NULL,
  specialty text NOT NULL,
  doctor_category text NOT NULL CHECK (doctor_category IN ('human', 'veterinary')),
  animal_specialty text,
  district text NOT NULL,
  city text NOT NULL,
  pincode text NOT NULL CHECK (pincode ~ '^[0-9]{6}$'),
  clinic_address text NOT NULL,
  clinic_timings text NOT NULL,
  online_slots text NOT NULL,
  years_experience integer NOT NULL CHECK (years_experience BETWEEN 0 AND 80),
  image_one text,
  image_two text,
  image_three text,
  certificate_link text,
  short_bio text,
  approval_status text NOT NULL DEFAULT 'pending' CHECK (approval_status IN ('pending', 'approved', 'rejected')),
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE doctor_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Doctors can view own application" ON doctor_profiles;
CREATE POLICY "Doctors can view own application" ON doctor_profiles FOR SELECT TO authenticated
USING (user_id = auth.uid() OR is_khbvd_admin());

DROP POLICY IF EXISTS "Doctors can create own application" ON doctor_profiles;
CREATE POLICY "Doctors can create own application" ON doctor_profiles FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Doctors can update own pending application" ON doctor_profiles;
CREATE POLICY "Doctors can update own pending application" ON doctor_profiles FOR UPDATE TO authenticated
USING (user_id = auth.uid() AND approval_status = 'pending' OR is_khbvd_admin())
WITH CHECK (user_id = auth.uid() AND approval_status = 'pending' OR is_khbvd_admin());

DROP POLICY IF EXISTS "Admins can delete doctor applications" ON doctor_profiles;
CREATE POLICY "Admins can delete doctor applications" ON doctor_profiles FOR DELETE TO authenticated
USING (is_khbvd_admin());

CREATE TABLE IF NOT EXISTS payment_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  doctor_id uuid REFERENCES doctor_profiles(id) ON DELETE SET NULL,
  consultation_id uuid REFERENCES consultations(id) ON DELETE SET NULL,
  payment_method text NOT NULL CHECK (payment_method IN ('card', 'paytm', 'phonepe', 'netbanking', 'upi')),
  amount numeric(10,2) NOT NULL CHECK (amount > 0),
  brokerage numeric(10,2) NOT NULL CHECK (brokerage >= 0),
  doctor_payout numeric(10,2) NOT NULL CHECK (doctor_payout >= 0),
  status text NOT NULL DEFAULT 'paid' CHECK (status IN ('pending', 'paid', 'refunded')),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE payment_records ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Patients can view own payments" ON payment_records;
CREATE POLICY "Patients can view own payments" ON payment_records FOR SELECT TO authenticated
USING (patient_id = auth.uid() OR is_khbvd_admin());

DROP POLICY IF EXISTS "Patients can create own payments" ON payment_records;
CREATE POLICY "Patients can create own payments" ON payment_records FOR INSERT TO authenticated
WITH CHECK (patient_id = auth.uid() AND amount > 0 AND brokerage >= 0 AND doctor_payout >= 0);

DROP POLICY IF EXISTS "Admins can update payments" ON payment_records;
CREATE POLICY "Admins can update payments" ON payment_records FOR UPDATE TO authenticated
USING (is_khbvd_admin()) WITH CHECK (is_khbvd_admin());

DROP POLICY IF EXISTS "Admins can delete payments" ON payment_records;
CREATE POLICY "Admins can delete payments" ON payment_records FOR DELETE TO authenticated
USING (is_khbvd_admin());

CREATE INDEX IF NOT EXISTS doctor_profiles_status_idx ON doctor_profiles (approval_status);
CREATE INDEX IF NOT EXISTS payment_records_created_at_idx ON payment_records (created_at DESC);
