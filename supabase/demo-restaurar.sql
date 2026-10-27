-- =============================================================================
-- RESTAURAÇÃO DA DEMONSTRAÇÃO · SOMENTE NO PROJETO DE DEMONSTRAÇÃO (portfólio)
--
-- Cria a função public.restaurar_demonstracao(), que volta TODO o conteúdo da
-- demonstração ao estado inicial (agendamentos, avaliações, folgas, perguntas,
-- certificados, serviços, horários, perfil e fotos). Os visitantes do portfólio mexem em tudo;
-- a restauração roda toda madrugada pelo pg_cron (passo a passo no README).
--
-- Segurança:
--   * só funciona com perfil.demonstracao = true (migration 010): no projeto
--     real ela RECUSA e não apaga nada;
--   * só o banco (SQL Editor e pg_cron) pode chamá-la; o site não;
--   * todos os nomes, telefones e avaliações são FICTÍCIOS;
--   * WhatsApp fictício, Instagram, TikTok e Facebook vazios e só o bairro no endereço:
--     nenhum visitante chega ao contato real da Marlene;
--   * a foto do perfil e os arquivos do Storage não são tocados.
--
-- Opcional: restaurar_demonstracao('email-da-demo', 'senha-da-demo') também
-- volta a senha do usuário de demonstração (caso um visitante a troque).
-- Esses valores ficam só no agendamento do pg_cron, nunca neste arquivo.
--
-- Rode este arquivo depois das migrations 001 a 011. Pode rodar mais de uma vez.
-- =============================================================================


-- N-ésimo dia de atendimento a partir de hoje (0 = hoje; -1 = último dia útil
-- antes de hoje), pulando domingos. Usado para a agenda fictícia parecer atual.
create or replace function public.demo_dia_util(n integer)
returns date
language sql
stable
set search_path = ''
as $$
  with hoje as (select public.agora_local()::date as d)
  select case
    when n >= 0 then (
      select dia from (select (hoje.d + i) as dia from hoje, generate_series(0, 120) i) s
      where extract(dow from dia) <> 0 order by dia offset n limit 1
    )
    else (
      select dia from (select (hoje.d - i) as dia from hoje, generate_series(1, 120) i) s
      where extract(dow from dia) <> 0 order by dia desc offset (-n - 1) limit 1
    )
  end
  from hoje;
$$;


create or replace function public.restaurar_demonstracao(p_email text default null, p_senha text default null)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_base text;
begin
  -- Trava principal: nunca roda no projeto real
  if not public.eh_demonstracao() then
    raise exception 'Restauração recusada: este projeto não está no modo demonstração (perfil.demonstracao = false).';
  end if;

  -- Limpa o que os visitantes criaram ---------------------------------------------
  delete from public.agendamentos;
  delete from public.avaliacoes;
  delete from public.bloqueios;
  delete from public.perguntas_frequentes;
  delete from public.certificados;

  -- Serviços: os 4 iniciais, preço "Consultar" ------------------------------------
  delete from public.servicos
   where nome not in ('Manicure', 'Pedicure', 'Manicure e pedicure', 'Design de sobrancelhas');

  with padrao (nome, descricao, duracao_minutos, ordem) as (
    values
      ('Manicure',               'Cutilagem, esmaltação e acabamento das unhas das mãos.', 120, 1),
      ('Pedicure',               'Cutilagem, esmaltação e acabamento das unhas dos pés.',  120, 2),
      ('Manicure e pedicure',    'Mãos e pés no mesmo atendimento.',                       180, 3),
      ('Design de sobrancelhas', 'Modelagem das sobrancelhas de acordo com o seu rosto.',   60, 4)
  ),
  atualizados as (
    update public.servicos s
       set descricao = p.descricao, duracao_minutos = p.duracao_minutos, preco = 0, ativo = true, ordem = p.ordem
      from padrao p
     where s.nome = p.nome
    returning s.nome
  )
  insert into public.servicos (nome, descricao, duracao_minutos, preco, ativo, ordem)
  select p.nome, p.descricao, p.duracao_minutos, 0, true, p.ordem
    from padrao p
   where p.nome not in (select nome from atualizados);

  -- Horários: segunda a sábado, 8h às 17h, almoço 12h às 13h ------------------------
  insert into public.horarios_funcionamento (dia_semana, aberto, abre, fecha, almoco_inicio, almoco_fim)
  select d, d <> 0,
         case when d <> 0 then time '08:00' end, case when d <> 0 then time '17:00' end,
         case when d <> 0 then time '12:00' end, case when d <> 0 then time '13:00' end
    from generate_series(0, 6) d
  on conflict (dia_semana) do update
    set aberto = excluded.aberto, abre = excluded.abre, fecha = excluded.fecha,
        almoco_inicio = excluded.almoco_inicio, almoco_fim = excluded.almoco_fim;

  -- Perfil: contato fictício (a foto não é tocada) ----------------------------------
  update public.perfil
     set sobre = 'Texto de demonstração. Aqui a profissional conta sua história, '
              || 'como começou a trabalhar com unhas e sobrancelhas e o que '
              || 'valoriza no atendimento. Ela edita este texto pelo painel.',
         whatsapp = '5592900000000',
         instagram = null,
         tiktok = null,
         facebook = null,
         endereco = 'Bairro Donga Micheles, Maués-AM',
         link_mapa = null,
         aviso_cancelamento = 'Se precisar cancelar, há taxa de R$ 5,00. Remarcar é grátis.',
         dias_maximos_agendamento = 30,
         antecedencia_minima_minutos = 60
   where id = 1;

  -- Fotos: as 4 iniciais, a partir dos arquivos que estão no Storage -----------------
  -- O endereço do projeto vem da foto do perfil (travada no modo demonstração).
  select substring(foto_url from '^(.*)/storage/v1/object/public/') into v_base from public.perfil where id = 1;
  if v_base is not null then
    delete from public.fotos;
    insert into public.fotos (url, caminho_storage, legenda, ordem)
    select v_base || '/storage/v1/object/public/galeria/' || f.caminho, f.caminho, f.legenda, f.ordem
      from (values
        ('pedicure-branca-com-flor-rosa.webp',        'Pedicure branca com flor rosa',        1),
        ('pedicure-rosa-com-flores-delicadas.webp',   'Pedicure rosa com flores delicadas',   2),
        ('pedicure-branca-com-flores-coloridas.webp', 'Pedicure branca com flores coloridas', 3),
        ('pedicure-branca-com-detalhe-azul.webp',     'Pedicure branca com detalhe azul',     4)
      ) as f (caminho, legenda, ordem)
     where exists (select 1 from storage.objects o where o.bucket_id = 'galeria' and o.name = f.caminho);
  end if;

  -- Perguntas frequentes -------------------------------------------------------------
  insert into public.perguntas_frequentes (pergunta, resposta, ordem)
  values
    ('Quanto tempo demora o atendimento?',
     'Depende do serviço: a duração de cada um está em "Serviços e preços". Unhas levam de 1h30 a 2h, conforme a cutilagem.', 1),
    ('Preciso pagar adiantado?', 'Não precisa. O pagamento é feito no dia do atendimento.', 2),
    ('Quais formas de pagamento são aceitas?', 'Pix e dinheiro.', 3),
    ('Como faço para cancelar ou remarcar?',
     'É só avisar pelo WhatsApp. Remarcar é grátis; se precisar cancelar, há uma taxa de R$ 5,00.', 4),
    ('O que acontece se eu me atrasar?', 'A tolerância é de 5 minutos. Se for se atrasar, avise pelo WhatsApp.', 5),
    ('Atende em domicílio?', 'Sim. Para atendimento em domicílio, combine pelo WhatsApp.', 6);

  -- Certificados fictícios, sem imagem (na demonstração não se enviam arquivos) ------
  insert into public.certificados (titulo, instituicao, ano, ordem)
  values
    ('Manicure e pedicure profissional', 'Escola de Beleza (exemplo)',   2018, 1),
    ('Design de sobrancelhas',           'Instituto de Estética (exemplo)', 2021, 2),
    ('Biossegurança no salão de beleza', 'Curso on-line (exemplo)',       null, 3);

  -- Agendamentos fictícios (o fim é calculado pelo gatilho) ---------------------------
  insert into public.agendamentos (servico_id, cliente_nome, cliente_whatsapp, inicio, status)
  select s.id, a.nome, a.whatsapp, public.demo_dia_util(a.dia) + a.hora, a.status
  from (values
    (-12, time '08:00', 'Manicure',               'Ana Paula Ferreira',   '92900000001', 'concluido'),
    (-12, time '13:00', 'Manicure e pedicure',    'Joana Batista',        '92900000002', 'concluido'),
    (-10, time '10:00', 'Design de sobrancelhas', 'Carla Mendes',         '92900000003', 'concluido'),
    ( -9, time '08:00', 'Pedicure',               'Luana Rocha',          '92900000004', 'cancelado'),
    ( -8, time '14:00', 'Pedicure',               'Beatriz Lima',         '92900000005', 'concluido'),
    ( -6, time '08:00', 'Manicure',               'Rita de Cássia Prado', '92900000006', 'concluido'),
    ( -5, time '15:00', 'Design de sobrancelhas', 'Fernanda Alves',       '92900000007', 'concluido'),
    ( -3, time '13:00', 'Manicure e pedicure',    'Patrícia Nogueira',    '92900000008', 'concluido'),
    ( -2, time '10:00', 'Design de sobrancelhas', 'Juliana Castro',       '92900000009', 'concluido'),
    ( -1, time '08:00', 'Manicure',               'Sandra Oliveira',      '92900000010', 'concluido'),
    (  0, time '08:00', 'Manicure',               'Mariana Lopes',        '92900000011', 'confirmado'),
    (  0, time '10:00', 'Design de sobrancelhas', 'Débora Farias',        '92900000012', 'confirmado'),
    (  0, time '13:00', 'Manicure e pedicure',    'Gabriela Pinto',       '92900000013', 'pendente'),
    (  1, time '08:00', 'Pedicure',               'Aline Martins',        '92900000014', 'confirmado'),
    (  1, time '14:00', 'Manicure',               'Vanessa Reis',         '92900000015', 'pendente'),
    (  2, time '10:00', 'Design de sobrancelhas', 'Tatiane Costa',        '92900000016', 'pendente'),
    (  3, time '13:00', 'Manicure e pedicure',    'Camila Freitas',       '92900000017', 'pendente'),
    (  5, time '08:00', 'Manicure',               'Renata Duarte',        '92900000018', 'confirmado')
  ) as a (dia, hora, servico, nome, whatsapp, status)
  join public.servicos s on s.nome = a.servico;

  -- Uma folga fictícia daqui a uma semana (dia inteiro)
  insert into public.bloqueios (inicio, fim, motivo)
  values (public.demo_dia_util(7)::timestamp, (public.demo_dia_util(7) + 1)::timestamp, 'Folga');

  -- Avaliações fictícias: 5 aprovadas e 2 aguardando aprovação
  insert into public.avaliacoes (nome, nota, comentario, status, criado_em)
  values
    ('Ana Paula', 5, 'Atendimento caprichado e no horário. Minhas unhas duraram mais de duas semanas!', 'aprovada', now() - interval '11 days'),
    ('Joana B.',  5, 'Ambiente tranquilo e muito cuidado com a cutilagem. Recomendo.',                   'aprovada', now() - interval '10 days'),
    ('Carla',     5, 'Amei o design da sobrancelha, ficou natural do jeito que eu queria.',              'aprovada', now() - interval '9 days'),
    ('Beatriz',   4, 'Muito bom! Só precisei esperar um pouquinho, mas valeu a pena.',                   'aprovada', now() - interval '7 days'),
    ('Fernanda',  5, 'Agendar pelo site foi muito prático.',                                             'aprovada', now() - interval '4 days'),
    ('Patrícia',  5, 'Mãos e pés impecáveis. Já marquei a próxima.',                                     'pendente', now() - interval '2 days'),
    ('Sandra',    4, null,                                                                                'pendente', now() - interval '1 day');

  -- Senha do usuário de demonstração (opcional) --------------------------------------
  if p_email is not null and p_senha is not null then
    update auth.users
       set encrypted_password = extensions.crypt(p_senha, extensions.gen_salt('bf'))
     where email = p_email;
  end if;

  return 'Demonstração restaurada em ' || to_char(public.agora_local(), 'DD/MM/YYYY HH24:MI') || ' (horário de Maués).';
end;
$$;

-- Só o banco (SQL Editor e pg_cron) chama: o site não consegue
revoke execute on function public.restaurar_demonstracao(text, text) from public, anon, authenticated;
revoke execute on function public.demo_dia_util(integer) from public, anon, authenticated;
