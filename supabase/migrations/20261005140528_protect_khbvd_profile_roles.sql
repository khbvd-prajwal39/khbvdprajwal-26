/*
# Protect KHBV.D profile roles

1. Modified Table
- `profiles` keeps the doctor or patient role selected during registration.
- Signed-in users retain permission to update their personal details, but not the `role` or `id` columns.

2. Security
- Revoke broad profile updates from authenticated users.
- Grant updates only for user-editable profile fields.
- Role changes are not exposed through the browser data API.
*/

REVOKE UPDATE ON profiles FROM authenticated;
GRANT UPDATE (username, full_name, age, gender, address, state, district, pincode, updated_at) ON profiles TO authenticated;
