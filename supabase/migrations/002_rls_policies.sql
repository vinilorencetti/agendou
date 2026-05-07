-- =============================================================================
-- AGENDOU — Row Level Security Policies
-- Migration: 002_rls_policies
-- =============================================================================
-- Estratégia:
--   1. Habilitar RLS em todas as tabelas com dados de tenant.
--   2. Helper functions para evitar repetição e N+1 em policies.
--   3. Policies separadas por operação (SELECT, INSERT, UPDATE, DELETE).
-- =============================================================================

-- =============================================================================
-- HELPER FUNCTIONS
-- Executadas com SECURITY DEFINER para evitar recursão infinita no RLS.
-- =============================================================================

-- Retorna o role do usuário autenticado em um tenant específico
create or replace function auth_user_role(p_tenant_id uuid)
returns user_role
language sql
security definer
stable
as $$
  select role
  from user_roles
  where user_id = auth.uid()
    and tenant_id = p_tenant_id
    and is_active = true
  limit 1;
$$;

-- Verifica se o usuário autenticado é master_admin
create or replace function auth_is_master_admin()
returns boolean
language sql
security definer
stable
as $$
  select exists (
    select 1 from user_roles
    where user_id = auth.uid()
      and role = 'master_admin'
      and is_active = true
  );
$$;

-- Verifica se o usuário autenticado é adm_geral de um tenant
create or replace function auth_is_adm_geral(p_tenant_id uuid)
returns boolean
language sql
security definer
stable
as $$
  select exists (
    select 1 from user_roles
    where user_id = auth.uid()
      and tenant_id = p_tenant_id
      and role = 'adm_geral'
      and is_active = true
  );
$$;

-- Verifica se o usuário autenticado é adm (geral ou básico) de um tenant
create or replace function auth_is_any_admin(p_tenant_id uuid)
returns boolean
language sql
security definer
stable
as $$
  select exists (
    select 1 from user_roles
    where user_id = auth.uid()
      and tenant_id = p_tenant_id
      and role in ('adm_geral', 'adm_basico')
      and is_active = true
  );
$$;

-- Retorna o professional vinculado ao usuário autenticado em um tenant
create or replace function auth_professional_id(p_tenant_id uuid)
returns uuid
language sql
security definer
stable
as $$
  select id from professionals
  where tenant_id = p_tenant_id
    and user_id = auth.uid()
    and is_active = true
  limit 1;
$$;

-- Verifica permissão granular de adm_basico
create or replace function auth_has_permission(p_tenant_id uuid, p_permission text)
returns boolean
language sql
security definer
stable
as $$
  select case p_permission
    when 'view_own_schedule'   then coalesce((select pp.can_view_own_schedule   from user_roles ur join professional_permissions pp on pp.user_role_id = ur.id where ur.user_id = auth.uid() and ur.tenant_id = p_tenant_id and ur.role = 'adm_basico' and ur.is_active = true limit 1), false)
    when 'view_all_schedules'  then coalesce((select pp.can_view_all_schedules  from user_roles ur join professional_permissions pp on pp.user_role_id = ur.id where ur.user_id = auth.uid() and ur.tenant_id = p_tenant_id and ur.role = 'adm_basico' and ur.is_active = true limit 1), false)
    when 'manage_schedule'     then coalesce((select pp.can_manage_schedule     from user_roles ur join professional_permissions pp on pp.user_role_id = ur.id where ur.user_id = auth.uid() and ur.tenant_id = p_tenant_id and ur.role = 'adm_basico' and ur.is_active = true limit 1), false)
    when 'view_financial'      then coalesce((select pp.can_view_financial      from user_roles ur join professional_permissions pp on pp.user_role_id = ur.id where ur.user_id = auth.uid() and ur.tenant_id = p_tenant_id and ur.role = 'adm_basico' and ur.is_active = true limit 1), false)
    when 'manage_financial'    then coalesce((select pp.can_manage_financial    from user_roles ur join professional_permissions pp on pp.user_role_id = ur.id where ur.user_id = auth.uid() and ur.tenant_id = p_tenant_id and ur.role = 'adm_basico' and ur.is_active = true limit 1), false)
    when 'view_reports'        then coalesce((select pp.can_view_reports        from user_roles ur join professional_permissions pp on pp.user_role_id = ur.id where ur.user_id = auth.uid() and ur.tenant_id = p_tenant_id and ur.role = 'adm_basico' and ur.is_active = true limit 1), false)
    when 'manage_clients'      then coalesce((select pp.can_manage_clients      from user_roles ur join professional_permissions pp on pp.user_role_id = ur.id where ur.user_id = auth.uid() and ur.tenant_id = p_tenant_id and ur.role = 'adm_basico' and ur.is_active = true limit 1), false)
    else false
  end;
$$;

-- =============================================================================
-- ENABLE RLS
-- =============================================================================

alter table tenants                   enable row level security;
alter table tenant_business_hours     enable row level security;
alter table users                     enable row level security;
alter table user_roles                enable row level security;
alter table professional_permissions  enable row level security;
alter table clients                   enable row level security;
alter table services                  enable row level security;
alter table professionals             enable row level security;
alter table professional_services     enable row level security;
alter table professional_schedules    enable row level security;
alter table professional_blocked_times enable row level security;
alter table appointments              enable row level security;
alter table financial_entries         enable row level security;

-- =============================================================================
-- TENANTS
-- =============================================================================

create policy "tenants: master_admin sees all"
  on tenants for select
  using (auth_is_master_admin());

create policy "tenants: admins see their own tenant"
  on tenants for select
  using (auth_is_any_admin(id));

-- Área pública: qualquer pessoa (inclusive anon) pode ver tenant ativo pelo slug
create policy "tenants: public can read active tenants"
  on tenants for select
  using (status = 'active');

create policy "tenants: adm_geral can update their tenant"
  on tenants for update
  using (auth_is_adm_geral(id));

create policy "tenants: only master_admin can insert"
  on tenants for insert
  with check (auth_is_master_admin());

create policy "tenants: only master_admin can delete"
  on tenants for delete
  using (auth_is_master_admin());

-- =============================================================================
-- TENANT BUSINESS HOURS
-- =============================================================================

create policy "business_hours: public can read"
  on tenant_business_hours for select
  using (
    exists (select 1 from tenants t where t.id = tenant_id and t.status = 'active')
  );

create policy "business_hours: adm_geral can manage"
  on tenant_business_hours for all
  using (auth_is_adm_geral(tenant_id))
  with check (auth_is_adm_geral(tenant_id));

create policy "business_hours: master_admin can manage"
  on tenant_business_hours for all
  using (auth_is_master_admin())
  with check (auth_is_master_admin());

-- =============================================================================
-- USERS
-- =============================================================================

-- Cada usuário vê apenas seu próprio registro
create policy "users: read own profile"
  on users for select
  using (id = auth.uid());

-- Admins veem usuários do seu tenant
create policy "users: admins read tenant users"
  on users for select
  using (
    auth_is_master_admin() or
    exists (
      select 1 from user_roles ur
      where ur.user_id = users.id
        and auth_is_any_admin(ur.tenant_id)
    )
  );

create policy "users: insert own profile on signup"
  on users for insert
  with check (id = auth.uid());

create policy "users: update own profile"
  on users for update
  using (id = auth.uid());

-- =============================================================================
-- USER ROLES
-- =============================================================================

create policy "user_roles: master_admin sees all"
  on user_roles for select
  using (auth_is_master_admin());

create policy "user_roles: user sees own roles"
  on user_roles for select
  using (user_id = auth.uid());

create policy "user_roles: adm_geral sees tenant roles"
  on user_roles for select
  using (auth_is_adm_geral(tenant_id));

create policy "user_roles: adm_geral manages tenant roles"
  on user_roles for insert
  with check (
    auth_is_adm_geral(tenant_id) and
    role in ('adm_basico', 'cliente')
  );

create policy "user_roles: adm_geral updates tenant roles"
  on user_roles for update
  using (
    auth_is_adm_geral(tenant_id) and
    role in ('adm_basico', 'cliente')
  );

create policy "user_roles: master_admin manages all"
  on user_roles for all
  using (auth_is_master_admin())
  with check (auth_is_master_admin());

-- =============================================================================
-- PROFESSIONAL PERMISSIONS
-- =============================================================================

create policy "prof_permissions: adm_geral manages"
  on professional_permissions for all
  using (
    exists (
      select 1 from user_roles ur
      where ur.id = professional_permissions.user_role_id
        and auth_is_adm_geral(ur.tenant_id)
    )
  )
  with check (
    exists (
      select 1 from user_roles ur
      where ur.id = professional_permissions.user_role_id
        and auth_is_adm_geral(ur.tenant_id)
    )
  );

create policy "prof_permissions: user reads own"
  on professional_permissions for select
  using (
    exists (
      select 1 from user_roles ur
      where ur.id = professional_permissions.user_role_id
        and ur.user_id = auth.uid()
    )
  );

create policy "prof_permissions: master_admin manages all"
  on professional_permissions for all
  using (auth_is_master_admin())
  with check (auth_is_master_admin());

-- =============================================================================
-- CLIENTS
-- =============================================================================

-- Público pode ver clientes? Não — apenas admins do tenant e o próprio cliente
create policy "clients: admins see tenant clients"
  on clients for select
  using (auth_is_any_admin(tenant_id) or auth_is_master_admin());

create policy "clients: client sees own record"
  on clients for select
  using (user_id = auth.uid());

create policy "clients: anyone can register as client"
  on clients for insert
  with check (
    -- O user_id inserido deve ser o do usuário autenticado (ou null para guest)
    (user_id is null or user_id = auth.uid())
  );

create policy "clients: client updates own record"
  on clients for update
  using (user_id = auth.uid());

create policy "clients: adm_geral and adm_basico with perm can update"
  on clients for update
  using (
    auth_is_adm_geral(tenant_id) or
    auth_has_permission(tenant_id, 'manage_clients')
  );

create policy "clients: adm_geral can delete"
  on clients for delete
  using (auth_is_adm_geral(tenant_id) or auth_is_master_admin());

-- =============================================================================
-- SERVICES
-- =============================================================================

-- Público pode ver serviços ativos
create policy "services: public reads active services"
  on services for select
  using (
    is_active = true and
    exists (select 1 from tenants t where t.id = tenant_id and t.status = 'active')
  );

create policy "services: admins read all services"
  on services for select
  using (auth_is_any_admin(tenant_id) or auth_is_master_admin());

create policy "services: adm_geral manages services"
  on services for insert
  with check (auth_is_adm_geral(tenant_id));

create policy "services: adm_geral updates services"
  on services for update
  using (auth_is_adm_geral(tenant_id));

create policy "services: adm_geral deletes services"
  on services for delete
  using (auth_is_adm_geral(tenant_id) or auth_is_master_admin());

-- =============================================================================
-- PROFESSIONALS
-- =============================================================================

-- Público pode ver profissionais ativos
create policy "professionals: public reads active"
  on professionals for select
  using (
    is_active = true and
    exists (select 1 from tenants t where t.id = tenant_id and t.status = 'active')
  );

create policy "professionals: admins read all"
  on professionals for select
  using (auth_is_any_admin(tenant_id) or auth_is_master_admin());

create policy "professionals: adm_geral manages"
  on professionals for insert
  with check (auth_is_adm_geral(tenant_id));

create policy "professionals: adm_geral updates"
  on professionals for update
  using (auth_is_adm_geral(tenant_id));

-- Professional pode atualizar seu próprio perfil
create policy "professionals: update own profile"
  on professionals for update
  using (user_id = auth.uid());

create policy "professionals: adm_geral deletes"
  on professionals for delete
  using (auth_is_adm_geral(tenant_id) or auth_is_master_admin());

-- =============================================================================
-- PROFESSIONAL SERVICES (many-to-many)
-- =============================================================================

create policy "professional_services: public reads"
  on professional_services for select
  using (
    exists (
      select 1 from professionals p
      where p.id = professional_id and p.is_active = true
    )
  );

create policy "professional_services: adm_geral manages"
  on professional_services for all
  using (
    exists (
      select 1 from professionals p
      where p.id = professional_id and auth_is_adm_geral(p.tenant_id)
    )
  )
  with check (
    exists (
      select 1 from professionals p
      where p.id = professional_id and auth_is_adm_geral(p.tenant_id)
    )
  );

-- =============================================================================
-- PROFESSIONAL SCHEDULES
-- =============================================================================

create policy "prof_schedules: public reads"
  on professional_schedules for select
  using (
    exists (
      select 1 from professionals p
      where p.id = professional_id and p.is_active = true
    )
  );

create policy "prof_schedules: adm_geral manages"
  on professional_schedules for all
  using (
    exists (
      select 1 from professionals p
      where p.id = professional_id and auth_is_adm_geral(p.tenant_id)
    )
  )
  with check (
    exists (
      select 1 from professionals p
      where p.id = professional_id and auth_is_adm_geral(p.tenant_id)
    )
  );

-- Professional manages own schedule
create policy "prof_schedules: professional manages own"
  on professional_schedules for all
  using (
    exists (
      select 1 from professionals p
      where p.id = professional_id and p.user_id = auth.uid()
        and auth_has_permission(p.tenant_id, 'manage_schedule')
    )
  )
  with check (
    exists (
      select 1 from professionals p
      where p.id = professional_id and p.user_id = auth.uid()
        and auth_has_permission(p.tenant_id, 'manage_schedule')
    )
  );

-- =============================================================================
-- PROFESSIONAL BLOCKED TIMES
-- =============================================================================

create policy "blocked_times: public reads"
  on professional_blocked_times for select
  using (
    exists (
      select 1 from professionals p
      where p.id = professional_id and p.is_active = true
    )
  );

create policy "blocked_times: adm_geral manages"
  on professional_blocked_times for all
  using (
    exists (
      select 1 from professionals p
      where p.id = professional_id and auth_is_adm_geral(p.tenant_id)
    )
  )
  with check (
    exists (
      select 1 from professionals p
      where p.id = professional_id and auth_is_adm_geral(p.tenant_id)
    )
  );

create policy "blocked_times: professional manages own"
  on professional_blocked_times for all
  using (
    exists (
      select 1 from professionals p
      where p.id = professional_id and p.user_id = auth.uid()
        and auth_has_permission(p.tenant_id, 'manage_schedule')
    )
  )
  with check (
    exists (
      select 1 from professionals p
      where p.id = professional_id and p.user_id = auth.uid()
        and auth_has_permission(p.tenant_id, 'manage_schedule')
    )
  );

-- =============================================================================
-- APPOINTMENTS
-- =============================================================================

-- Cliente pode ver seus próprios agendamentos
create policy "appointments: client reads own"
  on appointments for select
  using (
    exists (
      select 1 from clients c
      where c.id = client_id and c.user_id = auth.uid()
    )
  );

-- adm_geral e adm_basico (com permissão) veem todos do tenant
create policy "appointments: admins read tenant appointments"
  on appointments for select
  using (
    auth_is_adm_geral(tenant_id) or
    auth_has_permission(tenant_id, 'view_all_schedules') or
    auth_is_master_admin()
  );

-- Professional vê próprios agendamentos
create policy "appointments: professional reads own"
  on appointments for select
  using (
    professional_id = auth_professional_id(tenant_id)
    and auth_has_permission(tenant_id, 'view_own_schedule')
  );

-- Cliente pode criar agendamento
create policy "appointments: client inserts"
  on appointments for insert
  with check (
    exists (
      select 1 from clients c
      where c.id = client_id and (c.user_id = auth.uid() or c.user_id is null)
    ) and
    exists (select 1 from tenants t where t.id = tenant_id and t.status = 'active')
  );

-- adm_geral e admins com permissão podem criar agendamento
create policy "appointments: admins insert"
  on appointments for insert
  with check (
    auth_is_adm_geral(tenant_id) or
    auth_has_permission(tenant_id, 'manage_schedule')
  );

-- Atualização de status
create policy "appointments: admins update"
  on appointments for update
  using (
    auth_is_adm_geral(tenant_id) or
    auth_has_permission(tenant_id, 'manage_schedule') or
    auth_is_master_admin()
  );

-- Cliente pode cancelar o próprio agendamento
create policy "appointments: client cancels own"
  on appointments for update
  using (
    exists (
      select 1 from clients c
      where c.id = client_id and c.user_id = auth.uid()
    )
  );

-- =============================================================================
-- FINANCIAL ENTRIES
-- =============================================================================

create policy "financial: adm_geral manages"
  on financial_entries for all
  using (auth_is_adm_geral(tenant_id))
  with check (auth_is_adm_geral(tenant_id));

create policy "financial: adm_basico reads with permission"
  on financial_entries for select
  using (auth_has_permission(tenant_id, 'view_financial'));

create policy "financial: adm_basico manages with permission"
  on financial_entries for insert
  with check (auth_has_permission(tenant_id, 'manage_financial'));

create policy "financial: adm_basico updates with permission"
  on financial_entries for update
  using (auth_has_permission(tenant_id, 'manage_financial'));

create policy "financial: master_admin manages all"
  on financial_entries for all
  using (auth_is_master_admin())
  with check (auth_is_master_admin());
