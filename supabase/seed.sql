-- ============================================================
-- Seed Data: Hermes Agent Team
-- ============================================================

-- Tenant
INSERT INTO tenants (id, name, slug, api_key) VALUES
  ('a1111111-1111-1111-1111-111111111111', 'Hermes Agent', 'hermes-agent', 'hermes-test-api-key-0000000000000000000000000001')
ON CONFLICT (slug) DO NOTHING;

-- Agent User
INSERT INTO users (id, tenant_id, email, password_hash, role) VALUES
  ('b1111111-1111-1111-1111-111111111111', 'a1111111-1111-1111-1111-111111111111', 'hermes@agent.ai', '$2b$10$placeholderhash', 'agent')
ON CONFLICT (email) DO NOTHING;

-- Human Users
INSERT INTO users (id, tenant_id, email, password_hash, role) VALUES
  ('c1111111-1111-1111-1111-111111111111', 'a1111111-1111-1111-1111-111111111111', 'marcus@team.ai', '$2b$10$placeholderhash', 'human'),
  ('c2222222-2222-2222-2222-222222222222', 'a1111111-1111-1111-1111-111111111111', 'priya@team.ai', '$2b$10$placeholderhash', 'human')
ON CONFLICT (email) DO NOTHING;

-- Human Profiles
INSERT INTO human_profiles (id, full_name, avatar_url, location_city, location_country, bio, skills, languages, verification_status, rating, completed_tasks, hourly_rate) VALUES
  ('c1111111-1111-1111-1111-111111111111', 'Marcus Chen', 'https://api.dicebear.com/9.x/avataaars/svg?seed=Marcus', 'San Francisco', 'US', 'Professional photographer and visual storyteller with 5+ years of field experience.', ARRAY['photography', 'inspection', 'research'], ARRAY['en', 'zh'], 'verified', 4.85, 47, 35.00),
  ('c2222222-2222-2222-2222-222222222222', 'Priya Sharma', 'https://api.dicebear.com/9.x/avataaars/svg?seed=Priya', 'New York', 'US', 'Legal researcher and compliance specialist. Detail-oriented with strong analytical skills.', ARRAY['research', 'mystery-shopping', 'representation'], ARRAY['en', 'hi'], 'verified', 4.92, 63, 40.00)
ON CONFLICT (id) DO NOTHING;

-- Categories
INSERT INTO categories (id, name, slug, description, icon) VALUES
  ('cat11111-1111-1111-1111-111111111111', 'Data Entry', 'data-entry', 'Simple data entry and transcription tasks', '📝'),
  ('cat22222-2222-2222-2222-222222222222', 'Verification', 'verification', 'Data or document verification tasks', '✅'),
  ('cat33333-3333-3333-3333-333333333333', 'Annotation', 'annotation', 'Image or text annotation tasks', '🏷️'),
  ('cat44444-4444-4444-4444-444444444444', 'Photography', 'photography', 'Photo capture and documentation tasks', '📷'),
  ('cat55555-5555-5555-5555-555555555555', 'Research', 'research', 'Market research and survey tasks', '🔍'),
  ('cat66666-6666-6666-6666-666666666666', 'Inspection', 'inspection', 'Property and facility inspection tasks', '🏠'),
  ('cat77777-7777-7777-7777-777777777777', 'Mystery Shopping', 'mystery-shopping', 'Customer experience evaluation tasks', '🛒'),
  ('cat88888-8888-8888-8888-888888888888', 'Delivery', 'delivery', 'Courier and delivery tasks', '📦'),
  ('cat99999-9999-9999-9999-999999999999', 'Errands', 'errands', 'Personal errands and task running', '🏃'),
  ('cataaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'General', 'general', 'General tasks and odd jobs', '⚡')
ON CONFLICT (slug) DO NOTHING;

-- Sample Bounties
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
  ('g1111111-1111-1111-1111-111111111111', 'd6666666-6666-6666-6666-666666666666', 'b1111111-1111-1111-1111-111111111111',
   'Wrong items purchased', 'Agent requested 10 ballpoint pens but received gel pens. Receipt shows different SKU than specified.', 'open')
ON CONFLICT (id) DO NOTHING;
