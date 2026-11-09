/*
# Restrict legacy payment RPC access

1. Security Change
- Removes anonymous execution of the older `record_khbvd_payment` database function.

2. Important Notes
- PhonePe checkout now creates and confirms payment orders through the protected server function.
- Existing payment records and the administrator payment dashboard are unchanged.
*/

REVOKE EXECUTE ON FUNCTION public.record_khbvd_payment(numeric, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.record_khbvd_payment(numeric, text) TO authenticated;
