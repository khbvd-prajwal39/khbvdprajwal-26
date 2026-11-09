/*
# Create KHBV.D account profiles

1. New Tables
- `profiles` stores the account information collected during registration.
- `id` (uuid, primary key and auth user reference)
- `username` (text, unique login name)
- `role` (text, either doctor or patient)
- `full_name`, `age`, `gender`, `address`, `state`, `district`, `pincode` (profile details)
- `created_at`, `updated_at` (timestamps)

2. Security
- Enable row level security on `profiles`.
- Signed-in users can read, create, update, and delete only their own profile.
- Role is retained in the profile for display and is not used as an authorization shortcut.
*/

CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username text NOT NULL,
  role text NOT NULL CHECK (role IN ('doctor', 'patient')),
  full_name text NOT NULL,
  age integer NOT NULL CHECK (age BETWEEN 1 AND 120),
  gender text NOT NULL,
  address text NOT NULL,
  state text NOT NULL,
  district text NOT NULL,
  pincode text NOT NULL CHECK (pincode ~ '^[0-9]{6}$'),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS profiles_username_lower_key ON profiles (lower(username));
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own KHBVD profile" ON profiles;
CREATE POLICY "Users can view own KHBVD profile" ON profiles FOR SELECT
TO authenticated USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can create own KHBVD profile" ON profiles;
CREATE POLICY "Users can create own KHBVD profile" ON profiles FOR INSERT
TO authenticated WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own KHBVD profile" ON profiles;
CREATE POLICY "Users can update own KHBVD profile" ON profiles FOR UPDATE
TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can delete own KHBVD profile" ON profiles;
CREATE POLICY "Users can delete own KHBVD profile" ON profiles FOR DELETE
TO authenticated USING (auth.uid() = id);
