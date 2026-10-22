-- =============================================================================
-- 010 · Modo demonstração
--
-- No projeto de DEMONSTRAÇÃO (portfólio), qualquer visitante entra no painel
-- com o usuário de demonstração, que é "a profissional" daquele projeto.
-- Com perfil.demonstracao = true, o banco impede o que não tem volta ou expõe
-- algo indevido:
--   * enviar, trocar ou apagar arquivos no Storage (inclusive a foto da Marlene);
--   * cadastrar ou apagar fotos da galeria, ou trocar o endereço de uma foto
--     (legenda e ordem continuam editáveis);
--   * trocar a foto do perfil.
-- Em QUALQUER projeto, as colunas "demonstracao" e "profissional_id" do perfil
-- só mudam pelo SQL Editor: ninguém se desliga do perfil nem desliga o modo
-- demonstração pelo site.
--
-- No projeto REAL, rode esta migration também, mas deixe demonstracao = false
-- (o padrão): nada muda para a Marlene.
-- Pode rodar mais de uma vez.
-- =============================================================================

alter table public.perfil
  add column if not exists demonstracao boolean not null default false;

comment on column public.perfil.demonstracao is
  'true só no projeto de demonstração do portfólio. Muda apenas pelo SQL Editor.';


-- Está no modo demonstração? ---------------------------------------------------
create or replace function public.eh_demonstracao()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce((select demonstracao from public.perfil where id = 1), false);
$$;


-- Chamada pelo site (anon ou usuário logado)? O SQL Editor roda como postgres.
create or replace function public.chamada_pelo_site()
returns boolean
language sql
stable
set search_path = ''
as $$
  select current_user in ('anon', 'authenticated');
$$;


-- Perfil: colunas protegidas ---------------------------------------------------
create or replace function public.proteger_perfil()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if public.chamada_pelo_site() then
    if new.demonstracao is distinct from old.demonstracao
       or new.profissional_id is distinct from old.profissional_id then
      raise exception 'Esta configuração só pode ser mudada pelo administrador do sistema.';
    end if;

    if public.eh_demonstracao()
       and (new.foto_url is distinct from old.foto_url
            or new.foto_caminho_storage is distinct from old.foto_caminho_storage) then
      raise exception 'Na demonstração, a foto do perfil não pode ser trocada.';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists perfil_proteger on public.perfil;
create trigger perfil_proteger
  before update on public.perfil
  for each row execute function public.proteger_perfil();


-- Fotos da galeria: na demonstração, só legenda e ordem mudam -------------------
create or replace function public.proteger_fotos_demonstracao()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if public.chamada_pelo_site() and public.eh_demonstracao() then
    if tg_op = 'INSERT' then
      raise exception 'Na demonstração, não é possível enviar fotos.';
    elsif tg_op = 'DELETE' then
      raise exception 'Na demonstração, as fotos da galeria não podem ser removidas.';
    elsif new.url is distinct from old.url
          or new.caminho_storage is distinct from old.caminho_storage then
      raise exception 'Na demonstração, as fotos da galeria não podem ser trocadas.';
    end if;
  end if;
  return case when tg_op = 'DELETE' then old else new end;
end;
$$;

drop trigger if exists fotos_proteger_demonstracao on public.fotos;
create trigger fotos_proteger_demonstracao
  before insert or update or delete on public.fotos
  for each row execute function public.proteger_fotos_demonstracao();


-- Storage: na demonstração, ninguém envia, troca ou apaga arquivos ---------------
-- (Mesmas políticas da migration 004, com "e não é demonstração".)
drop policy if exists "galeria: profissional envia" on storage.objects;
create policy "galeria: profissional envia"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'galeria' and public.eh_profissional() and not public.eh_demonstracao());

drop policy if exists "galeria: profissional substitui" on storage.objects;
create policy "galeria: profissional substitui"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'galeria' and public.eh_profissional() and not public.eh_demonstracao())
  with check (bucket_id = 'galeria' and public.eh_profissional() and not public.eh_demonstracao());

drop policy if exists "galeria: profissional apaga" on storage.objects;
create policy "galeria: profissional apaga"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'galeria' and public.eh_profissional() and not public.eh_demonstracao());
