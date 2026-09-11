-- Referral fraud detection: Paystack's charge.success webhook includes card
-- details (bin/last4/bank) even though the "customer" is a synthetic
-- per-telegram-id email — this lets us detect when the SAME physical card
-- pays for both a referrer's own subscription and their "referred" friend's,
-- which is the main realistic self-referral fraud pattern at this scale.

CREATE TABLE IF NOT EXISTS user_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id),
  reference text NOT NULL,
  amount integer NOT NULL,
  card_bin text,
  card_last4 text,
  bank text,
  card_type text,
  authorization_code text,
  fingerprint text, -- bin-last4-bank; a coarse but useful "same card" signal
  paid_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_user_payments_user ON user_payments(user_id);
CREATE INDEX IF NOT EXISTS idx_user_payments_fingerprint ON user_payments(fingerprint);
ALTER TABLE user_payments ADD CONSTRAINT user_payments_reference_unique UNIQUE (reference);

ALTER TABLE referrals ADD COLUMN IF NOT EXISTS fraud_note text;
