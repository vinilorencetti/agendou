-- =============================================================================
-- AGENDOU — Seed: Master Admin Setup
-- Migration: 003_seed_master_admin
-- =============================================================================
-- Execute AFTER creating the first user via Supabase Auth dashboard.
-- Replace the UUID below with the actual auth.users.id of your account.
-- =============================================================================

-- Step 1: Insert into public.users (run after Supabase Auth signup)
-- insert into users (id, full_name)
-- values ('<YOUR_AUTH_USER_UUID>', 'Master Admin');

-- Step 2: Grant master_admin role
-- insert into user_roles (user_id, tenant_id, role)
-- values ('<YOUR_AUTH_USER_UUID>', null, 'master_admin');

-- =============================================================================
-- Default categories for financial entries (reference only — no table needed)
-- income:  'service', 'product', 'other_income'
-- expense: 'rent', 'supply', 'salary', 'commission', 'marketing', 'other_expense'
-- =============================================================================
