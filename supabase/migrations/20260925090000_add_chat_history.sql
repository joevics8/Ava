-- Short-term conversation history so Ava can follow the thread of a chat.
-- Separate from memory_log (long-term tags): this stores the actual text of
-- recent exchanges. Only the last few rows per user are ever read; older rows
-- are pruned on write (see addChatMessage in lib/ava/db.ts).

CREATE TABLE IF NOT EXISTS chat_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('user', 'model')),
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_chat_history_user_created
  ON chat_history (user_id, created_at DESC);

ALTER TABLE chat_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY service_role_chat_history ON chat_history FOR ALL TO service_role USING (true) WITH CHECK (true);
