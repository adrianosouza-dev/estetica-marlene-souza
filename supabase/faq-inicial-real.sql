-- =============================================================================
-- PERGUNTAS FREQUENTES INICIAIS · SOMENTE PARA O PROJETO REAL
--
-- Respostas passadas pela Marlene. Ela ajusta os detalhes depois pelo painel
-- (Perguntas frequentes e Perfil). Rode depois da migration 009.
-- Só cadastra se ainda não houver nenhuma pergunta (pode rodar mais de uma vez).
-- Para a demonstração, as perguntas ficam no seed.sql.
-- =============================================================================

insert into public.perguntas_frequentes (pergunta, resposta, ordem)
select v.pergunta, v.resposta, v.ordem
from (values
  ('Quanto tempo demora o atendimento?',
   'Depende do serviço: a duração de cada um está em "Serviços e preços". Unhas levam de 1h30 a 2h, conforme a cutilagem. Ao agendar, o tempo máximo fica reservado só para você.',
   1),
  ('Preciso pagar adiantado?',
   'Não precisa. O pagamento é feito no dia do atendimento.',
   2),
  ('Quais formas de pagamento são aceitas?',
   'Pix e dinheiro.',
   3),
  ('Como faço para cancelar ou remarcar?',
   'É só avisar pelo WhatsApp. Remarcar é grátis; se precisar cancelar, há uma taxa de R$ 5,00.',
   4),
  ('O que acontece se eu me atrasar?',
   'A tolerância é de 5 minutos. Se for se atrasar, avise pelo WhatsApp.',
   5),
  ('Atende em domicílio?',
   'Sim. Para atendimento em domicílio, combine pelo WhatsApp.',
   6)
) as v (pergunta, resposta, ordem)
where not exists (select 1 from public.perguntas_frequentes);

-- Aviso da tela de confirmação do agendamento (só se ainda estiver vazio)
update public.perfil
   set aviso_cancelamento = 'Se precisar cancelar, há taxa de R$ 5,00. Remarcar é grátis.'
 where id = 1 and aviso_cancelamento is null;

select ordem, pergunta from public.perguntas_frequentes order by ordem;
