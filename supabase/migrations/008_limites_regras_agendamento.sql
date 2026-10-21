-- =============================================================================
-- 008 · Limites das regras do agendamento online
--
-- A Marlene passa a editar essas regras no painel (tela Horários). Os limites
-- combinados valem também aqui no banco, e não só na tela:
--   * antecedência mínima: de 0 a 48 horas (0 a 2880 minutos), que já era o limite;
--   * agenda aberta: de 7 a 90 dias (antes era de 1 a 365).
-- Pode rodar mais de uma vez.
-- =============================================================================

alter table public.perfil
  drop constraint if exists perfil_dias_maximos_agendamento_check;

alter table public.perfil
  add constraint perfil_dias_maximos_agendamento_check
  check (dias_maximos_agendamento between 7 and 90);

comment on column public.perfil.dias_maximos_agendamento is
  'Até quantos dias à frente a cliente pode agendar pelo site (7 a 90).';
comment on column public.perfil.antecedencia_minima_minutos is
  'Antecedência mínima para agendar pelo site, em minutos (0 a 2880 = 48h).';
