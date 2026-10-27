-- =============================================================================
-- CONFERÊNCIA DO PROJETO REAL · SÓ LEITURA
--
-- Confere se o projeto real foi montado como o roteiro do supabase/README.md
-- manda. Não grava, não apaga e não testa nada: só lê. Por isso pode rodar a
-- qualquer momento, inclusive depois que a Marlene começar a usar o site.
--
-- Como rodar: cole o arquivo inteiro no SQL Editor e clique em Run.
-- O resultado é uma tabela, uma linha por item:
--   ✅ certo   ❌ precisa corrigir (a coluna "detalhe" diz o quê)   ℹ️ só informação
--
-- Se aparecer erro de tabela ou coluna inexistente, falta rodar alguma migration
-- (001 a 011).
-- =============================================================================

with
p as (
  -- to_jsonb: lê colunas que podem não existir sem dar erro (ex.: migration 010 não rodada)
  select to_jsonb(perfil) as j from public.perfil where id = 1
),
base as (
  -- Endereço do projeto, tirado da foto da Marlene
  select substring(j ->> 'foto_url' from '^(https://[^/]+)/storage/v1/object/public/') as url from p
),
tabelas (nome) as (
  values ('servicos'), ('horarios_funcionamento'), ('bloqueios'), ('agendamentos'),
         ('fotos'), ('avaliacoes'), ('perfil'), ('perguntas_frequentes'), ('certificados')
),
conta as (
  select u.email, u.email_confirmed_at
    from p join auth.users u on u.id = (p.j ->> 'profissional_id')::uuid
),
fotos as (
  select f.url, f.caminho_storage,
         exists (select 1 from storage.objects o
                  where o.bucket_id = 'galeria' and o.name = f.caminho_storage) as arquivo_existe
    from public.fotos f
),
resultado (ordem, item, ok, detalhe) as (

  select 1, 'Migrations 001 a 011',
         (select count(*) from tabelas where to_regclass('public.' || nome) is not null) = 9
           and (select j ? 'demonstracao' and j ? 'aviso_cancelamento' and j ? 'foto_url' and j ? 'tiktok' and j ? 'facebook' from p),
         'Tabelas encontradas: ' || (select count(*) from tabelas where to_regclass('public.' || nome) is not null) || ' de 9'
           || case when (select j ? 'tiktok' from p) then '' else '; falta a migration 011 (TikTok, Facebook e certificados)' end

  union all
  select 2, 'Row Level Security ativo em todas as tabelas',
         not exists (select 1 from tabelas t join pg_class c on c.oid = to_regclass('public.' || t.nome)
                      where not c.relrowsecurity),
         coalesce('Sem RLS: ' || (select string_agg(t.nome, ', ') from tabelas t
                                    join pg_class c on c.oid = to_regclass('public.' || t.nome)
                                   where not c.relrowsecurity), 'todas protegidas')

  union all
  select 3, 'Modo demonstração DESLIGADO',
         (select coalesce((j ->> 'demonstracao')::boolean, false) = false from p),
         case when (select coalesce((j ->> 'demonstracao')::boolean, false) from p)
              then 'ATENÇÃO: este projeto está como demonstração. No real, rode no SQL Editor: update public.perfil set demonstracao = false where id = 1;'
              else 'demonstracao = false' end

  union all
  select 4, 'Nada da demonstração instalado',
         to_regprocedure('public.restaurar_demonstracao(text, text)') is null
           and to_regprocedure('public.demo_dia_util(integer)') is null
           and not exists (select 1 from pg_extension where extname = 'pg_cron'),
         case
           when to_regprocedure('public.restaurar_demonstracao(text, text)') is not null
             then 'demo-restaurar.sql foi rodado aqui. Ele não pertence ao projeto real: apague com drop function public.restaurar_demonstracao(text, text); drop function public.demo_dia_util(integer);'
           when exists (select 1 from pg_extension where extname = 'pg_cron')
             then 'pg_cron está ativado. O projeto real não precisa dele: confira em Database > Extensions.'
           else 'sem função de restauração e sem pg_cron' end

  union all
  select 5, 'Conta da Marlene ligada ao perfil',
         exists (select 1 from conta where email_confirmed_at is not null),
         coalesce((select email || case when email_confirmed_at is null
                                        then ' (NÃO confirmada: marque Auto Confirm User ou confirme em Authentication > Users)'
                                        else '' end from conta),
                  'Nenhuma conta ligada. Faça o passo 5 do README.')

  union all
  select 6, 'Só uma conta no login',
         (select count(*) from auth.users) = 1,
         (select count(*) from auth.users) || ' conta(s). Lembre também de desligar "Allow new users to sign up" (passo 4).'

  union all
  select 7, 'Serviços ativos',
         (select count(*) from public.servicos where ativo) > 0,
         (select count(*) from public.servicos where ativo) || ' ativo(s) (no início: 4): '
           || coalesce((select string_agg(nome, ', ' order by ordem) from public.servicos where ativo), 'nenhum')

  union all
  select 8, 'Horário de funcionamento',
         (select count(*) from public.horarios_funcionamento) = 7
           and exists (select 1 from public.horarios_funcionamento where aberto),
         (select count(*) filter (where aberto) from public.horarios_funcionamento) || ' dia(s) aberto(s) na semana'

  union all
  select 9, 'Foto da Marlene (página Sobre)',
         (select j ->> 'foto_caminho_storage' = 'perfil/marlene-souza.webp' from p)
           and exists (select 1 from storage.objects
                        where bucket_id = 'galeria' and name = 'perfil/marlene-souza.webp')
           and (select url from base) is not null,
         case
           when not exists (select 1 from storage.objects
                             where bucket_id = 'galeria' and name = 'perfil/marlene-souza.webp')
             then 'Arquivo perfil/marlene-souza.webp não está no Storage (passo 8).'
           when (select url from base) is null
             then 'Arquivo enviado, mas falta rodar foto-perfil.sql (passo 8).'
           else 'ok' end

  union all
  select 10, 'Fotos da galeria',
         (select count(*) from fotos) > 0
           and not exists (select 1 from fotos where not arquivo_existe)
           and not exists (select 1 from fotos, base
                            where fotos.url <> base.url || '/storage/v1/object/public/galeria/' || fotos.caminho_storage),
         case
           when (select count(*) from fotos) = 0
             then 'Nenhuma foto cadastrada (passo 7).'
           when exists (select 1 from fotos where not arquivo_existe)
             then 'Foto cadastrada sem arquivo no Storage: '
                  || (select string_agg(coalesce(caminho_storage, url), ', ') from fotos where not arquivo_existe)
           when (select url from base) is null
             then (select count(*) from fotos) || ' foto(s); não deu para conferir o endereço sem a foto da Marlene (item 9).'
           when exists (select 1 from fotos, base
                         where fotos.url <> base.url || '/storage/v1/object/public/galeria/' || fotos.caminho_storage)
             then 'Alguma foto aponta para outro endereço (URL do projeto errada em fotos-iniciais.sql?).'
           else (select count(*) from fotos) || ' foto(s) (no início: 4), todas com arquivo no Storage' end

  union all
  select 11, 'Perguntas frequentes',
         (select count(*) from public.perguntas_frequentes where ativa) > 0,
         (select count(*) from public.perguntas_frequentes where ativa) || ' visível(is) (no início: 6). Se for 0, rode faq-inicial-real.sql.'

  union all
  select 12, 'Aviso de cancelamento',
         (select coalesce(j ->> 'aviso_cancelamento', '') <> '' from p),
         coalesce((select j ->> 'aviso_cancelamento' from p), 'vazio: rode faq-inicial-real.sql')

  union all
  select 13, 'Endereço',
         (select coalesce(j ->> 'endereco', '') <> '' from p),
         coalesce((select j ->> 'endereco' from p), 'vazio')

  -- Só informação --------------------------------------------------------------
  union all
  select 14, 'WhatsApp', null,
         coalesce((select j ->> 'whatsapp' from p),
                  'vazio: a Marlene preenche em Perfil no primeiro acesso. Até lá, os botões do WhatsApp ficam escondidos no site.')

  union all
  select 15, 'Agendamentos', null,
         (select count(*) from public.agendamentos) || ' no total; '
           || (select count(*) from public.agendamentos where inicio >= public.agora_local() and status <> 'cancelado') || ' a partir de agora'

  union all
  select 16, 'Avaliações', null,
         (select count(*) filter (where status = 'aprovada') from public.avaliacoes) || ' aprovada(s), '
           || (select count(*) filter (where status = 'pendente') from public.avaliacoes) || ' pendente(s)'

  union all
  select 17, 'Redes sociais', null,
         coalesce(nullif(concat_ws(', ',
           case when (select j ->> 'instagram' from p) is not null then 'Instagram' end,
           case when (select j ->> 'tiktok' from p) is not null then 'TikTok' end,
           case when (select j ->> 'facebook' from p) is not null then 'Facebook' end), ''),
           'nenhuma preenchida (os ícones não aparecem no site)')

  union all
  select 18, 'Certificados', null,
         (select count(*) from public.certificados) || ' cadastrado(s), '
           || (select count(*) from public.certificados where caminho_storage is not null) || ' com imagem'
           || case when (select count(*) from public.certificados) = 0 then ' (a seção some da página Sobre)' else '' end
)
select case when ordem >= 14 then 'ℹ️' when coalesce(ok, false) then '✅' else '❌' end as situacao,
       item,
       detalhe
  from resultado
 order by ordem;
