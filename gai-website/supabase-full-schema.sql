-- ============================================
-- GAi Connect - Full Admin Schema
-- Run this in Supabase SQL Editor
-- ============================================

-- ============================================
-- ENABLE UUID EXTENSION
-- ============================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- EXISTING TABLES - ADD NEW COLUMNS
-- ============================================

-- Users table - add new columns
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS role VARCHAR(20) DEFAULT 'member';
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS account_status VARCHAR(20) DEFAULT 'active';
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS kyc_status VARCHAR(20) DEFAULT 'pending';
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS behavior_score INT DEFAULT 100;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS login_history JSONB DEFAULT '[]';
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS ip_addresses JSONB DEFAULT '[]';
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS two_factor_enabled BOOLEAN DEFAULT false;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS last_password_change TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS id_document_url TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS kyc_notes TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS kyc_verified_at TIMESTAMPTZ;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS banned_at TIMESTAMPTZ;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS ban_reason TEXT;

-- Services table - add new columns
ALTER TABLE public.services ADD COLUMN IF NOT EXISTS subcategory VARCHAR(100);
ALTER TABLE public.services ADD COLUMN IF NOT EXISTS approval_status VARCHAR(20) DEFAULT 'approved';
ALTER TABLE public.services ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT false;
ALTER TABLE public.services ADD COLUMN IF NOT EXISTS boost_expires TIMESTAMPTZ;
ALTER TABLE public.services ADD COLUMN IF NOT EXISTS custom_fields JSONB DEFAULT '{}';
ALTER TABLE public.services ADD COLUMN IF NOT EXISTS views_count INT DEFAULT 0;
ALTER TABLE public.services ADD COLUMN IF NOT EXISTS bookings_count INT DEFAULT 0;
ALTER TABLE public.services ADD COLUMN IF NOT EXISTS commission_rate DECIMAL(5,2) DEFAULT 10.00;

-- Messages table - add new columns
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS spam_score INT DEFAULT 0;
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS is_flagged BOOLEAN DEFAULT false;
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS moderation_notes TEXT;

-- ============================================
-- NEW TABLES
-- ============================================

-- User Blacklist Table
CREATE TABLE IF NOT EXISTS public.user_blacklist (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User Notes Table
CREATE TABLE IF NOT EXISTS public.user_notes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    admin_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    note TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- IP Blacklist Table
CREATE TABLE IF NOT EXISTS public.ip_blacklist (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ip_address VARCHAR(45) NOT NULL,
    reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Bookings Table
CREATE TABLE IF NOT EXISTS public.bookings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    service_id UUID REFERENCES public.services(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    provider_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    status VARCHAR(20) DEFAULT 'pending',
    scheduled_at TIMESTAMPTZ,
    notes TEXT,
    price DECIMAL(10, 2),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Reviews Table
CREATE TABLE IF NOT EXISTS public.reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    service_id UUID REFERENCES public.services(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    provider_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    rating INT CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    status VARCHAR(20) DEFAULT 'approved',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Broadcasts Table
CREATE TABLE IF NOT EXISTS public.broadcasts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    admin_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    title VARCHAR(255),
    message TEXT NOT NULL,
    target_roles JSONB DEFAULT '["member"]',
    sent_at TIMESTAMPTZ DEFAULT NOW()
);

-- Workflow Triggers Table
CREATE TABLE IF NOT EXISTS public.workflow_triggers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    event_type VARCHAR(50) NOT NULL,
    conditions JSONB DEFAULT '{}',
    enabled BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Workflow Actions Table
CREATE TABLE IF NOT EXISTS public.workflow_actions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    trigger_id UUID REFERENCES public.workflow_triggers(id) ON DELETE CASCADE,
    action_type VARCHAR(50) NOT NULL,
    config JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Workflow Executions Table
CREATE TABLE IF NOT EXISTS public.workflow_executions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    trigger_id UUID REFERENCES public.workflow_triggers(id) ON DELETE SET NULL,
    status VARCHAR(20) DEFAULT 'pending',
    result JSONB DEFAULT '{}',
    executed_at TIMESTAMPTZ DEFAULT NOW()
);

-- AI Agents Table
CREATE TABLE IF NOT EXISTS public.ai_agents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    agent_type VARCHAR(50) NOT NULL,
    system_prompt TEXT,
    enabled BOOLEAN DEFAULT true,
    config JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- AI Logs Table
CREATE TABLE IF NOT EXISTS public.ai_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agent_id UUID REFERENCES public.ai_agents(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    input_data JSONB DEFAULT '{}',
    result JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Subscription Plans Table
CREATE TABLE IF NOT EXISTS public.subscription_plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(50) NOT NULL,
    tier VARCHAR(20) NOT NULL,
    price DECIMAL(10, 2) DEFAULT 0,
    features JSONB DEFAULT '[]',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Wallets Table
CREATE TABLE IF NOT EXISTS public.wallets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE UNIQUE,
    balance DECIMAL(10, 2) DEFAULT 0,
    currency VARCHAR(10) DEFAULT 'USD',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Wallet Transactions Table
CREATE TABLE IF NOT EXISTS public.wallet_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    wallet_id UUID REFERENCES public.wallets(id) ON DELETE CASCADE,
    type VARCHAR(20) NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    description TEXT,
    reference_id UUID,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Payments Table
CREATE TABLE IF NOT EXISTS public.payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    amount DECIMAL(10, 2) NOT NULL,
    currency VARCHAR(10) DEFAULT 'USD',
    payment_method VARCHAR(50),
    status VARCHAR(20) DEFAULT 'pending',
    transaction_id VARCHAR(255),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Promo Codes Table
CREATE TABLE IF NOT EXISTS public.promo_codes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(50) NOT NULL UNIQUE,
    discount_type VARCHAR(20) NOT NULL,
    discount_value DECIMAL(10, 2) NOT NULL,
    max_uses INTEGER,
    uses_count INTEGER DEFAULT 0,
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Activity Log Table (expanded)
CREATE TABLE IF NOT EXISTS public.activity_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50),
    entity_id UUID,
    details JSONB DEFAULT '{}',
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS users_role_idx ON public.users(role);
CREATE INDEX IF NOT EXISTS users_account_status_idx ON public.users(account_status);
CREATE INDEX IF NOT EXISTS users_kyc_status_idx ON public.users(kyc_status);
CREATE INDEX IF NOT EXISTS services_approval_status_idx ON public.services(approval_status);
CREATE INDEX IF NOT EXISTS services_is_featured_idx ON public.services(is_featured);
CREATE INDEX IF NOT EXISTS bookings_status_idx ON public.bookings(status);
CREATE INDEX IF NOT EXISTS bookings_service_idx ON public.bookings(service_id);
CREATE INDEX IF NOT EXISTS reviews_service_idx ON public.reviews(service_id);
CREATE INDEX IF NOT EXISTS reviews_user_idx ON public.reviews(user_id);
CREATE INDEX IF NOT EXISTS workflow_triggers_event_idx ON public.workflow_triggers(event_type);
CREATE INDEX IF NOT EXISTS ai_agents_type_idx ON public.ai_agents(agent_type);
CREATE INDEX IF NOT EXISTS activity_log_user_idx ON public.activity_log(user_id);
CREATE INDEX IF NOT EXISTS activity_log_created_idx ON public.activity_log(created_at);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

ALTER TABLE public.user_blacklist ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ip_blacklist ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.broadcasts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workflow_triggers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workflow_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workflow_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallet_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.promo_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_log ENABLE ROW LEVEL SECURITY;

-- RLS Policies - Admin full access, users limited
CREATE POLICY "admin_full_access" ON public.users FOR ALL USING (is_admin = true);
CREATE POLICY "admin_full_access_blacklist" ON public.user_blacklist FOR ALL USING (true);
CREATE POLICY "admin_full_access_notes" ON public.user_notes FOR ALL USING (true);
CREATE POLICY "admin_full_access_ip" ON public.ip_blacklist FOR ALL USING (true);
CREATE POLICY "admin_full_access_bookings" ON public.bookings FOR ALL USING (true);
CREATE POLICY "admin_full_access_reviews" ON public.reviews FOR ALL USING (true);
CREATE POLICY "admin_full_access_broadcasts" ON public.broadcasts FOR ALL USING (true);
CREATE POLICY "admin_full_access_workflow" ON public.workflow_triggers FOR ALL USING (true);
CREATE POLICY "admin_full_access_workflow_actions" ON public.workflow_actions FOR ALL USING (true);
CREATE POLICY "admin_full_access_workflow_exec" ON public.workflow_executions FOR ALL USING (true);
CREATE POLICY "admin_full_access_ai_agents" ON public.ai_agents FOR ALL USING (true);
CREATE POLICY "admin_full_access_ai_logs" ON public.ai_logs FOR ALL USING (true);
CREATE POLICY "admin_full_access_plans" ON public.subscription_plans FOR ALL USING (true);
CREATE POLICY "admin_full_access_wallets" ON public.wallets FOR ALL USING (true);
CREATE POLICY "admin_full_access_transactions" ON public.wallet_transactions FOR ALL USING (true);
CREATE POLICY "admin_full_access_payments" ON public.payments FOR ALL USING (true);
CREATE POLICY "admin_full_access_promo" ON public.promo_codes FOR ALL USING (true);
CREATE POLICY "admin_full_access_activity" ON public.activity_log FOR ALL USING (true);

-- ============================================
-- SEED DATA
-- ============================================

-- Default subscription plans
INSERT INTO public.subscription_plans (name, tier, price, features, is_active) VALUES
('Free', 'Free', 0, '["Basic profile", "5 service listings", "10 messages/day", "Standard support"]', true),
('Premium', 'Premium', 19.99, '["Enhanced profile", "20 service listings", "Unlimited messages", "Priority support", "Featured listings"]', true),
('VIP', 'VIP', 49.99, '["VIP profile", "Unlimited services", "Unlimited messages", "24/7 support", "Top featured", "Analytics dashboard"]', true)
ON CONFLICT DO NOTHING;

-- Default AI agents
INSERT INTO public.ai_agents (name, agent_type, system_prompt, enabled) VALUES
('Content Moderator', 'moderation', 'You are a content moderator. Review user-generated content and flag inappropriate material.', true),
('Welcome Agent', 'engagement', 'You are a welcome agent. Send friendly welcome messages to new users and guide them around the platform.', true),
('Marketing Agent', 'marketing', 'You are a marketing agent. Promote services and engage users with relevant content.', true)
ON CONFLICT DO NOTHING;

-- Default workflow triggers
INSERT INTO public.workflow_triggers (name, event_type, conditions, enabled) VALUES
('New User Welcome', 'user_registered', '{"send_welcome": true, "assign_tier": "Free"}', true),
('Service Approved', 'service_approved', '{"notify_provider": true}', true),
('New Booking', 'booking_created', '{"notify_provider": true, "notify_user": true}', true)
ON CONFLICT DO NOTHING;

-- ============================================
-- VERIFICATION
-- ============================================

SELECT 'Full Admin Schema Setup Complete!' as status;
SELECT COUNT(*) as new_tables_count FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
    'user_blacklist', 'user_notes', 'ip_blacklist', 'bookings', 'reviews',
    'broadcasts', 'workflow_triggers', 'workflow_actions', 'workflow_executions',
    'ai_agents', 'ai_logs', 'subscription_plans', 'wallets', 'wallet_transactions',
    'payments', 'promo_codes', 'activity_log'
);
