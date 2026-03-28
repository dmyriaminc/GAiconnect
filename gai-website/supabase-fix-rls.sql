-- ============================================
-- FIX SUPABASE RLS POLICIES
-- This fixes the issue where users can't be created without authentication
-- Run this in Supabase SQL Editor
-- ============================================

-- ============================================
-- CREATE MISSING TABLES (if not exist)
-- ============================================

-- Audit Log Table
CREATE TABLE IF NOT EXISTS public.audit_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    details JSONB DEFAULT '{}',
    ip_address VARCHAR(45),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User Blacklist
CREATE TABLE IF NOT EXISTS public.user_blacklist (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User Notes
CREATE TABLE IF NOT EXISTS public.user_notes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    admin_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    note TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- IP Blacklist
CREATE TABLE IF NOT EXISTS public.ip_blacklist (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ip_address VARCHAR(45) NOT NULL,
    reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Bookings
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

-- Reviews
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

-- Broadcasts
CREATE TABLE IF NOT EXISTS public.broadcasts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    admin_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    title VARCHAR(255),
    message TEXT NOT NULL,
    target_roles JSONB DEFAULT '["member"]',
    sent_at TIMESTAMPTZ DEFAULT NOW()
);

-- Workflow Triggers
CREATE TABLE IF NOT EXISTS public.workflow_triggers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    event_type VARCHAR(50) NOT NULL,
    conditions JSONB DEFAULT '{}',
    enabled BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Workflow Actions
CREATE TABLE IF NOT EXISTS public.workflow_actions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    trigger_id UUID REFERENCES public.workflow_triggers(id) ON DELETE CASCADE,
    action_type VARCHAR(50) NOT NULL,
    config JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Workflow Executions
CREATE TABLE IF NOT EXISTS public.workflow_executions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    trigger_id UUID REFERENCES public.workflow_triggers(id) ON DELETE SET NULL,
    status VARCHAR(20) DEFAULT 'pending',
    result JSONB DEFAULT '{}',
    executed_at TIMESTAMPTZ DEFAULT NOW()
);

-- AI Agents
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

-- AI Logs
CREATE TABLE IF NOT EXISTS public.ai_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agent_id UUID REFERENCES public.ai_agents(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    input_data JSONB DEFAULT '{}',
    result JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Subscription Plans
CREATE TABLE IF NOT EXISTS public.subscription_plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(50) NOT NULL,
    tier VARCHAR(20) NOT NULL,
    price DECIMAL(10, 2) DEFAULT 0,
    features JSONB DEFAULT '[]',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Wallets
CREATE TABLE IF NOT EXISTS public.wallets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE UNIQUE,
    balance DECIMAL(10, 2) DEFAULT 0,
    currency VARCHAR(10) DEFAULT 'USD',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Wallet Transactions
CREATE TABLE IF NOT EXISTS public.wallet_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    wallet_id UUID REFERENCES public.wallets(id) ON DELETE CASCADE,
    type VARCHAR(20) NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    description TEXT,
    reference_id UUID,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Payments
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

-- Promo Codes
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

-- Activity Log
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
-- DROP OLD RESTRICTIVE POLICIES
-- ============================================

-- Users table - drop old policies
DROP POLICY IF EXISTS "users_select_own" ON public.users;
DROP POLICY IF EXISTS "users_update_own" ON public.users;
DROP POLICY IF EXISTS "users_insert_anyone" ON public.users;
DROP POLICY IF EXISTS "users_select_all_admin" ON public.users;
DROP POLICY IF EXISTS "users_update_all_admin" ON public.users;

-- Services table - drop old policies
DROP POLICY IF EXISTS "services_select_active" ON public.services;
DROP POLICY IF EXISTS "services_insert_owner" ON public.services;
DROP POLICY IF EXISTS "services_update_owner" ON public.services;
DROP POLICY IF EXISTS "services_delete_owner" ON public.services;

-- Messages table - drop old policies
DROP POLICY IF EXISTS "messages_select_participant" ON public.messages;
DROP POLICY IF EXISTS "messages_insert_sender" ON public.messages;
DROP POLICY IF EXISTS "messages_update_receiver" ON public.messages;

-- Memberships table - drop old policies
DROP POLICY IF EXISTS "memberships_select_own" ON public.memberships;
DROP POLICY IF EXISTS "memberships_insert_anyone" ON public.memberships;

-- Connections table - drop old policies
DROP POLICY IF EXISTS "connections_select_own" ON public.connections;
DROP POLICY IF EXISTS "connections_insert_own" ON public.connections;

-- ============================================
-- CREATE NEW PERMISSIVE POLICIES
-- Allow public read/write without authentication
-- ============================================

-- USERS - Allow public insert, select, update
CREATE POLICY "public_users_select" ON public.users FOR SELECT USING (true);
CREATE POLICY "public_users_insert" ON public.users FOR INSERT WITH CHECK (true);
CREATE POLICY "public_users_update" ON public.users FOR UPDATE USING (true);
CREATE POLICY "public_users_delete" ON public.users FOR DELETE USING (true);

-- SERVICES - Allow public access
CREATE POLICY "public_services_select" ON public.services FOR SELECT USING (true);
CREATE POLICY "public_services_insert" ON public.services FOR INSERT WITH CHECK (true);
CREATE POLICY "public_services_update" ON public.services FOR UPDATE USING (true);
CREATE POLICY "public_services_delete" ON public.services FOR DELETE USING (true);

-- MESSAGES - Allow public access
CREATE POLICY "public_messages_select" ON public.messages FOR SELECT USING (true);
CREATE POLICY "public_messages_insert" ON public.messages FOR INSERT WITH CHECK (true);
CREATE POLICY "public_messages_update" ON public.messages FOR UPDATE USING (true);
CREATE POLICY "public_messages_delete" ON public.messages FOR DELETE USING (true);

-- MEMBERSHIPS - Allow public access
CREATE POLICY "public_memberships_select" ON public.memberships FOR SELECT USING (true);
CREATE POLICY "public_memberships_insert" ON public.memberships FOR INSERT WITH CHECK (true);
CREATE POLICY "public_memberships_update" ON public.memberships FOR UPDATE USING (true);
CREATE POLICY "public_memberships_delete" ON public.memberships FOR DELETE USING (true);

-- CONNECTIONS - Allow public access
CREATE POLICY "public_connections_select" ON public.connections FOR SELECT USING (true);
CREATE POLICY "public_connections_insert" ON public.connections FOR INSERT WITH CHECK (true);
CREATE POLICY "public_connections_update" ON public.connections FOR UPDATE USING (true);
CREATE POLICY "public_connections_delete" ON public.connections FOR DELETE USING (true);

-- AUDIT LOG - Allow public access
CREATE POLICY "public_audit_log_select" ON public.audit_log FOR SELECT USING (true);
CREATE POLICY "public_audit_log_insert" ON public.audit_log FOR INSERT WITH CHECK (true);

-- NEW TABLES - Allow public access
CREATE POLICY "public_user_blacklist_select" ON public.user_blacklist FOR SELECT USING (true);
CREATE POLICY "public_user_blacklist_insert" ON public.user_blacklist FOR INSERT WITH CHECK (true);
CREATE POLICY "public_user_blacklist_delete" ON public.user_blacklist FOR DELETE USING (true);

CREATE POLICY "public_user_notes_select" ON public.user_notes FOR SELECT USING (true);
CREATE POLICY "public_user_notes_insert" ON public.user_notes FOR INSERT WITH CHECK (true);
CREATE POLICY "public_user_notes_delete" ON public.user_notes FOR DELETE USING (true);

CREATE POLICY "public_ip_blacklist_select" ON public.ip_blacklist FOR SELECT USING (true);
CREATE POLICY "public_ip_blacklist_insert" ON public.ip_blacklist FOR INSERT WITH CHECK (true);
CREATE POLICY "public_ip_blacklist_delete" ON public.ip_blacklist FOR DELETE USING (true);

CREATE POLICY "public_bookings_select" ON public.bookings FOR SELECT USING (true);
CREATE POLICY "public_bookings_insert" ON public.bookings FOR INSERT WITH CHECK (true);
CREATE POLICY "public_bookings_update" ON public.bookings FOR UPDATE USING (true);
CREATE POLICY "public_bookings_delete" ON public.bookings FOR DELETE USING (true);

CREATE POLICY "public_reviews_select" ON public.reviews FOR SELECT USING (true);
CREATE POLICY "public_reviews_insert" ON public.reviews FOR INSERT WITH CHECK (true);
CREATE POLICY "public_reviews_update" ON public.reviews FOR UPDATE USING (true);
CREATE POLICY "public_reviews_delete" ON public.reviews FOR DELETE USING (true);

CREATE POLICY "public_broadcasts_select" ON public.broadcasts FOR SELECT USING (true);
CREATE POLICY "public_broadcasts_insert" ON public.broadcasts FOR INSERT WITH CHECK (true);

CREATE POLICY "public_workflow_triggers_select" ON public.workflow_triggers FOR SELECT USING (true);
CREATE POLICY "public_workflow_triggers_insert" ON public.workflow_triggers FOR INSERT WITH CHECK (true);
CREATE POLICY "public_workflow_triggers_update" ON public.workflow_triggers FOR UPDATE USING (true);
CREATE POLICY "public_workflow_triggers_delete" ON public.workflow_triggers FOR DELETE USING (true);

CREATE POLICY "public_workflow_actions_select" ON public.workflow_actions FOR SELECT USING (true);
CREATE POLICY "public_workflow_actions_insert" ON public.workflow_actions FOR INSERT WITH CHECK (true);
CREATE POLICY "public_workflow_actions_delete" ON public.workflow_actions FOR DELETE USING (true);

CREATE POLICY "public_workflow_executions_select" ON public.workflow_executions FOR SELECT USING (true);
CREATE POLICY "public_workflow_executions_insert" ON public.workflow_executions FOR INSERT WITH CHECK (true);

CREATE POLICY "public_ai_agents_select" ON public.ai_agents FOR SELECT USING (true);
CREATE POLICY "public_ai_agents_insert" ON public.ai_agents FOR INSERT WITH CHECK (true);
CREATE POLICY "public_ai_agents_update" ON public.ai_agents FOR UPDATE USING (true);
CREATE POLICY "public_ai_agents_delete" ON public.ai_agents FOR DELETE USING (true);

CREATE POLICY "public_ai_logs_select" ON public.ai_logs FOR SELECT USING (true);
CREATE POLICY "public_ai_logs_insert" ON public.ai_logs FOR INSERT WITH CHECK (true);

CREATE POLICY "public_subscription_plans_select" ON public.subscription_plans FOR SELECT USING (true);
CREATE POLICY "public_subscription_plans_insert" ON public.subscription_plans FOR INSERT WITH CHECK (true);
CREATE POLICY "public_subscription_plans_update" ON public.subscription_plans FOR UPDATE USING (true);

CREATE POLICY "public_wallets_select" ON public.wallets FOR SELECT USING (true);
CREATE POLICY "public_wallets_insert" ON public.wallets FOR INSERT WITH CHECK (true);
CREATE POLICY "public_wallets_update" ON public.wallets FOR UPDATE USING (true);

CREATE POLICY "public_wallet_transactions_select" ON public.wallet_transactions FOR SELECT USING (true);
CREATE POLICY "public_wallet_transactions_insert" ON public.wallet_transactions FOR INSERT WITH CHECK (true);

CREATE POLICY "public_payments_select" ON public.payments FOR SELECT USING (true);
CREATE POLICY "public_payments_insert" ON public.payments FOR INSERT WITH CHECK (true);
CREATE POLICY "public_payments_update" ON public.payments FOR UPDATE USING (true);

CREATE POLICY "public_promo_codes_select" ON public.promo_codes FOR SELECT USING (true);
CREATE POLICY "public_promo_codes_insert" ON public.promo_codes FOR INSERT WITH CHECK (true);

CREATE POLICY "public_activity_log_select" ON public.activity_log FOR SELECT USING (true);
CREATE POLICY "public_activity_log_insert" ON public.activity_log FOR INSERT WITH CHECK (true);

-- ============================================
-- ENABLE RLS ON NEW TABLES
-- ============================================

ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;
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

-- ============================================
-- VERIFICATION
-- ============================================

SELECT 'RLS Policies Fixed!' as status;
SELECT COUNT(*) as policies_count FROM pg_policies WHERE schemaname = 'public';
