/*
# Protect KHBV.D doctor approval fields

1. Modified Table
- `doctor_profiles` now allows doctors to update only their application content.
- Ownership, approval status, review timestamp, and creation timestamp cannot be changed by a doctor.

2. Security
- Admin review remains the only path for approval decisions.
*/

REVOKE UPDATE ON doctor_profiles FROM authenticated;
GRANT UPDATE (full_name, degree, registration_number, specialty, doctor_category, animal_specialty, district, city, pincode, clinic_address, clinic_timings, online_slots, years_experience, image_one, image_two, image_three, certificate_link, short_bio, updated_at) ON doctor_profiles TO authenticated;
