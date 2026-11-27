-- Region fallback for food suggestions. Users whose country is one of our 50 (or any country we
-- can map to a region from users.country) never need this; it only stores the region someone
-- picked when their country wasn't recognised. Values are RegionId strings from lib/ava/countries.ts.
ALTER TABLE users ADD COLUMN IF NOT EXISTS food_region text;
