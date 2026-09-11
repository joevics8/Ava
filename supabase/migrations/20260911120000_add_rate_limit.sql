-- Lightweight rate limiting to protect against a spam loop (or malicious
-- actor) running up Gemini/Paystack costs against the webhook. Built on
-- Supabase rather than Redis since no Redis/Upstash instance is configured
-- for this project — fine at current scale, worth revisiting if traffic
-- grows enough that the extra round-trip per message matters.

CREATE TABLE IF NOT EXISTS message_rate_limit (
  telegram_id bigint PRIMARY KEY,
  window_start timestamptz NOT NULL DEFAULT now(),
  count int NOT NULL DEFAULT 1
);

ALTER TABLE message_rate_limit ENABLE ROW LEVEL SECURITY;
CREATE POLICY service_role_message_rate_limit ON message_rate_limit FOR ALL TO service_role USING (true) WITH CHECK (true);
