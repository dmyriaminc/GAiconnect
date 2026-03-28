-- ============================================
-- COMPLETE SUPABASE SETUP SCRIPT
-- Run this ONE script to set up everything
-- ============================================

DO $$ 
BEGIN
    -- Drop all existing policies on each table
    DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
    DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
    DROP POLICY IF EXISTS "Anyone can sign up" ON public.users;
    DROP POLICY IF EXISTS "Admins can view all users" ON public.users;
    DROP POLICY IF EXISTS "users_select_own" ON public.users;
    DROP POLICY IF EXISTS "users_update_own" ON public.users;
    DROP POLICY IF EXISTS "users_insert_anyone" ON public.users;
    DROP POLICY IF EXISTS "users_select_all_admin" ON public.users;
    DROP POLICY IF EXISTS "users_update_all_admin" ON public.users;
    
    DROP POLICY IF EXISTS "Anyone can view active services" ON public.services;
    DROP POLICY IF EXISTS "Users can create services" ON public.services;
    DROP POLICY IF EXISTS "Providers can update own services" ON public.services;
    DROP POLICY IF EXISTS "Providers can delete own services" ON public.services;
    DROP POLICY IF EXISTS "services_select_active" ON public.services;
    DROP POLICY IF EXISTS "services_insert_owner" ON public.services;
    DROP POLICY IF EXISTS "services_update_owner" ON public.services;
    DROP POLICY IF EXISTS "services_delete_owner" ON public.services;
    
    DROP POLICY IF EXISTS "Users can view own messages" ON public.messages;
    DROP POLICY IF EXISTS "Users can send messages" ON public.messages;
    DROP POLICY IF EXISTS "messages_select_participant" ON public.messages;
    DROP POLICY IF EXISTS "messages_insert_sender" ON public.messages;
    DROP POLICY IF EXISTS "messages_update_receiver" ON public.messages;
    
    DROP POLICY IF EXISTS "memberships_select_own" ON public.memberships;
    DROP POLICY IF EXISTS "memberships_insert_anyone" ON public.memberships;
    
    DROP POLICY IF EXISTS "connections_select_own" ON public.connections;
    DROP POLICY IF EXISTS "connections_insert_own" ON public.connections;
    
    RAISE NOTICE 'All existing policies dropped successfully';
END $$;

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- TABLES (using IF NOT EXISTS for safety)
-- ============================================

CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id VARCHAR(50) UNIQUE NOT NULL,
    fullname VARCHAR(255),
    nickname VARCHAR(100) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    avatar_url TEXT,
    dob DATE,
    nationality VARCHAR(100),
    location VARCHAR(255),
    bio TEXT,
    tier VARCHAR(50) DEFAULT 'Free',
    status VARCHAR(50) DEFAULT 'active',
    verified BOOLEAN DEFAULT false,
    is_admin BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.services (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    provider_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100),
    price DECIMAL(10, 2),
    price_unit VARCHAR(50) DEFAULT 'fixed',
    location VARCHAR(255),
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    rating DECIMAL(3, 2) DEFAULT 0,
    reviews_count INTEGER DEFAULT 0,
    status VARCHAR(50) DEFAULT 'active',
    images JSONB DEFAULT '[]',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sender_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    receiver_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    content TEXT NOT NULL,
    read BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.memberships (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    tier VARCHAR(50) NOT NULL,
    price DECIMAL(10, 2),
    status VARCHAR(50) DEFAULT 'active',
    started_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.connections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    connected_user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    status VARCHAR(50) DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- ENABLE ROW LEVEL SECURITY
-- ============================================

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.connections ENABLE ROW LEVEL SECURITY;

-- ============================================
-- CREATE POLICIES (No "FOR" prefix to avoid conflicts)
-- ============================================

-- Users Policies
DROP POLICY IF EXISTS "p_users_select_own" ON public.users;
DROP POLICY IF EXISTS "p_users_update_own" ON public.users;
DROP POLICY IF EXISTS "p_users_insert_anyone" ON public.users;
DROP POLICY IF EXISTS "p_users_admin" ON public.users;

CREATE POLICY "p_users_select_own" ON public.users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "p_users_update_own" ON public.users FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "p_users_insert_anyone" ON public.users FOR INSERT WITH CHECK (true);
CREATE POLICY "p_users_admin" ON public.users FOR ALL USING (is_admin = true);

-- Services Policies
DROP POLICY IF EXISTS "p_services_view" ON public.services;
DROP POLICY IF EXISTS "p_services_insert" ON public.services;
DROP POLICY IF EXISTS "p_services_update" ON public.services;
DROP POLICY IF EXISTS "p_services_delete" ON public.services;

CREATE POLICY "p_services_view" ON public.services FOR SELECT USING (status = 'active');
CREATE POLICY "p_services_insert" ON public.services FOR INSERT WITH CHECK (auth.uid() = provider_id);
CREATE POLICY "p_services_update" ON public.services FOR UPDATE USING (auth.uid() = provider_id);
CREATE POLICY "p_services_delete" ON public.services FOR DELETE USING (auth.uid() = provider_id);

-- Messages Policies
DROP POLICY IF EXISTS "p_messages_view" ON public.messages;
DROP POLICY IF EXISTS "p_messages_insert" ON public.messages;

CREATE POLICY "p_messages_view" ON public.messages FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = receiver_id);
CREATE POLICY "p_messages_insert" ON public.messages FOR INSERT WITH CHECK (auth.uid() = sender_id);

-- Memberships Policies
DROP POLICY IF EXISTS "p_memberships_view" ON public.memberships;
DROP POLICY IF EXISTS "p_memberships_insert" ON public.memberships;

CREATE POLICY "p_memberships_view" ON public.memberships FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "p_memberships_insert" ON public.memberships FOR INSERT WITH CHECK (true);

-- Connections Policies
DROP POLICY IF EXISTS "p_connections_view" ON public.connections;
DROP POLICY IF EXISTS "p_connections_insert" ON public.connections;

CREATE POLICY "p_connections_view" ON public.connections FOR SELECT USING (auth.uid() = user_id OR auth.uid() = connected_user_id);
CREATE POLICY "p_connections_insert" ON public.connections FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ============================================
-- SEED ADMIN USER
-- ============================================

INSERT INTO public.users (id, user_id, fullname, nickname, email, password_hash, tier, status, verified, is_admin)
VALUES (
    uuid_generate_v4(),
    'GAi000001',
    'System Administrator',
    'admin',
    'admin@gai.connect',
    'GAiAdmin2024!',
    'Elite',
    'active',
    true,
    true
) ON CONFLICT (email) DO NOTHING;

-- ============================================
-- VERIFY
-- ============================================

SELECT 'Setup Complete!' as status;
SELECT count(*) as users_count FROM public.users;
SELECT count(*) as policies_count FROM pg_policies WHERE schemaname = 'public';
