-- =============================================================================
-- TESTES DO BANCO: segurança (RLS) e regras de agendamento
--
-- Como rodar: cole o arquivo INTEIRO no SQL Editor do Supabase e clique em Run.
-- Prefira o projeto de DEMONSTRAÇÃO, embora o projeto real também não seja alterado.
--
-- Por que tudo está num único bloco DO:
--   O SQL Editor não garante que vários comandos fiquem na mesma transação ou
--   sessão. Por isso, tabelas temporárias e um BEGIN/ROLLBACK separados não
--   funcionam de forma confiável lá. Um bloco DO é UM comando só, então roda
--   inteiro numa única transação, do começo ao fim.
--
-- Como nada é gravado (equivale a BEGIN ... ROLLBACK):
--   Os testes rodam dentro de um sub-bloco. No final, ele dispara de propósito o
--   erro "sentinela" TST00 e o captura em seguida. Capturar um erro desfaz tudo
--   o que o sub-bloco fez (é um ROLLBACK TO SAVEPOINT automático do Postgres).
--   Se algum teste falhar, o erro sai do bloco e o comando inteiro é cancelado,
--   então também nada é gravado.
--
-- Como ler o resultado:
--   * Tudo certo  -> a última linha mostra "✅ Todos os testes passaram".
--   * Algo errado -> aparece um erro "❌ Teste X FALHOU" com o esperado e o obtido.
--
-- "Como anon": SET LOCAL ROLE anon faz o banco tratar o comando como uma visitante
-- do site, com as mesmas regras (RLS e permissões) da chave pública. Os dados do
-- teste ficam em variáveis do próprio bloco, então o anon não precisa de acesso a
-- nenhuma tabela extra. RESET ROLE volta para o administrador, que confere tudo.
-- =============================================================================

do $testes$
declare
  -- Horário livre usado nos testes de agendamento
  v_inicio    timestamp;
  v_servico   uuid;

  -- Auxiliares
  v_estado    text;
  v_estado_b  text;
  v_status    text;
  v_ok        boolean;
  v_achou     boolean;
  v_colunas   text;
  n_esperado  integer;
  n_obtido    integer;
  n_extra     integer;
begin
  begin -- sub-bloco: tudo aqui dentro é desfeito no final

    -- Preparação ---------------------------------------------------------------
    -- Primeiro horário livre de verdade a partir de depois de amanhã: dia aberto,
    -- dentro do expediente, fora do almoço, sem bloqueio e sem outro agendamento.
    with servico as (
      select id, duracao_minutos from public.servicos
      where nome = 'Design de sobrancelhas' and ativo
    ),
    candidatos as (
      select d::date + h.abre + make_interval(hours => n) as inicio, h.*
      from generate_series(public.agora_local()::date + 2, public.agora_local()::date + 25, interval '1 day') d
      join public.horarios_funcionamento h on h.dia_semana = extract(dow from d) and h.aberto
      cross join generate_series(0, 12) n
    )
    select c.inicio, s.id
      into v_inicio, v_servico
    from candidatos c
    cross join servico s
    cross join lateral (select c.inicio + make_interval(mins => s.duracao_minutos) as fim) f
    where f.fim::date = c.inicio::date
      and f.fim::time <= c.fecha
      and not (c.almoco_inicio is not null and c.inicio::time < c.almoco_fim and f.fim::time > c.almoco_inicio)
      and not exists (select 1 from public.bloqueios b
                      where tsrange(b.inicio, b.fim, '[)') && tsrange(c.inicio, f.fim, '[)'))
      and not exists (select 1 from public.agendamentos a
                      where a.status <> 'cancelado'
                        and tsrange(a.inicio, a.fim, '[)') && tsrange(c.inicio, f.fim, '[)'))
    order by c.inicio
    limit 1;

    if v_inicio is null then
      raise exception '❌ Preparação FALHOU: nenhum horário livre para "Design de sobrancelhas" nos próximos 25 dias.';
    end if;
    raise notice 'Horário livre usado nos testes: %', v_inicio;


    -- =========================================================================
    -- TESTE 1a · Como anon, NÃO consegue ler a tabela de agendamentos
    -- Esperado: erro 42501 (permission denied for table agendamentos).
    -- =========================================================================
    v_estado := 'nenhum erro (a leitura funcionou!)';
    set local role anon;
    begin
      perform 1 from public.agendamentos limit 1;
    exception when others then
      v_estado := sqlstate || ' - ' || sqlerrm;
    end;
    reset role;

    if v_estado not like '42501%' then
      raise exception E'❌ Teste 1a FALHOU\nEsperado: erro 42501\nObtido: %', v_estado;
    end if;
    raise notice '✅ Teste 1a passou: anon não lê agendamentos';


    -- =========================================================================
    -- TESTE 1b · Como anon, lê os serviços ATIVOS, e só eles
    -- Cria um serviço inativo de teste para garantir que existe algo a esconder.
    -- Esperado: anon vê exatamente a quantidade de ativos e nenhum inativo.
    -- =========================================================================
    insert into public.servicos (nome, duracao_minutos, ativo)
    values ('Serviço inativo (teste)', 60, false);

    select count(*) into n_esperado from public.servicos where ativo;

    set local role anon;
    select count(*), count(*) filter (where not ativo)
      into n_obtido, n_extra
      from public.servicos;
    reset role;

    if n_obtido <> n_esperado or n_extra <> 0 then
      raise exception E'❌ Teste 1b FALHOU\nEsperado: % serviços visíveis, 0 inativos\nObtido: % visíveis, % inativos',
        n_esperado, n_obtido, n_extra;
    end if;
    raise notice '✅ Teste 1b passou: anon vê % serviços ativos e nenhum inativo', n_obtido;


    -- =========================================================================
    -- TESTE 1c · Como anon, vê SÓ as avaliações aprovadas
    -- Cria uma avaliação pendente de teste para garantir que existe algo a esconder.
    -- Esperado: anon vê exatamente a quantidade de aprovadas e nenhuma pendente.
    -- =========================================================================
    insert into public.avaliacoes (nome, nota, comentario, status)
    values ('Pendente (teste)', 3, 'Não deve aparecer para o público.', 'pendente');

    select count(*) into n_esperado from public.avaliacoes where status = 'aprovada';

    set local role anon;
    select count(*), count(*) filter (where status <> 'aprovada')
      into n_obtido, n_extra
      from public.avaliacoes;
    reset role;

    if n_obtido <> n_esperado or n_extra <> 0 then
      raise exception E'❌ Teste 1c FALHOU\nEsperado: % avaliações visíveis, 0 pendentes\nObtido: % visíveis, % pendentes',
        n_esperado, n_obtido, n_extra;
    end if;
    raise notice '✅ Teste 1c passou: anon vê só as % avaliações aprovadas', n_obtido;


    -- =========================================================================
    -- TESTE 2a · Como anon, CONSEGUE criar um agendamento futuro em horário livre
    -- Tenta mandar status "confirmado" de propósito.
    -- Esperado: o agendamento é gravado com status "pendente" (forçado pelo banco)
    --           e com o fim calculado pela duração do serviço.
    -- =========================================================================
    v_estado := 'ok';
    set local role anon;
    begin
      insert into public.agendamentos (servico_id, cliente_nome, cliente_whatsapp, inicio, status)
      values (v_servico, 'Cliente Teste A', '92900009991', v_inicio, 'confirmado');
    exception when others then
      v_estado := sqlstate || ' - ' || sqlerrm;
    end;
    reset role;

    if v_estado <> 'ok' then
      raise exception E'❌ Teste 2a FALHOU\nEsperado: agendamento criado em %\nObtido: erro %', v_inicio, v_estado;
    end if;

    select a.status, a.fim = a.inicio + make_interval(mins => s.duracao_minutos)
      into v_status, v_ok
      from public.agendamentos a
      join public.servicos s on s.id = a.servico_id
     where a.cliente_whatsapp = '92900009991';

    if v_status is distinct from 'pendente' or not coalesce(v_ok, false) then
      raise exception E'❌ Teste 2a FALHOU\nEsperado: status pendente e fim calculado\nObtido: status %, fim correto = %', v_status, v_ok;
    end if;
    raise notice '✅ Teste 2a passou: anon agendou % (status pendente, fim calculado)', v_inicio;


    -- =========================================================================
    -- TESTE 2b · Como anon, NÃO consegue agendar no passado
    -- Esperado: erro P0001 com a mensagem "Este horário já passou ou está muito
    --           em cima da hora...". Nada é gravado.
    -- =========================================================================
    v_estado := 'nenhum erro (agendou no passado!)';
    set local role anon;
    begin
      insert into public.agendamentos (servico_id, cliente_nome, cliente_whatsapp, inicio)
      values (v_servico, 'Cliente Teste Passado', '92900009992',
              (public.agora_local()::date - 1) + time '10:00');
    exception when others then
      v_estado := sqlstate || ' - ' || sqlerrm;
    end;
    reset role;

    if v_estado not like 'P0001%' then
      raise exception E'❌ Teste 2b FALHOU\nEsperado: erro P0001 (horário já passou)\nObtido: %', v_estado;
    end if;
    raise notice '✅ Teste 2b passou: agendamento no passado recusado (%)', v_estado;


    -- =========================================================================
    -- TESTE 3 · Dois agendamentos no MESMO horário
    -- O horário do teste 2a já está ocupado; outra cliente tenta o mesmo.
    -- Esperado: erro 23P01 (exclusion_violation, constraint agendamento_sem_conflito).
    -- =========================================================================
    v_estado := 'nenhum erro (dois agendamentos no mesmo horário!)';
    set local role anon;
    begin
      insert into public.agendamentos (servico_id, cliente_nome, cliente_whatsapp, inicio)
      values (v_servico, 'Cliente Teste B', '92900009993', v_inicio);
    exception when others then
      v_estado := sqlstate || ' - ' || sqlerrm;
    end;
    reset role;

    if v_estado not like '23P01%' then
      raise exception E'❌ Teste 3 FALHOU\nEsperado: erro 23P01\nObtido: %', v_estado;
    end if;
    raise notice '✅ Teste 3 passou: segundo agendamento no mesmo horário recusado com 23P01';


    -- =========================================================================
    -- TESTE 4 · Agendamento CANCELADO não bloqueia o horário
    -- Cancela o agendamento do teste 2a (como administrador) e outra cliente
    -- agenda o mesmo horário (como anon).
    -- Esperado: o novo agendamento é gravado; no horário fica 1 ativo e 1 cancelado.
    -- =========================================================================
    update public.agendamentos set status = 'cancelado' where cliente_whatsapp = '92900009991';

    v_estado := 'ok';
    set local role anon;
    begin
      insert into public.agendamentos (servico_id, cliente_nome, cliente_whatsapp, inicio)
      values (v_servico, 'Cliente Teste C', '92900009994', v_inicio);
    exception when others then
      v_estado := sqlstate || ' - ' || sqlerrm;
    end;
    reset role;

    select count(*) filter (where status <> 'cancelado'), count(*) filter (where status = 'cancelado')
      into n_obtido, n_extra
      from public.agendamentos
     where inicio = v_inicio;

    if v_estado <> 'ok' or n_obtido <> 1 or n_extra <> 1 then
      raise exception E'❌ Teste 4 FALHOU\nEsperado: agendamento criado; 1 ativo e 1 cancelado no horário\nObtido: %; % ativo(s), % cancelado(s)',
        v_estado, n_obtido, n_extra;
    end if;
    raise notice '✅ Teste 4 passou: horário cancelado foi reaproveitado';


    -- =========================================================================
    -- TESTE 5 · horarios_ocupados(dia) devolve SÓ início e fim
    -- Chamada como anon, no dia do teste (que tem o agendamento do teste 4).
    -- Esperado: anon consegue chamar; cada linha tem apenas as colunas "inicio" e
    --           "fim" (sem nome, telefone, id ou status); o horário do teste aparece.
    -- =========================================================================
    set local role anon;
    select count(*),
           bool_and(array(select jsonb_object_keys(to_jsonb(h)) order by 1) = array['fim', 'inicio']),
           bool_or(h.inicio = v_inicio),
           string_agg(distinct array_to_string(array(select jsonb_object_keys(to_jsonb(h)) order by 1), ', '), ' | ')
      into n_obtido, v_ok, v_achou, v_colunas
      from public.horarios_ocupados(v_inicio::date) h;
    reset role;

    if n_obtido = 0 or not v_ok or not v_achou then
      raise exception E'❌ Teste 5 FALHOU\nEsperado: só as colunas "fim, inicio" e o horário % na lista\nObtido: % linha(s), colunas: %, horário encontrado: %',
        v_inicio, n_obtido, v_colunas, v_achou;
    end if;
    raise notice '✅ Teste 5 passou: % horário(s) ocupado(s), colunas: %', n_obtido, v_colunas;


    -- =========================================================================
    -- TESTE 6 · Como anon, avaliação nunca entra como aprovada
    --
    -- 6a: envia uma avaliação SEM status.
    --     Esperado: gravada com status "pendente".
    --
    -- 6b: tenta enviar já como "aprovada".
    --     Esperado: o banco RECUSA o envio inteiro (erro 42501, violação de RLS)
    --     e nada é gravado. Ou seja, é bloqueada em vez de convertida para
    --     pendente. O formulário do site sempre envia sem status, então só chega
    --     aqui quem tenta burlar a API.
    -- =========================================================================
    v_estado   := 'ok';
    v_estado_b := 'nenhum erro (aceitou avaliação já aprovada!)';
    set local role anon;
    begin
      insert into public.avaliacoes (nome, nota, comentario)
      values ('Avaliação Teste A', 5, 'Enviada sem status.');
    exception when others then
      v_estado := sqlstate || ' - ' || sqlerrm;
    end;
    begin
      insert into public.avaliacoes (nome, nota, comentario, status)
      values ('Avaliação Teste B', 5, 'Tentando entrar como aprovada.', 'aprovada');
    exception when others then
      v_estado_b := sqlstate || ' - ' || sqlerrm;
    end;
    reset role;

    select status into v_status from public.avaliacoes where nome = 'Avaliação Teste A';
    select count(*) into n_obtido from public.avaliacoes where nome = 'Avaliação Teste B';

    if v_estado <> 'ok' or v_status is distinct from 'pendente' then
      raise exception E'❌ Teste 6a FALHOU\nEsperado: avaliação gravada como pendente\nObtido: %; status = %', v_estado, v_status;
    end if;
    raise notice '✅ Teste 6a passou: avaliação sem status gravada como pendente';

    if v_estado_b not like '42501%' or n_obtido <> 0 then
      raise exception E'❌ Teste 6b FALHOU\nEsperado: erro 42501 e nada gravado\nObtido: %; % registro(s) gravado(s)', v_estado_b, n_obtido;
    end if;
    raise notice '✅ Teste 6b passou: avaliação "aprovada" recusada e nada gravado';


    -- =========================================================================
    -- TESTE 7 · Certificados (migration 011)
    --
    -- 7a: como anon, lê a tabela certificados. Esperado: sem erro.
    -- 7b: como anon, tenta cadastrar um certificado. Esperado: erro 42501 (RLS)
    --     e nada gravado.
    -- 7c: como administrador, ano depois do ano atual. Esperado: recusado pelo
    --     gatilho (P0001).
    -- 7d: como administrador, imagem fora da pasta certificados/ (ex.: a foto
    --     da Marlene). Esperado: recusado pelo CHECK (23514).
    -- 7e: como administrador, certificado válido sem ano e sem imagem.
    --     Esperado: gravado (e desfeito no final, como tudo aqui).
    -- =========================================================================
    v_estado   := 'ok';
    v_estado_b := 'nenhum erro (o visitante cadastrou um certificado!)';
    set local role anon;
    begin
      perform count(*) from public.certificados;
    exception when others then
      v_estado := sqlstate || ' - ' || sqlerrm;
    end;
    begin
      insert into public.certificados (titulo, instituicao) values ('Certificado Teste Anon', 'Teste');
    exception when others then
      v_estado_b := sqlstate || ' - ' || sqlerrm;
    end;
    reset role;
    select count(*) into n_obtido from public.certificados where titulo = 'Certificado Teste Anon';

    if v_estado <> 'ok' then
      raise exception E'❌ Teste 7a FALHOU\nEsperado: o visitante lê os certificados\nObtido: %', v_estado;
    end if;
    raise notice '✅ Teste 7a passou: visitante lê os certificados';

    if v_estado_b not like '42501%' or n_obtido <> 0 then
      raise exception E'❌ Teste 7b FALHOU\nEsperado: erro 42501 e nada gravado\nObtido: %; % registro(s) gravado(s)', v_estado_b, n_obtido;
    end if;
    raise notice '✅ Teste 7b passou: visitante não cadastra certificado';

    v_estado := 'nenhum erro (aceitou ano no futuro!)';
    begin
      insert into public.certificados (titulo, instituicao, ano)
      values ('Certificado Teste Futuro', 'Teste', extract(year from public.agora_local())::smallint + 1);
    exception when others then
      v_estado := sqlstate || ' - ' || sqlerrm;
    end;
    if v_estado not like 'P0001%' then
      raise exception E'❌ Teste 7c FALHOU\nEsperado: erro P0001 (ano depois deste ano)\nObtido: %', v_estado;
    end if;
    raise notice '✅ Teste 7c passou: ano no futuro recusado';

    v_estado := 'nenhum erro (aceitou imagem fora da pasta certificados/!)';
    begin
      insert into public.certificados (titulo, instituicao, imagem_url, caminho_storage)
      values ('Certificado Teste Caminho', 'Teste', 'https://exemplo.com/x.webp', 'perfil/marlene-souza.webp');
    exception when others then
      v_estado := sqlstate || ' - ' || sqlerrm;
    end;
    if v_estado not like '23514%' then
      raise exception E'❌ Teste 7d FALHOU\nEsperado: erro 23514 (imagem só na pasta certificados/)\nObtido: %', v_estado;
    end if;
    raise notice '✅ Teste 7d passou: imagem fora da pasta certificados/ recusada';

    v_estado := 'ok';
    begin
      insert into public.certificados (titulo, instituicao) values ('Certificado Teste Válido', 'Teste');
    exception when others then
      v_estado := sqlstate || ' - ' || sqlerrm;
    end;
    if v_estado <> 'ok' then
      raise exception E'❌ Teste 7e FALHOU\nEsperado: certificado sem ano e sem imagem gravado\nObtido: %', v_estado;
    end if;
    raise notice '✅ Teste 7e passou: certificado sem ano e sem imagem aceito';


    -- =========================================================================
    -- TESTE 8 · TikTok e Facebook no perfil (migration 011)
    --
    -- 8a: TikTok com espaço. Esperado: recusado pelo CHECK (23514).
    -- 8b: Facebook no formato profile.php?id=. Esperado: aceito.
    -- =========================================================================
    v_estado := 'nenhum erro (aceitou TikTok com espaço!)';
    begin
      update public.perfil set tiktok = 'marlene souza' where id = 1;
    exception when others then
      v_estado := sqlstate || ' - ' || sqlerrm;
    end;
    if v_estado not like '23514%' then
      raise exception E'❌ Teste 8a FALHOU\nEsperado: erro 23514 (usuário do TikTok inválido)\nObtido: %', v_estado;
    end if;
    raise notice '✅ Teste 8a passou: TikTok inválido recusado';

    v_estado := 'ok';
    begin
      update public.perfil set facebook = 'profile.php?id=100012345678' where id = 1;
    exception when others then
      v_estado := sqlstate || ' - ' || sqlerrm;
    end;
    if v_estado <> 'ok' then
      raise exception E'❌ Teste 8b FALHOU\nEsperado: Facebook profile.php?id= aceito\nObtido: %', v_estado;
    end if;
    raise notice '✅ Teste 8b passou: Facebook profile.php?id= aceito';


    -- Fim: dispara o erro sentinela para desfazer TUDO o que os testes criaram.
    raise exception using errcode = 'TST00', message = 'desfazer testes';

  exception when sqlstate 'TST00' then
    -- Chegou aqui = todos os testes passaram e tudo já foi desfeito.
    raise notice 'Todos os testes passaram. Alterações desfeitas.';
  end;
end
$testes$;

-- Só chega aqui se nenhum teste falhou (um teste com falha interrompe a execução).
select '✅ Todos os testes passaram (1a, 1b, 1c, 2a, 2b, 3, 4, 5, 6a, 6b, 7a a 7e, 8a, 8b). Nada foi gravado no banco.' as resultado;
