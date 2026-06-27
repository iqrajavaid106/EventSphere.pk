-- Run this script in your Supabase Dashboard SQL Editor to update your schema.

-- 1. Add ticket_tiers JSONB column to events table
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS ticket_tiers JSONB DEFAULT '[{"name": "Regular", "price": 50}, {"name": "VIP", "price": 150}, {"name": "Student", "price": 25}]'::jsonb;

-- 2. Add coupons JSONB column to events table
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS coupons JSONB DEFAULT '[]'::jsonb;
