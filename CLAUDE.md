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
- **Sobre (/sobre):** texto sobre a Marlene, editável no painel.
- **Contato e localização (/contato):** endereço, link do mapa, WhatsApp e horário de funcionamento.
- **Avaliações:** seção na página inicial mostrando só avaliações aprovadas (nome, nota de 1 a 5 e comentário). Página /avaliar com formulário para a cliente deixar a avaliação; chega como "pendente". Nunca invente avaliações no site real; avaliações fictícias só no seed.sql da demonstração.
- **FAQ (/perguntas e um resumo na página inicial):** perguntas em formato de acordeão acessível (`<details>`). As perguntas ficam na tabela `perguntas_frequentes` e a Marlene edita no painel (/admin/perguntas); as respostas iniciais do projeto real estão em supabase/faq-inicial-real.sql. Perguntas iniciais:
  - Quanto tempo demora o atendimento?
  - Preciso pagar adiantado?
  - Quais formas de pagamento são aceitas?
  - Como faço para cancelar ou remarcar?
  - O que acontece se eu me atrasar?
  - Atende em domicílio?
- **Footer em todas as páginas públicas:** nome, endereço, horário de funcionamento, links para WhatsApp e Instagram, links rápidos (Serviços, Agendar, FAQ) e ano atual com "Todos os direitos reservados". Discreto, sem ser poluído.

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
- **Perfil:** editar o texto do "Sobre", os dados de contato, a foto, o aviso de cancelamento mostrado na confirmação do agendamento e trocar a senha (com lembrete no início do painel enquanto a senha provisória não for trocada).

## Regras do banco (muito importante)

- Escreva o SQL em arquivos dentro de supabase/migrations, para eu rodar no SQL Editor do Supabase.
- Tabelas: servicos, horarios_funcionamento, bloqueios, agendamentos, fotos, avaliacoes, perfil, perguntas_frequentes.
- Ative Row Level Security em todas as tabelas.
- O público (anon) pode: ler serviços ativos, fotos, horários, bloqueios, perfil e avaliações aprovadas; criar agendamentos para hoje em diante; criar avaliações (sempre como pendente).
- O público NÃO pode ler a tabela de agendamentos (tem nome e telefone das clientes). Para mostrar os horários livres, crie uma função SQL security definer que retorna só início e fim dos horários ocupados de um dia.
- Impeça dois agendamentos no mesmo horário direto no banco, com uma exclusion constraint em tsrange, ignorando os cancelados. No site, trate esse erro (código 23P01) com uma mensagem amigável.
- Tabela avaliacoes: nome, nota de 1 a 5, comentario, status (pendente/aprovada), criado_em.
- Só o usuário autenticado (a profissional) pode editar serviços, horários, bloqueios, fotos, perfil, agendamentos e avaliações.
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
   - No projeto Supabase real, configurar um serviço de e-mail próprio (SMTP, como o Resend). Sem isso, o "Esqueci minha senha" não chega para a Marlene: o e-mail padrão do Supabase só envia para a equipe do projeto.

## Melhorias futuras

Fora do escopo das fases atuais; anotadas para depois.

- **Agenda em tempo real (Supabase Realtime):** hoje o painel recarrega ao voltar para ele e tem o botão "Atualizar". Com Realtime, um agendamento feito pelo site apareceria na hora (exige migration ativando a publicação da tabela e mais configuração).
- **Guardar o preço no agendamento:** gravar o preço do serviço no momento do agendamento, para o histórico e os valores não mudarem quando a Marlene atualizar os preços. Depois disso, mostrar o total em reais dos atendimentos concluídos no histórico.

## Andamento

- [x] Fase 1: Configuração
- [x] Fase 2: Banco
- [x] Fase 3: Páginas públicas
- [x] Fase 4: Agendamento
- [x] Fase 5: Login
- [x] Fase 6: Painel parte 1
- [x] Fase 7: Painel parte 2
- [ ] Fase 8: Portfólio

Ao terminar uma fase, marque com [x] aqui.