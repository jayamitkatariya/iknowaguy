-- ============================================================
-- Migration: Add missing columns for MCP server compatibility
-- Run this in Supabase SQL Runner
-- ============================================================

-- In bounties table, add missing columns:
ALTER TABLE bounties ADD COLUMN IF NOT EXISTS completion_code TEXT;
ALTER TABLE bounties ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'unpaid' CHECK (payment_status IN ('unpaid', 'pending', 'held', 'released', 'refunded'));
ALTER TABLE bounties ADD COLUMN IF NOT EXISTS evidence_required TEXT[] DEFAULT '{}';
ALTER TABLE bounties ADD COLUMN IF NOT EXISTS location_city TEXT;
ALTER TABLE bounties ADD COLUMN IF NOT EXISTS location_country TEXT;
ALTER TABLE bounties ADD COLUMN IF NOT EXISTS location_instructions TEXT;
ALTER TABLE bounties ADD COLUMN IF NOT EXISTS steps JSONB DEFAULT '[]';
ALTER TABLE bounties ADD COLUMN IF NOT EXISTS is_remote BOOLEAN DEFAULT false;
ALTER TABLE bounties ADD COLUMN IF NOT EXISTS price DECIMAL(10,2);
ALTER TABLE bounties ADD COLUMN IF NOT EXISTS price_type TEXT DEFAULT 'fixed' CHECK (price_type IN ('fixed', 'hourly'));
ALTER TABLE bounties ADD COLUMN IF NOT EXISTS estimated_hours DECIMAL(5,2);
ALTER TABLE bounties ADD COLUMN IF NOT EXISTS agent_id UUID REFERENCES users(id);

-- In human_profiles table, add missing columns:
ALTER TABLE human_profiles ADD COLUMN IF NOT EXISTS is_available BOOLEAN DEFAULT true;
ALTER TABLE human_profiles ADD COLUMN IF NOT EXISTS timezone TEXT;

-- Create payment_transactions table if not exists (referenced by payments_initiate)
CREATE TABLE IF NOT EXISTS payment_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  bounty_id UUID REFERENCES bounties(id) ON DELETE CASCADE,
  human_id UUID REFERENCES users(id) ON DELETE SET NULL,
  amount DECIMAL(10,2) NOT NULL,
  currency TEXT DEFAULT 'USD',
  type TEXT NOT NULL CHECK (type IN ('hold', 'release', 'refund')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
  payment_provider TEXT,
  provider_transaction_id TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Update existing seed data for bounties (completion_code, etc.)
-- Note: These are optional updates to existing rows
UPDATE bounties SET 
  completion_code = 'XXXXXXXX',
  payment_status = 'unpaid',
  evidence_required = '{}',
  location_city = COALESCE(location_city, 'San Francisco'),
  location_country = COALESCE(location_country, 'US'),
  is_remote = false,
  steps = '[]'
WHERE completion_code IS NULL;

-- Update existing human_profiles seed data
UPDATE human_profiles SET 
  is_available = true
WHERE is_available IS NULL;
