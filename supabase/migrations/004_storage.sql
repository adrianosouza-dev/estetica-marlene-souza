-- =============================================================================
-- 004 · Storage: bucket "galeria" para as fotos dos trabalhos
--
-- Bucket público: qualquer pessoa abre a foto pelo link (é o que a galeria
-- precisa). Enviar, trocar e apagar arquivos é só para a profissional.
-- Limite de 5 MB por arquivo e apenas imagens.
-- =============================================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('galeria', 'galeria', true, 5242880, array['image/webp', 'image/jpeg', 'image/png'])
on conflict (id) do nothing;

-- Listar arquivos do bucket não é necessário para o público (a galeria usa a
-- tabela "fotos"), então a leitura via API fica restrita à profissional.
create policy "galeria: profissional lista"
  on storage.objects for select
  to authenticated
  using (bucket_id = 'galeria' and public.eh_profissional());

create policy "galeria: profissional envia"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'galeria' and public.eh_profissional());

create policy "galeria: profissional substitui"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'galeria' and public.eh_profissional())
  with check (bucket_id = 'galeria' and public.eh_profissional());

create policy "galeria: profissional apaga"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'galeria' and public.eh_profissional());
