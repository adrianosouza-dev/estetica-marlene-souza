-- =============================================================================
-- 005 · Dados iniciais (projeto real E projeto de demonstração)
--
-- Valores provisórios marcados com CONFIRMAR: a Marlene ajusta tudo pelo painel.
-- Pode rodar mais de uma vez sem duplicar nada.
-- =============================================================================


-- Serviços: preço 0 aparece como "Consultar" no site -----------------------------
insert into public.servicos (nome, descricao, duracao_minutos, preco, ordem)
select v.nome, v.descricao, v.duracao_minutos, 0, v.ordem
from (values
  ('Manicure',               'Cutilagem, esmaltação e acabamento das unhas das mãos.', 120, 1), -- CONFIRMAR duração
  ('Pedicure',               'Cutilagem, esmaltação e acabamento das unhas dos pés.',  120, 2), -- CONFIRMAR duração
  ('Manicure e pedicure',    'Mãos e pés no mesmo atendimento.',                       180, 3), -- CONFIRMAR duração
  ('Design de sobrancelhas', 'Modelagem das sobrancelhas de acordo com o seu rosto.',   60, 4)  -- CONFIRMAR duração
) as v (nome, descricao, duracao_minutos, ordem)
where not exists (select 1 from public.servicos s where s.nome = v.nome);


-- Funcionamento: segunda a sábado, 8h às 17h, almoço 12h às 13h (CONFIRMAR almoço)
insert into public.horarios_funcionamento (dia_semana, aberto, abre, fecha, almoco_inicio, almoco_fim)
values
  (0, false, null,    null,    null,    null),    -- domingo
  (1, true,  '08:00', '17:00', '12:00', '13:00'), -- segunda
  (2, true,  '08:00', '17:00', '12:00', '13:00'), -- terça
  (3, true,  '08:00', '17:00', '12:00', '13:00'), -- quarta
  (4, true,  '08:00', '17:00', '12:00', '13:00'), -- quinta
  (5, true,  '08:00', '17:00', '12:00', '13:00'), -- sexta
  (6, true,  '08:00', '17:00', '12:00', '13:00')  -- sábado
on conflict (dia_semana) do nothing;


-- Perfil: a linha única. O texto do "Sobre" e o WhatsApp a Marlene preenche no painel.
insert into public.perfil (id, endereco)
values (1, 'Bairro Donga Micheles, Maués-AM') -- CONFIRMAR grafia do bairro
on conflict (id) do nothing;
