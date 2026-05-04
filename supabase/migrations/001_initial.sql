-- ============================================================
-- HireAHuman Initial Schema
-- ============================================================

-- Tenants (agents/organizations)
CREATE TABLE IF NOT EXISTS tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  api_key TEXT UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(32), 'hex'),
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Users (both agent-system users and human workers)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT,
  role TEXT NOT NULL CHECK (role IN ('agent', 'human', 'admin')),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Human worker profiles
CREATE TABLE IF NOT EXISTS human_profiles (
  id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  avatar_url TEXT,
  location_city TEXT,
  location_country TEXT,
  bio TEXT,
  skills TEXT[] DEFAULT '{}',
  languages TEXT[] DEFAULT '{}',
  verification_status TEXT DEFAULT 'pending' CHECK (verification_status IN ('pending', 'verified', 'rejected')),
  rating DECIMAL(3,2) DEFAULT 0.00,
  completed_tasks INT DEFAULT 0,
  hourly_rate DECIMAL(10,2),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Categories for bounties
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  icon TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Bounties (tasks posted by agents)
CREATE TABLE IF NOT EXISTS bounties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  assigned_human_id UUID REFERENCES users(id),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  instructions TEXT,
  location_address TEXT,
  location_lat DECIMAL(10, 8),
  location_lng DECIMAL(11, 8),
  reward_amount DECIMAL(10,2) NOT NULL,
  currency TEXT DEFAULT 'USD',
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'accepted', 'in_progress', 'submitted', 'reviewing', 'completed', 'disputed', 'cancelled', 'refunded')),
  deadline TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Task submissions (proof of work from humans)
CREATE TABLE IF NOT EXISTS task_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bounty_id UUID REFERENCES bounties(id) ON DELETE CASCADE,
  human_id UUID REFERENCES users(id) ON DELETE CASCADE,
  content TEXT,
  media_urls TEXT[] DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'submitted' CHECK (status IN ('submitted', 'approved', 'rejected')),
  reviewer_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Messages (agent-human communication per bounty)
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bounty_id UUID REFERENCES bounties(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  attachments TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Disputes
CREATE TABLE IF NOT EXISTS disputes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bounty_id UUID REFERENCES bounties(id) ON DELETE CASCADE,
  raised_by UUID REFERENCES users(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'investigating', 'resolved', 'escalated')),
  resolution TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- Indexes
-- ============================================================

CREATE INDEX idx_users_tenant_id ON users(tenant_id);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);

CREATE INDEX idx_human_profiles_location ON human_profiles(location_city, location_country);
CREATE INDEX idx_human_profiles_verification ON human_profiles(verification_status);
CREATE INDEX idx_human_profiles_skills ON human_profiles USING GIN(skills);

CREATE INDEX idx_bounties_tenant_id ON bounties(tenant_id);
CREATE INDEX idx_bounties_status ON bounties(status);
CREATE INDEX idx_bounties_category ON bounties(category_id);
CREATE INDEX idx_bounties_assigned ON bounties(assigned_human_id);
CREATE INDEX idx_bounties_created ON bounties(created_at DESC);

CREATE INDEX idx_task_submissions_bounty ON task_submissions(bounty_id);
CREATE INDEX idx_task_submissions_human ON task_submissions(human_id);

CREATE INDEX idx_messages_bounty ON messages(bounty_id);
CREATE INDEX idx_messages_created ON messages(created_at DESC);

CREATE INDEX idx_disputes_bounty ON disputes(bounty_id);
CREATE INDEX idx_disputes_status ON disputes(status);

-- ============================================================
-- RLS Policies
-- ============================================================

ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE human_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE bounties ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE disputes ENABLE ROW LEVEL SECURITY;

-- Tenants: only accessible via API key (service role)
CREATE POLICY "tenants_service_role" ON tenants USING (true);

-- Users: tenant-scoped access
CREATE POLICY "users_tenant_isolation" ON users
  USING (tenant_id = current_setting('app.current_tenant_id', true)::UUID);

-- Human profiles: readable by all, writable by owner
CREATE POLICY "human_profiles_read" ON human_profiles FOR SELECT USING (true);
CREATE POLICY "human_profiles_owner_write" ON human_profiles
  FOR UPDATE USING (id = current_setting('app.current_user_id', true)::UUID);

-- Categories: public read
CREATE POLICY "categories_read" ON categories FOR SELECT USING (true);

-- Bounties: tenant-scoped
CREATE POLICY "bounties_tenant_isolation" ON bounties
  USING (tenant_id = current_setting('app.current_tenant_id', true)::UUID);

-- Task submissions: bounty participants
CREATE POLICY "submissions_bounty_access" ON task_submissions
  USING (bounty_id IN (
    SELECT id FROM bounties WHERE tenant_id = current_setting('app.current_tenant_id', true)::UUID
  ));

-- Messages: bounty participants
CREATE POLICY "messages_bounty_access" ON messages
  USING (bounty_id IN (
    SELECT id FROM bounties WHERE tenant_id = current_setting('app.current_tenant_id', true)::UUID
  ));

-- Disputes: tenant-scoped
CREATE POLICY "disputes_tenant_isolation" ON disputes
  USING (bounty_id IN (
    SELECT id FROM bounties WHERE tenant_id = current_setting('app.current_tenant_id', true)::UUID
  ));

-- ============================================================
-- Seed Categories
-- ============================================================

INSERT INTO categories (name, slug, description, icon) VALUES
  ('Delivery', 'delivery', 'Package and food delivery tasks', 'truck'),
  ('Photography', 'photography', 'Photo capture and documentation', 'camera'),
  ('Inspection', 'inspection', 'Property and asset inspection', 'clipboard-check'),
  ('Research', 'research', 'On-ground research and data collection', 'search'),
  ('Mystery Shopping', 'mystery-shopping', 'Anonymous store visits and evaluations', 'user-secret'),
  ('Representation', 'representation', 'In-person representation and queuing', 'user-check'),
  ('Errands', 'errands', 'General errands and local tasks', 'shopping-bag'),
  ('Installation', 'installation', 'Equipment and sign installation', 'tools')
ON CONFLICT (slug) DO NOTHING;
