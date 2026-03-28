-- COMPLETE CLEANUP SCRIPT
-- Run this FIRST to remove all existing policies, then run supabase-schema.sql

-- Drop all policies from all tables
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

-- Verify cleanup
SELECT 'All policies dropped!' as status;
