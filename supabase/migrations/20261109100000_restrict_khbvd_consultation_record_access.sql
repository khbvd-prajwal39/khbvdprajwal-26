REVOKE ALL ON public.consultations, public.chat_messages FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.consultations, public.chat_messages TO authenticated;

DROP POLICY IF EXISTS "anon_select_consultations" ON public.consultations;
DROP POLICY IF EXISTS "anon_insert_consultations" ON public.consultations;
DROP POLICY IF EXISTS "anon_update_consultations" ON public.consultations;
DROP POLICY IF EXISTS "anon_delete_consultations" ON public.consultations;
DROP POLICY IF EXISTS "anon_select_chat_messages" ON public.chat_messages;
DROP POLICY IF EXISTS "anon_insert_chat_messages" ON public.chat_messages;
DROP POLICY IF EXISTS "anon_update_chat_messages" ON public.chat_messages;
DROP POLICY IF EXISTS "anon_delete_chat_messages" ON public.chat_messages;

CREATE POLICY "Admins can view consultations" ON public.consultations FOR SELECT
TO authenticated USING (public.is_khbvd_admin());

CREATE POLICY "Admins can view consultation messages" ON public.chat_messages FOR SELECT
TO authenticated USING (public.is_khbvd_admin());