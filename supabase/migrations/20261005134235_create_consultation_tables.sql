/*
# Create consultation tables (single-tenant, no auth)

1. New Tables
- `consultations`
  - `id` (uuid, primary key)
  - `procedure_name` (text)
  - `doctor_name` (text)
  - `doctor_location` (text)
  - `chief_complaint` (text)
  - `symptom_duration` (text)
  - `tier` (text)
  - `language` (text)
  - `status` (text)
  - `created_at` (timestamp)
- `chat_messages`
  - `id` (uuid, primary key)
  - `consultation_id` (uuid, FK to consultations)
  - `role` (text)
  - `content` (text)
  - `attachment_url` (text, nullable)
  - `created_at` (timestamp)

2. Security
- Enable RLS on both tables.
- Allow anon + authenticated CRUD (no sign-in, shared data).
*/

CREATE TABLE IF NOT EXISTS consultations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  procedure_name text NOT NULL,
  doctor_name text NOT NULL,
  doctor_location text,
  chief_complaint text,
  symptom_duration text,
  tier text DEFAULT 'essential',
  language text DEFAULT 'en',
  status text DEFAULT 'triage',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE consultations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_consultations" ON consultations;
CREATE POLICY "anon_select_consultations" ON consultations FOR SELECT
TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_consultations" ON consultations;
CREATE POLICY "anon_insert_consultations" ON consultations FOR INSERT
TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_consultations" ON consultations;
CREATE POLICY "anon_update_consultations" ON consultations FOR UPDATE
TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_consultations" ON consultations;
CREATE POLICY "anon_delete_consultations" ON consultations FOR DELETE
TO anon, authenticated USING (true);

CREATE TABLE IF NOT EXISTS chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  consultation_id uuid REFERENCES consultations(id) ON DELETE CASCADE,
  role text NOT NULL,
  content text NOT NULL,
  attachment_url text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_chat_messages" ON chat_messages;
CREATE POLICY "anon_select_chat_messages" ON chat_messages FOR SELECT
TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_chat_messages" ON chat_messages;
CREATE POLICY "anon_insert_chat_messages" ON chat_messages FOR INSERT
TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_chat_messages" ON chat_messages;
CREATE POLICY "anon_update_chat_messages" ON chat_messages FOR UPDATE
TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_chat_messages" ON chat_messages;
CREATE POLICY "anon_delete_chat_messages" ON chat_messages FOR DELETE
TO anon, authenticated USING (true);
