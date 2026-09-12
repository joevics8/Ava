import { defineConfig } from 'vitest/config';
import path from 'path';

// Tests only exercise pure logic (cycle math, fertility labels, text
// dedup) — nothing here actually calls Supabase/Gemini/Telegram. But
// several files construct a Supabase client at *module load time*
// (lib/supabase.ts), which throws immediately if the URL env var is
// missing — so importing e.g. lib/ava/ai.ts (which imports lib/ava/db.ts,
// which imports lib/supabase.ts) would fail before any test even runs.
// Dummy values here are enough to satisfy the constructor; no network
// call is ever made against them.
process.env.NEXT_PUBLIC_SUPABASE_URL ||= 'http://localhost:54321';
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||= 'test-anon-key';
process.env.SUPABASE_SERVICE_ROLE_KEY ||= 'test-service-role-key';

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
});
