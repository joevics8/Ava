-- The original service_role_* policies on users/cycle_data/memory_log/
-- user_remedies/remedies used USING (true) for role 'public' — meaning they
-- didn't actually restrict anon-key access at all, despite the name
-- suggesting service-role-only. Since supabaseAdmin's service_role key has
-- BYPASSRLS at the Postgres level regardless of policies, this change is
-- purely defense-in-depth against the (currently unused) anon-key client
-- ever being exposed client-side — zero functional change to server-side
-- app behavior.

DROP POLICY IF EXISTS service_role_users ON users;
DROP POLICY IF EXISTS service_role_cycle_data ON cycle_data;
DROP POLICY IF EXISTS service_role_memory_log ON memory_log;
DROP POLICY IF EXISTS service_role_user_remedies ON user_remedies;
DROP POLICY IF EXISTS service_role_remedies ON remedies;

CREATE POLICY service_role_users ON users FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY service_role_cycle_data ON cycle_data FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY service_role_memory_log ON memory_log FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY service_role_user_remedies ON user_remedies FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY service_role_remedies ON remedies FOR ALL TO service_role USING (true) WITH CHECK (true);
