-- ============================================================
-- HireAHuman — Complete Fresh Schema
-- DROP + CREATE + SEED — run once in Supabase SQL Editor
-- ============================================================

-- ============================================================
-- DROP existing tables (reverse FK order for safe deletion)
-- ============================================================
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS disputes CASCADE;
DROP TABLE IF EXISTS messages CASCADE;
DROP TABLE IF EXISTS payments CASCADE;
DROP TABLE IF EXISTS payment_transactions CASCADE;
DROP TABLE IF EXISTS task_submissions CASCADE;
DROP TABLE IF EXISTS bounty_assignments CASCADE;
DROP TABLE IF EXISTS bounties CASCADE;
DROP TABLE IF EXISTS task_templates CASCADE;
DROP TABLE IF EXISTS human_profiles CASCADE;
DROP TABLE IF EXISTS team_members CASCADE;
DROP TABLE IF EXISTS categories CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS tenants CASCADE;

-- ============================================================
-- Extensions
-- ============================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- Functions
-- ============================================================

CREATE OR REPLACE FUNCTION generate_api_key(prefix TEXT DEFAULT 'hak_live')
RETURNS TEXT LANGUAGE plpgsql AS $$
BEGIN
  RETURN prefix || '_' || encode(gen_random_bytes(24), 'hex');
END;
$$;

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION increment_tasks_completed()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
    UPDATE human_profiles
    SET completed_tasks = completed_tasks + 1
    WHERE id = NEW.assigned_human_id AND NEW.assigned_human_id IS NOT NULL;
  END IF;
  RETURN NEW;
END;
$$;

-- ============================================================
-- Tables (in dependency order)
-- ============================================================

-- Tenants (agents/organizations)
CREATE TABLE tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  api_key TEXT UNIQUE NOT NULL DEFAULT generate_api_key(),
  api_key_prefix TEXT GENERATED ALWAYS AS (LEFT(api_key, 12)) STORED,
  api_key_hash TEXT,
  contact_email TEXT,
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Users (both agent-system users and human workers)
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT,
  role TEXT NOT NULL CHECK (role IN ('agent', 'human', 'admin')),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Categories for bounties
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  icon TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Human worker profiles
CREATE TABLE human_profiles (
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
  is_available BOOLEAN DEFAULT true,
  timezone TEXT,
  notification_slack TEXT,
  notification_telegram TEXT,
  notification_email TEXT,
  notification_phone TEXT,
  notification_preferred_channels TEXT[] DEFAULT '{}',
  stripe_account_id TEXT,
  stripe_onboarding_complete BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Task templates (predefined task blueprints)
CREATE TABLE task_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  description TEXT,
  steps JSONB NOT NULL DEFAULT '[]',
  estimated_duration_minutes INT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Bounties (tasks posted by agents)
CREATE TABLE bounties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  template_id UUID REFERENCES task_templates(id) ON DELETE SET NULL,
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
  completion_code TEXT,
  payment_status TEXT DEFAULT 'unpaid' CHECK (payment_status IN ('unpaid', 'pending', 'held', 'released', 'refunded')),
  evidence_required TEXT[] DEFAULT '{}',
  location_city TEXT,
  location_country TEXT,
  location_instructions TEXT,
  steps JSONB DEFAULT '[]',
  is_remote BOOLEAN DEFAULT false,
  price DECIMAL(10,2),
  price_type TEXT DEFAULT 'fixed' CHECK (price_type IN ('fixed', 'hourly')),
  estimated_hours DECIMAL(5,2),
  agent_id UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Bounty assignments (explicit assignment records)
CREATE TABLE bounty_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bounty_id UUID REFERENCES bounties(id) ON DELETE CASCADE,
  human_id UUID REFERENCES users(id) ON DELETE CASCADE,
  assigned_by UUID REFERENCES users(id),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'cancelled')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Task submissions (proof of work from humans)
CREATE TABLE task_submissions (
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

-- Payment transactions
CREATE TABLE payment_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  bounty_id UUID REFERENCES bounties(id) ON DELETE SET NULL,
  human_id UUID REFERENCES users(id) ON DELETE SET NULL,
  amount DECIMAL(10,2) NOT NULL,
  currency TEXT DEFAULT 'USD',
  type TEXT NOT NULL CHECK (type IN ('bounty_payment', 'refund', 'bonus', 'penalty', 'hold', 'release')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'refunded')),
  stripe_payment_intent_id TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Payments (simpler payment records linked to transactions)
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bounty_id UUID REFERENCES bounties(id) ON DELETE SET NULL,
  transaction_id UUID REFERENCES payment_transactions(id) ON DELETE SET NULL,
  amount DECIMAL(10,2) NOT NULL,
  currency TEXT DEFAULT 'USD',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'held', 'released', 'refunded', 'failed')),
  payment_method TEXT,
  provider TEXT DEFAULT 'stripe',
  provider_payment_id TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Messages (agent-human communication per bounty)
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bounty_id UUID REFERENCES bounties(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  attachments TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Disputes
CREATE TABLE disputes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bounty_id UUID REFERENCES bounties(id) ON DELETE CASCADE,
  raised_by UUID REFERENCES users(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  description TEXT,
  evidence_urls TEXT[] DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'investigating', 'resolved', 'escalated')),
  resolution TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Notifications
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('task_assigned', 'message_received', 'submission_reviewed', 'dispute_raised', 'payment_received', 'deadline_reminder', 'verification_update')),
  title TEXT NOT NULL,
  content TEXT,
  metadata JSONB DEFAULT '{}',
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Team members (tenant membership)
CREATE TABLE team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member')),
  invited_by UUID REFERENCES users(id),
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tenant_id, user_id)
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
CREATE INDEX idx_human_profiles_name_trgm ON human_profiles USING GIN(full_name gin_trgm_ops);

CREATE INDEX idx_categories_slug ON categories(slug);

CREATE INDEX idx_task_templates_category ON task_templates(category_id);
CREATE INDEX idx_task_templates_name_trgm ON task_templates USING GIN(name gin_trgm_ops);

CREATE INDEX idx_bounties_tenant_id ON bounties(tenant_id);
CREATE INDEX idx_bounties_status ON bounties(status);
CREATE INDEX idx_bounties_category ON bounties(category_id);
CREATE INDEX idx_bounties_assigned ON bounties(assigned_human_id);
CREATE INDEX idx_bounties_template ON bounties(template_id);
CREATE INDEX idx_bounties_created ON bounties(created_at DESC);
CREATE INDEX idx_bounties_deadline ON bounties(deadline) WHERE deadline IS NOT NULL;
CREATE INDEX idx_bounties_title_trgm ON bounties USING GIN(title gin_trgm_ops);
CREATE INDEX idx_bounties_payment_status ON bounties(payment_status);

CREATE INDEX idx_bounty_assignments_bounty ON bounty_assignments(bounty_id);
CREATE INDEX idx_bounty_assignments_human ON bounty_assignments(human_id);
CREATE INDEX idx_bounty_assignments_status ON bounty_assignments(status);

CREATE INDEX idx_task_submissions_bounty ON task_submissions(bounty_id);
CREATE INDEX idx_task_submissions_human ON task_submissions(human_id);
CREATE INDEX idx_task_submissions_status ON task_submissions(status);

CREATE INDEX idx_payment_transactions_tenant ON payment_transactions(tenant_id);
CREATE INDEX idx_payment_transactions_bounty ON payment_transactions(bounty_id);
CREATE INDEX idx_payment_transactions_human ON payment_transactions(human_id);
CREATE INDEX idx_payment_transactions_status ON payment_transactions(status);
CREATE INDEX idx_payment_transactions_created ON payment_transactions(created_at DESC);
CREATE INDEX idx_payment_transactions_stripe ON payment_transactions(stripe_payment_intent_id) WHERE stripe_payment_intent_id IS NOT NULL;

CREATE INDEX idx_payments_bounty ON payments(bounty_id);
CREATE INDEX idx_payments_transaction ON payments(transaction_id);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_payments_provider ON payments(provider_payment_id) WHERE provider_payment_id IS NOT NULL;

CREATE INDEX idx_messages_bounty ON messages(bounty_id);
CREATE INDEX idx_messages_sender ON messages(sender_id);
CREATE INDEX idx_messages_created ON messages(created_at DESC);

CREATE INDEX idx_disputes_bounty ON disputes(bounty_id);
CREATE INDEX idx_disputes_status ON disputes(status);
CREATE INDEX idx_disputes_raised_by ON disputes(raised_by);

CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_unread ON notifications(user_id, is_read) WHERE is_read = FALSE;
CREATE INDEX idx_notifications_created ON notifications(created_at DESC);

CREATE INDEX idx_team_members_tenant ON team_members(tenant_id);
CREATE INDEX idx_team_members_user ON team_members(user_id);

-- ============================================================
-- Triggers
-- ============================================================

CREATE TRIGGER update_tenants_updated_at BEFORE UPDATE ON tenants FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_human_profiles_updated_at BEFORE UPDATE ON human_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_task_templates_updated_at BEFORE UPDATE ON task_templates FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_bounties_updated_at BEFORE UPDATE ON bounties FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_bounty_assignments_updated_at BEFORE UPDATE ON bounty_assignments FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_task_submissions_updated_at BEFORE UPDATE ON task_submissions FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_payment_transactions_updated_at BEFORE UPDATE ON payment_transactions FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON payments FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_disputes_updated_at BEFORE UPDATE ON disputes FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER increment_completed_tasks_on_bounty_complete
  AFTER UPDATE ON bounties
  FOR EACH ROW EXECUTE FUNCTION increment_tasks_completed();

-- ============================================================
-- Row Level Security
-- ============================================================

ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE human_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE bounties ENABLE ROW LEVEL SECURITY;
ALTER TABLE bounty_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE disputes ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;

-- Tenants: service role full access
CREATE POLICY "tenants_service_role" ON tenants FOR ALL USING (true);

-- Users: tenant-scoped access
CREATE POLICY "users_tenant_isolation" ON users
  USING (tenant_id = current_setting('app.current_tenant_id', true)::UUID);

-- Human profiles: public read, owner/admin write
CREATE POLICY "human_profiles_read" ON human_profiles FOR SELECT USING (true);
CREATE POLICY "human_profiles_owner_write" ON human_profiles FOR ALL
  USING (id = auth.uid() OR current_setting('app.current_user_id', true)::UUID = id);

-- Categories: public read
CREATE POLICY "categories_read" ON categories FOR SELECT USING (true);

-- Task templates: public read
CREATE POLICY "task_templates_read" ON task_templates FOR SELECT USING (true);

-- Bounties: tenant-scoped + public open bounties for workers
CREATE POLICY "bounties_tenant_isolation" ON bounties
  USING (tenant_id = current_setting('app.current_tenant_id', true)::UUID);
CREATE POLICY "bounties_public_read_open" ON bounties FOR SELECT
  USING (status = 'open');

-- Bounty assignments: tenant-scoped
CREATE POLICY "bounty_assignments_tenant_isolation" ON bounty_assignments
  USING (bounty_id IN (SELECT id FROM bounties WHERE tenant_id = current_setting('app.current_tenant_id', true)::UUID));

-- Task submissions: tenant-scoped + human own
CREATE POLICY "submissions_tenant_access" ON task_submissions
  USING (bounty_id IN (SELECT id FROM bounties WHERE tenant_id = current_setting('app.current_tenant_id', true)::UUID));
CREATE POLICY "submissions_human_own" ON task_submissions FOR SELECT
  USING (human_id = auth.uid());

-- Payment transactions: tenant-scoped + human own
CREATE POLICY "payment_transactions_tenant_isolation" ON payment_transactions
  USING (tenant_id = current_setting('app.current_tenant_id', true)::UUID);
CREATE POLICY "payment_transactions_human_own" ON payment_transactions FOR SELECT
  USING (human_id = auth.uid());

-- Payments: tenant-scoped
CREATE POLICY "payments_tenant_isolation" ON payments
  USING (bounty_id IN (SELECT id FROM bounties WHERE tenant_id = current_setting('app.current_tenant_id', true)::UUID));

-- Messages: tenant-scoped + assigned human
CREATE POLICY "messages_tenant_access" ON messages
  USING (bounty_id IN (SELECT id FROM bounties WHERE tenant_id = current_setting('app.current_tenant_id', true)::UUID));

-- Disputes: tenant-scoped + raised by human
CREATE POLICY "disputes_tenant_isolation" ON disputes
  USING (bounty_id IN (SELECT id FROM bounties WHERE tenant_id = current_setting('app.current_tenant_id', true)::UUID));
CREATE POLICY "disputes_human_own" ON disputes FOR SELECT
  USING (raised_by = auth.uid());

-- Notifications: user owns theirs
CREATE POLICY "notifications_user_own" ON notifications
  FOR ALL USING (user_id = auth.uid());

-- Team members: tenant-scoped + user own
CREATE POLICY "team_members_tenant_isolation" ON team_members
  USING (tenant_id = current_setting('app.current_tenant_id', true)::UUID);
CREATE POLICY "team_members_user_own" ON team_members FOR SELECT
  USING (user_id = auth.uid());

-- ============================================================
-- Storage Bucket
-- ============================================================

INSERT INTO storage.buckets (id, name, public)
VALUES ('evidence', 'evidence', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "evidence_public_read" ON storage.objects;
DROP POLICY IF EXISTS "evidence_authenticated_write" ON storage.objects;
DROP POLICY IF EXISTS "evidence_authenticated_update" ON storage.objects;
DROP POLICY IF EXISTS "evidence_authenticated_delete" ON storage.objects;

CREATE POLICY "evidence_public_read" ON storage.objects FOR SELECT USING (bucket_id = 'evidence');
CREATE POLICY "evidence_authenticated_write" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'evidence' AND auth.role() = 'authenticated');
CREATE POLICY "evidence_authenticated_update" ON storage.objects FOR UPDATE USING (bucket_id = 'evidence' AND auth.role() = 'authenticated');
CREATE POLICY "evidence_authenticated_delete" ON storage.objects FOR DELETE USING (bucket_id = 'evidence' AND auth.role() = 'authenticated');

-- ============================================================
-- SEED DATA
-- ============================================================

-- Sample Tenant
INSERT INTO tenants (id, name, slug, api_key, api_key_hash, api_key_prefix, contact_email) VALUES
  ('a1111111-1111-1111-1111-111111111111', 'Acme AI Labs', 'acme-ai', 'hak_live_demo123456789012345678901234', '8896bb74e8df85cad3e996d9c1f64d55bf16e16904fff938b7835c27bda09c68', 'hak_live_de', 'admin@acme-ai.com')
ON CONFLICT DO NOTHING;

-- Sample Users
INSERT INTO users (id, tenant_id, email, password_hash, role) VALUES
  ('b1111111-1111-1111-1111-111111111111', 'a1111111-1111-1111-1111-111111111111', 'agent@acme-ai.com', '$2b$10$demo', 'agent'),
  ('b2222222-2222-2222-2222-222222222222', 'a1111111-1111-1111-1111-111111111111', 'admin@acme-ai.com', '$2b$10$demo', 'admin'),
  ('c1111111-1111-1111-1111-111111111111', 'a1111111-1111-1111-1111-111111111111', 'priya.worker@example.com', '$2b$10$demo', 'human'),
  ('c2222222-2222-2222-2222-222222222222', 'a1111111-1111-1111-1111-111111111111', 'marcus.worker@example.com', '$2b$10$demo', 'human')
ON CONFLICT DO NOTHING;

-- Sample Human Profiles
INSERT INTO human_profiles (id, full_name, location_city, location_country, bio, skills, languages, verification_status, rating, completed_tasks, hourly_rate, is_available, notification_email) VALUES
  ('c1111111-1111-1111-1111-111111111111', 'Priya Sharma', 'San Francisco', 'USA', 'Reliable worker with a keen eye for detail. Experienced in photography, data collection, and mystery shopping.', ARRAY['photography', 'data-entry', 'mystery-shopping', 'errands'], ARRAY['English', 'Hindi'], 'verified', 4.85, 28, 25.00, true, 'priya.worker@example.com'),
  ('c2222222-2222-2222-2222-222222222222', 'Marcus Johnson', 'San Francisco', 'USA', 'Former logistics coordinator now doing freelance tasks. Fast, accurate, and great with people.', ARRAY['errands', 'delivery', 'surveys', 'inspections'], ARRAY['English'], 'verified', 4.72, 41, 30.00, true, 'marcus.worker@example.com')
ON CONFLICT DO NOTHING;

-- Sample Categories
INSERT INTO categories (id, name, slug, description, icon) VALUES
  ('c0000001-0000-0000-0000-000000000001', 'Photography', 'photography', 'Photo capture tasks — storefronts, real estate, events', '📷'),
  ('c0000001-0000-0000-0000-000000000002', 'Surveys & Research', 'surveys', 'Data collection, surveys, market research', '📋'),
  ('c0000001-0000-0000-0000-000000000003', 'Inspections', 'inspection', 'Property, vehicle, or product inspections', '🔍'),
  ('c0000001-0000-0000-0000-000000000004', 'Errands', 'errands', 'Pickups, deliveries, and general errands', '📦'),
  ('c0000001-0000-0000-0000-000000000005', 'Mystery Shopping', 'mystery-shopping', 'Evaluate customer experience at retail locations', '🛒'),
  ('c0000001-0000-0000-0000-000000000006', 'Document Pickup', 'document-pickup', 'Fetch documents from offices, banks, government buildings', '📄')
ON CONFLICT DO NOTHING;

-- Sample Bounties
INSERT INTO bounties (id, tenant_id, category_id, assigned_human_id, title, description, instructions, location_address, reward_amount, status, payment_status, deadline, completion_code, agent_id) VALUES
  -- Open bounty — unassigned
  ('d1111111-1111-1111-1111-111111111111', 'a1111111-1111-1111-1111-111111111111',
   (SELECT id FROM categories WHERE slug = 'photography'), NULL,
   'Photograph storefront conditions on Market St', 'Walk down Market Street between 5th and 10th Ave. Photograph every storefront condition — broken signs, peeling paint, boarded windows, construction barriers.', 'Use the timestamp camera app. Walk west to east direction. Take 2 photos per storefront minimum. Note any businesses that appear closed permanently.',
   'Market St, San Francisco, CA 94102', 100.00, 'open', 'unpaid', NOW() + INTERVAL '3 days', NULL, 'b1111111-1111-1111-1111-111111111111'),

  -- Open bounty — unassigned
  ('d2222222-2222-2222-2222-222222222222', 'a1111111-1111-1111-1111-111111111111',
   (SELECT id FROM categories WHERE slug = 'surveys'), NULL,
   'Survey parking availability in SOMA', 'Count available parking spots on 3 blocks in SOMA. Note metered vs unmetered, time restrictions, and any construction impacts.', 'Use the parking survey form in the worker app. Count spots between 9AM-11AM on a weekday. Fill all fields in the form.',
   'SOMA, San Francisco, CA 94103', 45.00, 'open', 'unpaid', NOW() + INTERVAL '2 days', NULL, 'b1111111-1111-1111-1111-111111111111'),

  -- Assigned bounty — in progress
  ('d3333333-3333-3333-3333-333333333333', 'a1111111-1111-1111-1111-111111111111',
   (SELECT id FROM categories WHERE slug = 'mystery-shopping'), 'c2222222-2222-2222-2222-222222222222',
   'Mystery shop at Union Square retail store', 'Visit the Apple store at Union Square. Evaluate staff friendliness, wait time, and product knowledge.', 'Do not reveal you are conducting an evaluation. Purchase a small accessory if asked. Submit report within 2 hours of visit.',
   '340 Stockton St, San Francisco, CA 94108', 45.00, 'accepted', 'held', NOW() + INTERVAL '1 day', 'CODE-UNI-001', 'b1111111-1111-1111-1111-111111111111'),

  -- Submitted bounty — awaiting review
  ('d4444444-4444-4444-4444-444444444444', 'a1111111-1111-1111-1111-111111111111',
   (SELECT id FROM categories WHERE slug = 'inspection'), 'c1111111-1111-1111-1111-111111111111',
   'Inspect apartment unit at 789 Howard St', 'Document condition of unit 4B: walls, floors, appliances, plumbing, electrical.', 'Take timestamped photos of each room. Note any damage or maintenance issues. Check all appliances are functional.',
   '789 Howard St Unit 4B, San Francisco, CA 94103', 60.00, 'submitted', 'held', NOW() + INTERVAL '5 days', 'CODE-HWD-002', 'b1111111-1111-1111-1111-111111111111'),

  -- Completed bounty
  ('d5555555-5555-5555-5555-555555555555', 'a1111111-1111-1111-1111-111111111111',
   (SELECT id FROM categories WHERE slug = 'mystery-shopping'), 'c2222222-2222-2222-2222-222222222222',
   'Mystery shop at Union Square retail store', 'Visit the Apple store at Union Square. Evaluate staff friendliness, wait time, and product knowledge.', 'Do not reveal you are conducting an evaluation. Submit report within 2 hours.',
   '340 Stockton St, San Francisco, CA 94108', 45.00, 'completed', 'released', NOW() - INTERVAL '1 day', 'CODE-UNI-002', 'b1111111-1111-1111-1111-111111111111'),

  -- Disputed bounty
  ('d6666666-6666-6666-6666-666666666666', 'a1111111-1111-1111-1111-111111111111',
   (SELECT id FROM categories WHERE slug = 'errands'), 'c1111111-1111-1111-1111-111111111111',
   'Purchase and deliver office supplies', 'Buy 2 reams of paper, 10 pens, and 5 notebooks from Staples. Deliver to office.', 'Keep receipt. Items must be exact specifications. Delivery window: 2PM-4PM.',
   '1201 16th St, San Francisco, CA 94107', 30.00, 'disputed', 'held', NOW() - INTERVAL '2 days', NULL, 'b1111111-1111-1111-1111-111111111111')
ON CONFLICT DO NOTHING;

-- Sample Bounty Assignments
INSERT INTO bounty_assignments (id, bounty_id, human_id, assigned_by, status, notes) VALUES
  ('a1111111-1111-1111-1111-111111111111', 'd3333333-3333-3333-3333-333333333333', 'c2222222-2222-2222-2222-222222222222', 'b1111111-1111-1111-1111-111111111111', 'accepted', 'Priority — this is a repeat client'),
  ('a2222222-2222-2222-2222-222222222222', 'd4444444-4444-4444-4444-444444444444', 'c1111111-1111-1111-1111-111111111111', 'b1111111-1111-1111-1111-111111111111', 'accepted', NULL),
  ('a3333333-3333-3333-3333-333333333333', 'd5555555-5555-5555-5555-555555555555', 'c2222222-2222-2222-2222-222222222222', 'b1111111-1111-1111-1111-111111111111', 'accepted', 'Completed on time'),
  ('a4444444-4444-4444-4444-444444444444', 'd6666666-6666-6666-6666-666666666666', 'c1111111-1111-1111-1111-111111111111', 'b1111111-1111-1111-1111-111111111111', 'accepted', NULL)
ON CONFLICT DO NOTHING;

-- Sample Task Submissions
INSERT INTO task_submissions (id, bounty_id, human_id, content, media_urls, status, reviewer_notes) VALUES
  ('e1111111-1111-1111-1111-111111111111', 'd4444444-4444-4444-4444-444444444444', 'c1111111-1111-1111-1111-111111111111',
   'Inspection complete. Unit 4B is in good condition overall. Minor scuff marks on living room wall. Kitchen appliances functional. Bathroom faucet has slow drip. All electrical outlets tested and working.',
   ARRAY['https://storage.example.com/submissions/e111/photo1.jpg', 'https://storage.example.com/submissions/e111/photo2.jpg', 'https://storage.example.com/submissions/e111/photo3.jpg'],
   'submitted', NULL),

  ('e2222222-2222-2222-2222-222222222222', 'd5555555-5555-5555-5555-555555555555', 'c2222222-2222-2222-2222-222222222222',
   'Visit completed at 2:15 PM. Staff greeted within 30 seconds. Wait time for assistance: 2 minutes. Associate demonstrated strong knowledge of MacBook lineup. Store was clean and well-organized. NPS score: 9/10.',
   ARRAY['https://storage.example.com/submissions/e222/receipt.jpg'],
   'approved', 'Excellent detailed report. Payment released.')
ON CONFLICT DO NOTHING;

-- Sample Messages
INSERT INTO messages (id, bounty_id, sender_id, content) VALUES
  ('f1111111-1111-1111-1111-111111111111', 'd2222222-2222-2222-2222-222222222222', 'b1111111-1111-1111-1111-111111111111',
   'Marcus, please focus on storefronts that have "For Lease" signs. Those are priority.'),
  ('f2222222-2222-2222-2222-222222222222', 'd2222222-2222-2222-2222-222222222222', 'c2222222-2222-2222-2222-222222222222',
   'Got it. I''ll prioritize those and flag them in the submission.'),
  ('f3333333-3333-3333-3333-333333333333', 'd3333333-3333-3333-3333-333333333333', 'b1111111-1111-1111-1111-111111111111',
   'Priya, can you also note any no-parking signs that seem outdated?'),
  ('f4444444-4444-4444-4444-444444444444', 'd3333333-3333-3333-3333-333333333333', 'c1111111-1111-1111-1111-111111111111',
   'Will do. I''ll add a column for sign condition in my report.')
ON CONFLICT DO NOTHING;

-- Sample Disputes
INSERT INTO disputes (id, bounty_id, raised_by, reason, description, status) VALUES
  ('d7777777-7777-7777-7777-777777777777', 'd6666666-6666-6666-6666-666666666666', 'b1111111-1111-1111-1111-111111111111',
   'Wrong items purchased', 'Agent requested 10 ballpoint pens but received gel pens. Receipt shows different SKU than specified.', 'open')
ON CONFLICT DO NOTHING;

-- Sample Notifications
INSERT INTO notifications (id, user_id, type, title, content, metadata) VALUES
  ('91111111-1111-1111-1111-111111111111', 'c1111111-1111-1111-1111-111111111111', 'task_assigned', 'New bounty assigned', 'You have been assigned to "Inspect apartment unit at 789 Howard St"', '{"bounty_id": "d4444444-4444-4444-4444-444444444444"}'),
  ('92222222-2222-2222-2222-222222222222', 'c2222222-2222-2222-2222-222222222222', 'task_assigned', 'New bounty assigned', 'You have been assigned to "Survey parking availability in SOMA"', '{"bounty_id": "d2222222-2222-2222-2222-222222222222"}'),
  ('93333333-3333-3333-3333-333333333333', 'c1111111-1111-1111-1111-111111111111', 'message_received', 'New message on bounty', 'Marcus, please focus on storefronts that have "For Lease" signs.', '{"bounty_id": "d2222222-2222-2222-2222-222222222222"}'),
  ('94444444-4444-4444-4444-444444444444', 'c2222222-2222-2222-2222-222222222222', 'payment_received', 'Payment received', 'You received $45.00 for completed bounty "Mystery shop at Union Square retail store"', '{"bounty_id": "d5555555-5555-5555-5555-555555555555", "amount": 45.00}')
ON CONFLICT DO NOTHING;

-- Sample Payment Transactions
INSERT INTO payment_transactions (id, tenant_id, bounty_id, human_id, amount, currency, type, status, metadata) VALUES
  ('b1111111-1111-1111-1111-111111111111', 'a1111111-1111-1111-1111-111111111111', 'd5555555-5555-5555-5555-555555555555', 'c2222222-2222-2222-2222-222222222222', 45.00, 'USD', 'bounty_payment', 'completed', '{"payout_method": "stripe"}'),
  ('b2222222-2222-2222-2222-222222222222', 'a1111111-1111-1111-1111-111111111111', 'd2222222-2222-2222-2222-222222222222', 'c1111111-1111-1111-1111-111111111111', 45.00, 'USD', 'hold', 'pending', '{"hold_reason": "awaiting_submission"}'),
  ('b3333333-3333-3333-3333-333333333333', 'a1111111-1111-1111-1111-111111111111', 'd6666666-6666-6666-6666-666666666666', 'c1111111-1111-1111-1111-111111111111', 30.00, 'USD', 'hold', 'pending', '{"hold_reason": "dispute_open"}')
ON CONFLICT DO NOTHING;

-- Sample Team Members
INSERT INTO team_members (tenant_id, user_id, role) VALUES
  ('a1111111-1111-1111-1111-111111111111', 'b1111111-1111-1111-1111-111111111111', 'owner'),
  ('a1111111-1111-1111-1111-111111111111', 'c1111111-1111-1111-1111-111111111111', 'member'),
  ('a1111111-1111-1111-1111-111111111111', 'c2222222-2222-2222-2222-222222222222', 'member')
ON CONFLICT DO NOTHING;
