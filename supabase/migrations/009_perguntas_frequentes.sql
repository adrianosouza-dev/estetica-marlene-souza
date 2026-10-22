-- =============================================================================
-- 009 · Perguntas frequentes no banco e aviso de cancelamento
--
-- O FAQ sai do código (src/config/faq.js) e passa a ser editado pela Marlene
-- no painel. O perfil ganha o aviso de cancelamento mostrado na confirmação do
-- agendamento (vazio = o aviso não aparece).
-- Pode rodar mais de uma vez.
-- =============================================================================

create table if not exists public.perguntas_frequentes (
  id        uuid primary key default gen_random_uuid(),
  pergunta  text not null check (char_length(btrim(pergunta)) between 3 and 200),
  resposta  text not null check (char_length(btrim(resposta)) between 1 and 1500),
  ordem     integer not null default 0,
  ativa     boolean not null default true,
  criado_em timestamptz not null default now()
);

create index if not exists perguntas_frequentes_ordem_idx on public.perguntas_frequentes (ordem);

alter table public.perguntas_frequentes enable row level security;

-- Camada extra, como nas outras tabelas: o visitante nunca altera nem apaga
revoke update, delete, truncate on public.perguntas_frequentes from anon;

drop policy if exists "perguntas: público vê as ativas" on public.perguntas_frequentes;
create policy "perguntas: público vê as ativas"
  on public.perguntas_frequentes for select
  to anon, authenticated
  using (ativa or public.eh_profissional());

drop policy if exists "perguntas: profissional cadastra" on public.perguntas_frequentes;
create policy "perguntas: profissional cadastra"
  on public.perguntas_frequentes for insert
  to authenticated
  with check (public.eh_profissional());

drop policy if exists "perguntas: profissional edita" on public.perguntas_frequentes;
create policy "perguntas: profissional edita"
  on public.perguntas_frequentes for update
  to authenticated
  using (public.eh_profissional())
  with check (public.eh_profissional());

drop policy if exists "perguntas: profissional remove" on public.perguntas_frequentes;
create policy "perguntas: profissional remove"
  on public.perguntas_frequentes for delete
  to authenticated
  using (public.eh_profissional());


-- Aviso de cancelamento (mostrado na tela "Horário reservado!") ---------------
alter table public.perfil
  add column if not exists aviso_cancelamento text check (char_length(aviso_cancelamento) <= 300);

comment on column public.perfil.aviso_cancelamento is
  'Aviso mostrado na confirmação do agendamento (ex.: taxa de cancelamento). Vazio = não aparece.';
