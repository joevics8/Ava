-- Product direction changed: daily affirmations are now an explicit Yes/No
-- question at the end of onboarding (see onboarding-raw.ts step 8 ->
-- completeOnboardingAfterAffirmationChoice), not an opt-out default. New
-- signups should start false until they say yes; existing users keep
-- whatever value they already have (unaffected by a default change).
ALTER TABLE users ALTER COLUMN affirmations_enabled SET DEFAULT false;
