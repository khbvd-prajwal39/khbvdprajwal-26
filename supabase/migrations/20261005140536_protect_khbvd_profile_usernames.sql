/*
# Protect KHBV.D usernames

1. Modified Table
- `profiles.username` remains the stable sign-in identifier.

2. Security
- Remove browser update access to username so a profile cannot become detached from its sign-in identity.
*/

REVOKE UPDATE (username) ON profiles FROM authenticated;
