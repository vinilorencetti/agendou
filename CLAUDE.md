# Agendou — Documento de Contexto do Projeto

> Este arquivo é a memória permanente do projeto para o Claude Code.
> Consulte-o no início de cada sessão de desenvolvimento.

---

## O que é o Agendou

SaaS de agendamento e gestão para pequenos negócios brasileiros.
O produto resolve três problemas centrais: agendamento de serviços, controle financeiro e gestão de equipe — tudo em um único sistema.

Conceito de marca: **"O funcionário da sua empresa."** O Agendou é o parceiro operacional do dono de negócio — prático, funcional, sempre disponível, sem enrolação.

**Ponto de entrada:** barbearias.
**Expansão futura:** clínicas de estética, petshops, cabeleireiros e outros nichos de serviço.

---

## Stack Tecnológico

| Camada | Tecnologia |
|---|---|
| Frontend + API | Next.js 14 (App Router) |
| Banco de dados | Supabase (PostgreSQL) |
| Autenticação | Supabase Auth |
| Storage (logos, imagens) | Supabase Storage |
| Deploy | Vercel |
| ORM | Prisma (ou Supabase client direto) |

---

## Arquitetura Multi-Tenant

Cada negócio cadastrado é um **tenant** com dados isolados.
O isolamento é feito por **schema separado no PostgreSQL** (schema-per-tenant) combinado com **Row Level Security (RLS)** do Supabase.

### Estrutura de URLs

```
agendou.com.br                          → Landing page / cadastro
agendou.com.br/[slug]                   → Área pública do negócio (cliente final)
agendou.com.br/admin/[slug]             → Painel do negócio (AdmGeral + AdmBásico)
master-admin.agendou.com.br             → Painel master (equipe Agendou)
```

O `[slug]` é gerado automaticamente no cadastro com base no nome do negócio.
Exemplo: Barbearia do João → `agendou.com.br/barbearia-do-joao`

---

## Tipos de Usuário

### 1. master_admin
Equipe interna do Agendou. Acessa `master-admin.agendou.com.br`.

Visualiza:
- Todos os tenants ativos
- Faturamento total e por tenant
- Contas a receber / contas a pagar
- Consumo de banco de dados
- Alertas de capacidade

### 2. adm_geral
O empresário — a pessoa que contratou o Agendou.

Acessa: `agendou.com.br/admin/[slug]`

Pode:
- Configurar o negócio (nome, logo, tema, serviços, horários)
- Ver financeiro completo
- Criar e gerenciar contas de adm_basico
- Definir permissões de cada adm_basico
- Ver relatórios completos
- Gerenciar agenda geral

### 3. adm_basico
Funcionário do negócio (ex: barbeiro, atendente).

Acessa: `agendou.com.br/admin/[slug]`

Permissões configuradas pelo adm_geral. Pode incluir:
- Ver e gerenciar própria agenda
- Ver agenda geral (opcional)
- Acessar módulo financeiro (opcional)
- Ver relatórios (opcional)

### 4. cliente
Cliente final do negócio.

Acessa: `agendou.com.br/[slug]`

Pode:
- Criar conta / fazer login
- Ver serviços disponíveis e preços
- Ver horários disponíveis por profissional
- Fazer agendamento
- Ver histórico de agendamentos
- Cancelar agendamento (dentro da política do negócio)

---

## Módulos do Sistema

### Módulo Core (todos os nichos)

**Agendamento**
- Cadastro de serviços (nome, descrição, duração, preço)
- Cadastro de profissionais e seus horários de trabalho
- Calendário de disponibilidade em tempo real
- Agendamento pelo cliente final
- Confirmação, cancelamento e reagendamento
- Notificações (e-mail / WhatsApp futuro)

**Gestão de Clientes**
- Cadastro automático no primeiro agendamento
- Histórico de visitas e serviços
- Dados de contato

**Financeiro**
- Lançamentos de receita por agendamento
- Contas a pagar manuais
- Fluxo de caixa
- Relatório de faturamento por período
- Comissão por profissional (% configurável)

**Configurações do Negócio**
- Nome, logo, descrição
- Tema visual (cores, background)
- Horário de funcionamento
- Política de cancelamento
- Slug / URL do negócio

**Usuários e Permissões**
- RBAC (Role-Based Access Control)
- adm_geral configura permissões do adm_basico por módulo

### Módulos por Nicho (futuros)

**Barbearia**
- Fila de espera (walk-in)
- Foto do resultado (before/after)
- Preferências do cliente (corte favorito, observações)

**Clínica de Estética**
- Ficha de anamnese
- Fotos antes/depois
- Contraindicações e alergias

**Petshop**
- Ficha do pet (raça, idade, peso, vacinas)
- Histórico de banho e tosa
- Observações veterinárias

---

## Personalização por Tenant

Cada negócio pode personalizar:
- Logo (upload de imagem)
- Cor primária e cor de fundo
- Tema pré-definido (seleção de templates)
- Tema completamente personalizado (custo adicional)

As configurações visuais são armazenadas por tenant e aplicadas dinamicamente no frontend.

---

## Modelo de Negócio

- Cobrança mensal fixa por plano
- Cobrança adicional por usuário (adm_basico extra)
- Personalização de tema completa: custo adicional único
- Planos a definir (Starter / Pro / Business)

---

## Banco de Dados — Tabelas Principais

```
tenants               → negócios cadastrados
users                 → todos os usuários do sistema
user_roles            → relação usuário + tenant + role
services              → serviços oferecidos por tenant
professionals         → profissionais por tenant
schedules             → horários de trabalho por profissional
appointments          → agendamentos
clients               → clientes por tenant
financial_entries     → lançamentos financeiros
tenant_settings       → configurações visuais e operacionais por tenant
```

---

## Concorrentes Diretos

| Marca | Observação |
|---|---|
| Booksy | Forte em barbearias, experiência de UX |
| Trinks | Popular no Brasil, interface simples |
| Bless | Focado em beleza e estética |

**Diferencial do Agendou:** sistema completo (agenda + financeiro + equipe) com personalização visual e multi-nicho, com precificação acessível para o mercado brasileiro.

---

## Convenções de Desenvolvimento

- Idioma do código: inglês (variáveis, funções, comentários)
- Idioma da interface: português brasileiro
- Estilo de commits: Conventional Commits (`feat:`, `fix:`, `chore:`)
- Autenticação: sempre via Supabase Auth, nunca implementar auth própria
- RLS obrigatório em todas as tabelas com dados de tenant
- Nunca expor tenant_id em URLs públicas — usar sempre o slug

---

## Prioridade de Desenvolvimento

1. Setup do projeto Next.js + Supabase
2. Modelagem completa do banco de dados + RLS
3. Sistema de autenticação e roles
4. Cadastro de tenant (onboarding do adm_geral)
5. Módulo de agendamento (core do produto)
6. Painel do adm_geral
7. Área pública do cliente final
8. Módulo financeiro
9. Painel master_admin
10. Personalização visual por tenant

---

## Informações do Projeto

- **Produto:** Agendou
- **Domínio:** agendou.com.br
- **Handle:** @agendou
- **Desenvolvedor:** Euforia Design
- **Início:** Maio 2026
- **Relatório de naming:** https://www.notion.so/358198ac7aa781a4b36bcfec63232197
