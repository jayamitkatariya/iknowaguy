-- HireAHuman Complete Schema
-- ============================================================
-- Paste-and-run in Supabase SQL Editor
-- ============================================================

-- ============================================================
-- Extensions
-- ============================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- ============================================================
-- Functions
-- ============================================================

-- Generate a random API key with prefix
CREATE OR REPLACE FUNCTION generate_api_key(prefix TEXT DEFAULT 'hak_live')
RETURNS TEXT
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN prefix || '_' || encode(gen_random_bytes(24), 'hex');
END;
$$;

-- Update the updated_at column automatically
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Increment completed_tasks on human profile when bounty is completed
CREATE OR REPLACE FUNCTION increment_tasks_completed()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    UPDATE human_profiles
    SET completed_tasks = completed_tasks + 1
    WHERE id = NEW.assigned_human_id AND NEW.assigned_human_id IS NOT NULL;
  END IF;
  RETURN NEW;
END;
$$;

-- Auto-create human profile when a user with role 'human' is inserted
CREATE OR REPLACE FUNCTION create_human_profile_trigger()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.role = 'human' THEN
    INSERT INTO human_profiles (id, full_name)
    VALUES (NEW.id, split_part(NEW.email, '@', 1));
  END IF;
  RETURN NEW;
END;
$$;

-- ============================================================
-- Tables
-- ============================================================

-- Tenants (agents/organizations)
CREATE TABLE IF NOT EXISTS tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  api_key TEXT UNIQUE NOT NULL DEFAULT generate_api_key(),
  api_key_prefix TEXT GENERATED ALWAYS AS (LEFT(api_key, 12)) STORED,
  contact_email TEXT,
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

-- Task templates (predefined task blueprints)
CREATE TABLE IF NOT EXISTS task_templates (
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
CREATE TABLE IF NOT EXISTS bounties (
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

-- Notifications
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('task_assigned', 'message_received', 'submission_reviewed', 'dispute_raised', 'payment_received', 'deadline_reminder', 'verification_update')),
  title TEXT NOT NULL,
  content TEXT,
  metadata JSONB DEFAULT '{}',
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Payment transactions
CREATE TABLE IF NOT EXISTS payment_transactions (
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

-- ============================================================
-- Indexes
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_users_tenant_id ON users(tenant_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

CREATE INDEX IF NOT EXISTS idx_human_profiles_location ON human_profiles(location_city, location_country);
CREATE INDEX IF NOT EXISTS idx_human_profiles_verification ON human_profiles(verification_status);
CREATE INDEX IF NOT EXISTS idx_human_profiles_skills ON human_profiles USING GIN(skills);
CREATE INDEX IF NOT EXISTS idx_human_profiles_name_trgm ON human_profiles USING GIN(full_name gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_categories_slug ON categories(slug);

CREATE INDEX IF NOT EXISTS idx_task_templates_category ON task_templates(category_id);
CREATE INDEX IF NOT EXISTS idx_task_templates_name_trgm ON task_templates USING GIN(name gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_bounties_tenant_id ON bounties(tenant_id);
CREATE INDEX IF NOT EXISTS idx_bounties_status ON bounties(status);
CREATE INDEX IF NOT EXISTS idx_bounties_category ON bounties(category_id);
CREATE INDEX IF NOT EXISTS idx_bounties_assigned ON bounties(assigned_human_id);
CREATE INDEX IF NOT EXISTS idx_bounties_template ON bounties(template_id);
CREATE INDEX IF NOT EXISTS idx_bounties_created ON bounties(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_bounties_deadline ON bounties(deadline) WHERE deadline IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_bounties_title_trgm ON bounties USING GIN(title gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_task_submissions_bounty ON task_submissions(bounty_id);
CREATE INDEX IF NOT EXISTS idx_task_submissions_human ON task_submissions(human_id);
CREATE INDEX IF NOT EXISTS idx_task_submissions_status ON task_submissions(status);

CREATE INDEX IF NOT EXISTS idx_messages_bounty ON messages(bounty_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_created ON messages(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_disputes_bounty ON disputes(bounty_id);
CREATE INDEX IF NOT EXISTS idx_disputes_status ON disputes(status);
CREATE INDEX IF NOT EXISTS idx_disputes_raised_by ON disputes(raised_by);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON notifications(user_id, is_read) WHERE is_read = FALSE;
CREATE INDEX IF NOT EXISTS idx_notifications_created ON notifications(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_payment_transactions_tenant ON payment_transactions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_bounty ON payment_transactions(bounty_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_human ON payment_transactions(human_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_status ON payment_transactions(status);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_created ON payment_transactions(created_at DESC);

-- ============================================================
-- Triggers
-- ============================================================

CREATE TRIGGER update_tenants_updated_at
  BEFORE UPDATE ON tenants
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_human_profiles_updated_at
  BEFORE UPDATE ON human_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_task_templates_updated_at
  BEFORE UPDATE ON task_templates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_bounties_updated_at
  BEFORE UPDATE ON bounties
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_task_submissions_updated_at
  BEFORE UPDATE ON task_submissions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_disputes_updated_at
  BEFORE UPDATE ON disputes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_payment_transactions_updated_at
  BEFORE UPDATE ON payment_transactions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER increment_completed_tasks_on_bounty_complete
  AFTER UPDATE ON bounties
  FOR EACH ROW EXECUTE FUNCTION increment_tasks_completed();

CREATE TRIGGER create_human_profile_on_user_insert
  AFTER INSERT ON users
  FOR EACH ROW EXECUTE FUNCTION create_human_profile_trigger();

-- ============================================================
-- Row Level Security
-- ============================================================

ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE human_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE bounties ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE disputes ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_transactions ENABLE ROW LEVEL SECURITY;

-- Tenants: service role / authenticated with matching api_key
CREATE POLICY "tenants_service_role" ON tenants USING (true);

-- Users: tenant-scoped access
CREATE POLICY "users_tenant_isolation" ON users
  USING (tenant_id = current_setting('app.current_tenant_id', true)::UUID);

-- Human profiles: readable by all, writable by owner or admin
CREATE POLICY "human_profiles_read" ON human_profiles FOR SELECT USING (true);
CREATE POLICY "human_profiles_owner_write" ON human_profiles
  FOR ALL USING (id = auth.uid() OR current_setting('app.current_user_id', true)::UUID = id);

-- Categories: public read
CREATE POLICY "categories_read" ON categories FOR SELECT USING (true);

-- Task templates: public read
CREATE POLICY "task_templates_read" ON task_templates FOR SELECT USING (true);

-- Bounties: tenant-scoped
CREATE POLICY "bounties_tenant_isolation" ON bounties
  USING (tenant_id = current_setting('app.current_tenant_id', true)::UUID);
CREATE POLICY "bounties_human_view_assigned" ON bounties FOR SELECT
  USING (assigned_human_id = auth.uid());
-- Bounties: public read for open bounties (worker app browsing)
CREATE POLICY "bounties_public_read_open" ON bounties FOR SELECT
  USING (status = 'open');

-- Task submissions: bounty participants
CREATE POLICY "submissions_bounty_access" ON task_submissions
  USING (bounty_id IN (
    SELECT id FROM bounties WHERE tenant_id = current_setting('app.current_tenant_id', true)::UUID
  ));
CREATE POLICY "submissions_human_own" ON task_submissions FOR SELECT
  USING (human_id = auth.uid());

-- Messages: bounty participants
CREATE POLICY "messages_bounty_access" ON messages
  USING (bounty_id IN (
    SELECT id FROM bounties WHERE tenant_id = current_setting('app.current_tenant_id', true)::UUID
  ));
CREATE POLICY "messages_human_own_bounty" ON messages FOR SELECT
  USING (bounty_id IN (
    SELECT id FROM bounties WHERE assigned_human_id = auth.uid()
  ));

-- Disputes: tenant-scoped
CREATE POLICY "disputes_tenant_isolation" ON disputes
  USING (bounty_id IN (
    SELECT id FROM bounties WHERE tenant_id = current_setting('app.current_tenant_id', true)::UUID
  ));
CREATE POLICY "disputes_human_own" ON disputes FOR SELECT
  USING (raised_by = auth.uid());

-- Notifications: user owns their notifications
CREATE POLICY "notifications_user_own" ON notifications
  FOR ALL USING (user_id = auth.uid());

-- Payment transactions: tenant-scoped
CREATE POLICY "payments_tenant_isolation" ON payment_transactions
  USING (tenant_id = current_setting('app.current_tenant_id', true)::UUID);
CREATE POLICY "payments_human_own" ON payment_transactions FOR SELECT
  USING (human_id = auth.uid());

-- ============================================================
-- Seed: Categories (8)
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

-- ============================================================
-- Seed: Task Templates (3)
-- ============================================================

INSERT INTO task_templates (name, category_id, description, steps, estimated_duration_minutes) VALUES
  (
    'Storefront Photography Survey',
    (SELECT id FROM categories WHERE slug = 'photography'),
    'Capture a series of photos documenting storefront conditions along a specified street segment.',
    '[
      {"step_number": 1, "title": "Arrive at start point", "description": "Navigate to the starting address provided in the bounty details."},
      {"step_number": 2, "title": "Capture wide-angle photo", "description": "Take a wide-angle photo showing the full storefront including signage and surrounding context."},
      {"step_number": 3, "title": "Capture close-up details", "description": "Take close-up photos of any notable features: damage, for-lease signs, construction, or changes."},
      {"step_number": 4, "title": "Record GPS and timestamp", "description": "Ensure each photo has GPS metadata and timestamp enabled."},
      {"step_number": 5, "title": "Move to next storefront", "description": "Proceed to the next storefront and repeat steps 2-4 until the end of the segment."},
      {"step_number": 6, "title": "Submit all photos", "description": "Upload all photos with brief notes on each storefront condition."}
    ]',
    45
  ),
  (
    'Property Inspection Checklist',
    (SELECT id FROM categories WHERE slug = 'inspection'),
    'Conduct a thorough inspection of a residential or commercial property unit.',
    '[
      {"step_number": 1, "title": "Exterior assessment", "description": "Photograph the building exterior, entryway, and any visible damage or maintenance issues."},
      {"step_number": 2, "title": "Living areas inspection", "description": "Check walls, floors, ceilings, windows, and doors in all living spaces. Note any damage, stains, or wear."},
      {"step_number": 3, "title": "Kitchen inspection", "description": "Test all appliances (stove, oven, refrigerator, dishwasher, microwave). Check countertops, cabinets, sink, and plumbing."},
      {"step_number": 4, "title": "Bathroom inspection", "description": "Test toilet, shower/tub, sink, and faucet. Check for leaks, water pressure, drainage, and ventilation."},
      {"step_number": 5, "title": "Electrical and HVAC", "description": "Test light switches, outlets, thermostat, and HVAC system. Note any non-functional items."},
      {"step_number": 6, "title": "Compile report", "description": "Write a summary of findings with timestamped photos organized by room/area."}
    ]',
    60
  ),
  (
    'Mystery Shopping Evaluation',
    (SELECT id FROM categories WHERE slug = 'mystery-shopping'),
    'Visit a retail location as a regular customer and evaluate the experience.',
    '[
      {"step_number": 1, "title": "Pre-visit preparation", "description": "Review the evaluation criteria. Do not reveal your identity as a mystery shopper."},
      {"step_number": 2, "title": "Entry and greeting", "description": "Note the time of entry. Record whether you were greeted, how quickly, and by whom."},
      {"step_number": 3, "title": "Browse and engage", "description": "Browse the store for at least 10 minutes. Ask a staff member a product question and evaluate their knowledge and helpfulness."},
      {"step_number": 4, "title": "Checkout experience", "description": "Make a small purchase. Note the checkout process, wait time, and staff courtesy."},
      {"step_number": 5, "title": "Store condition", "description": "Assess cleanliness, organization, product displays, and overall ambiance."},
      {"step_number": 6, "title": "Submit evaluation", "description": "Complete the evaluation form within 2 hours of leaving the store. Include all ratings and narrative feedback."}
    ]',
    40
  )
ON CONFLICT DO NOTHING;

-- ============================================================
-- Seed: Tenant, Users, Profiles, Bounties
-- ============================================================

-- Tenant
INSERT INTO tenants (id, name, slug, api_key, contact_email) VALUES
  ('a1111111-1111-1111-1111-111111111111', 'Hermes Agent', 'hermes-agent', 'hak_live_hermes0000000000000000000001', 'hermes@agent.ai')
ON CONFLICT (slug) DO NOTHING;

-- Agent User
INSERT INTO users (id, tenant_id, email, password_hash, role) VALUES
  ('b1111111-1111-1111-1111-111111111111', 'a1111111-1111-1111-1111-111111111111', 'hermes@agent.ai', '$2b$10$placeholderhash', 'agent')
ON CONFLICT (email) DO NOTHING;

-- Human Users (profiles auto-created by trigger)
INSERT INTO users (id, tenant_id, email, password_hash, role) VALUES
  ('c1111111-1111-1111-1111-111111111111', 'a1111111-1111-1111-1111-111111111111', 'marcus@team.ai', '$2b$10$placeholderhash', 'human'),
  ('c2222222-2222-2222-2222-222222222222', 'a1111111-1111-1111-1111-111111111111', 'priya@team.ai', '$2b$10$placeholderhash', 'human')
ON CONFLICT (email) DO NOTHING;

-- Human Profiles (update auto-created profiles with full details)
INSERT INTO human_profiles (id, full_name, avatar_url, location_city, location_country, bio, skills, languages, verification_status, rating, completed_tasks, hourly_rate) VALUES
  ('c1111111-1111-1111-1111-111111111111', 'Marcus Chen', 'https://api.dicebear.com/9.x/avataaars/svg?seed=Marcus', 'San Francisco', 'US', 'Professional photographer and visual storyteller with 5+ years of field experience.', ARRAY['photography', 'inspection', 'research'], ARRAY['en', 'zh'], 'verified', 4.85, 47, 35.00),
  ('c2222222-2222-2222-2222-222222222222', 'Priya Sharma', 'https://api.dicebear.com/9.x/avataaars/svg?seed=Priya', 'New York', 'US', 'Legal researcher and compliance specialist. Detail-oriented with strong analytical skills.', ARRAY['research', 'mystery-shopping', 'representation'], ARRAY['en', 'hi'], 'verified', 4.92, 63, 40.00)
ON CONFLICT (id) DO UPDATE SET
  full_name = EXCLUDED.full_name,
  avatar_url = EXCLUDED.avatar_url,
  location_city = EXCLUDED.location_city,
  location_country = EXCLUDED.location_country,
  bio = EXCLUDED.bio,
  skills = EXCLUDED.skills,
  languages = EXCLUDED.languages,
  verification_status = EXCLUDED.verification_status,
  rating = EXCLUDED.rating,
  completed_tasks = EXCLUDED.completed_tasks,
  hourly_rate = EXCLUDED.hourly_rate;

-- Sample Bounties (3 core + 3 extras)
INSERT INTO bounties (id, tenant_id, category_id, assigned_human_id, title, description, instructions, location_address, reward_amount, status, deadline) VALUES
  -- Open bounty (unassigned)
  ('d1111111-1111-1111-1111-111111111111', 'a1111111-1111-1111-1111-111111111111',
   (SELECT id FROM categories WHERE slug = 'delivery'), NULL,
   'Deliver package to Mission District', 'Pick up a sealed envelope from 123 Market St and deliver to 456 Valencia St.', 'Confirm recipient identity, collect signature.', '456 Valencia St, San Francisco, CA 94110', 25.00, 'open', NOW() + INTERVAL '2 days'),

  -- Accepted bounty (assigned to Marcus)
  ('d2222222-2222-2222-2222-222222222222', 'a1111111-1111-1111-1111-111111111111',
   (SELECT id FROM categories WHERE slug = 'photography'), 'c1111111-1111-1111-1111-111111111111',
   'Photograph storefront conditions on Market St', 'Take 5 photos of each storefront between 5th St and 10th St on Market St.', 'Ensure photos are clear, well-lit, and show full storefront including signage.', 'Market St between 5th and 10th, San Francisco, CA', 75.00, 'accepted', NOW() + INTERVAL '1 day'),

  -- In progress (assigned to Priya)
  ('d3333333-3333-3333-3333-333333333333', 'a1111111-1111-1111-1111-111111111111',
   (SELECT id FROM categories WHERE slug = 'research'), 'c2222222-2222-2222-2222-222222222222',
   'Survey parking availability in SOMA', 'Count available parking spots on 3rd St, 4th St, and 5th St between 12pm-2pm.', 'Record count per block with timestamp and GPS coordinates.', 'SOMA District, San Francisco, CA', 50.00, 'in_progress', NOW() + INTERVAL '3 days'),

  -- Submitted (awaiting review)
  ('d4444444-4444-4444-4444-444444444444', 'a1111111-1111-1111-1111-111111111111',
   (SELECT id FROM categories WHERE slug = 'inspection'), 'c1111111-1111-1111-1111-111111111111',
   'Inspect apartment unit at 789 Howard St', 'Document condition of unit 4B: walls, floors, appliances, plumbing, electrical.', 'Take timestamped photos of each room. Note any damage or maintenance issues.', '789 Howard St Unit 4B, San Francisco, CA 94103', 60.00, 'submitted', NOW() + INTERVAL '5 days'),

  -- Completed
  ('d5555555-5555-5555-5555-555555555555', 'a1111111-1111-1111-1111-111111111111',
   (SELECT id FROM categories WHERE slug = 'mystery-shopping'), 'c2222222-2222-2222-2222-222222222222',
   'Mystery shop at Union Square retail store', 'Visit the Apple store at Union Square. Evaluate staff friendliness, wait time, and product knowledge.', 'Do not reveal you are conducting an evaluation. Submit report within 2 hours.', '340 Stockton St, San Francisco, CA 94108', 45.00, 'completed', NOW() - INTERVAL '1 day'),

  -- Disputed
  ('d6666666-6666-6666-6666-666666666666', 'a1111111-1111-1111-1111-111111111111',
   (SELECT id FROM categories WHERE slug = 'errands'), 'c1111111-1111-1111-1111-111111111111',
   'Purchase and deliver office supplies', 'Buy 2 reams of paper, 10 pens, and 5 notebooks from Staples. Deliver to office.', 'Keep receipt. Items must be exact specifications.', '1201 16th St, San Francisco, CA 94107', 30.00, 'disputed', NOW() - INTERVAL '2 days')
ON CONFLICT (id) DO NOTHING;

-- Sample Submissions
INSERT INTO task_submissions (id, bounty_id, human_id, content, media_urls, status) VALUES
  ('e1111111-1111-1111-1111-111111111111', 'd4444444-4444-4444-4444-444444444444', 'c1111111-1111-1111-1111-111111111111',
   'Inspection complete. Unit 4B is in good condition overall. Minor scuff marks on living room wall. Kitchen appliances functional. Bathroom faucet has slow drip. All electrical outlets tested and working.',
   ARRAY['https://storage.example.com/submissions/e111/photo1.jpg', 'https://storage.example.com/submissions/e111/photo2.jpg', 'https://storage.example.com/submissions/e111/photo3.jpg'],
   'submitted'),

  ('e2222222-2222-2222-2222-222222222222', 'd5555555-5555-5555-5555-555555555555', 'c2222222-2222-2222-2222-222222222222',
   'Visit completed at 2:15 PM. Staff greeted within 30 seconds. Wait time for assistance: 2 minutes. Associate demonstrated strong knowledge of MacBook lineup. Store was clean and well-organized. NPS score: 9/10.',
   ARRAY['https://storage.example.com/submissions/e222/receipt.jpg'],
   'approved')
ON CONFLICT (id) DO NOTHING;

-- Sample Messages
INSERT INTO messages (id, bounty_id, sender_id, content) VALUES
  ('f1111111-1111-1111-1111-111111111111', 'd2222222-2222-2222-2222-222222222222', 'b1111111-1111-1111-1111-111111111111',
   'Marcus, please focus on storefronts that have "For Lease" signs. Those are priority.'),
  ('f2222222-2222-2222-2222-222222222222', 'd2222222-2222-2222-2222-222222222222', 'c1111111-1111-1111-1111-111111111111',
   'Got it. I''ll prioritize those and flag them in the submission.'),
  ('f3333333-3333-3333-3333-333333333333', 'd3333333-3333-3333-3333-333333333333', 'b1111111-1111-1111-1111-111111111111',
   'Priya, can you also note any no-parking signs that seem outdated?'),
  ('f4444444-4444-4444-4444-444444444444', 'd3333333-3333-3333-3333-333333333333', 'c2222222-2222-2222-2222-222222222222',
   'Will do. I''ll add a column for sign condition in my report.')
ON CONFLICT (id) DO NOTHING;

-- Sample Dispute
INSERT INTO disputes (id, bounty_id, raised_by, reason, description, status) VALUES
  ('d7777777-7777-7777-7777-777777777777', 'd6666666-6666-6666-6666-666666666666', 'b1111111-1111-1111-1111-111111111111',
   'Wrong items purchased', 'Agent requested 10 ballpoint pens but received gel pens. Receipt shows different SKU than specified.', 'open')
ON CONFLICT (id) DO NOTHING;

-- Sample Notifications
INSERT INTO notifications (id, user_id, type, title, content, metadata) VALUES
  ('i1111111-1111-1111-1111-111111111111', 'c1111111-1111-1111-1111-111111111111', 'task_assigned', 'New bounty assigned', 'You have been assigned to "Photograph storefront conditions on Market St"', '{"bounty_id": "d2222222-2222-2222-2222-222222222222"}'),
  ('i2222222-2222-2222-2222-222222222222', 'c2222222-2222-2222-2222-222222222222', 'task_assigned', 'New bounty assigned', 'You have been assigned to "Survey parking availability in SOMA"', '{"bounty_id": "d3333333-3333-3333-3333-333333333333"}'),
  ('i3333333-3333-3333-3333-333333333333', 'c1111111-1111-1111-1111-111111111111', 'message_received', 'New message on bounty', 'Marcus, please focus on storefronts that have "For Lease" signs.', '{"bounty_id": "d2222222-2222-2222-2222-222222222222"}'),
  ('i4444444-4444-4444-4444-444444444444', 'c2222222-2222-2222-2222-222222222222', 'payment_received', 'Payment received', 'You received $45.00 for completed bounty "Mystery shop at Union Square retail store"', '{"bounty_id": "d5555555-5555-5555-5555-555555555555", "amount": 45.00}')
ON CONFLICT (id) DO NOTHING;

-- Sample Payment Transactions
INSERT INTO payment_transactions (id, tenant_id, bounty_id, human_id, amount, currency, type, status, metadata) VALUES
  ('j1111111-1111-1111-1111-111111111111', 'a1111111-1111-1111-1111-111111111111', 'd5555555-5555-5555-5555-555555555555', 'c2222222-2222-2222-2222-222222222222', 45.00, 'USD', 'bounty_payment', 'completed', '{"payout_method": "stripe"}'),
  ('j2222222-2222-2222-2222-222222222222', 'a1111111-1111-1111-1111-111111111111', 'd2222222-2222-2222-2222-222222222222', 'c1111111-1111-1111-1111-111111111111', 75.00, 'USD', 'hold', 'pending', '{"hold_reason": "awaiting_submission"}'),
  ('j3333333-3333-3333-3333-333333333333', 'a1111111-1111-1111-1111-111111111111', 'd6666666-6666-6666-6666-666666666666', 'c1111111-1111-1111-1111-111111111111', 30.00, 'USD', 'hold', 'pending', '{"hold_reason": "dispute_open"}')
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- Supabase Storage: Evidence Bucket
-- ============================================================

-- Create the evidence bucket (idempotent)
INSERT INTO storage.buckets (id, name, public)
VALUES ('evidence', 'evidence', true)
ON CONFLICT (id) DO NOTHING;

-- Public read access for evidence bucket
CREATE POLICY "evidence_public_read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'evidence');

-- Authenticated write access for evidence bucket
CREATE POLICY "evidence_authenticated_write"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'evidence' AND auth.role() = 'authenticated');

-- Authenticated update access for evidence bucket
CREATE POLICY "evidence_authenticated_update"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'evidence' AND auth.role() = 'authenticated');

-- Authenticated delete access for evidence bucket
CREATE POLICY "evidence_authenticated_delete"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'evidence' AND auth.role() = 'authenticated');

-- End of HireAHuman Schema
