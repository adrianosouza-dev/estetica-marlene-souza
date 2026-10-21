-- =============================================================================
-- 007 · WhatsApp opcional nos agendamentos feitos pela profissional
--
-- A Marlene cadastra pelo painel clientes que marcaram por WhatsApp ou
-- pessoalmente; nem sempre ela tem (ou precisa anotar) o número.
--   * Pelo painel (profissional): WhatsApp pode ficar vazio.
--   * Pelo site (público): continua obrigatório, agora conferido no gatilho.
-- O formato (só números, 10 a 13 dígitos) continua valendo quando preenchido.
-- =============================================================================

alter table public.agendamentos
  alter column cliente_whatsapp drop not null;

comment on column public.agendamentos.cliente_whatsapp is
  'Só números (DDD + número, com ou sem 55). Obrigatório no site; opcional no painel.';


-- Mesma função da migration 002, com uma regra a mais para o público:
-- o WhatsApp é obrigatório.
create or replace function public.preparar_agendamento()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  v_duracao     integer;
  v_ativo       boolean;
  v_horario     public.horarios_funcionamento%rowtype;
  v_perfil      public.perfil%rowtype;
  v_agora       timestamp := public.agora_local();
  v_eh_publico  boolean := current_user in ('anon', 'authenticated') and not public.eh_profissional();
begin
  -- Recalcula o fim no cadastro ou quando mudam o serviço ou o horário
  if tg_op = 'INSERT'
     or new.inicio is distinct from old.inicio
     or new.servico_id is distinct from old.servico_id then

    select s.duracao_minutos, s.ativo
      into v_duracao, v_ativo
      from public.servicos s
     where s.id = new.servico_id;

    if v_duracao is null then
      raise exception 'Este serviço não está disponível para agendamento.';
    end if;

    new.fim := new.inicio + make_interval(mins => v_duracao);
  end if;

  if tg_op <> 'INSERT' or not v_eh_publico then
    return new;
  end if;

  -- Daqui para baixo: só agendamentos feitos pelo público -----------------------
  new.status := 'pendente';
  new.cliente_nome := btrim(new.cliente_nome);

  if new.cliente_whatsapp is null then
    raise exception 'Informe seu WhatsApp para a Marlene confirmar o horário.';
  end if;

  if not v_ativo then
    raise exception 'Este serviço não está disponível para agendamento.';
  end if;

  select * into v_perfil from public.perfil where id = 1;

  if new.inicio < v_agora + make_interval(mins => coalesce(v_perfil.antecedencia_minima_minutos, 60)) then
    raise exception 'Este horário já passou ou está muito em cima da hora. Escolha outro, por favor.';
  end if;

  if new.inicio::date > v_agora::date + coalesce(v_perfil.dias_maximos_agendamento, 30) then
    raise exception 'Ainda não é possível agendar para essa data. Escolha um dia mais próximo.';
  end if;

  select * into v_horario
    from public.horarios_funcionamento
   where dia_semana = extract(dow from new.inicio)::smallint;

  if not coalesce(v_horario.aberto, false) then
    raise exception 'Não há atendimento neste dia da semana.';
  end if;

  if new.fim::date <> new.inicio::date
     or new.inicio::time < v_horario.abre
     or new.fim::time > v_horario.fecha then
    raise exception 'Este horário fica fora do expediente.';
  end if;

  if v_horario.almoco_inicio is not null
     and new.inicio::time < v_horario.almoco_fim
     and new.fim::time > v_horario.almoco_inicio then
    raise exception 'Este horário bate com o intervalo de almoço.';
  end if;

  if exists (
    select 1
      from public.bloqueios b
     where tsrange(b.inicio, b.fim, '[)') && tsrange(new.inicio, new.fim, '[)')
  ) then
    raise exception 'Não há atendimento neste horário. Escolha outro, por favor.';
  end if;

  -- O conflito com outro agendamento é barrado pela constraint
  -- agendamento_sem_conflito (erro 23P01), que vale até para corridas
  -- entre duas clientes clicando ao mesmo tempo.
  return new;
end;
$$;
