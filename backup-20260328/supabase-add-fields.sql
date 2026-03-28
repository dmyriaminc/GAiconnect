-- Add new profile fields to users table
-- Run this in Supabase SQL Editor to add: whatsapp, phone, portfolio, twitter, instagram, linkedin

ALTER TABLE public.users ADD COLUMN IF NOT EXISTS whatsapp VARCHAR(50);
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS phone VARCHAR(50);
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS portfolio TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS twitter VARCHAR(100);
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS instagram VARCHAR(100);
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS linkedin VARCHAR(100);
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS bio TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS avatar_url TEXT;

SELECT 'Added profile fields to users table' as status;
