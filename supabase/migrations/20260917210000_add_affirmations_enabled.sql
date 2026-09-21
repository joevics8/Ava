-- Defaulted true when this column was first added (opt-out model). Product
-- direction changed to an explicit onboarding opt-in question instead — see
-- the 20260920 migration for the flip to default false.
ALTER TABLE users ADD COLUMN IF NOT EXISTS affirmations_enabled boolean NOT NULL DEFAULT true;
