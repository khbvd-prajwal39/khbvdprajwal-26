/*
# Add protected admin support and doctor request workflows

1. New Tables
- `support_requests` stores patient or doctor support tickets, their category, description, status, and administrator reply.
- `doctor_requests` stores doctor-submitted payment, appointment, verification, consultation, technical, and other operational issues.

2. Security
- Both tables require row-level security.
- Signed-in users may create and view only their own requests.
- Administrators may view and update every request through the existing `is_khbvd_admin()` authorization function.
- Anonymous users receive no table access.

3. Data integrity
- Request statuses are restricted to pending, in_progress, and resolved.
- User identity is filled from the signed-in session by default.
- Timestamps are maintained by database defaults and explicit update values from the admin interface.

4. Important notes
- Existing consultation, profile, doctor application, payment, and certificate tables are reused by the dashboard.
- No existing table, column, or record is removed or renamed.
*/

CREATE TABLE IF NOT EXISTS public.support_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  issue_category text NOT NULL CHECK (issue_category IN ('consultation', 'payment', 'account', 'technical', 'other')),
  issue_description text NOT NULL CHECK (char_length(issue_description) BETWEEN 1 AND 4000),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'resolved')),
  admin_reply text CHECK (admin_reply IS NULL OR char_length(admin_reply) <= 4000),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  resolved_at timestamptz
);

CREATE TABLE IF NOT EXISTS public.doctor_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  issue_category text NOT NULL CHECK (issue_category IN ('payment', 'appointment', 'verification', 'consultation', 'technical', 'other')),
  issue_description text NOT NULL CHECK (char_length(issue_description) BETWEEN 1 AND 4000),
  priority text NOT NULL DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'resolved')),
  admin_reply text CHECK (admin_reply IS NULL OR char_length(admin_reply) <= 4000),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  resolved_at timestamptz
);

ALTER TABLE public.support_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.doctor_requests ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE ON public.support_requests TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.doctor_requests TO authenticated;

DROP POLICY IF EXISTS "Users can view own support requests" ON public.support_requests;
CREATE POLICY "Users can view own support requests" ON public.support_requests FOR SELECT TO authenticated
  USING (requester_id = auth.uid() OR is_khbvd_admin());
DROP POLICY IF EXISTS "Users can create own support requests" ON public.support_requests;
CREATE POLICY "Users can create own support requests" ON public.support_requests FOR INSERT TO authenticated
  WITH CHECK (requester_id = auth.uid());
DROP POLICY IF EXISTS "Users and admins can update support requests" ON public.support_requests;
CREATE POLICY "Users and admins can update support requests" ON public.support_requests FOR UPDATE TO authenticated
  USING (requester_id = auth.uid() OR is_khbvd_admin())
  WITH CHECK (requester_id = auth.uid() OR is_khbvd_admin());
DROP POLICY IF EXISTS "Users can delete own support requests" ON public.support_requests;
CREATE POLICY "Users can delete own support requests" ON public.support_requests FOR DELETE TO authenticated
  USING (requester_id = auth.uid() OR is_khbvd_admin());

DROP POLICY IF EXISTS "Doctors can view own requests" ON public.doctor_requests;
CREATE POLICY "Doctors can view own requests" ON public.doctor_requests FOR SELECT TO authenticated
  USING (doctor_id = auth.uid() OR is_khbvd_admin());
DROP POLICY IF EXISTS "Doctors can create own requests" ON public.doctor_requests;
CREATE POLICY "Doctors can create own requests" ON public.doctor_requests FOR INSERT TO authenticated
  WITH CHECK (doctor_id = auth.uid());
DROP POLICY IF EXISTS "Doctors and admins can update requests" ON public.doctor_requests;
CREATE POLICY "Doctors and admins can update requests" ON public.doctor_requests FOR UPDATE TO authenticated
  USING (doctor_id = auth.uid() OR is_khbvd_admin())
  WITH CHECK (doctor_id = auth.uid() OR is_khbvd_admin());
DROP POLICY IF EXISTS "Doctors can delete own requests" ON public.doctor_requests;
CREATE POLICY "Doctors can delete own requests" ON public.doctor_requests FOR DELETE TO authenticated
  USING (doctor_id = auth.uid() OR is_khbvd_admin());

CREATE INDEX IF NOT EXISTS support_requests_status_created_idx ON public.support_requests (status, created_at DESC);
CREATE INDEX IF NOT EXISTS doctor_requests_status_created_idx ON public.doctor_requests (status, created_at DESC);
CREATE INDEX IF NOT EXISTS doctor_requests_priority_idx ON public.doctor_requests (priority, created_at DESC);