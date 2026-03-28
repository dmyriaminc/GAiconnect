-- Supabase Database Schema for GAi Connect
-- Run this in Supabase SQL Editor
-- NOTE: If you get "policy already exists" errors, run the "DROP OLD POLICIES" section first

-- ============================================
-- DROP OLD POLICIES (Run if you get errors)
-- ============================================

DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
DROP POLICY IF EXISTS "Anyone can sign up" ON public.users;
DROP POLICY IF EXISTS "Admins can view all users" ON public.users;
DROP POLICY IF EXISTS "Anyone can view active services" ON public.services;
DROP POLICY IF EXISTS "Users can create services" ON public.services;
DROP POLICY IF EXISTS "Providers can update own services" ON public.services;
DROP POLICY IF EXISTS "Providers can delete own services" ON public.services;
DROP POLICY IF EXISTS "Users can view own messages" ON public.messages;
DROP POLICY IF EXISTS "Users can send messages" ON public.messages;

-- ============================================
-- ENABLE UUID EXTENSION
-- ============================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- USERS TABLE
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

CREATE INDEX IF NOT EXISTS users_email_idx ON public.users(email);
CREATE INDEX IF NOT EXISTS users_nickname_idx ON public.users(nickname);
CREATE INDEX IF NOT EXISTS users_status_idx ON public.users(status);

-- ============================================
-- SERVICES TABLE
-- ============================================

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

CREATE INDEX IF NOT EXISTS services_provider_idx ON public.services(provider_id);
CREATE INDEX IF NOT EXISTS services_category_idx ON public.services(category);
CREATE INDEX IF NOT EXISTS services_status_idx ON public.services(status);

-- ============================================
-- MESSAGES TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS public.messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sender_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    receiver_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    content TEXT NOT NULL,
    read BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS messages_sender_idx ON public.messages(sender_id);
CREATE INDEX IF NOT EXISTS messages_receiver_idx ON public.messages(receiver_id);
CREATE INDEX IF NOT EXISTS messages_created_idx ON public.messages(created_at);

-- ============================================
-- MEMBERSHIPS TABLE
-- ============================================

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

-- ============================================
-- CONNECTIONS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS public.connections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    connected_user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    status VARCHAR(50) DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS connections_user_idx ON public.connections(user_id);
CREATE INDEX IF NOT EXISTS connections_connected_idx ON public.connections(connected_user_id);

-- ============================================
-- AUDIT LOG TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS public.audit_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    details JSONB DEFAULT '{}',
    ip_address VARCHAR(45),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS audit_log_user_idx ON public.audit_log(user_id);
CREATE INDEX IF NOT EXISTS audit_log_created_idx ON public.audit_log(created_at);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.connections ENABLE ROW LEVEL SECURITY;

-- USERS POLICIES
CREATE POLICY "users_select_own" ON public.users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "users_update_own" ON public.users FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "users_insert_anyone" ON public.users FOR INSERT WITH CHECK (true);
CREATE POLICY "users_select_all_admin" ON public.users FOR SELECT USING (is_admin = true);
CREATE POLICY "users_update_all_admin" ON public.users FOR UPDATE USING (is_admin = true);

-- SERVICES POLICIES
CREATE POLICY "services_select_active" ON public.services FOR SELECT USING (status = 'active');
CREATE POLICY "services_insert_owner" ON public.services FOR INSERT WITH CHECK (auth.uid() = provider_id);
CREATE POLICY "services_update_owner" ON public.services FOR UPDATE USING (auth.uid() = provider_id);
CREATE POLICY "services_delete_owner" ON public.services FOR DELETE USING (auth.uid() = provider_id);

-- MESSAGES POLICIES
CREATE POLICY "messages_select_participant" ON public.messages FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = receiver_id);
CREATE POLICY "messages_insert_sender" ON public.messages FOR INSERT WITH CHECK (auth.uid() = sender_id);
CREATE POLICY "messages_update_receiver" ON public.messages FOR UPDATE USING (auth.uid() = receiver_id);

-- MEMBERSHIPS POLICIES
CREATE POLICY "memberships_select_own" ON public.memberships FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "memberships_insert_anyone" ON public.memberships FOR INSERT WITH CHECK (true);

-- CONNECTIONS POLICIES
CREATE POLICY "connections_select_own" ON public.connections FOR SELECT USING (auth.uid() = user_id OR auth.uid() = connected_user_id);
CREATE POLICY "connections_insert_own" ON public.connections FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ============================================
-- TRIGGERS
-- ============================================

CREATE OR REPLACE FUNCTION generate_user_id()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.user_id IS NULL THEN
        NEW.user_id := 'GAi' || LPAD(CAST(EXTRACT(EPOCH FROM NOW())::INTEGER % 1000000 AS TEXT), 6, '0');
    END IF;
    NEW.updated_at := NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS users_generate_user_id ON public.users;
CREATE TRIGGER users_generate_user_id
    BEFORE INSERT OR UPDATE ON public.users
    FOR EACH ROW EXECUTE FUNCTION generate_user_id();

-- ============================================
-- SEED DATA (Admin User)
-- ============================================

INSERT INTO public.users (id, user_id, fullname, nickname, email, password_hash, tier, status, verified, is_admin)
VALUES (
    uuid_generate_v4(),
    'GAi000001',
    'System Administrator',
    'admin',
    'admin@gai.connect',
    'GAiAdmin2024!', -- Plain text for now, hash in production
    'Elite',
    'active',
    true,
    true
) ON CONFLICT (email) DO NOTHING;

-- ============================================
-- VERIFICATION
-- ============================================

SELECT 'Schema Setup Complete!' as status;
