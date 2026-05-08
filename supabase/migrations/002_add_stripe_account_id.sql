-- Migration: Add stripe_account_id to human_profiles for Stripe Connect
-- Date: 2026-05-07

-- Add stripe_account_id column to human_profiles
ALTER TABLE human_profiles
ADD COLUMN IF NOT EXISTS stripe_account_id TEXT;

-- Add index for fast lookup
CREATE INDEX IF NOT EXISTS idx_human_profiles_stripe_account
ON human_profiles(stripe_account_id)
WHERE stripe_account_id IS NOT NULL;

-- Add comment
COMMENT ON COLUMN human_profiles.stripe_account_id IS 'Stripe Connect express account ID for worker payouts';
