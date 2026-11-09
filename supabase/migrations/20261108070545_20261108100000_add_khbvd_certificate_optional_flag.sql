/*
# Update KHBV.D certificate chain to 6 document types

1. New Column
- `is_optional boolean DEFAULT false` marks certificates that are only required for certain doctors (e.g. senior specialist MD/MS/DM).

2. Important Notes
- No existing certificate records are removed; old `certificate_type` text values remain and new types are used for new uploads.
- The column is nullable-safe with a default so existing rows get false.
*/

ALTER TABLE public.doctor_certificates
  ADD COLUMN IF NOT EXISTS is_optional boolean NOT NULL DEFAULT false;
