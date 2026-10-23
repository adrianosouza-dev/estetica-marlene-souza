# Banco de dados (Supabase)

Passo a passo para preparar um projeto Supabase do zero. Vale para os dois projetos:
o **real** (da Marlene) e o de **demonstração** (portfólio).

## 1. Criar o projeto

No [Supabase](https://supabase.com/dashboard), crie um projeto novo. Escolha a região
**South America (São Paulo)**, que é a mais próxima de Maués.

## 2. Rodar as migrations

Em **SQL Editor > New query**, cole e rode um arquivo por vez, **nesta ordem**:

| Arquivo | O que faz |
|---|---|
| `migrations/001_tabelas.sql` | Cria as tabelas e a trava contra horários encavalados |
| `migrations/002_funcoes.sql` | Funções: horários ocupados, validação de agendamento, fuso de Manaus |
| `migrations/003_seguranca_rls.sql` | Ativa o Row Level Security e define quem pode o quê |
| `migrations/004_storage.sql` | Cria o bucket `galeria` para as fotos |
| `migrations/005_dados_iniciais.sql` | Serviços, horário de funcionamento e perfil iniciais |
| `migrations/006_perfil_foto.sql` | Coluna da foto da profissional no perfil (página Sobre) |
| `migrations/007_whatsapp_opcional_no_painel.sql` | WhatsApp opcional nos agendamentos criados pelo painel (no site continua obrigatório) |
| `migrations/008_limites_regras_agendamento.sql` | Limites das regras editáveis no painel: antecedência de 0 a 48h, agenda aberta de 7 a 90 dias |
| `migrations/009_perguntas_frequentes.sql` | Tabela de perguntas frequentes (editáveis no painel) e aviso de cancelamento no perfil |
| `migrations/010_modo_demonstracao.sql` | Modo demonstração (só é ligado no projeto do portfólio) e colunas protegidas do perfil |

**Perguntas frequentes iniciais**

- Projeto **real**: rode `faq-inicial-real.sql` (respostas passadas pela Marlene e o aviso de
  cancelamento). Só cadastra se ainda não houver perguntas.
- Projeto de **demonstração**: as perguntas já vêm no `seed.sql` (passo 3).

**Lembrete de senha provisória**

O painel mostra "Você ainda está com a senha provisória" até a conta trocar a senha em
Perfil. Para uma conta que não precisa do lembrete (ex.: a sua conta de testes), rode:

```sql
update auth.users
set raw_user_meta_data = coalesce(raw_user_meta_data, '{}'::jsonb) || '{"senha_definida": true}'
where email = 'email-da-conta@exemplo.com';
```

A conta precisa sair e entrar de novo no painel para o lembrete sumir.

## 3. Só no projeto de demonstração

> **Nada desta seção vale para o projeto real.** No projeto real, pule direto para o passo 4.

O projeto de demonstração é o do portfólio: qualquer visitante entra no painel com um
usuário de demonstração, cujo e-mail e senha aparecem na tela de login. Por isso ele
tem o **modo demonstração** ligado (migration 010) e é **restaurado toda madrugada**.
Todos os dados são fictícios.

**O que o modo demonstração muda**

- Ninguém envia, troca ou apaga arquivos do Storage pelo site (nem a foto da Marlene).
- As fotos da galeria não podem ser cadastradas nem removidas; legenda e ordem continuam
  editáveis. A foto do perfil não pode ser trocada.
- Todo o resto (agendamentos, serviços, horários, avaliações, perguntas, perfil) pode ser
  editado pelos visitantes e volta ao original na restauração.
- O contato é fictício: WhatsApp `5592900000000`, sem Instagram, só o bairro no endereço.
  Nenhum visitante chega ao WhatsApp real da Marlene.

**Antes de começar**

Os passos 1 e 2 (projeto e migrations 001 a 010) precisam estar feitos. Escolha agora o
e-mail e a senha do usuário de demonstração (ex.: `demonstracao@example.com`). A senha
fica pública, então use uma senha simples que você não usa em nenhum outro lugar.

**Passo a passo**

1. **Função de restauração.** No SQL Editor, rode `demo-restaurar.sql`.
2. **Usuário de demonstração.** Em **Authentication > Users > Add user > Create new user**,
   informe o e-mail e a senha escolhidos e marque **Auto Confirm User**. Sem essa marcação
   o usuário fica esperando a confirmação por e-mail e o login não funciona.
3. **Ligar o usuário ao perfil e o modo demonstração** (troque o e-mail):

   ```sql
   update public.perfil
   set profissional_id = (select id from auth.users where email = 'demonstracao@example.com'),
       demonstracao = true
   where id = 1
   returning profissional_id, demonstracao;
   ```

   O resultado deve mostrar uma linha com `profissional_id` preenchido e
   `demonstracao = true`. Se `profissional_id` vier vazio, o e-mail não bate com o do
   passo 2. Se não vier nenhuma linha, confira se a migration 005 foi rodada. A partir
   daqui, essas duas colunas só mudam pelo SQL Editor, nunca pelo site.
4. **Fotos.** Faça os passos 7 (galeria) e 8 (foto da Marlene) desta página **antes** do
   seed: a restauração recria a galeria a partir dos arquivos do Storage e do endereço da
   foto da Marlene. O envio pelo painel do Supabase e o SQL Editor continuam funcionando
   no modo demonstração, porque a trava vale só para o site.
5. **Dados fictícios.** Rode `seed.sql`. Ele chama a restauração e preenche agendamentos,
   avaliações, perguntas, serviços, horários, fotos e o perfil. Rodar de novo **apaga e
   recria** tudo. No projeto real ele recusa, porque lá o modo demonstração está desligado.
6. **Restauração automática toda madrugada.**
   - Em **Database > Extensions**, ative `pg_cron`.
   - No SQL Editor, agende a restauração (troque e-mail e senha pelos do passo 2):

   ```sql
   select cron.schedule(
     'restaurar-demonstracao',
     '0 7 * * *',  -- 7h em UTC = 3h em Maués
     $$select public.restaurar_demonstracao('demonstracao@example.com', 'senha-da-demo')$$
   );
   ```

   A senha vai junto para voltar ao normal caso um visitante a troque pelo Perfil. Ela
   fica só nesse agendamento, dentro do Supabase, e não no GitHub. Para trocar a senha
   depois, rode o mesmo comando com a senha nova: o agendamento com o mesmo nome é
   substituído.

   Para conferir:

   ```sql
   select jobname, schedule, active from cron.job;                          -- o agendamento existe?
   select status, return_message, start_time from cron.job_run_details
   order by start_time desc limit 5;                                        -- as últimas execuções
   ```

   Para restaurar na hora, sem esperar a madrugada:
   `select public.restaurar_demonstracao('demonstracao@example.com', 'senha-da-demo');`
7. **Conferir.** Rode `testes.sql` (logo abaixo) e entre no painel do site com o usuário
   de demonstração.

O passo 5 desta página (login da profissional) **não** é feito na demonstração: o usuário de
demonstração faz esse papel.

**Cuidados**

- O e-mail e a senha de demonstração precisam ser **iguais** em três lugares:
  1. no usuário do Supabase (passo 2);
  2. no agendamento do `pg_cron` (passo 6);
  3. no `.env.local` do seu computador (`VITE_DEMO_EMAIL`/`VITE_DEMO_SENHA` e, para os
     testes automáticos, `TESTE_EMAIL`/`TESTE_SENHA`) e nas variáveis do projeto de
     demonstração na Vercel.

  Se mudar em um lugar, mude nos outros. Senão, a madrugada volta a senha antiga e o
  botão de acesso da demonstração para de funcionar.
- `VITE_MODO_DEMO`, `VITE_DEMO_EMAIL` e `VITE_DEMO_SENHA` existem **só** no projeto de
  demonstração da Vercel, nunca no site real da Marlene.
- `TESTE_EMAIL` e `TESTE_SENHA` ficam só no `.env.local` (que não vai para o GitHub).
  Nunca escreva esses valores em arquivos do projeto, commits ou mensagens.
- Testes automáticos que gravam dados rodam **só** no projeto de demonstração. Antes de
  rodar, confira se o `.env.local` aponta para ele.

### Conferir se está tudo certo: `testes.sql`

Rode `testes.sql` inteiro no SQL Editor. Ele testa as regras de segurança e de
agendamento como se fosse uma visitante do site e desfaz tudo no final, sem gravar
nada. Se tudo estiver certo, aparece "✅ Todos os testes passaram". Se algo falhar,
aparece "❌ Teste X FALHOU", com o resultado esperado e o obtido.

## 4. Fechar o cadastro público

Em **Authentication > Sign In / Providers**, desative **Allow new users to sign up**.
Assim ninguém consegue criar conta pelo site.

## 5. Criar o login da profissional

1. Em **Authentication > Users > Add user > Create new user**, informe e-mail e senha
   e marque **Auto Confirm User**.
2. No **SQL Editor**, ligue esse usuário ao perfil (troque o e-mail):

```sql
update public.perfil
set profissional_id = (select id from auth.users where email = 'email-da-profissional@exemplo.com')
where id = 1;
```

Sem esse passo, ninguém consegue editar nada no painel, nem estando logado.
Essa é a segunda camada de proteção.

## 6. Conectar o site

Em **Project Settings > API**, copie a **Project URL** e a chave **anon / publishable**
para o arquivo `.env.local` na raiz do projeto (use `.env.example` como modelo).

> A chave `service_role` / `secret` **nunca** vai para o site nem para o GitHub.

## 7. Fotos iniciais da galeria

As fotos ficam no Storage (bucket `galeria`) e são listadas na tabela `fotos`.
A partir da Fase 7, a Marlene envia e remove fotos pelo painel. As 4 fotos atuais
entram uma única vez, à mão. **Repita este passo nos dois projetos** (real e demonstração).

Os arquivos já otimizados (.webp, sem dados de localização) estão em
`fotos-otimizadas/galeria/`. Essa pasta não vai para o GitHub.

**Enviar os arquivos**

1. No painel do projeto, abra **Storage** e clique no bucket **galeria**.
2. Clique em **Upload files** e selecione os 4 arquivos de `fotos-otimizadas/galeria/`.
   Envie na **raiz** do bucket (sem criar pasta) e **sem renomear**:
   - `pedicure-branca-com-flor-rosa.webp`
   - `pedicure-rosa-com-flores-delicadas.webp`
   - `pedicure-branca-com-flores-coloridas.webp`
   - `pedicure-branca-com-detalhe-azul.webp`

O envio pelo painel usa o seu login de dono do projeto. Nenhuma chave
(`service_role` ou outra) é necessária.

**Cadastrar na tabela**

1. Abra `fotos-iniciais.sql` e troque a URL na linha marcada com `TROQUE AQUI`
   pela **Project URL** do projeto (**Project Settings > API**).
2. Cole no **SQL Editor** e rode.
3. O resultado lista as 4 fotos com a URL de cada uma. Abra uma delas no navegador
   para conferir.

Se aparecer erro, a mensagem diz o que corrigir: a URL não foi trocada, ou algum
arquivo não está no bucket com o nome exato. Rodar de novo não duplica fotos.

> Atenção: depois de rodar, **não salve a URL trocada no arquivo do projeto**. Desfaça
> a troca para o arquivo continuar servindo para os dois projetos.

## 8. Foto da Marlene (página Sobre)

A foto fica no mesmo bucket `galeria`, numa pasta `perfil`, separada dos trabalhos.
A Marlene autorizou o uso da foto e do nome no site e no portfólio, então
**repita este passo nos dois projetos**. Antes, confira se a migration
`006_perfil_foto.sql` já foi rodada.

**Enviar o arquivo**

1. Em **Storage > galeria**, clique em **Create folder** e crie a pasta `perfil`.
2. Entre na pasta `perfil`, clique em **Upload files** e envie
   `fotos-otimizadas/sobre/marlene-souza.webp`, **sem renomear**.

**Ligar ao perfil**

1. Abra `foto-perfil.sql` e troque a URL na linha `TROQUE AQUI` pela **Project URL**.
2. Rode no **SQL Editor**. O resultado mostra a URL da foto. Abra no navegador para conferir.
3. Desfaça a troca da URL no arquivo, como no passo 7.

## 9. Recuperação de senha ("Esqueci minha senha")

A tela de login tem "Esqueci minha senha". O Supabase envia um e-mail com um link
para `/admin/nova-senha`, onde a profissional cria uma senha nova. **Faça nos dois
projetos**, cada um com o endereço do seu site.

**1. Endereços permitidos**

Em **Authentication > URL Configuration**:

- **Site URL**: o endereço do site na Vercel, ex.: `https://seu-site.vercel.app`
- **Redirect URLs**: clique em **Add URL** e adicione:
  - `https://seu-site.vercel.app/admin/nova-senha`
  - `http://localhost:5173/admin/nova-senha` (para testar no computador)

Sem isso, o link do e-mail é recusado ou leva para a página errada.

**2. E-mail em português**

Em **Authentication > Emails > Reset Password**, troque:

- **Subject**: `Crie uma nova senha para o painel`
- **Body** (mantenha o `{{ .ConfirmationURL }}` exatamente assim):

```html
<h2>Criar nova senha</h2>
<p>Recebemos um pedido para criar uma nova senha para o painel da Marlene Souza.</p>
<p><a href="{{ .ConfirmationURL }}">Criar nova senha</a></p>
<p>Se não foi você, ignore este e-mail. A senha atual continua valendo.</p>
```

**3. Tamanho mínimo da senha**

Em **Authentication > Sign In / Providers > Email**, coloque **Minimum password length**
em `8`, igual ao que a tela pede.

**4. Atenção ao envio de e-mails**

O serviço de e-mail que vem pronto no Supabase serve só para testes: envia poucos
e-mails por hora e **só para endereços da equipe do projeto** no Supabase. Para a
Marlene receber o link no projeto real, configure um serviço de e-mail próprio
(SMTP) em **Authentication > Emails > SMTP Settings**. Existem opções gratuitas para
poucos envios, como Resend ou Brevo. Enquanto isso não for feito, a senha pode ser
redefinida por você em **Authentication > Users**.

## Como as regras funcionam

**Quem pode o quê**

| | Visitante | Profissional |
|---|---|---|
| Serviços | vê os ativos | tudo |
| Horários, bloqueios, fotos, perfil | vê | tudo |
| Agendamentos | só cria (sempre `pendente`) | tudo |
| Avaliações | vê as aprovadas e envia (sempre `pendente`) | tudo |

- **Horários livres:** o público não lê a tabela `agendamentos`. O site chama
  `horarios_ocupados(dia)`, que devolve só início e fim.
- **Validação no banco:** antes de gravar um agendamento do público, o banco calcula
  o fim pela duração do serviço e confere expediente, almoço, bloqueios e antecedência
  (perfil: `antecedencia_minima_minutos` e `dias_maximos_agendamento`). A profissional
  pode encaixar horários fora dessas regras.
- **Erros que o site trata:**
  - `23P01`: horário já ocupado. Duas clientes tentaram o mesmo horário.
  - `P0001`: regra de agenda. A mensagem já vem em português, pronta para mostrar.
- **Fuso horário:** horários de atendimento ficam no horário de Maués
  (`America/Manaus`), em colunas `timestamp`.
