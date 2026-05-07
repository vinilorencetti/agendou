-- =============================================================================
-- AGENDOU — Migration 004: secondary_color + avatar_url no tenant
-- =============================================================================

alter table tenants
  add column if not exists secondary_color text not null default '#6b7280';
