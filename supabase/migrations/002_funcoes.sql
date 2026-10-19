-- =============================================================================
-- 002 · Funções e gatilhos
-- =============================================================================


-- Data e hora atuais em Maués --------------------------------------------------
-- O servidor do Supabase roda em UTC. Sem isso, às 21h de Maués o banco já
-- acharia que é o dia seguinte.
create or replace function public.agora_local()
returns timestamp
language sql
stable
set search_path = ''
as $$
  select (now() at time zone 'America/Manaus')::timestamp;
$$;


-- O usuário logado é a profissional? -------------------------------------------
-- Usada nas regras de segurança (RLS). Compara o usuário da sessão com o
-- perfil.profissional_id. É "security definer" para conseguir ler o perfil
-- independentemente das regras da própria tabela.
create or replace function public.eh_profissional()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.perfil
    where profissional_id is not null
      and profissional_id = auth.uid()
  );
$$;


-- Horários ocupados de um dia (para o público) ---------------------------------
-- O público não pode ler a tabela de agendamentos, porque ela tem nome e
-- telefone das clientes. Esta função roda com permissão do dono do banco
-- (security definer) e devolve SÓ início e fim, nada mais.
create or replace function public.horarios_ocupados(dia date)
returns table (inicio timestamp, fim timestamp)
language sql
stable
security definer
set search_path = ''
as $$
  select a.inicio, a.fim
  from public.agendamentos a
  where a.status <> 'cancelado'
    and tsrange(a.inicio, a.fim, '[)') && tsrange(dia::timestamp, (dia + 1)::timestamp, '[)')
  order by a.inicio;
$$;

revoke execute on function public.horarios_ocupados(date) from public;
grant execute on function public.horarios_ocupados(date) to anon, authenticated;


-- Preparação e validação de cada agendamento -----------------------------------
-- Roda antes de gravar. A chave pública do Supabase permite chamar a API sem
-- passar pelo site, então o banco não confia no que chega:
--   * o fim é sempre calculado aqui, pela duração do serviço;
--   * agendamentos do público entram sempre como "pendente";
--   * o horário precisa respeitar expediente, almoço, bloqueios e antecedência.
-- A profissional (e o SQL Editor) podem encaixar horários fora dessas regras.
-- As mensagens de erro são mostradas para a cliente, por isso o tom amigável.
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

create trigger agendamentos_preparar
  before insert or update on public.agendamentos
  for each row execute function public.preparar_agendamento();


-- Atualiza perfil.atualizado_em a cada edição ------------------------------------
create or replace function public.marcar_atualizacao()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.atualizado_em := now();
  return new;
end;
$$;

create trigger perfil_marcar_atualizacao
  before update on public.perfil
  for each row execute function public.marcar_atualizacao();
