-- =============================================================================
-- 003 · Segurança (Row Level Security)
--
-- Quem é quem:
--   anon          visitante do site (a chave pública do Supabase)
--   authenticated qualquer usuário logado
--   profissional  o usuário logado cujo id está em perfil.profissional_id
--                 (função public.eh_profissional())
--
-- Duas camadas de proteção para o painel:
--   1. O cadastro público fica desativado no Supabase (veja supabase/README.md);
--   2. Mesmo que alguém consiga uma conta, só a profissional edita os dados.
-- =============================================================================

alter table public.servicos               enable row level security;
alter table public.horarios_funcionamento enable row level security;
alter table public.bloqueios              enable row level security;
alter table public.agendamentos           enable row level security;
alter table public.fotos                  enable row level security;
alter table public.avaliacoes             enable row level security;
alter table public.perfil                 enable row level security;


-- Camada extra: o visitante nunca altera nem apaga nada, e nunca lê agendamentos.
-- (Mesmo que uma política seja criada por engano no futuro.)
revoke update, delete, truncate on all tables in schema public from anon;
revoke select on public.agendamentos from anon;


-- Serviços -------------------------------------------------------------------
create policy "servicos: público vê os ativos"
  on public.servicos for select
  to anon, authenticated
  using (ativo or public.eh_profissional());

create policy "servicos: profissional cadastra"
  on public.servicos for insert
  to authenticated
  with check (public.eh_profissional());

create policy "servicos: profissional edita"
  on public.servicos for update
  to authenticated
  using (public.eh_profissional())
  with check (public.eh_profissional());

create policy "servicos: profissional remove"
  on public.servicos for delete
  to authenticated
  using (public.eh_profissional());


-- Horários de funcionamento ------------------------------------------------------
create policy "horarios: leitura pública"
  on public.horarios_funcionamento for select
  to anon, authenticated
  using (true);

create policy "horarios: profissional cadastra"
  on public.horarios_funcionamento for insert
  to authenticated
  with check (public.eh_profissional());

create policy "horarios: profissional edita"
  on public.horarios_funcionamento for update
  to authenticated
  using (public.eh_profissional())
  with check (public.eh_profissional());

create policy "horarios: profissional remove"
  on public.horarios_funcionamento for delete
  to authenticated
  using (public.eh_profissional());


-- Bloqueios --------------------------------------------------------------------
create policy "bloqueios: leitura pública"
  on public.bloqueios for select
  to anon, authenticated
  using (true);

create policy "bloqueios: profissional cadastra"
  on public.bloqueios for insert
  to authenticated
  with check (public.eh_profissional());

create policy "bloqueios: profissional edita"
  on public.bloqueios for update
  to authenticated
  using (public.eh_profissional())
  with check (public.eh_profissional());

create policy "bloqueios: profissional remove"
  on public.bloqueios for delete
  to authenticated
  using (public.eh_profissional());


-- Agendamentos -------------------------------------------------------------------
-- O público só cria. Para saber os horários livres, usa a função
-- public.horarios_ocupados(dia), que não expõe nome nem telefone.
-- As regras de horário são conferidas pelo gatilho agendamentos_preparar.
create policy "agendamentos: público cria pendente"
  on public.agendamentos for insert
  to anon, authenticated
  with check (status = 'pendente' or public.eh_profissional());

create policy "agendamentos: profissional lê"
  on public.agendamentos for select
  to authenticated
  using (public.eh_profissional());

create policy "agendamentos: profissional edita"
  on public.agendamentos for update
  to authenticated
  using (public.eh_profissional())
  with check (public.eh_profissional());

create policy "agendamentos: profissional remove"
  on public.agendamentos for delete
  to authenticated
  using (public.eh_profissional());


-- Fotos ------------------------------------------------------------------------
create policy "fotos: leitura pública"
  on public.fotos for select
  to anon, authenticated
  using (true);

create policy "fotos: profissional cadastra"
  on public.fotos for insert
  to authenticated
  with check (public.eh_profissional());

create policy "fotos: profissional edita"
  on public.fotos for update
  to authenticated
  using (public.eh_profissional())
  with check (public.eh_profissional());

create policy "fotos: profissional remove"
  on public.fotos for delete
  to authenticated
  using (public.eh_profissional());


-- Avaliações -------------------------------------------------------------------
create policy "avaliacoes: público vê as aprovadas"
  on public.avaliacoes for select
  to anon, authenticated
  using (status = 'aprovada' or public.eh_profissional());

-- Toda avaliação nova chega como pendente; só a profissional aprova
create policy "avaliacoes: público envia pendente"
  on public.avaliacoes for insert
  to anon, authenticated
  with check (status = 'pendente');

create policy "avaliacoes: profissional aprova"
  on public.avaliacoes for update
  to authenticated
  using (public.eh_profissional())
  with check (public.eh_profissional());

create policy "avaliacoes: profissional remove"
  on public.avaliacoes for delete
  to authenticated
  using (public.eh_profissional());


-- Perfil -------------------------------------------------------------------------
-- Uma linha só, criada em 005_dados_iniciais.sql: não há política de insert/delete.
create policy "perfil: leitura pública"
  on public.perfil for select
  to anon, authenticated
  using (true);

create policy "perfil: profissional edita"
  on public.perfil for update
  to authenticated
  using (public.eh_profissional())
  with check (public.eh_profissional());
