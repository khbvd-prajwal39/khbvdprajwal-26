/*
# Add KHBV.D consultation reviews and prescription requests

1. New Table
- `consultation_reviews` stores the patient rating, review, and whether a prescription was requested after a consultation.
- Reviews must contain at least 50 characters and a rating from 1 to 5.

2. Security
- Patients can create and read only their own reviews.
- The patient identity is filled by the signed-in session.
*/

CREATE TABLE IF NOT EXISTS consultation_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  doctor_name text NOT NULL,
  rating integer NOT NULL CHECK (rating BETWEEN 1 AND 5),
  review text NOT NULL CHECK (char_length(review) >= 50),
  prescription_requested boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE consultation_reviews ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Patients can view own consultation reviews" ON consultation_reviews;
CREATE POLICY "Patients can view own consultation reviews" ON consultation_reviews FOR SELECT TO authenticated
USING (patient_id = auth.uid());

DROP POLICY IF EXISTS "Patients can create own consultation reviews" ON consultation_reviews;
CREATE POLICY "Patients can create own consultation reviews" ON consultation_reviews FOR INSERT TO authenticated
WITH CHECK (patient_id = auth.uid() AND char_length(review) >= 50);

DROP POLICY IF EXISTS "Patients can update own consultation reviews" ON consultation_reviews;
CREATE POLICY "Patients can update own consultation reviews" ON consultation_reviews FOR UPDATE TO authenticated
USING (patient_id = auth.uid()) WITH CHECK (patient_id = auth.uid() AND char_length(review) >= 50);

DROP POLICY IF EXISTS "Patients can delete own consultation reviews" ON consultation_reviews;
CREATE POLICY "Patients can delete own consultation reviews" ON consultation_reviews FOR DELETE TO authenticated
USING (patient_id = auth.uid());
