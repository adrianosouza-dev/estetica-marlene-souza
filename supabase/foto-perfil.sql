-- =============================================================================
-- FOTO DA MARLENE NO PERFIL (página Sobre)
-- Liga ao perfil a foto já enviada ao bucket "galeria", em perfil/marlene-souza.webp.
-- Serve para os DOIS projetos (real e demonstração). Rode depois da migration 006.
--
-- Antes de rodar:
--   1. Envie fotos-otimizadas/sobre/marlene-souza.webp para o bucket "galeria",
--      dentro da pasta "perfil". Passo a passo em supabase/README.md.
--   2. Troque a URL abaixo pela Project URL do projeto em que você vai rodar
--      (Project Settings > API > Project URL).
--
-- O script para com erro se a URL não foi trocada ou se o arquivo não está no
-- Storage. Pode rodar mais de uma vez.
-- =============================================================================

do $foto$
declare
  -- ▼▼▼ TROQUE AQUI pela Project URL deste projeto ▼▼▼
  v_url_projeto text := 'https://COLE-AQUI-O-ID-DO-PROJETO.supabase.co';
  -- ▲▲▲

  v_caminho constant text := 'perfil/marlene-souza.webp';
begin
  v_url_projeto := rtrim(btrim(v_url_projeto), '/');

  if v_url_projeto !~ '^https://[a-z0-9]+\.supabase\.co$' or v_url_projeto like '%COLE-AQUI%' then
    raise exception 'Troque v_url_projeto pela Project URL deste projeto (ex.: https://abcdefghijklmnopqrst.supabase.co). Valor atual: %', v_url_projeto;
  end if;

  if not exists (select 1 from storage.objects where bucket_id = 'galeria' and name = v_caminho) then
    raise exception 'O arquivo % ainda não está no bucket "galeria". Crie a pasta "perfil" no bucket e envie marlene-souza.webp dentro dela, sem renomear.', v_caminho;
  end if;

  update public.perfil
     set foto_url = v_url_projeto || '/storage/v1/object/public/galeria/' || v_caminho,
         foto_caminho_storage = v_caminho
   where id = 1;

  if not found then
    raise exception 'A linha do perfil não existe. Rode antes a migration 005_dados_iniciais.sql.';
  end if;
end
$foto$;

-- Confira: abra a URL no navegador para ver a foto.
select foto_url from public.perfil where id = 1;
