# Agendou — Supabase Database

## Migrations

| Arquivo | Descrição |
|---|---|
| `001_initial_schema.sql` | Tabelas, enums, índices, triggers de updated_at |
| `002_rls_policies.sql` | Row Level Security: policies + helper functions |
| `003_seed_master_admin.sql` | Instruções para criar o master_admin inicial |

## Como aplicar

1. Acesse o Supabase Dashboard → SQL Editor
2. Execute as migrations **em ordem** (001 → 002 → 003)
3. Após criar sua conta via Auth, siga as instruções do `003_seed_master_admin.sql`

## Diagrama de tabelas

```
tenants
  ├── tenant_business_hours   (horário de funcionamento)
  ├── services                (serviços oferecidos)
  ├── professionals           (profissionais)
  │     ├── professional_services     (serviços que executa)
  │     ├── professional_schedules    (horário semanal)
  │     └── professional_blocked_times (bloqueios pontuais)
  ├── clients                 (clientes do negócio)
  ├── appointments            (agendamentos)
  └── financial_entries       (lançamentos financeiros)

users (auth.users)
  └── user_roles              (user ↔ tenant ↔ role)
        └── professional_permissions  (permissões granulares do adm_basico)
```

## Regras de RLS por tipo de usuário

| Tabela | público | cliente | adm_basico | adm_geral | master_admin |
|---|---|---|---|---|---|
| tenants | leitura (ativo) | — | leitura | leitura + update | tudo |
| services | leitura (ativo) | — | leitura | tudo | tudo |
| professionals | leitura (ativo) | — | leitura | tudo | tudo |
| appointments | — | próprios | próprios* | tudo | tudo |
| clients | — | próprio | com permissão | tudo | tudo |
| financial_entries | — | — | com permissão | tudo | tudo |

\* adm_basico vê próprios ou todos dependendo da permissão `can_view_all_schedules`
