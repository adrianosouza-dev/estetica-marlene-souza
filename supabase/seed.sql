-- =============================================================================
-- SEED · SOMENTE PARA O PROJETO DE DEMONSTRAÇÃO (portfólio)
--
-- ⚠ NÃO RODE NO PROJETO REAL DA MARLENE.
-- Todos os nomes, telefones e avaliações abaixo são FICTÍCIOS.
--
-- Rode depois das migrations. As datas são relativas ao dia em que o seed roda,
-- então a agenda da demo sempre parece "atual" (passado, hoje e próximos dias).
-- Domingos são pulados, porque não há atendimento.
-- =============================================================================


-- Texto do "Sobre" e contato fictícios da demo -----------------------------------
-- WhatsApp e Instagram fictícios e só o bairro no endereço: nenhum visitante do
-- portfólio pode chegar ao contato real da Marlene.
update public.perfil
set sobre              = 'Texto de demonstração. Aqui a profissional conta sua história, '
                      || 'como começou a trabalhar com unhas e sobrancelhas e o que '
                      || 'valoriza no atendimento. Ela edita este texto pelo painel.',
    whatsapp           = '5592900000000',
    instagram          = null,
    endereco           = 'Bairro Donga Micheles, Maués-AM',
    link_mapa          = null,
    aviso_cancelamento = 'Se precisar cancelar, há taxa de R$ 5,00. Remarcar é grátis.'
where id = 1;


-- Perguntas frequentes da demo (migration 009) ------------------------------------
-- Fora da trava do bloco abaixo: entram mesmo num banco que já tem agendamentos,
-- mas só se ainda não houver nenhuma pergunta.
insert into public.perguntas_frequentes (pergunta, resposta, ordem)
select v.pergunta, v.resposta, v.ordem
from (values
  ('Quanto tempo demora o atendimento?',
   'Depende do serviço: a duração de cada um está em "Serviços e preços". Unhas levam de 1h30 a 2h, conforme a cutilagem.', 1),
  ('Preciso pagar adiantado?', 'Não precisa. O pagamento é feito no dia do atendimento.', 2),
  ('Quais formas de pagamento são aceitas?', 'Pix e dinheiro.', 3),
  ('Como faço para cancelar ou remarcar?',
   'É só avisar pelo WhatsApp. Remarcar é grátis; se precisar cancelar, há uma taxa de R$ 5,00.', 4),
  ('O que acontece se eu me atrasar?', 'A tolerância é de 5 minutos. Se for se atrasar, avise pelo WhatsApp.', 5),
  ('Atende em domicílio?', 'Sim. Para atendimento em domicílio, combine pelo WhatsApp.', 6)
) as v (pergunta, resposta, ordem)
where not exists (select 1 from public.perguntas_frequentes);


-- N-ésimo dia de atendimento a partir de hoje (0 = hoje; -1 = último dia útil
-- antes de hoje), pulando domingos. Função temporária: some ao fim da sessão.
create or replace function pg_temp.dia_util(n integer)
returns date
language sql
stable
as $$
  with hoje as (select public.agora_local()::date as d)
  select case
    when n >= 0 then (
      select dia from (
        select (hoje.d + i) as dia from hoje, generate_series(0, 120) i
      ) s
      where extract(dow from dia) <> 0
      order by dia
      offset n limit 1
    )
    else (
      select dia from (
        select (hoje.d - i) as dia from hoje, generate_series(1, 120) i
      ) s
      where extract(dow from dia) <> 0
      order by dia desc
      offset (-n - 1) limit 1
    )
  end
  from hoje;
$$;


do $$
begin
  if exists (select 1 from public.agendamentos) or exists (select 1 from public.avaliacoes) then
    raise notice 'Seed ignorado: já existem agendamentos ou avaliações neste banco.';
    return;
  end if;

  -- Agendamentos fictícios ------------------------------------------------------
  -- O "fim" é calculado pelo gatilho a partir da duração do serviço.
  insert into public.agendamentos (servico_id, cliente_nome, cliente_whatsapp, inicio, status)
  select s.id, a.nome, a.whatsapp, pg_temp.dia_util(a.dia) + a.hora, a.status
  from (values
    -- dia útil, hora,    serviço,                  cliente,                whatsapp,      status
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

  -- Uma folga fictícia daqui a uma semana (dia inteiro) ---------------------------
  insert into public.bloqueios (inicio, fim, motivo)
  values (pg_temp.dia_util(7)::timestamp, (pg_temp.dia_util(7) + 1)::timestamp, 'Folga');

  -- Avaliações fictícias: 5 aprovadas e 2 aguardando aprovação ---------------------
  insert into public.avaliacoes (nome, nota, comentario, status, criado_em)
  values
    ('Ana Paula', 5, 'Atendimento caprichado e no horário. Minhas unhas duraram mais de duas semanas!', 'aprovada', now() - interval '11 days'),
    ('Joana B.',  5, 'Ambiente tranquilo e muito cuidado com a cutilagem. Recomendo.',                   'aprovada', now() - interval '10 days'),
    ('Carla',     5, 'Amei o design da sobrancelha, ficou natural do jeito que eu queria.',              'aprovada', now() - interval '9 days'),
    ('Beatriz',   4, 'Muito bom! Só precisei esperar um pouquinho, mas valeu a pena.',                   'aprovada', now() - interval '7 days'),
    ('Fernanda',  5, 'Agendar pelo site foi muito prático.',                                             'aprovada', now() - interval '4 days'),
    ('Patrícia',  5, 'Mãos e pés impecáveis. Já marquei a próxima.',                                     'pendente', now() - interval '2 days'),
    ('Sandra',    4, null,                                                                                'pendente', now() - interval '1 day');
end;
$$;
