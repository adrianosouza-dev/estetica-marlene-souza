-- =============================================================================
-- 006 · Foto da profissional no perfil (página Sobre)
--
-- A foto fica no bucket "galeria", na pasta "perfil/", e não no código do site.
-- Assim ela não vai para o GitHub e a Marlene pode trocá-la pelo painel.
-- =============================================================================

alter table public.perfil
  add column if not exists foto_url text check (char_length(foto_url) <= 500),
  -- Caminho do arquivo no bucket "galeria"; usado para apagar a foto antiga ao trocar
  add column if not exists foto_caminho_storage text check (char_length(foto_caminho_storage) <= 300);

comment on column public.perfil.foto_url is 'URL pública da foto da profissional (página Sobre).';
