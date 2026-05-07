-- =============================================================================
-- AGENDOU — Migration 006: intervalo (almoço/pausa) no horário do profissional
-- =============================================================================

alter table professional_schedules
  add column if not exists break_start_time time default null,
  add column if not exists break_end_time   time default null;

-- Garante que, se um dos campos for preenchido, o outro também deve ser
alter table professional_schedules
  add constraint valid_break_times check (
    (break_start_time is null and break_end_time is null) or
    (break_start_time is not null and break_end_time is not null and break_start_time < break_end_time)
  );
