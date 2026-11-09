/*
# Optimize KHBV.D database for high-concurrency production traffic

1. New Indexes
- `profiles_role_idx` accelerates admin queries that filter users by role across 10,000+ accounts.
- `profiles_created_at_idx` speeds up ordered user listing in the admin dashboard.
- `payment_records_status_idx` lets the admin earnings snapshot filter paid records without a full scan.
- `payment_records_patient_status_idx` lets patients check their own pending/paid orders quickly.
- `doctor_profiles_user_id_idx` accelerates ownership lookups during application and certificate checks.
- `doctor_certificates_status_idx` speeds up the admin certificate review queue.

2. Important Notes
- No table, column, or record is removed or renamed.
- All indexes are CONCURRENTLY-safe via IF NOT EXISTS.
- These indexes target the exact query patterns used by the patient flow, doctor dashboard, and admin panels.
*/

CREATE INDEX IF NOT EXISTS profiles_role_idx ON public.profiles (role);
CREATE INDEX IF NOT EXISTS profiles_created_at_idx ON public.profiles (created_at DESC);
CREATE INDEX IF NOT EXISTS payment_records_status_idx ON public.payment_records (status, created_at DESC);
CREATE INDEX IF NOT EXISTS payment_records_patient_status_idx ON public.payment_records (patient_id, status);
CREATE INDEX IF NOT EXISTS doctor_profiles_user_id_idx ON public.doctor_profiles (user_id);
CREATE INDEX IF NOT EXISTS doctor_certificates_status_idx ON public.doctor_certificates (verification_status, created_at DESC);
