-- Referral system: every user gets a shareable code; referred_by links a
-- new user back to whoever referred them; the referrals table tracks
-- qualification (referred user went premium) and payout status separately
-- from the users table so payout bookkeeping doesn't clutter user records.

ALTER TABLE users ADD COLUMN IF NOT EXISTS referral_code text UNIQUE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS referred_by uuid REFERENCES users(id);

CREATE TABLE IF NOT EXISTS referrals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id uuid NOT NULL REFERENCES users(id),
  referred_id uuid NOT NULL UNIQUE REFERENCES users(id),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','qualified','paid','invalid')),
  payout_amount integer NOT NULL DEFAULT 1000, -- naira; ₦1,000 per qualified referral
  created_at timestamptz NOT NULL DEFAULT now(),
  qualified_at timestamptz, -- set when referred user's premium payment is confirmed
  paid_at timestamptz,      -- set manually once the referrer has actually been paid
  notes text
);

CREATE INDEX IF NOT EXISTS idx_referrals_referrer ON referrals(referrer_id);
CREATE INDEX IF NOT EXISTS idx_referrals_status ON referrals(status);
