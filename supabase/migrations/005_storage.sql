-- =============================================================================
-- AGENDOU — Migration 005: Supabase Storage — buckets e policies
-- =============================================================================
-- Execute no SQL Editor do Supabase Dashboard.
-- Os buckets precisam ser criados via Dashboard ou CLI antes das policies.
--
-- Crie os buckets manualmente:
--   Dashboard → Storage → New bucket
--   Nome: "logos"    → Public: true
--   Nome: "avatars"  → Public: true
-- =============================================================================

-- ─── LOGOS (logo do tenant) ──────────────────────────────────────────────────

-- adm_geral pode fazer upload na pasta do seu tenant
create policy "logos: adm_geral can upload"
  on storage.objects for insert
  with check (
    bucket_id = 'logos' and
    auth_is_adm_geral((storage.foldername(name))[1]::uuid)
  );

-- adm_geral pode atualizar/deletar na pasta do seu tenant
create policy "logos: adm_geral can update"
  on storage.objects for update
  using (
    bucket_id = 'logos' and
    auth_is_adm_geral((storage.foldername(name))[1]::uuid)
  );

create policy "logos: adm_geral can delete"
  on storage.objects for delete
  using (
    bucket_id = 'logos' and
    auth_is_adm_geral((storage.foldername(name))[1]::uuid)
  );

-- Leitura pública
create policy "logos: public read"
  on storage.objects for select
  using (bucket_id = 'logos');

-- ─── AVATARS (foto dos profissionais) ────────────────────────────────────────

create policy "avatars: admins can upload"
  on storage.objects for insert
  with check (
    bucket_id = 'avatars' and
    auth_is_any_admin((storage.foldername(name))[1]::uuid)
  );

create policy "avatars: admins can update"
  on storage.objects for update
  using (
    bucket_id = 'avatars' and
    auth_is_any_admin((storage.foldername(name))[1]::uuid)
  );

create policy "avatars: admins can delete"
  on storage.objects for delete
  using (
    bucket_id = 'avatars' and
    auth_is_any_admin((storage.foldername(name))[1]::uuid)
  );

create policy "avatars: public read"
  on storage.objects for select
  using (bucket_id = 'avatars');
