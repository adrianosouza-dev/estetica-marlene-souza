# Sistema de agendamento: Marlene Souza (unhas e sobrancelhas)

Você vai me ajudar a construir um sistema de agendamento para uma profissional de unhas e sobrancelhas. É um projeto real para uma cliente e também vai para o meu portfólio no GitHub, então o código precisa ser limpo, organizado e bem documentado.

Estou aprendendo: ao final de cada fase, me explique em poucas linhas o que foi feito e por quê. Se eu perguntar o porquê de alguma decisão, explique de forma simples.

## Sobre o negócio

- Profissional: Marlene Souza. O espaço ainda não tem nome; use "Marlene Souza" como marca.
- Atende só unhas e sobrancelhas.
- Serviços iniciais: Manicure, Pedicure, Manicure e pedicure, Design de sobrancelhas. Os preços ficam como R$ 0 provisoriamente (mostrar "Consultar" no site) e ela vai editar pelo painel.
- Unhas levam de 1h30 a 2h, dependendo da cutilagem. Para não encavalar clientes, o sistema reserva o tempo máximo de cada serviço.
- Funcionamento: 8h às 17h, de segunda a sábado. Isso deve ser editável no painel, incluindo intervalo de almoço.
- Local: Bairro Donga Micheles, Maués-AM (grafia do bairro ainda a confirmar).
- As clientes acessam quase sempre pelo celular: mobile first.

## Stack

- Vite + React (JavaScript, sem TypeScript) + React Router
- Supabase: banco Postgres, Auth (login da profissional) e Storage (fotos da galeria)
- CSS puro com variáveis (sem Tailwind), organizado em src/styles
- Deploy na Vercel

## Estrutura de pastas

```
src/config            dados do negócio (valores de reserva)
src/lib               cliente do Supabase, cálculo de disponibilidade, formatadores
src/hooks             useAuth e outros hooks
src/components/ui     Botao, Campo, Modal, Aviso
src/components/layout LayoutPublico, LayoutAdmin, RotaProtegida, Rodape
src/components/secoes blocos usados em mais de uma página (FAQ, avaliações)
src/components/agendamento passos do fluxo de agendamento
src/pages/publico     páginas das clientes
src/pages/admin       páginas do painel
src/styles            tokens.css, global.css
supabase/migrations   SQL das tabelas, segurança e funções
supabase/seed.sql     dados fictícios para a demonstração
fotos-originais       fotos reais enviadas por mim (não vai para o GitHub)
```

## Parte pública (para as clientes)

- **Início (/):** frase de impacto, descrição curta e acolhedora, botão "Agendar meu horário", algumas fotos da galeria e a seção de avaliações aprovadas.
- **Serviços e preços (/servicos):** lista vinda do banco, só serviços ativos, com duração e preço.
- **Galeria (/galeria):** fotos cadastradas pela profissional.
- **Agendamento (/agendar):** 4 passos (serviço, dia, horário livre, nome + WhatsApp) e tela de confirmação com botão para avisar a profissional no WhatsApp.
- **Sobre (/sobre):** texto sobre a Marlene, editável no painel, e a seção "Certificados e cursos" (some quando não há nenhum).
- **Contato e localização (/contato):** endereço, link do mapa, WhatsApp, redes sociais (Instagram, TikTok e Facebook, com ícone, só as preenchidas) e horário de funcionamento.
- **Avaliações:** seção na página inicial mostrando só avaliações aprovadas (nome, nota de 1 a 5 e comentário). Página /avaliar com formulário para a cliente deixar a avaliação; chega como "pendente". Nunca invente avaliações no site real; avaliações fictícias só no seed.sql da demonstração.
- **FAQ (/perguntas e um resumo na página inicial):** perguntas em formato de acordeão acessível (`<details>`). As perguntas ficam na tabela `perguntas_frequentes` e a Marlene edita no painel (/admin/perguntas); as respostas iniciais do projeto real estão em supabase/faq-inicial-real.sql. Perguntas iniciais:
  - Quanto tempo demora o atendimento?
  - Preciso pagar adiantado?
  - Quais formas de pagamento são aceitas?
  - Como faço para cancelar ou remarcar?
  - O que acontece se eu me atrasar?
  - Atende em domicílio?
- **Footer em todas as páginas públicas:** nome, endereço, horário de funcionamento, links para WhatsApp e redes sociais (Instagram, TikTok e Facebook, só as preenchidas), links rápidos (Serviços, Agendar, FAQ) e ano atual com "Todos os direitos reservados". Discreto, sem ser poluído.

## Parte administrativa (para a profissional)

- **Login (/admin/login):** e-mail e senha (Supabase Auth). Todas as rotas /admin ficam protegidas.
- **Dashboard (/admin):** agendamentos de hoje, próximos agendamentos, total da semana e avaliações pendentes.
- **Agenda (/admin/agenda):** visão por dia, com opção de confirmar, concluir ou cancelar.
- **Serviços (/admin/servicos):** criar, editar, ativar/desativar, com preço e duração.
- **Horários (/admin/horarios):** funcionamento por dia da semana, almoço e bloqueios (folgas, feriados).
- **Fotos (/admin/fotos):** upload para o Supabase Storage, legenda e remoção.
- **Histórico (/admin/historico):** agendamentos passados, com filtro por período e por cliente.
- **Avaliações (/admin/avaliacoes):** lista de pendentes e aprovadas, com botões aprovar e remover.
- **Perguntas frequentes (/admin/perguntas):** criar, editar, esconder, ordenar e apagar.
- **Certificados (/admin/certificados):** criar, editar, ordenar e remover; título e instituição obrigatórios, ano e imagem opcionais. A imagem passa pelo mesmo preparo das fotos e a tela avisa para cobrir CPF, RG e outros dados pessoais. Ao remover, o arquivo sai do Storage.
- **Perfil:** editar o texto do "Sobre", os dados de contato (WhatsApp, Instagram, TikTok e Facebook; as redes aceitam @usuario ou o link e guardam só o usuário), a foto, o aviso de cancelamento mostrado na confirmação do agendamento e trocar a senha (com lembrete no início do painel enquanto a senha provisória não for trocada).

## Regras do banco (muito importante)

- Escreva o SQL em arquivos dentro de supabase/migrations, para eu rodar no SQL Editor do Supabase.
- Tabelas: servicos, horarios_funcionamento, bloqueios, agendamentos, fotos, avaliacoes, perfil, perguntas_frequentes, certificados.
- Ative Row Level Security em todas as tabelas.
- O público (anon) pode: ler serviços ativos, fotos, horários, bloqueios, perfil, certificados e avaliações aprovadas; criar agendamentos para hoje em diante; criar avaliações (sempre como pendente).
- O público NÃO pode ler a tabela de agendamentos (tem nome e telefone das clientes). Para mostrar os horários livres, crie uma função SQL security definer que retorna só início e fim dos horários ocupados de um dia.
- Impeça dois agendamentos no mesmo horário direto no banco, com uma exclusion constraint em tsrange, ignorando os cancelados. No site, trate esse erro (código 23P01) com uma mensagem amigável.
- Tabela avaliacoes: nome, nota de 1 a 5, comentario, status (pendente/aprovada), criado_em.
- Só o usuário autenticado (a profissional) pode editar serviços, horários, bloqueios, fotos, perfil, agendamentos, avaliações, perguntas e certificados.
- Migration nova com o site no ar: rodar na demonstração e testar, depois rodar no real, e SÓ ENTÃO enviar o código ao GitHub (o código novo lê o que a migration cria). Ordem descrita no supabase/README.md.
- Crie um seed.sql com dados fictícios para a versão de demonstração do portfólio.

## Fotos

- A pasta fotos-originais tem fotos reais de unhas feitas pela Marlene. Otimize para web (redimensione e converta para .webp), renomeie com nomes descritivos e use na galeria e na página inicial.
- Coloque fotos-originais no .gitignore.
- A galeria usa só fotos reais do trabalho da Marlene. Fotos de banco de imagem gratuito (Unsplash/Pexels) só podem aparecer como decoração, nunca na galeria de trabalhos. Nunca use imagens do Google.

## Identidade visual

- Cores: fundo rosado #FCECEC, texto vinho #3A0F1E, destaque vermelho guaraná #C8233A, verde #2E5B45 para confirmações.
- Fontes: Fraunces para títulos e Figtree para textos (Google Fonts).
- Elemento de destaque: ilustração em SVG de um guaraná aberto (casca vermelha, polpa branca, semente escura), símbolo de Maués, na página inicial.
- Sem cara de template: nada de cards iguais com sombra em tudo, nada de animação em cada seção.
- Acessível: foco visível no teclado, bom contraste e respeito a prefers-reduced-motion.
- O painel admin pode ser mais simples e funcional, mas usando as mesmas cores.

## Segurança

- Nunca coloque chaves reais no código: use sempre variáveis de ambiente (VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY) e mantenha um .env.example.
- .env e .env.local ficam no .gitignore.
- Haverá dois projetos Supabase: um real (da Marlene) e um de demonstração (para o portfólio, só com dados fictícios).

## Como trabalhar

Faça em fases. No início de cada fase, me mostre o plano e espere eu aprovar. No final, faça um commit em português com mensagem clara (ex.: "feat: página de serviços com dados do Supabase") e marque a fase como concluída na seção Andamento abaixo.

Se tiver dúvida sobre alguma regra do negócio, me pergunte em vez de inventar.

1. **Configuração:** criar o projeto, git, rotas, layouts público e admin, estilos base e cliente do Supabase com .env.example
2. **Banco:** migrations, RLS, funções e seed
3. **Páginas públicas:** início, serviços, galeria (com as fotos otimizadas), sobre, contato, FAQ, avaliações (vitrine e formulário /avaliar) e footer
4. **Agendamento:** fluxo completo de agendamento
5. **Login:** login e rotas protegidas
6. **Painel parte 1:** dashboard, agenda e histórico
7. **Painel parte 2:** serviços, horários, fotos, avaliações e perfil
8. **Portfólio:** README com descrição, prints, tecnologias, como rodar e link do deploy; revisão de responsividade; checagem de que nenhuma chave secreta vai para o GitHub
9. **Redes e certificados (pedido da Marlene):** TikTok e Facebook no Perfil, ícones no rodapé e no Contato, e certificados (tabela, tela no painel e seção no Sobre)

## Melhorias futuras

Fora do escopo das fases atuais; anotadas para depois.

- **Agenda em tempo real (Supabase Realtime):** hoje o painel recarrega ao voltar para ele e tem o botão "Atualizar". Com Realtime, um agendamento feito pelo site apareceria na hora (exige migration ativando a publicação da tabela e mais configuração).
- **E-mail próprio (SMTP) no projeto real:** configurar um serviço de e-mail próprio (como o Resend) no Supabase real. Sem isso, o "Esqueci minha senha" não chega para a Marlene: o e-mail padrão do Supabase só envia para a equipe do projeto. Depende de a Marlene decidir se registra um domínio no nome dela (ver decisões). Até lá, a senha dela é redefinida em Authentication > Users.
- **Links do autor no README:** acrescentar LinkedIn e portfólio na seção "Autor" quando o usuário pedir (hoje só o GitHub).
- **Guardar o preço no agendamento:** gravar o preço do serviço no momento do agendamento, para o histórico e os valores não mudarem quando a Marlene atualizar os preços. Depois disso, mostrar o total em reais dos atendimentos concluídos no histórico.

## Andamento

- [x] Fase 1: Configuração
- [x] Fase 2: Banco
- [x] Fase 3: Páginas públicas
- [x] Fase 4: Agendamento
- [x] Fase 5: Login
- [x] Fase 6: Painel parte 1
- [x] Fase 7: Painel parte 2
- [x] Fase 8: Portfólio
- [ ] Fase 9: Redes e certificados

Ao terminar uma fase, marque com [x] aqui.

### Fase 9: estado atual (para continuar em outro chat)

- Código: migration 011 (tiktok e facebook no perfil; tabela certificados com RLS, imagem só na pasta certificados/, gatilho com o limite do ano e a trava da demonstração), Perfil, ícones (src/components/ui/ItensRedes.jsx e src/lib/redes.js), tela /admin/certificados, seção no Sobre, testes de unidade (incluindo src/lib/certificados.test.js com Supabase simulado), testes.sql (7a a 7e, 8a, 8b), conferir-real.sql, demo-restaurar.sql (3 certificados fictícios sem imagem; TikTok e Facebook vazios) e supabase/README.md.
- Demonstração: 011, demo-restaurar.sql, restauração e testes.sql rodados pelo usuário; testes automáticos contra a demonstração passando.
- Real: 011 rodada pelo usuário e conferir-real.sql todo ✅ (9 de 9 tabelas, RLS com certificados, 0 certificados).
- **Falta:** enviar ao GitHub e conferir a demonstração primeiro e o real depois (só leitura); marcar a fase 9.
- Decisões: título e instituição obrigatórios, ano opcional; ícones também no Instagram; TikTok e Facebook vazios na demonstração.

### Fase 8: estado atual

A fase 8 foi dividida em 7 etapas; cada etapa é aprovada pelo usuário antes de começar. Fase concluída (a etapa 4 ficou em "Melhorias futuras").

- [x] **Etapa 1: senha, FAQ e avisos.** FAQ no banco e no painel (migration 009, /admin/perguntas), aviso de cancelamento no Perfil, "Trocar minha senha" e lembrete de senha provisória. Testada e enviada ao GitHub.
- [x] **Etapa 2: modo demonstração.** Migration 010, demo-restaurar.sql, seed.sql chamando a restauração, VITE_MODO_DEMO no site e passo a passo na seção 3 do supabase/README.md. Supabase de demonstração configurado e testado com o usuário de demonstração (login, Storage e fotos travados, perfil/marlene-souza.webp intacta). Enviada ao GitHub.
- [x] **Etapa 3: projeto Supabase real.** "Roteiro do projeto real" no topo do supabase/README.md (10 itens) e supabase/conferir-real.sql (só leitura, tabela de ✅/❌, pode rodar com o site em uso). Projeto real montado pelo usuário seguindo o roteiro; conferir-real.sql todo ✅. Sem seed.sql. As chaves do projeto real não vão para o .env.local; só para a Vercel, na etapa 5.
- **Etapa 4: e-mail próprio (SMTP).** Adiada e movida para "Melhorias futuras" (ver decisões).
- [x] **Etapa 5: dois sites na Vercel.** Passo a passo na seção 6 do supabase/README.md; site real em https://estetica-marlene-souza.vercel.app (Supabase real, variáveis só em Production, sem variáveis de demonstração) e demonstração em https://marlene-souza-demo.vercel.app (projeto Vercel marlene-souza-demo, Supabase de demonstração, VITE_MODO_DEMO=true). Os dois conferidos lendo o JavaScript publicado; testes da etapa 2 passando na demonstração; leitura pública do banco real conferida. Conferência visual do site real no celular feita pelo usuário.
- [x] **Etapa 6: desempenho.** Área /admin inteira (rotas, login, sessão e CSS do painel) carregada sob demanda em src/pages/admin/RotasAdmin.jsx; React, roteador e Supabase em arquivos próprios (codeSplitting no vite.config.js); cache de 1 ano em /assets no vercel.json. Medido no site de demonstração (Chrome real, kB transferidos):
  - site público, 1ª visita: JS 151,9 → 151,1 kB; CSS 7,5 → 5,3 kB; nada do painel é baixado;
  - 2ª visita: arquivos de JS que vão ao servidor 2 de 2 → 0 de 5;
  - painel: tela de login 155,9 kB de JS (o público + módulo do painel); ao entrar, +6 kB;
  - Lighthouse celular (mediana de 5, antes e depois alternados no mesmo computador): / 79 → 87, /agendar 78 → 82, /galeria 61 → 63. Diferenças dentro da oscilação: a 1ª visita não mudou; o ganho está na 2ª visita e nos deploys.
  - Salto de layout (CLS, Lighthouse celular, mediana de 3, site de demonstração): /galeria 0,308 → 0,022; /agendar 0,119 → 0; / 0,016 → 0,016 (bom: abaixo de 0,1). Causa: o rodapé era empurrado quando os dados chegavam. Correção: área de conteúdo com altura mínima da tela (layout.css) e fotos da galeria e do início com width/height + aspect-ratio + height: auto. O 0,022 que sobra na galeria é o botão "Agendar meu horário" descendo quando as fotos substituem o "Carregando…".
- [x] **Etapa 7: revisão final e README.** Prints de todas as telas (320 a 1366px), checagem de acessibilidade (axe), varredura do histórico do git atrás de chaves, README do projeto com prints da demonstração e links:
  - 2 primeiras fotos da galeria sem lazy (a 1ª com fetchpriority alta): LCP da /galeria 4,28 → 4,14 s, nota 62 → 74 (mediana de 7, antes e depois alternados). Ganho pequeno: o gargalo é a foto só começar a baixar depois do JavaScript e da consulta ao banco.
  - Responsividade (18 telas × 320, 390, 768 e 1366px): corrigidos o menu do painel em 768px (rolagem lateral) e o cabeçalho público em 320px. Nenhuma rolagem lateral restante.
  - axe (18 telas × 390 e 1366px): nada crítico nem sério. Restam 2 itens leves (faixa da demonstração fora das regiões da página; alt da foto igual à legenda na galeria), mostrados ao usuário.
  - Histórico do git (27 commits): nenhum .env, foto original, chave ou valor do .env.local; só falsos positivos (URL de exemplo e código que trata senha).
  - README.md com docs/prints (5 prints .webp da demonstração). Sem link do site real (só a demonstração), só português, sem licença; seção "Como o projeto foi desenvolvido" no texto do usuário; "Autor" só com o GitHub por enquanto.
  - Os 2 itens leves do axe ficam como estão (decisão do usuário).

**Decisões já tomadas**

- FAQ fica no banco e a Marlene edita no painel (não em src/config).
- SMTP adiado: a Marlene vai decidir se registra um domínio no nome dela; se sim, Resend com o domínio. Até lá, a senha dela é redefinida pelo painel do Supabase (Authentication > Users).
- Restauração da demonstração todo dia às 3h de Maués (7h UTC), pelo pg_cron, com a função public.restaurar_demonstracao(email, senha).
- Usuário de demonstração: demonstracao@example.com.
- WhatsApp real: a Marlene preenche em Perfil no primeiro acesso (não entra no roteiro). Enquanto estiver vazio, os botões do WhatsApp ficam escondidos no site.
- Bairro: fica "Donga Micheles" até a Marlene confirmar a grafia; ela corrige pelo Perfil.
- Site URL do projeto real (Authentication > URL Configuration): o endereço atual da Vercel, que vira o site real na etapa 5.
- Demonstração com contato fictício: WhatsApp 5592900000000, sem Instagram, só o bairro no endereço. Nenhum visitante do portfólio pode chegar ao WhatsApp real da Marlene.
- A 5ª foto que aparecia na galeria da demonstração ("Pedicure em marrom...") era um teste e foi apagada.
- Depois que a Marlene começar a usar o site real, nenhum teste automático roda no projeto real: testes só na demonstração.

**Cuidados**

- Ao criar o usuário de demonstração no Supabase, marcar **Auto Confirm User**.
- O e-mail e a senha de demonstração precisam ser **iguais** em três lugares: no usuário do Supabase, no agendamento do pg_cron e no .env.local (TESTE_EMAIL/TESTE_SENHA e VITE_DEMO_EMAIL/VITE_DEMO_SENHA).
- VITE_MODO_DEMO, VITE_DEMO_EMAIL e VITE_DEMO_SENHA só existem no projeto de demonstração da Vercel, nunca no site real.
- Credenciais de teste (TESTE_*) nunca vão para arquivos do repositório nem para mensagens.