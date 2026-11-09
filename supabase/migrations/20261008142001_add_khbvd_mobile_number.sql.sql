/*
# Add mobile number column to profiles

1. Modified Table
- `profiles` gains `mobile_number` for OTP-based phone verification.

2. Security
- Users can set their own mobile number on insert and update.
- The column is included in the existing RLS ownership policies.
*/

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS mobile_number text CHECK (mobile_number IS NULL OR mobile_number ~ '^[0-9]{10}$');

GRANT UPDATE (mobile_number) ON profiles TO authenticated;
