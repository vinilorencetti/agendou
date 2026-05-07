-- =============================================================================
-- AGENDOU — Initial Schema
-- Migration: 001_initial_schema
-- =============================================================================

-- Enable required extensions
create extension if not exists "uuid-ossp";
create extension if not exists "citext";

-- =============================================================================
-- ENUMS
-- =============================================================================

create type user_role as enum ('master_admin', 'adm_geral', 'adm_basico', 'cliente');

create type appointment_status as enum (
  'pending',
  'confirmed',
  'in_progress',
  'completed',
  'cancelled',
  'no_show'
);

create type tenant_status as enum ('active', 'suspended', 'cancelled');

create type day_of_week as enum (
  'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'
);

create type financial_entry_type as enum ('income', 'expense');

create type financial_entry_status as enum ('pending', 'paid', 'cancelled');

-- =============================================================================
-- TENANTS
-- =============================================================================

create table tenants (
  id            uuid primary key default uuid_generate_v4(),
  slug          citext not null unique,
  name          text not null,
  status        tenant_status not null default 'active',
  phone         text,
  email         citext,
  description   text,

  -- Endereço
  address_street    text,
  address_number    text,
  address_district  text,
  address_city      text,
  address_state     char(2),
  address_zip       text,

  -- Configurações visuais
  logo_url          text,
  primary_color     text default '#000000',
  background_color  text default '#ffffff',
  theme_name        text default 'default',

  -- Política de cancelamento (horas de antecedência mínima)
  cancellation_policy_hours int not null default 2,

  -- Plano de assinatura
  plan              text not null default 'starter',
  plan_expires_at   timestamptz,

  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- Slug validation: lowercase, alphanumeric + hyphens only
alter table tenants
  add constraint tenants_slug_format
  check (slug ~ '^[a-z0-9][a-z0-9\-]{1,62}[a-z0-9]$');

-- =============================================================================
-- TENANT BUSINESS HOURS
-- =============================================================================

create table tenant_business_hours (
  id          uuid primary key default uuid_generate_v4(),
  tenant_id   uuid not null references tenants(id) on delete cascade,
  day         day_of_week not null,
  is_open     boolean not null default true,
  open_time   time not null default '09:00',
  close_time  time not null default '18:00',
  created_at  timestamptz not null default now(),

  unique(tenant_id, day)
);

-- =============================================================================
-- USERS
-- Linked to Supabase Auth (auth.users) via id.
-- master_admin users have tenant_id = NULL.
-- =============================================================================

create table users (
  id          uuid primary key references auth.users(id) on delete cascade,
  full_name   text not null,
  phone       text,
  avatar_url  text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- =============================================================================
-- USER ROLES
-- A user can have different roles in different tenants.
-- master_admin: tenant_id = NULL (system-wide).
-- =============================================================================

create table user_roles (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid not null references users(id) on delete cascade,
  tenant_id   uuid references tenants(id) on delete cascade,
  role        user_role not null,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now(),

  -- master_admin: unique globally (no tenant)
  -- other roles: unique per user per tenant
  unique(user_id, tenant_id, role)
);

-- Enforce: master_admin must have null tenant_id; others must have tenant_id
alter table user_roles
  add constraint user_roles_master_no_tenant
  check (
    (role = 'master_admin' and tenant_id is null) or
    (role != 'master_admin' and tenant_id is not null)
  );

-- =============================================================================
-- PROFESSIONAL PERMISSIONS
-- Granular permission flags for adm_basico users.
-- =============================================================================

create table professional_permissions (
  id                      uuid primary key default uuid_generate_v4(),
  user_role_id            uuid not null references user_roles(id) on delete cascade,
  can_view_own_schedule   boolean not null default true,
  can_view_all_schedules  boolean not null default false,
  can_manage_schedule     boolean not null default true,
  can_view_financial      boolean not null default false,
  can_manage_financial    boolean not null default false,
  can_view_reports        boolean not null default false,
  can_manage_clients      boolean not null default false,
  updated_at              timestamptz not null default now(),

  unique(user_role_id)
);

-- =============================================================================
-- CLIENTS
-- Clientes finais de cada tenant. Separado de users para permitir
-- clientes sem conta (cadastro simplificado via agendamento).
-- =============================================================================

create table clients (
  id          uuid primary key default uuid_generate_v4(),
  tenant_id   uuid not null references tenants(id) on delete cascade,
  user_id     uuid references users(id) on delete set null, -- null = guest
  full_name   text not null,
  phone       text,
  email       citext,
  notes       text, -- observações internas do negócio
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),

  unique(tenant_id, email)
);

-- =============================================================================
-- SERVICES
-- =============================================================================

create table services (
  id            uuid primary key default uuid_generate_v4(),
  tenant_id     uuid not null references tenants(id) on delete cascade,
  name          text not null,
  description   text,
  duration_min  int not null check (duration_min > 0),  -- duração em minutos
  price         numeric(10, 2) not null check (price >= 0),
  is_active     boolean not null default true,
  display_order int not null default 0,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- =============================================================================
-- PROFESSIONALS
-- Profissionais que executam serviços dentro de um tenant.
-- Podem estar associados a um user (adm_basico) ou não (externo/autônomo).
-- =============================================================================

create table professionals (
  id          uuid primary key default uuid_generate_v4(),
  tenant_id   uuid not null references tenants(id) on delete cascade,
  user_id     uuid references users(id) on delete set null,
  name        text not null,
  bio         text,
  avatar_url  text,
  commission_pct  numeric(5, 2) default 0 check (commission_pct between 0 and 100),
  is_active   boolean not null default true,
  display_order int not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- =============================================================================
-- PROFESSIONAL SERVICES (many-to-many)
-- Quais serviços cada profissional executa.
-- =============================================================================

create table professional_services (
  professional_id uuid not null references professionals(id) on delete cascade,
  service_id      uuid not null references services(id) on delete cascade,
  primary key (professional_id, service_id)
);

-- =============================================================================
-- PROFESSIONAL SCHEDULES
-- Horário de trabalho semanal por profissional.
-- =============================================================================

create table professional_schedules (
  id              uuid primary key default uuid_generate_v4(),
  professional_id uuid not null references professionals(id) on delete cascade,
  day             day_of_week not null,
  is_working      boolean not null default true,
  start_time      time not null,
  end_time        time not null,
  created_at      timestamptz not null default now(),

  unique(professional_id, day),
  constraint valid_schedule_times check (start_time < end_time)
);

-- =============================================================================
-- PROFESSIONAL BLOCKED TIMES
-- Bloqueios pontuais (férias, folga avulsa, etc.)
-- =============================================================================

create table professional_blocked_times (
  id              uuid primary key default uuid_generate_v4(),
  professional_id uuid not null references professionals(id) on delete cascade,
  start_at        timestamptz not null,
  end_at          timestamptz not null,
  reason          text,
  created_at      timestamptz not null default now(),

  constraint valid_blocked_times check (start_at < end_at)
);

-- =============================================================================
-- APPOINTMENTS
-- =============================================================================

create table appointments (
  id              uuid primary key default uuid_generate_v4(),
  tenant_id       uuid not null references tenants(id) on delete cascade,
  client_id       uuid not null references clients(id) on delete restrict,
  professional_id uuid not null references professionals(id) on delete restrict,
  service_id      uuid not null references services(id) on delete restrict,

  status          appointment_status not null default 'pending',
  starts_at       timestamptz not null,
  ends_at         timestamptz not null,

  -- Snapshot de preço/duração no momento do agendamento
  price_snapshot      numeric(10, 2) not null,
  duration_min_snapshot int not null,

  notes           text,  -- observações do cliente
  internal_notes  text,  -- observações internas

  cancelled_at    timestamptz,
  cancellation_reason text,

  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),

  constraint valid_appointment_times check (starts_at < ends_at)
);

-- Índices de consulta frequente
create index appointments_tenant_starts_at on appointments(tenant_id, starts_at);
create index appointments_professional_starts_at on appointments(professional_id, starts_at);
create index appointments_client on appointments(client_id);
create index appointments_status on appointments(tenant_id, status);

-- =============================================================================
-- FINANCIAL ENTRIES
-- =============================================================================

create table financial_entries (
  id              uuid primary key default uuid_generate_v4(),
  tenant_id       uuid not null references tenants(id) on delete cascade,
  appointment_id  uuid references appointments(id) on delete set null,
  professional_id uuid references professionals(id) on delete set null,

  type            financial_entry_type not null,
  status          financial_entry_status not null default 'pending',
  description     text not null,
  amount          numeric(10, 2) not null check (amount > 0),
  due_date        date not null,
  paid_at         timestamptz,

  category        text,  -- ex: 'service', 'commission', 'rent', 'supply'
  notes           text,

  created_by      uuid references users(id) on delete set null,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index financial_entries_tenant_due_date on financial_entries(tenant_id, due_date);
create index financial_entries_tenant_type on financial_entries(tenant_id, type, status);

-- =============================================================================
-- UPDATED_AT TRIGGER
-- =============================================================================

create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger tenants_updated_at
  before update on tenants
  for each row execute function set_updated_at();

create trigger users_updated_at
  before update on users
  for each row execute function set_updated_at();

create trigger clients_updated_at
  before update on clients
  for each row execute function set_updated_at();

create trigger services_updated_at
  before update on services
  for each row execute function set_updated_at();

create trigger professionals_updated_at
  before update on professionals
  for each row execute function set_updated_at();

create trigger appointments_updated_at
  before update on appointments
  for each row execute function set_updated_at();

create trigger financial_entries_updated_at
  before update on financial_entries
  for each row execute function set_updated_at();

create trigger professional_permissions_updated_at
  before update on professional_permissions
  for each row execute function set_updated_at();
