-- ============================================
-- FIX MISSING USER COLUMNS
-- Run this in Supabase SQL Editor
-- ============================================

-- Add missing columns to users table
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS biometricEnabled BOOLEAN DEFAULT false;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS faceDescriptor JSONB;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS voicePrint JSONB;
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
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS tier VARCHAR(20) DEFAULT 'Standard';
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS nationality VARCHAR(100);
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS location VARCHAR(255);
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS bio TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS verified BOOLEAN DEFAULT false;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Verify columns
SELECT column_name, data_type FROM information_schema.columns 
WHERE table_name = 'users' AND table_schema = 'public'
ORDER BY ordinal_position;

SELECT 'Missing columns added!' as status;
