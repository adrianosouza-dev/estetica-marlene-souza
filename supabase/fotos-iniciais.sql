-- =============================================================================
-- FOTOS INICIAIS DA GALERIA
-- Cadastra na tabela "fotos" as 4 fotos de trabalhos da Marlene já enviadas ao
-- bucket "galeria" do Storage. Serve para os DOIS projetos (real e demonstração).
--
-- Antes de rodar:
--   1. Envie os 4 arquivos de fotos-otimizadas/galeria/ para o bucket "galeria"
--      (na raiz do bucket, sem pasta). Passo a passo em supabase/README.md.
--   2. Troque a URL abaixo pela Project URL do projeto em que você vai rodar
--      (Project Settings > API > Project URL). Cada projeto tem a sua.
--
-- O script é seguro:
--   * para com erro se a URL não foi trocada ou se algum arquivo não está no Storage;
--   * pode rodar mais de uma vez: fotos já cadastradas são ignoradas;
--   * é um único bloco DO, então ou cadastra tudo ou nada.
-- =============================================================================

do $fotos$
declare
  -- ▼▼▼ TROQUE AQUI pela Project URL deste projeto ▼▼▼
  v_url_projeto text := 'https://COLE-AQUI-O-ID-DO-PROJETO.supabase.co';
  -- ▲▲▲

  v_faltando text;
  v_novas    integer;
begin
  v_url_projeto := rtrim(btrim(v_url_projeto), '/');

  if v_url_projeto !~ '^https://[a-z0-9]+\.supabase\.co$' or v_url_projeto like '%COLE-AQUI%' then
    raise exception 'Troque v_url_projeto pela Project URL deste projeto (ex.: https://abcdefghijklmnopqrst.supabase.co). Valor atual: %', v_url_projeto;
  end if;

  create temp table _fotos_iniciais (caminho text, legenda text, ordem integer) on commit drop;
  insert into _fotos_iniciais values
    ('pedicure-branca-com-flor-rosa.webp',         'Pedicure branca com flor rosa',         1),
    ('pedicure-rosa-com-flores-delicadas.webp',    'Pedicure rosa com flores delicadas',    2),
    ('pedicure-branca-com-flores-coloridas.webp',  'Pedicure branca com flores coloridas',  3),
    ('pedicure-branca-com-detalhe-azul.webp',      'Pedicure branca com detalhe azul',      4);

  -- Confere se todos os arquivos já estão no bucket "galeria"
  select string_agg(f.caminho, ', ')
    into v_faltando
    from _fotos_iniciais f
   where not exists (
     select 1 from storage.objects o
      where o.bucket_id = 'galeria' and o.name = f.caminho
   );

  if v_faltando is not null then
    raise exception 'Estes arquivos ainda não estão no bucket "galeria" (envie na raiz do bucket, com o nome exato): %', v_faltando;
  end if;

  -- Cadastra só as que ainda não existem na tabela
  insert into public.fotos (url, caminho_storage, legenda, ordem)
  select v_url_projeto || '/storage/v1/object/public/galeria/' || f.caminho,
         f.caminho,
         f.legenda,
         f.ordem
    from _fotos_iniciais f
   where not exists (select 1 from public.fotos p where p.caminho_storage = f.caminho)
   order by f.ordem;

  get diagnostics v_novas = row_count;
  raise notice '% foto(s) cadastrada(s).', v_novas;
end
$fotos$;

-- Confira o resultado: abra uma das URLs no navegador para ver a foto.
select legenda, url from public.fotos order by ordem;
