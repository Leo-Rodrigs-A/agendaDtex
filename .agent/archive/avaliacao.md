Li o plano inteiro. **A direção é boa e, para o estágio atual do projeto, eu faria essa migração.** Você está saindo de uma arquitetura que começou como protótipo — Apps Script + Sheets — para uma arquitetura coerente com o que o sistema está virando: Postgres + autenticação + autorização.

Mas há **alguns pontos importantes que eu mudaria antes de você começar**, principalmente em RLS, migração dos usuários e regras de negócio.

Pesquisei a documentação atual do Supabase porque esses detalhes mudam e são justamente os lugares onde é fácil criar uma falha de segurança.

## Minha avaliação geral

Eu colocaria assim:

| Área                            | Avaliação                                          |
| ------------------------------- | -------------------------------------------------- |
| Escolha do Supabase             | **Muito boa**                                      |
| Manter SPA/Vite                 | **Boa**                                            |
| Separação por services          | **Boa**                                            |
| Migração incremental por branch | **Muito boa**                                      |
| RLS                             | **Boa ideia, mas precisa corrigir algumas coisas** |
| Auth                            | **Boa arquitetura**                                |
| Migração de dados               | **Precisa ajustar o conceito de ID**               |
| DataProvider                    | **Boa estratégia de transição**                    |
| Offline/PWA                     | **Precisa repensar**                               |
| Regras de negócio               | **Precisa sair parcialmente do frontend**          |
| Ordem das fases                 | **Eu mudaria um pouco**                            |

O plano está bem mais maduro do que os primeiros protótipos que você estava fazendo com Apps Script.

---

# 1. O maior problema: `role` não deve vir de `user_metadata`

Você escreveu:

> trigger `handle_new_user`: ... lendo `raw_user_meta_data->>'name'/'role'`

E depois:

> policies ... via `auth.jwt() -> 'user_metadata' ->> 'role'`

**Nome pode vir de `user_metadata`. Role não.**

A própria documentação do Supabase alerta explicitamente que `raw_user_meta_data` pode ser alterado pelo próprio usuário autenticado e, portanto, **não deve ser usado para autorização**. Para autorização, `raw_app_meta_data` é apropriado porque o usuário não pode alterá-lo. ([Supabase](https://supabase.com/docs/guides/database/postgres/row-level-security?utm_source=chatgpt.com 'Row Level Security | Supabase Docs'))

Mas eu iria um passo além:

### Para seu projeto, eu manteria o `role` em `profiles`

```text
auth.users
    │
    │ 1:1
    ▼
profiles
    ├── id
    ├── name
    ├── role
    └── is_active
```

E as policies consultariam `profiles.role`.

Por quê?

Porque você já criou `profiles` justamente para representar o usuário da aplicação.

Não precisa colocar a mesma informação em:

```text
auth.users
profiles
JWT
```

sem necessidade.

Para 2–3 usuários, uma função como:

```text
is_admin()
```

que consulta `profiles.role` é perfeitamente razoável.

Custom claims são interessantes quando o sistema cresce e você precisa de RBAC mais sofisticado. O Supabase inclusive possui um mecanismo próprio de Custom Access Token Hooks para isso.

**Eu não adicionaria custom claims agora.**

---

# 2. Tem um problema importante na sua policy de `orders`

Você escreveu:

> UPDATE (`is_done`) para autenticados (qualquer um conclui pedido)

Isso parece correto à primeira vista.

Mas existe uma pegadinha:

**RLS controla linhas, não colunas.**

Se você permitir:

```text
UPDATE orders
TO authenticated
```

um usuário autenticado não estará necessariamente limitado a:

```text
is_done
```

Ele poderá tentar alterar também:

```text
order_name
shirt_count
total_amount
delivery_date
user_id
```

A policy precisa impedir isso de alguma maneira.

Esse é um ponto que eu considero **obrigatório corrigir antes da implementação**.

Para o seu caso, eu prefiro:

```text
INSERT order
    ↓
service / RPC

UPDATE is_done
    ↓
RPC específica
```

Algo conceitualmente como:

```text
complete_order(order_id, done)
```

A função altera **somente `is_done`**.

Isso combina muito bem com o seu domínio porque "concluir pedido" é uma operação de negócio, não simplesmente "editar pedido".

O Supabase recomenda atenção especial a funções `SECURITY DEFINER`, grants e RLS, então essa RPC precisa ser escrita cuidadosamente.

---

# 3. Seu modelo de ID precisa ser esclarecido

Aqui tem uma contradição:

> migrar histórico completo preservando `id`

E depois:

> cria conta no Auth ... e insere `profiles` com o id antigo mapeado

Seu `profiles.id` é:

```sql
id uuid primary key references auth.users(id)
```

Portanto:

**o ID do usuário antigo da planilha não pode ser preservado como ID do Auth**, a menos que ele já seja um UUID exatamente compatível.

O correto seria:

```text
Google Sheets
────────────────────

user_id = "123"
          │
          │ migração
          ▼
Supabase
────────────────────

auth.users.id = "a8f..."
profiles.id    = "a8f..."
```

E você mantém:

```text
legacy_user_id = "123"
```

se precisar rastrear o histórico.

Eu adicionaria:

```sql
legacy_id text unique
```

em `profiles`.

Então:

```text
profiles
────────────────────────
id              UUID
legacy_id       TEXT
name            TEXT
role            TEXT
is_active       BOOLEAN
created_at      TIMESTAMPTZ
```

Já os **IDs dos pedidos**, esses sim você pode preservar se quiser, desde que sejam UUIDs compatíveis com o novo schema. Se hoje forem strings/números, você precisará decidir se o novo `orders.id` será `text` ou se fará um mapeamento.

Não deixe essa decisão implícita.

---

# 4. Eu mudaria a estratégia de convite

Seu plano diz:

> `AddUserDialog` vira fluxo de convite: admin chama RPC/Edge Function `invite-user`

**Isso está correto.**

O convite administrativo precisa ocorrer em ambiente confiável; a chave secreta não pode ir para o navegador. A documentação atual do Supabase recomenda `inviteUserByEmail()` no lado servidor ou pelo Dashboard.

Então sua arquitetura ficaria:

```text
React
  │
  │ POST / invite
  ▼
Supabase Edge Function
  │
  │ secret key
  ▼
Supabase Auth
  │
  ▼
email de convite
```

Não:

```text
React
  │
  └── service_role ❌
```

Isso você já entendeu corretamente.

### E eu não faria isso no MVP

> usuário define senha + confirma nome/role

O usuário **não deveria confirmar a própria role**.

Imagine:

```text
Admin:
  "Convidei João como vendedor."

João:
  "Vou colocar aqui que sou admin."
```

Obviamente isso não pode acontecer.

O onboarding deveria permitir:

```text
Nome
Senha
```

E a role vem do convite/admin/banco.

---

# 5. O trigger de `profiles` é uma boa escolha

Essa parte eu manteria:

```text
auth.users
      │
      │ trigger
      ▼
profiles
```

Isso evita situações como:

```text
auth.users existe
profiles não existe
```

O próprio Supabase documenta essa arquitetura de conectar `auth.users` às tabelas públicas por trigger/foreign key.

Só tenha cuidado com o que o trigger aceita.

Eu faria o mínimo:

```text
auth.users
    ↓
profiles
    ├── id
    ├── name
    └── role inicial segura
```

E não deixaria o cliente escolher arbitrariamente:

```text
role = "admin"
```

---

# 6. Seu `orders` está quase bom, mas eu adicionaria algumas constraints

Hoje:

```sql
total_amount numeric(10,2) not null default 0
```

Eu colocaria:

```text
total_amount >= 0
```

Também consideraria:

```text
delivery_date >= created_at::date
```

dependendo das regras do sistema.

E talvez:

```text
shirt_count + others_items_count > 0
```

porque um pedido com:

```text
0 camisas
0 outros
R$ 500
```

provavelmente não faz sentido.

Não necessariamente precisa colocar todas essas regras no banco agora, mas pense nisso como **invariantes do domínio**, não apenas validação de formulário.

---

# 7. E aqui está outra coisa que eu mudaria: regra de prazo

Esse é um ponto importante no seu projeto.

Você tem regras como:

- prazo mínimo;

- dias úteis;

- feriados;

- capacidade diária;

- quantidade de pedidos;

- quantidade de peças;

- possibilidade de override administrativo.

Se o frontend fizer:

```text
calcularDeliveryDate()
```

e depois:

```text
supabase.from("orders").insert(...)
```

isso é insuficiente.

Porque alguém pode simplesmente chamar a API diretamente e inserir:

```text
delivery_date = amanhã
```

O RLS pode garantir:

> "esse usuário pode criar pedido?"

Mas não necessariamente:

> "esse pedido respeita as regras comerciais da empresa?"

Essas são coisas diferentes.

Eu faria:

```text
Frontend
   │
   │ createOrder()
   ▼
RPC / função de domínio
   │
   ├── verifica feriados
   ├── verifica dias úteis
   ├── verifica capacidade
   ├── verifica prazo
   └── cria order
```

O frontend continua fazendo a validação para UX:

```text
"Essa data não está disponível"
```

mas o banco/backend é a autoridade final.

**Isso é uma evolução importante em relação ao Apps Script.**

---

# 8. `DataProvider` é uma boa estratégia, mas não carregue o legado para sempre

Você escreveu:

> manter API do hook `useData()` para não quebrar consumidores

**Perfeito para a migração.**

Eu faria exatamente isso.

Seu objetivo durante a migração é:

```text
ANTES

Componentes
    ↓
useData()
    ↓
api.ts
    ↓
Apps Script
```

virar:

```text
Componentes
    ↓
useData()
    ↓
services/orders.ts
    ↓
Supabase
```

Assim você não precisa reescrever:

```text
OrdersTable
KPIs
Dashboard
lib/orders.ts
...
```

ao mesmo tempo em que muda backend.

Isso reduz muito o risco.

### Mas depois da migração

Revise se `DataProvider` ainda faz sentido.

Não crie uma abstração só porque "arquitetura limpa manda".

Se o Supabase resolver naturalmente:

```text
useOrders()
useHolidays()
useProfiles()
```

pode ser melhor evoluir para hooks específicos.

**Abstração deve resolver problema, não ganhar pontos de arquitetura.**

---

# 9. `orders_with_seller`: eu não criaria ainda

Você propôs:

> view `orders_with_seller`

Pode funcionar.

Mas eu acho prematuro.

O Supabase consegue trabalhar com relações do Postgres através do relacionamento:

```text
orders.user_id
        ↓
profiles.id
```

e você pode buscar os campos necessários.

Começaria simples.

Se depois você perceber que:

```text
10 componentes
     ↓
precisam da mesma combinação
orders + seller
```

aí uma view pode fazer sentido.

E se criar uma view, atenção: views precisam ser protegidas adequadamente; a documentação do Supabase chama atenção para o comportamento de RLS em views e para `security_invoker`.

---

# 10. Seu `AuthProvider` precisa tomar cuidado com `onAuthStateChange`

Sua ideia está certa:

```text
AuthProvider
 ├── session
 ├── user
 ├── profile
 ├── isLoading
 ├── signIn()
 └── signOut()
```

Mas existe uma pegadinha importante.

Não faça:

```text
onAuthStateChange(...)
    ↓
await supabase.from("profiles")...
```

diretamente dentro do callback.

A documentação do Supabase atualmente alerta para possibilidade de deadlock quando chamadas assíncronas do Supabase são feitas dentro de `onAuthStateChange`.

Use o evento para atualizar o estado de sessão e faça o carregamento do profile fora desse callback.

Além disso, o Supabase já inicializa a sessão automaticamente no client normal; você não precisa criar manualmente uma rotina de `initialize()` para esse cenário SPA.

---

# 11. PWA/offline: aqui seu plano está otimista demais

Você colocou:

> PWA offline mínimo

Cuidado.

Você está saindo de:

```text
React
 ↓
Apps Script
```

para:

```text
React
 ↓
Supabase
```

Isso **não significa que o app funciona offline**.

Se perder internet:

```text
supabase.from("orders").insert(...)
```

não vai magicamente entrar numa fila offline.

Para o seu sistema atual, eu faria:

### MVP

```text
Offline:
    usuário consegue abrir a aplicação
    dados previamente carregados podem permanecer disponíveis

Online:
    operações de escrita
```

E deixaria:

```text
criar pedido offline
editar offline
sincronização
conflitos
fila de mutations
```

para uma fase posterior.

Não misture "PWA instalável" com "offline-first".

São problemas diferentes.

---

# 12. Eu mudaria um pouco a ordem das fases

Seu fluxo:

```text
Schema
↓
RLS
↓
Auth
↓
services
↓
migração
```

é bom.

Mas eu faria:

```text
Fase 0
Branch + projeto Supabase

        ↓

Fase 1
Schema + migrations

        ↓

Fase 2
RLS + testes

        ↓

Fase 3
Auth
login
logout
onboarding

        ↓

Fase 4
Services + DataProvider

        ↓

Fase 5
Dados de teste

        ↓

Fase 6
Migração real

        ↓

Fase 7
Aceite

        ↓

Fase 8
Desligar Apps Script
```

Ou seja, **não misturaria migração de dados no mesmo momento em que você ainda está descobrindo se o modelo funciona.**

Primeiro prove:

```text
auth
+
RLS
+
CRUD
+
rules
```

com dados descartáveis.

Depois:

```text
produção
```

---

# 13. E eu faria um teste de RLS realmente agressivo

Não faça apenas:

> "usuário A consegue entrar."

Teste uma matriz:

| Operação               |   Admin | Vendedor |
| ---------------------- | ------: | -------: |
| Ler pedidos            |      ✅ |       ✅ |
| Criar pedido           |      ✅ |       ✅ |
| Concluir pedido        |      ✅ |       ✅ |
| Alterar nome do pedido | depende |  depende |
| Alterar valor          | depende |  depende |
| Deletar pedido         |      ✅ |       ❌ |
| Ler feriados           |      ✅ |       ✅ |
| Criar feriado          |      ✅ |       ❌ |
| Deletar feriado        |      ✅ |       ❌ |
| Editar próprio perfil  |      ✅ |       ✅ |
| Alterar role           |      ❌ |       ❌ |
| Criar usuário          |      ✅ |       ❌ |

E principalmente:

### Teste malicioso

Logado como vendedor:

```text
UPDATE orders
SET user_id = "ID_DO_ADMIN"
```

```text
UPDATE orders
SET total_amount = 999999
```

```text
UPDATE profiles
SET role = 'admin'
```

```text
DELETE FROM orders
```

Se qualquer uma dessas passar indevidamente, a implementação está errada.

Isso é muito mais importante que testar só o fluxo feliz.

---

# 14. Outra coisa: `is_active` precisa entrar nas policies

Você colocou:

```text
profiles.is_active
```

mas não explicou como ele será utilizado.

Defina agora.

Por exemplo:

```text
auth.users
    │
    │ usuário autenticado
    ▼
profiles.is_active
    │
    ├── true  → acesso
    └── false → sem acesso aos dados
```

Só esconder o usuário no frontend:

```text
if (!profile.is_active) logout()
```

não é segurança.

O RLS também precisa considerar isso.

---

# 15. `SUPABASE_ANON_KEY` ainda funciona, mas eu usaria a nomenclatura atual

A documentação atual já trata a chave pública como **publishable key**, embora projetos antigos ainda mostrem `anon`. A chave pública pode ficar no frontend quando RLS está corretamente configurado.

Então eu prefiro:

```env
VITE_SUPABASE_URL=
VITE_SUPABASE_PUBLISHABLE_KEY=
```

em vez de:

```env
VITE_SUPABASE_ANON_KEY=
```

Não é uma questão funcional; é principalmente nomenclatura atual.

E obviamente:

```text
publishable key → frontend ✅
secret/service role → frontend ❌
```

---

# 16. A arquitetura final que eu buscaria

Para o tamanho atual do seu projeto, eu não complicaria além disso:

```text
                         ┌──────────────────┐
                         │   React + Vite   │
                         │ TanStack Router  │
                         └────────┬─────────┘
                                  │
                    publishable key + JWT
                                  │
                    ┌─────────────▼─────────────┐
                    │         Supabase          │
                    │                           │
                    │ Auth                      │
                    │   │                       │
                    │   └── auth.users          │
                    │           │               │
                    │           ▼               │
                    │       profiles            │
                    │                           │
                    │ Postgres                  │
                    │   ├── orders              │
                    │   └── holidays            │
                    │                           │
                    │ RLS                       │
                    │ RPCs                      │
                    └─────────────┬─────────────┘
                                  │
                           Edge Functions
                                  │
                         operações admin
                         convites / etc.
```

E no frontend:

```text
src/
├── components/
├── routes/
├── providers/
│   ├── auth-provider.tsx
│   └── data-provider.tsx
├── services/
│   ├── orders.ts
│   ├── holidays.ts
│   └── profiles.ts
├── lib/
│   ├── supabase.ts
│   └── orders.ts
└── types/
```

Isso é **mais do que suficiente** para o seu projeto atual.

---

# Minha principal recomendação

Eu faria a migração, mas antes de escrever o primeiro SQL, revisaria **quatro decisões**:

### 1. Autoridade da role

```text
profiles.role
```

é a fonte da verdade.

Não `user_metadata`.

### 2. Atualização de pedidos

Não:

```text
UPDATE orders liberado para authenticated
```

se a intenção é permitir somente o toggle.

Use operação específica/RPC ou uma política que realmente impeça alterações indevidas.

### 3. IDs antigos

Não tente preservar o ID antigo do usuário dentro de `auth.users`.

Use:

```text
auth UUID
+
legacy_id
```

e preserve os IDs dos pedidos quando tecnicamente possível.

### 4. Regras de prazo

Não deixe a regra de:

```text
15 dias
+ feriados
+ capacidade
+ quantidade
+ override
```

ser exclusivamente uma decisão do React.

O frontend **valida para UX**; o backend/banco **garante a regra**.

---
