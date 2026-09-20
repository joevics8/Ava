-- Defaults ON per product decision: the daily affirmation is meant to be
-- a habit-building push (opt-out, not opt-in) — most users would never
-- discover and enable an opt-in toggle, defeating the point of a daily
-- ritual feature. /settings gives an easy way to turn it off.
ALTER TABLE users ADD COLUMN IF NOT EXISTS affirmations_enabled boolean NOT NULL DEFAULT true;
