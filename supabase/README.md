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

## 3. Só no projeto de demonstração: `seed.sql`

Rode `seed.sql` para preencher agendamentos e avaliações **fictícios**.
**Nunca rode no projeto real.** As datas são relativas ao dia em que o seed roda.

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
