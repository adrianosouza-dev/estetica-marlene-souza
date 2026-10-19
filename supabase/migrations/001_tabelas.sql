-- =============================================================================
-- 001 · Tabelas
-- Rode os arquivos desta pasta em ordem, no SQL Editor do Supabase.
--
-- Sobre datas e horas:
--   Os horários de atendimento são gravados no horário local de Maués
--   (America/Manaus, UTC-4) usando "timestamp" sem fuso. Assim "8h" no banco é
--   8h na agenda da Marlene, e a trava contra horários encavalados usa tsrange,
--   que trabalha com esse tipo. Colunas de registro (criado_em) usam timestamptz.
-- =============================================================================


-- Serviços oferecidos --------------------------------------------------------
create table public.servicos (
  id              uuid primary key default gen_random_uuid(),
  nome            text not null check (char_length(nome) between 2 and 80),
  descricao       text check (char_length(descricao) <= 500),
  -- Tempo reservado na agenda: sempre o MÁXIMO que o serviço pode levar
  duracao_minutos integer not null check (duracao_minutos between 15 and 480),
  -- 0 significa "Consultar" no site
  preco           numeric(10, 2) not null default 0 check (preco >= 0),
  ativo           boolean not null default true,
  ordem           integer not null default 0,
  criado_em       timestamptz not null default now()
);

comment on column public.servicos.duracao_minutos is 'Tempo máximo do serviço; é o que fica reservado na agenda.';
comment on column public.servicos.preco is 'Zero aparece como "Consultar" no site.';


-- Horário de funcionamento: uma linha por dia da semana ----------------------
-- dia_semana segue o padrão do Postgres: 0 = domingo, 1 = segunda ... 6 = sábado
create table public.horarios_funcionamento (
  dia_semana    smallint primary key check (dia_semana between 0 and 6),
  aberto        boolean not null default false,
  abre          time,
  fecha         time,
  almoco_inicio time,
  almoco_fim    time,

  constraint horario_completo_quando_aberto
    check (not aberto or (abre is not null and fecha is not null and abre < fecha)),
  constraint almoco_com_inicio_e_fim
    check ((almoco_inicio is null) = (almoco_fim is null)),
  constraint almoco_dentro_do_expediente
    check (
      almoco_inicio is null
      or (
        almoco_inicio < almoco_fim
        and (not aberto or (almoco_inicio >= abre and almoco_fim <= fecha))
      )
    )
);


-- Bloqueios na agenda: folgas, feriados, compromissos -------------------------
-- Dia inteiro = das 00:00 de um dia até as 00:00 do dia seguinte.
create table public.bloqueios (
  id        uuid primary key default gen_random_uuid(),
  inicio    timestamp not null,
  fim       timestamp not null,
  motivo    text check (char_length(motivo) <= 120),  -- aparece para o público
  criado_em timestamptz not null default now(),

  constraint bloqueio_fim_depois_do_inicio check (inicio < fim)
);

create index bloqueios_periodo_idx on public.bloqueios (inicio, fim);


-- Agendamentos ----------------------------------------------------------------
create table public.agendamentos (
  id               uuid primary key default gen_random_uuid(),
  servico_id       uuid not null references public.servicos (id) on delete restrict,
  cliente_nome     text not null check (char_length(btrim(cliente_nome)) between 2 and 80),
  -- Só números: DDD + número, com ou sem o 55 na frente
  cliente_whatsapp text not null check (cliente_whatsapp ~ '^[0-9]{10,13}$'),
  inicio           timestamp not null,
  -- Calculado pelo banco a partir da duração do serviço (veja 002_funcoes.sql)
  fim              timestamp not null,
  status           text not null default 'pendente'
                   check (status in ('pendente', 'confirmado', 'concluido', 'cancelado')),
  observacao       text check (char_length(observacao) <= 300),
  criado_em        timestamptz not null default now(),

  constraint agendamento_fim_depois_do_inicio check (inicio < fim),

  -- A trava principal: dois agendamentos não cancelados não podem se sobrepor.
  -- '[)' quer dizer que o fim não conta: um termina às 10h e outro começa às 10h, ok.
  -- Se alguém tentar, o Postgres devolve o erro 23P01 (exclusion_violation).
  constraint agendamento_sem_conflito
    exclude using gist (tsrange(inicio, fim, '[)') with &&)
    where (status <> 'cancelado')
);

create index agendamentos_inicio_idx on public.agendamentos (inicio);
create index agendamentos_servico_idx on public.agendamentos (servico_id);


-- Fotos da galeria ------------------------------------------------------------
create table public.fotos (
  id              uuid primary key default gen_random_uuid(),
  url             text not null,
  -- Caminho do arquivo no bucket "galeria"; usado para apagar o arquivo junto
  caminho_storage text,
  legenda         text check (char_length(legenda) <= 150),
  ordem           integer not null default 0,
  criado_em       timestamptz not null default now()
);


-- Avaliações das clientes -----------------------------------------------------
create table public.avaliacoes (
  id         uuid primary key default gen_random_uuid(),
  nome       text not null check (char_length(btrim(nome)) between 2 and 60),
  nota       smallint not null check (nota between 1 and 5),
  comentario text check (char_length(comentario) <= 600),
  status     text not null default 'pendente' check (status in ('pendente', 'aprovada')),
  criado_em  timestamptz not null default now()
);

create index avaliacoes_status_idx on public.avaliacoes (status, criado_em desc);


-- Perfil: dados editáveis do negócio (tabela de uma linha só) -----------------
create table public.perfil (
  id                          smallint primary key default 1 check (id = 1),
  -- Usuário do Supabase Auth que é a profissional; só ele edita o sistema
  profissional_id             uuid references auth.users (id) on delete set null,
  sobre                       text check (char_length(sobre) <= 3000),
  whatsapp                    text check (whatsapp ~ '^[0-9]{12,13}$'),
  instagram                   text check (char_length(instagram) <= 60),
  endereco                    text check (char_length(endereco) <= 200),
  link_mapa                   text check (char_length(link_mapa) <= 500),
  -- Regras do agendamento online
  dias_maximos_agendamento    integer not null default 30 check (dias_maximos_agendamento between 1 and 365),
  antecedencia_minima_minutos integer not null default 60 check (antecedencia_minima_minutos between 0 and 2880),
  atualizado_em               timestamptz not null default now()
);

comment on table public.perfil is 'Sempre uma única linha (id = 1).';
