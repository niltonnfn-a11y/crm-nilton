# Design: Sistema de Login + Dashboard de CRM

**Data:** 2026-07-30
**Status:** Aprovado para planejamento de implementação

## Contexto e objetivo

Sistema web pessoal (usuário único) com tela de login que dá acesso a um dashboard de CRM. O CRM gerencia contatos/clientes e um pipeline de vendas (negócios organizados por estágio).

## Escopo

**Incluído nesta versão:**
- Login com email/senha (conta criada diretamente no painel do Supabase, sem tela de cadastro)
- Dashboard protegido com resumo (total de contatos, negócios por estágio)
- CRUD de contatos (criar, listar, editar, excluir)
- Pipeline de vendas com negócios organizados por estágio, permitindo mover um negócio entre estágios
- Logout

**Fora de escopo (explicitamente adiado):**
- Tela de cadastro/registro de novos usuários
- Recuperação de senha ("esqueci minha senha") — reset feito manualmente pelo painel do Supabase
- Múltiplos usuários com papéis/permissões diferentes
- Testes automatizados (validação será manual, ver seção Testes)

## Arquitetura

- **Frontend + rotas de servidor:** Next.js (App Router), empacotado em Docker (modo `standalone`) e hospedado no EasyPanel.
- **Autenticação e banco de dados:** Supabase (Postgres + Auth), usando a biblioteca oficial `@supabase/ssr`.
- **Proteção de rotas:** `middleware.ts` no Next.js valida a sessão do Supabase no servidor para qualquer rota sob `/dashboard/*`, redirecionando para `/login` quando não há sessão válida. A validação ocorre antes da renderização da página (sem "piscar" conteúdo protegido).
- **Segurança no banco:** Row Level Security (RLS) habilitado em todas as tabelas, restringindo cada registro ao `user_id` do usuário autenticado.

## Modelo de dados

### `contacts`
| Campo | Tipo | Observação |
|---|---|---|
| `id` | uuid | chave primária |
| `user_id` | uuid | dono do registro (RLS) |
| `name` | text | obrigatório |
| `email` | text | obrigatório |
| `phone` | text | opcional |
| `company` | text | opcional |
| `notes` | text | opcional |
| `created_at` | timestamptz | default now() |

### `deals`
| Campo | Tipo | Observação |
|---|---|---|
| `id` | uuid | chave primária |
| `user_id` | uuid | dono do registro (RLS) |
| `contact_id` | uuid | referencia `contacts.id` |
| `title` | text | obrigatório |
| `value` | numeric | valor do negócio |
| `stage` | text | um de: `novo`, `em_contato`, `proposta_enviada`, `negociacao`, `ganho`, `perdido` |
| `created_at` | timestamptz | default now() |
| `updated_at` | timestamptz | atualizado a cada mudança de estágio |

## Telas e fluxo

- **`/login`** — formulário de email/senha via `supabase.auth.signInWithPassword`. Erro de credencial inválida exibido inline, com mensagem genérica ("email ou senha inválidos").
- **`/dashboard`** — visão geral: cards com total de contatos e quantidade de negócios por estágio.
- **`/dashboard/contatos`** — lista com busca; criar/editar/excluir contato em formulário (modal ou painel lateral). Validação client-side: nome e email obrigatórios antes de enviar.
- **`/dashboard/pipeline`** — negócios organizados visualmente por estágio (colunas), com ação para mover um negócio para outro estágio.
- **Logout** — botão no dashboard, encerra sessão via `supabase.auth.signOut()` e redireciona para `/login`.

O navegador conversa diretamente com o Supabase (auth e dados) através de `@supabase/ssr`; o Next.js entrega as páginas e aplica a proteção de rota via middleware.

## Tratamento de erros

- Login inválido: mensagem genérica, sem indicar se o problema é o email ou a senha.
- Formulários (contato/negócio): validação de campos obrigatórios antes do envio.
- Falha de conexão com Supabase: mensagem genérica de erro com opção de tentar novamente.

## Testes

Projeto pessoal de usuário único — validação manual dos fluxos principais (login, CRUD de contato, mover negócio de estágio) é suficiente para esta versão. Testes automatizados ficam para uma futura expansão (ex: múltiplos usuários ou regras mais complexas).
