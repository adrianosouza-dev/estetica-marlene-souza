-- =============================================================================
-- 011 · TikTok, Facebook e certificados
--
-- 1. O perfil ganha TikTok e Facebook (só o usuário, como o Instagram).
-- 2. Tabela "certificados": cursos da Marlene, mostrados na página Sobre.
--    A imagem é opcional e fica no bucket "galeria", na pasta certificados/.
--
-- Rode nos DOIS projetos (real e demonstração) ANTES de publicar o código novo:
-- o site novo lê estas colunas e esta tabela. O site antigo continua
-- funcionando com ela, porque esta migration só acrescenta coisas.
-- Pode rodar mais de uma vez.
-- =============================================================================


-- 1. TikTok e Facebook ---------------------------------------------------------
alter table public.perfil
  add column if not exists tiktok text
    check (tiktok ~ '^[A-Za-z0-9_.]{2,24}$'),
  add column if not exists facebook text
    check (facebook ~ '^([A-Za-z0-9.]{3,50}|profile\.php\?id=[0-9]{5,20})$');

comment on column public.perfil.tiktok is 'Só o usuário, sem @ (ex.: marlenesouza). Vazio = o ícone não aparece.';
comment on column public.perfil.facebook is 'Só o usuário (ex.: marlenesouza) ou profile.php?id=123. Vazio = o ícone não aparece.';


-- 2. Certificados ---------------------------------------------------------------
create table if not exists public.certificados (
  id              uuid primary key default gen_random_uuid(),
  titulo          text not null check (char_length(btrim(titulo)) between 3 and 150),
  instituicao     text not null check (char_length(btrim(instituicao)) between 2 and 150),
  ano             smallint check (ano between 1950 and 2100),  -- opcional; o limite do ano atual fica no gatilho abaixo
  imagem_url      text check (char_length(imagem_url) <= 500),
  -- Só arquivos da pasta certificados/: um certificado nunca aponta para a foto da Marlene
  caminho_storage text check (caminho_storage like 'certificados/%' and char_length(caminho_storage) <= 300),
  ordem           integer not null default 0,
  criado_em       timestamptz not null default now(),

  constraint certificado_imagem_completa
    check ((imagem_url is null) = (caminho_storage is null))
);

create index if not exists certificados_ordem_idx on public.certificados (ordem);

alter table public.certificados enable row level security;

-- Camada extra, como nas outras tabelas: o visitante nunca altera nem apaga
revoke update, delete, truncate on public.certificados from anon;

drop policy if exists "certificados: leitura pública" on public.certificados;
create policy "certificados: leitura pública"
  on public.certificados for select
  to anon, authenticated
  using (true);

drop policy if exists "certificados: profissional cadastra" on public.certificados;
create policy "certificados: profissional cadastra"
  on public.certificados for insert
  to authenticated
  with check (public.eh_profissional());

drop policy if exists "certificados: profissional edita" on public.certificados;
create policy "certificados: profissional edita"
  on public.certificados for update
  to authenticated
  using (public.eh_profissional())
  with check (public.eh_profissional());

drop policy if exists "certificados: profissional remove" on public.certificados;
create policy "certificados: profissional remove"
  on public.certificados for delete
  to authenticated
  using (public.eh_profissional());


-- Regras que o CHECK não consegue fazer -----------------------------------------
--   * o ano não pode ser depois do ano atual (o CHECK não pode depender da data);
--   * no modo demonstração (migration 010), o site não cadastra, troca nem apaga
--     certificado COM imagem: os visitantes do portfólio não enviam arquivos.
create or replace function public.proteger_certificado()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if tg_op <> 'DELETE'
     and new.ano is not null
     and new.ano > extract(year from public.agora_local()) then
    raise exception 'O ano do certificado não pode ser depois deste ano.';
  end if;

  if public.chamada_pelo_site() and public.eh_demonstracao() then
    if tg_op = 'INSERT' and new.caminho_storage is not null then
      raise exception 'Na demonstração, não é possível enviar imagens de certificados.';
    elsif tg_op = 'UPDATE' and new.caminho_storage is distinct from old.caminho_storage then
      raise exception 'Na demonstração, não é possível enviar imagens de certificados.';
    elsif tg_op = 'DELETE' and old.caminho_storage is not null then
      raise exception 'Na demonstração, certificados com imagem não podem ser removidos.';
    end if;
  end if;

  return case when tg_op = 'DELETE' then old else new end;
end;
$$;

drop trigger if exists certificados_proteger on public.certificados;
create trigger certificados_proteger
  before insert or update or delete on public.certificados
  for each row execute function public.proteger_certificado();
