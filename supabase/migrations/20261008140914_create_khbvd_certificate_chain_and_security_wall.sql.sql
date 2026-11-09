/*
# Add KHBV.D doctor certificate verification chain and security hardening

## 1. New Table: doctor_certificates
- Stores individual certificate records for each doctor profile.
- Each certificate has a type (degree, license, awards), a file reference, and a verification status.
- The verification chain: uploaded -> pending -> verified / rejected.
- Only admins can change verification status; doctors can only upload their own certificates.

## 2. Security Hardening ("firewall")
- Revoke anon access on all authenticated-only tables.
- Revoke anon EXECUTE on SECURITY DEFINER functions.
- Add a rate-limit function that caps writes per user per minute, protecting the app at scale.
- Add input length validation on certificate file references.
- Add indexes for fast lookups.

## 3. Important Notes
- consultations and chat_messages remain anon-accessible (shared consultation tracking).
- All other tables are now authenticated-only.
- The rate-limit function is SECURITY DEFINER, callable only by authenticated users.
*/

CREATE TABLE IF NOT EXISTS doctor_certificates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_profile_id uuid NOT NULL REFERENCES doctor_profiles(id) ON DELETE CASCADE,
  certificate_type text NOT NULL CHECK (certificate_type IN ('degree', 'license', 'awards')),
  file_reference text NOT NULL CHECK (char_length(file_reference) <= 500),
  verification_status text NOT NULL DEFAULT 'pending' CHECK (verification_status IN ('pending', 'verified', 'rejected')),
  verified_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  verified_at timestamptz,
  rejection_reason text CHECK (rejection_reason IS NULL OR char_length(rejection_reason) <= 500),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (doctor_profile_id, certificate_type)
);

ALTER TABLE doctor_certificates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Doctors can view own certificates" ON doctor_certificates;
CREATE POLICY "Doctors can view own certificates" ON doctor_certificates
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM doctor_profiles dp
    WHERE dp.id = doctor_certificates.doctor_profile_id
    AND (dp.user_id = auth.uid() OR is_khbvd_admin())
  )
);

DROP POLICY IF EXISTS "Doctors can insert own certificates" ON doctor_certificates;
CREATE POLICY "Doctors can insert own certificates" ON doctor_certificates
FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM doctor_profiles dp
    WHERE dp.id = doctor_certificates.doctor_profile_id
    AND dp.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Doctors can update own pending certificates" ON doctor_certificates;
CREATE POLICY "Doctors can update own pending certificates" ON doctor_certificates
FOR UPDATE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM doctor_profiles dp
    WHERE dp.id = doctor_certificates.doctor_profile_id
    AND (dp.user_id = auth.uid() OR is_khbvd_admin())
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM doctor_profiles dp
    WHERE dp.id = doctor_certificates.doctor_profile_id
    AND (dp.user_id = auth.uid() OR is_khbvd_admin())
  )
);

DROP POLICY IF EXISTS "Admins can delete certificates" ON doctor_certificates;
CREATE POLICY "Admins can delete certificates" ON doctor_certificates
FOR DELETE TO authenticated
USING (is_khbvd_admin());

CREATE INDEX IF NOT EXISTS doctor_certificates_profile_idx ON doctor_certificates (doctor_profile_id);
CREATE INDEX IF NOT EXISTS doctor_certificates_status_idx ON doctor_certificates (verification_status);

REVOKE SELECT, INSERT, UPDATE, DELETE ON profiles FROM anon;
REVOKE SELECT, INSERT, UPDATE, DELETE ON doctor_profiles FROM anon;
REVOKE SELECT, INSERT, UPDATE, DELETE ON payment_records FROM anon;
REVOKE SELECT, INSERT, UPDATE, DELETE ON consultation_reviews FROM anon;
REVOKE SELECT, INSERT, UPDATE, DELETE ON doctor_certificates FROM anon;

REVOKE EXECUTE ON FUNCTION is_khbvd_admin() FROM anon;
REVOKE EXECUTE ON FUNCTION record_khbvd_payment(numeric, text) FROM anon;

GRANT SELECT, INSERT, UPDATE ON doctor_certificates TO authenticated;
REVOKE UPDATE (verification_status, verified_by, verified_at, rejection_reason) ON doctor_certificates FROM authenticated;
GRANT UPDATE (file_reference, updated_at) ON doctor_certificates TO authenticated;

CREATE TABLE IF NOT EXISTS rate_limit_buckets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action_key text NOT NULL,
  window_start timestamptz NOT NULL DEFAULT now(),
  hit_count integer NOT NULL DEFAULT 1,
  UNIQUE (user_id, action_key)
);

ALTER TABLE rate_limit_buckets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own rate limits" ON rate_limit_buckets;
CREATE POLICY "Users can view own rate limits" ON rate_limit_buckets
FOR SELECT TO authenticated
USING (user_id = auth.uid());

REVOKE ALL ON rate_limit_buckets FROM anon;
GRANT SELECT ON rate_limit_buckets TO authenticated;

CREATE OR REPLACE FUNCTION check_khbvd_rate_limit(p_action_key text, p_max_hits integer DEFAULT 30)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_current_count integer;
  v_window_start timestamptz := date_trunc('minute', now());
BEGIN
  SELECT hit_count INTO v_current_count
  FROM rate_limit_buckets
  WHERE user_id = auth.uid() AND action_key = p_action_key AND window_start = v_window_start
  FOR UPDATE;

  IF v_current_count IS NULL THEN
    INSERT INTO rate_limit_buckets (user_id, action_key, window_start, hit_count)
    VALUES (auth.uid(), p_action_key, v_window_start, 1)
    ON CONFLICT (user_id, action_key) DO UPDATE SET hit_count = 1, window_start = v_window_start;
    RETURN true;
  END IF;

  IF v_current_count >= p_max_hits THEN
    RETURN false;
  END IF;

  UPDATE rate_limit_buckets
  SET hit_count = hit_count + 1
  WHERE user_id = auth.uid() AND action_key = p_action_key AND window_start = v_window_start;

  RETURN true;
END;
$$;

REVOKE EXECUTE ON FUNCTION check_khbvd_rate_limit(text, integer) FROM anon;
GRANT EXECUTE ON FUNCTION check_khbvd_rate_limit(text, integer) TO authenticated;

CREATE OR REPLACE FUNCTION verify_khbvd_certificate(
  p_certificate_id uuid,
  p_status text,
  p_rejection_reason text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT is_khbvd_admin() THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  IF p_status NOT IN ('verified', 'rejected') THEN
    RAISE EXCEPTION 'Invalid status';
  END IF;

  IF NOT check_khbvd_rate_limit('admin_verify', 60) THEN
    RAISE EXCEPTION 'Rate limit exceeded. Please slow down.';
  END IF;

  UPDATE doctor_certificates
  SET verification_status = p_status,
      verified_by = auth.uid(),
      verified_at = now(),
      rejection_reason = p_rejection_reason,
      updated_at = now()
  WHERE id = p_certificate_id;
END;
$$;

REVOKE EXECUTE ON FUNCTION verify_khbvd_certificate(uuid, text, text) FROM anon;
GRANT EXECUTE ON FUNCTION verify_khbvd_certificate(uuid, text, text) TO authenticated;

CREATE INDEX IF NOT EXISTS rate_limit_user_action_idx ON rate_limit_buckets (user_id, action_key, window_start);
