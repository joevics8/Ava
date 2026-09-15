-- Country: free-text, collected once during onboarding. Needed regardless
-- of the food feature (useful demographic/tracking signal on its own), and
-- also what lets /foods and the morning "Eat" line localise suggestions
-- (see lib/ava/food-data.ts).
ALTER TABLE users ADD COLUMN IF NOT EXISTS country text;

-- food_profile_step: 0 = not in the "tell Ava about my diet" flow, 1-6 =
-- which question the user is currently answering. Mirrors the pattern
-- already used for onboarding_step / settings steps, kept separate so it
-- doesn't collide with either.
ALTER TABLE users ADD COLUMN IF NOT EXISTS food_profile_step int NOT NULL DEFAULT 0;

-- food_profile: free-text answers (breakfast habits, foods avoided,
-- allergies, budget, meals/day, cook-or-buy) used to tailor AI-generated
-- food suggestions. Deliberately unstructured/jsonb rather than fixed
-- columns since these are open text answers, not enums.
ALTER TABLE users ADD COLUMN IF NOT EXISTS food_profile jsonb NOT NULL DEFAULT '{}'::jsonb;
