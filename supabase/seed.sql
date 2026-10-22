-- =============================================================================
-- SEED · SOMENTE PARA O PROJETO DE DEMONSTRAÇÃO (portfólio)
--
-- ⚠ NÃO RODE NO PROJETO REAL DA MARLENE (e ele recusa: veja a trava abaixo).
-- Todos os nomes, telefones e avaliações são FICTÍCIOS.
--
-- Os dados da demonstração ficam num lugar só: a função
-- public.restaurar_demonstracao(), criada por demo-restaurar.sql. Este seed só
-- a chama. A mesma função roda toda madrugada pelo pg_cron.
--
-- Antes, no projeto de demonstração:
--   1. migrations 001 a 010;
--   2. demo-restaurar.sql;
--   3. ligar o modo demonstração (passo a passo no supabase/README.md):
--        update public.perfil set demonstracao = true where id = 1;
--
-- As datas são relativas ao dia em que roda: a agenda sempre parece "atual".
-- Rodar de novo APAGA o que existir e recria tudo (agendamentos, avaliações...).
-- =============================================================================

do $$
begin
  if not public.eh_demonstracao() then
    raise exception 'Seed recusado: ligue o modo demonstração antes (perfil.demonstracao = true). Nunca rode no projeto real.';
  end if;
end
$$;

select public.restaurar_demonstracao();
