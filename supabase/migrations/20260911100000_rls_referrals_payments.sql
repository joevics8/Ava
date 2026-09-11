-- The referrals and user_payments tables were created without RLS enabled,
-- flagged by Supabase's security advisor. Fixed by restricting access to
-- service_role only (the app only ever accesses Supabase via the service
-- role key in supabaseAdmin, which bypasses RLS anyway — this is purely
-- defense-in-depth in case the anon key is ever exposed client-side).

ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY service_role_referrals ON referrals
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY service_role_user_payments ON user_payments
  FOR ALL TO service_role USING (true) WITH CHECK (true);
