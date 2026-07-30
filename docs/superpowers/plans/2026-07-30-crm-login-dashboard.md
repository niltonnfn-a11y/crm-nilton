# Sistema de Login + Dashboard de CRM — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a personal, single-user CRM web app with Supabase-backed login, a protected dashboard, contact management (CRUD), and a sales pipeline (deals by stage), deployed as a Docker container on EasyPanel.

**Architecture:** Next.js (App Router, TypeScript) talking directly to Supabase (Postgres + Auth) via `@supabase/ssr`. A `middleware.ts` validates the session server-side for every `/dashboard/*` request and redirects unauthenticated visitors to `/login`. Row Level Security in Postgres scopes every row to `auth.uid()`.

**Tech Stack:** Next.js 15 (App Router) + TypeScript + Tailwind CSS v3 + Supabase (`@supabase/supabase-js`, `@supabase/ssr`) + Docker (multi-stage, `output: 'standalone'`) on EasyPanel.

## Global Constraints

- UI text is in Portuguese (pt-BR) — labels, buttons, error messages.
- Single user only: no signup/registration page. The Supabase user is created manually in the Supabase dashboard (Authentication → Users).
- No "esqueci minha senha" flow — password resets happen manually via the Supabase dashboard.
- Row Level Security (RLS) must be enabled on every table, with policies scoped to `auth.uid() = user_id`.
- No automated test suite for this project — per the approved spec, verification is manual (run the app, perform the action in the browser, confirm the expected result). Every task below still ends with a concrete, independently checkable verification step.
- Deployment target is a Docker container on EasyPanel — not Vercel.
- Pipeline stages are fixed: `novo`, `em_contato`, `proposta_enviada`, `negociacao`, `ganho`, `perdido`.

---

### Task 1: Project scaffolding (Next.js + TypeScript + Tailwind)

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `next.config.ts`
- Create: `next-env.d.ts`
- Create: `tailwind.config.ts`
- Create: `postcss.config.mjs`
- Create: `app/globals.css`
- Create: `app/layout.tsx`
- Create: `app/page.tsx`
- Create: `.gitignore`
- Create: `.env.example`

**Interfaces:**
- Produces: root layout `RootLayout` (wraps all pages, sets `<html lang="pt-BR">` and imports `globals.css`); a placeholder home page at `/`; the `@/*` import alias resolving to the project root.

- [ ] **Step 1: Initialize package.json and install dependencies**

```bash
npm init -y
npm install next@^15 react@^19 react-dom@^19
npm install -D typescript@^5 @types/node@^22 @types/react@^19 @types/react-dom@^19 tailwindcss@^3 postcss@^8 autoprefixer@^10
```

Then edit the generated `package.json` `scripts` section to:

```json
"scripts": {
  "dev": "next dev",
  "build": "next build",
  "start": "next start"
}
```

- [ ] **Step 2: Write tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2017",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": { "@/*": ["./*"] }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

- [ ] **Step 3: Write next.config.ts, next-env.d.ts, Tailwind/PostCSS config**

`next.config.ts`:
```ts
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  output: 'standalone',
}

export default nextConfig
```

`next-env.d.ts`:
```ts
/// <reference types="next" />
/// <reference types="next/image-types/global" />
```

`tailwind.config.ts`:
```ts
import type { Config } from 'tailwindcss'

export default {
  content: ['./app/**/*.{ts,tsx}'],
  theme: {
    extend: {},
  },
  plugins: [],
} satisfies Config
```

`postcss.config.mjs`:
```js
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
```

- [ ] **Step 4: Write app/globals.css, app/layout.tsx, app/page.tsx**

`app/globals.css`:
```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

`app/layout.tsx`:
```tsx
import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'CRM',
  description: 'Sistema de CRM pessoal',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className="bg-slate-50 text-slate-900">{children}</body>
    </html>
  )
}
```

`app/page.tsx` (placeholder — replaced in Task 4 with a redirect to `/login`):
```tsx
export default function Home() {
  return (
    <main className="flex min-h-screen items-center justify-center">
      <p className="text-slate-500">CRM em construção</p>
    </main>
  )
}
```

- [ ] **Step 5: Write .gitignore and .env.example**

`.gitignore`:
```
node_modules
.next
.env.local
```

`.env.example`:
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

- [ ] **Step 6: Verify manually**

Run: `npm run dev`
Open `http://localhost:3000` in the browser.
Expected: page loads with the text "CRM em construção" centered on the screen, no console errors in the terminal.

Stop the dev server (Ctrl+C).

- [ ] **Step 7: Commit**

```bash
git add package.json package-lock.json tsconfig.json next.config.ts next-env.d.ts tailwind.config.ts postcss.config.mjs app .gitignore .env.example
git commit -m "chore: scaffold Next.js + TypeScript + Tailwind project"
```

---

### Task 2: Supabase project setup + client helpers

**Files:**
- Create: `.env.local` (not committed — created locally from `.env.example`)
- Create: `lib/supabase/client.ts`
- Create: `lib/supabase/server.ts`
- Modify: `package.json` (new dependencies)

**Interfaces:**
- Consumes: env vars `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
- Produces: `createClient()` from `@/lib/supabase/client` — synchronous, returns a browser Supabase client. `createClient()` from `@/lib/supabase/server` — **async** (must be awaited), returns a server Supabase client bound to the current request's cookies. Both are used by every later task that talks to Supabase.

- [ ] **Step 1: Create a Supabase project**

Go to https://supabase.com/dashboard, create a new project (any name/region/password for the DB). Wait for provisioning to finish.
In **Project Settings → API**, copy the **Project URL** and the **anon public** key.

- [ ] **Step 2: Create .env.local**

Copy `.env.example` to `.env.local` and fill in the values from Step 1:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

`.env.local` is already covered by `.gitignore` from Task 1 — confirm it does not show up in `git status`.

- [ ] **Step 3: Install Supabase packages**

```bash
npm install @supabase/ssr@^0.5 @supabase/supabase-js@^2
```

- [ ] **Step 4: Write lib/supabase/client.ts**

```ts
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

- [ ] **Step 5: Write lib/supabase/server.ts**

```ts
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Called from a Server Component — cookies can't be written here.
            // The middleware (Task 5) is responsible for refreshing the session.
          }
        },
      },
    }
  )
}
```

- [ ] **Step 6: Verify manually**

Run: `npm run build`
Expected: build succeeds with no TypeScript errors (confirms env vars are read correctly and both files compile and type-check).

- [ ] **Step 7: Commit**

```bash
git add package.json package-lock.json lib/supabase/client.ts lib/supabase/server.ts .env.example
git commit -m "feat: add Supabase browser/server client helpers"
```

---

### Task 3: Database schema + TypeScript types

**Files:**
- Create: `supabase/schema.sql`
- Create: `types/database.ts`

**Interfaces:**
- Produces: `Contact` and `Deal` types, `Stage` union type, `STAGES` ordered list of `{ value, label }` used by every dashboard page. Produces Postgres tables `contacts` and `deals` with RLS enabled.

- [ ] **Step 1: Write supabase/schema.sql**

```sql
create table contacts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id),
  name text not null,
  email text not null,
  phone text,
  company text,
  notes text,
  created_at timestamptz not null default now()
);

alter table contacts enable row level security;

create policy "Users manage their own contacts"
  on contacts
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create table deals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id),
  contact_id uuid not null references contacts(id) on delete cascade,
  title text not null,
  value numeric not null default 0,
  stage text not null default 'novo'
    check (stage in ('novo', 'em_contato', 'proposta_enviada', 'negociacao', 'ganho', 'perdido')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table deals enable row level security;

create policy "Users manage their own deals"
  on deals
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
```

- [ ] **Step 2: Run the schema in Supabase**

In the Supabase dashboard, go to **SQL Editor → New query**, paste the contents of `supabase/schema.sql`, and run it.
Expected: "Success. No rows returned". Go to **Table Editor** and confirm both `contacts` and `deals` tables exist, each with a shield/lock icon indicating RLS is enabled.

- [ ] **Step 3: Write types/database.ts**

```ts
export type Stage =
  | 'novo'
  | 'em_contato'
  | 'proposta_enviada'
  | 'negociacao'
  | 'ganho'
  | 'perdido'

export interface Contact {
  id: string
  user_id: string
  name: string
  email: string
  phone: string | null
  company: string | null
  notes: string | null
  created_at: string
}

export interface Deal {
  id: string
  user_id: string
  contact_id: string
  title: string
  value: number
  stage: Stage
  created_at: string
  updated_at: string
}

export const STAGES: { value: Stage; label: string }[] = [
  { value: 'novo', label: 'Novo' },
  { value: 'em_contato', label: 'Em contato' },
  { value: 'proposta_enviada', label: 'Proposta enviada' },
  { value: 'negociacao', label: 'Negociação' },
  { value: 'ganho', label: 'Ganho' },
  { value: 'perdido', label: 'Perdido' },
]
```

- [ ] **Step 4: Verify manually**

Run: `npm run build`
Expected: build succeeds with no TypeScript errors.

- [ ] **Step 5: Commit**

```bash
git add supabase/schema.sql types/database.ts
git commit -m "feat: add contacts/deals schema with RLS and matching TS types"
```

---

### Task 4: Login page + login/logout server actions

**Files:**
- Create: `app/login/actions.ts`
- Create: `app/login/page.tsx`
- Modify: `app/page.tsx` (redirect `/` to `/login`)

**Interfaces:**
- Consumes: `createClient()` from `@/lib/supabase/server` (Task 2).
- Produces: `login(formData: FormData)` server action in `app/login/actions.ts`, used by the `/login` form. On failure it redirects back to `/login?error=...`; on success it redirects to `/dashboard`.

- [ ] **Step 1: Create a test user in Supabase**

In the Supabase dashboard, go to **Authentication → Users → Add user → Create new user**. Enter an email and password you will use to log in. Leave "Auto Confirm User" checked so no email confirmation is required.

- [ ] **Step 2: Write app/login/actions.ts**

```ts
'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export async function login(formData: FormData) {
  const supabase = await createClient()

  const email = formData.get('email') as string
  const password = formData.get('password') as string

  const { error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    redirect('/login?error=' + encodeURIComponent('Email ou senha inválidos'))
  }

  redirect('/dashboard')
}
```

- [ ] **Step 3: Write app/login/page.tsx**

```tsx
import { login } from './actions'

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const { error } = await searchParams

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50">
      <form action={login} className="w-full max-w-sm rounded-lg bg-white p-8 shadow">
        <h1 className="mb-6 text-xl font-semibold text-slate-900">Entrar no CRM</h1>
        {error && (
          <p className="mb-4 rounded bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
        )}
        <label className="mb-1 block text-sm font-medium text-slate-700">Email</label>
        <input
          name="email"
          type="email"
          required
          className="mb-4 w-full rounded border border-slate-300 px-3 py-2"
        />
        <label className="mb-1 block text-sm font-medium text-slate-700">Senha</label>
        <input
          name="password"
          type="password"
          required
          className="mb-6 w-full rounded border border-slate-300 px-3 py-2"
        />
        <button
          type="submit"
          className="w-full rounded bg-slate-900 px-4 py-2 text-white hover:bg-slate-800"
        >
          Entrar
        </button>
      </form>
    </div>
  )
}
```

- [ ] **Step 4: Update app/page.tsx to redirect to /login**

```tsx
import { redirect } from 'next/navigation'

export default function Home() {
  redirect('/login')
}
```

- [ ] **Step 5: Verify manually**

Run: `npm run dev`
Visit `http://localhost:3000` → expect an immediate redirect to `/login`, showing the login form.
Submit the form with a wrong password → expect to land back on `/login?error=...` with the red message "Email ou senha inválidos" visible.
Submit the form with the correct email/password from Step 1 → expect the browser to navigate towards `/dashboard` and show Next.js's default 404 page (expected — the dashboard route doesn't exist until Task 6). This 404 confirms the login itself succeeded and the redirect fired.

- [ ] **Step 6: Commit**

```bash
git add app/login app/page.tsx
git commit -m "feat: add login page and sign-in server action"
```

---

### Task 5: Middleware — protect /dashboard routes

**Files:**
- Create: `middleware.ts`

**Interfaces:**
- Consumes: `createServerClient` from `@supabase/ssr`, env vars.
- Produces: request-level protection — any unauthenticated request to `/dashboard/*` is redirected to `/login` before any page component runs.

- [ ] **Step 1: Write middleware.ts**

```ts
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user && request.nextUrl.pathname.startsWith('/dashboard')) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  return response
}

export const config = {
  matcher: ['/dashboard/:path*'],
}
```

- [ ] **Step 2: Verify manually**

Run: `npm run dev`
Open a private/incognito browser window (no session cookie) and visit `http://localhost:3000/dashboard` directly.
Expected: immediate redirect to `/login` — the 404 page from Task 4's verification no longer appears for unauthenticated visits.
Log in with the test user, then visit `/dashboard` again in that same (now authenticated) window.
Expected: still a 404 (the dashboard page itself doesn't exist until Task 6), but note the URL in the address bar stays `/dashboard` — confirming middleware let the authenticated request through instead of redirecting.

- [ ] **Step 3: Commit**

```bash
git add middleware.ts
git commit -m "feat: protect /dashboard routes with Supabase session middleware"
```

---

### Task 6: Dashboard shell (layout, nav, logout)

**Files:**
- Create: `app/dashboard/layout.tsx`
- Create: `app/dashboard/actions.ts`
- Create: `app/dashboard/page.tsx` (placeholder — replaced in Task 7)

**Interfaces:**
- Consumes: `createClient()` from `@/lib/supabase/server` (Task 2).
- Produces: `logout()` server action in `app/dashboard/actions.ts`, used by the nav's "Sair" button. Shared nav links to `/dashboard`, `/dashboard/contatos`, `/dashboard/pipeline` (the latter two built in later tasks).

- [ ] **Step 1: Write app/dashboard/actions.ts**

```ts
'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export async function logout() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}
```

- [ ] **Step 2: Write app/dashboard/layout.tsx**

```tsx
import Link from 'next/link'
import { logout } from './actions'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50">
      <nav className="flex items-center justify-between border-b bg-white px-6 py-4">
        <div className="flex gap-6">
          <Link href="/dashboard" className="font-semibold text-slate-900">
            Visão geral
          </Link>
          <Link href="/dashboard/contatos" className="text-slate-600">
            Contatos
          </Link>
          <Link href="/dashboard/pipeline" className="text-slate-600">
            Pipeline
          </Link>
        </div>
        <form action={logout}>
          <button type="submit" className="text-sm text-slate-600 hover:text-slate-900">
            Sair
          </button>
        </form>
      </nav>
      <main className="p-6">{children}</main>
    </div>
  )
}
```

- [ ] **Step 3: Write placeholder app/dashboard/page.tsx**

```tsx
export default function DashboardPage() {
  return <p className="text-slate-500">Bem-vindo ao CRM.</p>
}
```

- [ ] **Step 4: Verify manually**

Run: `npm run dev`, log in with the test user.
Expected: land on `/dashboard`, see the nav bar with "Visão geral", "Contatos", "Pipeline" links and a "Sair" button, and the text "Bem-vindo ao CRM." below it.
Click "Sair" → expect redirect to `/login`.
Try visiting `/dashboard` directly again → expect redirect back to `/login` (session was cleared).

- [ ] **Step 5: Commit**

```bash
git add app/dashboard/layout.tsx app/dashboard/actions.ts app/dashboard/page.tsx
git commit -m "feat: add dashboard shell with nav and logout"
```

---

### Task 7: Dashboard overview page (summary cards)

**Files:**
- Modify: `app/dashboard/page.tsx`

**Interfaces:**
- Consumes: `createClient()` from `@/lib/supabase/server`, `STAGES` from `@/types/database` (Task 3).

- [ ] **Step 1: Replace app/dashboard/page.tsx with the real overview**

```tsx
import { createClient } from '@/lib/supabase/server'
import { STAGES } from '@/types/database'

export default async function DashboardPage() {
  const supabase = await createClient()

  const { count: contactsCount } = await supabase
    .from('contacts')
    .select('*', { count: 'exact', head: true })

  const { data: deals } = await supabase.from('deals').select('stage')

  const dealsByStage = STAGES.map((stage) => ({
    ...stage,
    count: deals?.filter((d) => d.stage === stage.value).length ?? 0,
  }))

  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold text-slate-900">Visão geral</h1>
      <div className="mb-8 rounded-lg bg-white p-6 shadow-sm">
        <p className="text-sm text-slate-500">Total de contatos</p>
        <p className="text-3xl font-bold text-slate-900">{contactsCount ?? 0}</p>
      </div>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        {dealsByStage.map((stage) => (
          <div key={stage.value} className="rounded-lg bg-white p-4 shadow-sm">
            <p className="text-xs text-slate-500">{stage.label}</p>
            <p className="text-2xl font-bold text-slate-900">{stage.count}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Verify manually**

Run: `npm run dev`, log in.
Expected: `/dashboard` shows "Total de contatos: 0" and all six stage cards at 0 (tables are still empty).
In the Supabase Table Editor, manually insert one row into `contacts` (any name/email, `user_id` = your test user's UUID — found in Authentication → Users) and one row into `deals` (any `contact_id`/`title`/`value`, `stage = 'novo'`, same `user_id`).
Refresh `/dashboard` → expect "Total de contatos: 1" and the "Novo" card showing 1.

- [ ] **Step 3: Commit**

```bash
git add app/dashboard/page.tsx
git commit -m "feat: show contact and pipeline stage counts on dashboard overview"
```

---

### Task 8: Contacts — list + search

**Files:**
- Create: `app/dashboard/contatos/page.tsx`

**Interfaces:**
- Consumes: `createClient()` from `@/lib/supabase/server`, `Contact` type from `@/types/database`.
- Produces: `/dashboard/contatos` route, reading a `?q=` search param.

- [ ] **Step 1: Write app/dashboard/contatos/page.tsx**

```tsx
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

export default async function ContactsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>
}) {
  const { q } = await searchParams
  const supabase = await createClient()

  let query = supabase.from('contacts').select('*').order('created_at', { ascending: false })

  if (q) {
    query = query.or(`name.ilike.%${q}%,email.ilike.%${q}%`)
  }

  const { data: contacts } = await query

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-slate-900">Contatos</h1>
        <Link
          href="/dashboard/contatos/novo"
          className="rounded bg-slate-900 px-4 py-2 text-sm text-white"
        >
          Novo contato
        </Link>
      </div>
      <form className="mb-4">
        <input
          name="q"
          defaultValue={q}
          placeholder="Buscar por nome ou email"
          className="w-full max-w-sm rounded border border-slate-300 px-3 py-2 text-sm"
        />
      </form>
      <div className="overflow-hidden rounded-lg bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="border-b bg-slate-50 text-slate-500">
            <tr>
              <th className="px-4 py-3">Nome</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Empresa</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {contacts?.map((contact) => (
              <tr key={contact.id} className="border-b last:border-0">
                <td className="px-4 py-3">{contact.name}</td>
                <td className="px-4 py-3">{contact.email}</td>
                <td className="px-4 py-3">{contact.company}</td>
                <td className="px-4 py-3 text-right">
                  <Link
                    href={`/dashboard/contatos/${contact.id}`}
                    className="text-slate-600 hover:text-slate-900"
                  >
                    Editar
                  </Link>
                </td>
              </tr>
            ))}
            {contacts?.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-slate-400">
                  Nenhum contato encontrado
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Verify manually**

In the Supabase Table Editor, insert 2-3 contacts directly (distinct names/emails, correct `user_id`).
Run: `npm run dev`, log in, visit `/dashboard/contatos`.
Expected: all inserted contacts appear in the table.
Type part of one contact's name into the search box and press Enter → expected: only matching contact(s) shown, others filtered out.
Clear the search box and press Enter → expected: all contacts shown again.

- [ ] **Step 3: Commit**

```bash
git add app/dashboard/contatos/page.tsx
git commit -m "feat: add contacts list page with search"
```

---

### Task 9: Contacts — create, edit, delete

**Files:**
- Create: `app/dashboard/contatos/actions.ts`
- Create: `app/dashboard/contatos/novo/page.tsx`
- Create: `app/dashboard/contatos/[id]/page.tsx`

**Interfaces:**
- Consumes: `createClient()` from `@/lib/supabase/server`.
- Produces: `createContact(formData)`, `updateContact(id, formData)`, `deleteContact(id)` server actions in `app/dashboard/contatos/actions.ts`.

- [ ] **Step 1: Write app/dashboard/contatos/actions.ts**

```ts
'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export async function createContact(formData: FormData) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  await supabase.from('contacts').insert({
    user_id: user!.id,
    name: formData.get('name') as string,
    email: formData.get('email') as string,
    phone: (formData.get('phone') as string) || null,
    company: (formData.get('company') as string) || null,
    notes: (formData.get('notes') as string) || null,
  })

  redirect('/dashboard/contatos')
}

export async function updateContact(id: string, formData: FormData) {
  const supabase = await createClient()

  await supabase
    .from('contacts')
    .update({
      name: formData.get('name') as string,
      email: formData.get('email') as string,
      phone: (formData.get('phone') as string) || null,
      company: (formData.get('company') as string) || null,
      notes: (formData.get('notes') as string) || null,
    })
    .eq('id', id)

  redirect('/dashboard/contatos')
}

export async function deleteContact(id: string) {
  const supabase = await createClient()
  await supabase.from('contacts').delete().eq('id', id)
  redirect('/dashboard/contatos')
}
```

- [ ] **Step 2: Write app/dashboard/contatos/novo/page.tsx**

```tsx
import { createContact } from '../actions'

export default function NewContactPage() {
  return (
    <div className="max-w-lg">
      <h1 className="mb-6 text-2xl font-semibold text-slate-900">Novo contato</h1>
      <form action={createContact} className="space-y-4 rounded-lg bg-white p-6 shadow-sm">
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Nome *</label>
          <input name="name" required className="w-full rounded border border-slate-300 px-3 py-2" />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Email *</label>
          <input
            name="email"
            type="email"
            required
            className="w-full rounded border border-slate-300 px-3 py-2"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Telefone</label>
          <input name="phone" className="w-full rounded border border-slate-300 px-3 py-2" />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Empresa</label>
          <input name="company" className="w-full rounded border border-slate-300 px-3 py-2" />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Notas</label>
          <textarea name="notes" rows={3} className="w-full rounded border border-slate-300 px-3 py-2" />
        </div>
        <button type="submit" className="rounded bg-slate-900 px-4 py-2 text-sm text-white">
          Salvar
        </button>
      </form>
    </div>
  )
}
```

- [ ] **Step 3: Write app/dashboard/contatos/[id]/page.tsx**

```tsx
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { updateContact, deleteContact } from '../actions'

export default async function EditContactPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  const { data: contact } = await supabase.from('contacts').select('*').eq('id', id).single()

  if (!contact) notFound()

  const updateContactWithId = updateContact.bind(null, id)
  const deleteContactWithId = deleteContact.bind(null, id)

  return (
    <div className="max-w-lg">
      <h1 className="mb-6 text-2xl font-semibold text-slate-900">Editar contato</h1>
      <form action={updateContactWithId} className="space-y-4 rounded-lg bg-white p-6 shadow-sm">
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Nome *</label>
          <input
            name="name"
            defaultValue={contact.name}
            required
            className="w-full rounded border border-slate-300 px-3 py-2"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Email *</label>
          <input
            name="email"
            type="email"
            defaultValue={contact.email}
            required
            className="w-full rounded border border-slate-300 px-3 py-2"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Telefone</label>
          <input
            name="phone"
            defaultValue={contact.phone ?? ''}
            className="w-full rounded border border-slate-300 px-3 py-2"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Empresa</label>
          <input
            name="company"
            defaultValue={contact.company ?? ''}
            className="w-full rounded border border-slate-300 px-3 py-2"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Notas</label>
          <textarea
            name="notes"
            defaultValue={contact.notes ?? ''}
            rows={3}
            className="w-full rounded border border-slate-300 px-3 py-2"
          />
        </div>
        <button type="submit" className="rounded bg-slate-900 px-4 py-2 text-sm text-white">
          Salvar
        </button>
      </form>
      <form action={deleteContactWithId} className="mt-4">
        <button type="submit" className="text-sm text-red-600 hover:text-red-800">
          Excluir contato
        </button>
      </form>
    </div>
  )
}
```

- [ ] **Step 4: Verify manually**

Run: `npm run dev`, log in, visit `/dashboard/contatos`.
Click "Novo contato", fill name + email (required fields), leave others blank, click "Salvar" → expect redirect to `/dashboard/contatos` with the new contact visible in the list.
Click "Editar" on that contact, change the name, click "Salvar" → expect redirect back to the list with the updated name shown.
Click "Editar" again, click "Excluir contato" → expect redirect to the list with the contact no longer present.
Try submitting the "Novo contato" form with the name field empty → expect the browser's native required-field validation to block submission (no server round-trip).

- [ ] **Step 5: Commit**

```bash
git add app/dashboard/contatos/actions.ts app/dashboard/contatos/novo app/dashboard/contatos/[id]
git commit -m "feat: add contact create, edit and delete"
```

---

### Task 10: Pipeline — list by stage + create deal

**Files:**
- Create: `app/dashboard/pipeline/actions.ts`
- Create: `app/dashboard/pipeline/page.tsx`
- Create: `app/dashboard/pipeline/novo/page.tsx`

**Interfaces:**
- Consumes: `createClient()` from `@/lib/supabase/server`, `STAGES`/`Stage` from `@/types/database`.
- Produces: `createDeal(formData)` server action (this task); `DealWithContact` local type used by the pipeline page and extended by Task 11.

- [ ] **Step 1: Write app/dashboard/pipeline/actions.ts**

```ts
'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export async function createDeal(formData: FormData) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  await supabase.from('deals').insert({
    user_id: user!.id,
    contact_id: formData.get('contact_id') as string,
    title: formData.get('title') as string,
    value: Number(formData.get('value')),
    stage: 'novo',
  })

  redirect('/dashboard/pipeline')
}
```

- [ ] **Step 2: Write app/dashboard/pipeline/page.tsx**

```tsx
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { STAGES, type Stage } from '@/types/database'

type DealWithContact = {
  id: string
  title: string
  value: number
  stage: Stage
  contacts: { name: string } | null
}

export default async function PipelinePage() {
  const supabase = await createClient()

  const { data } = await supabase
    .from('deals')
    .select('id, title, value, stage, contacts(name)')
    .order('created_at', { ascending: false })

  const deals = (data ?? []) as unknown as DealWithContact[]

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-slate-900">Pipeline de vendas</h1>
        <Link
          href="/dashboard/pipeline/novo"
          className="rounded bg-slate-900 px-4 py-2 text-sm text-white"
        >
          Novo negócio
        </Link>
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3 xl:grid-cols-6">
        {STAGES.map((stage) => (
          <div key={stage.value} className="rounded-lg bg-white p-3 shadow-sm">
            <h2 className="mb-3 text-sm font-semibold text-slate-700">{stage.label}</h2>
            <div className="space-y-3">
              {deals
                .filter((deal) => deal.stage === stage.value)
                .map((deal) => (
                  <div key={deal.id} className="rounded border border-slate-200 p-3">
                    <p className="text-sm font-medium text-slate-900">{deal.title}</p>
                    <p className="text-xs text-slate-500">{deal.contacts?.name}</p>
                    <p className="text-xs text-slate-500">
                      {new Intl.NumberFormat('pt-BR', {
                        style: 'currency',
                        currency: 'BRL',
                      }).format(deal.value)}
                    </p>
                  </div>
                ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Write app/dashboard/pipeline/novo/page.tsx**

```tsx
import { createClient } from '@/lib/supabase/server'
import { createDeal } from '../actions'

export default async function NewDealPage() {
  const supabase = await createClient()
  const { data: contacts } = await supabase.from('contacts').select('id, name').order('name')

  return (
    <div className="max-w-lg">
      <h1 className="mb-6 text-2xl font-semibold text-slate-900">Novo negócio</h1>
      <form action={createDeal} className="space-y-4 rounded-lg bg-white p-6 shadow-sm">
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Contato *</label>
          <select
            name="contact_id"
            required
            className="w-full rounded border border-slate-300 px-3 py-2"
          >
            <option value="">Selecione um contato</option>
            {contacts?.map((contact) => (
              <option key={contact.id} value={contact.id}>
                {contact.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Título *</label>
          <input name="title" required className="w-full rounded border border-slate-300 px-3 py-2" />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Valor (R$) *</label>
          <input
            name="value"
            type="number"
            step="0.01"
            min="0"
            required
            className="w-full rounded border border-slate-300 px-3 py-2"
          />
        </div>
        <button type="submit" className="rounded bg-slate-900 px-4 py-2 text-sm text-white">
          Salvar
        </button>
      </form>
    </div>
  )
}
```

- [ ] **Step 4: Verify manually**

Prerequisite: at least one contact must exist (created in Task 9's verification).
Run: `npm run dev`, log in, visit `/dashboard/pipeline`.
Expected: six empty columns (or reflecting whatever test rows were inserted in Task 7).
Click "Novo negócio", select a contact, enter a title and a value (e.g. `1500.00`), click "Salvar" → expect redirect to `/dashboard/pipeline` with the new deal card showing under "Novo", displaying the contact's name and `R$ 1.500,00`.

- [ ] **Step 5: Commit**

```bash
git add app/dashboard/pipeline/actions.ts app/dashboard/pipeline/page.tsx app/dashboard/pipeline/novo
git commit -m "feat: add pipeline board with deal creation"
```

---

### Task 11: Pipeline — move a deal between stages

**Files:**
- Create: `app/dashboard/pipeline/StageSelect.tsx`
- Modify: `app/dashboard/pipeline/actions.ts` (add `moveDealStage`)
- Modify: `app/dashboard/pipeline/page.tsx` (render `StageSelect` per deal card)

**Interfaces:**
- Consumes: `Stage`, `STAGES` from `@/types/database`.
- Produces: `moveDealStage(dealId: string, stage: Stage)` server action.

- [ ] **Step 1: Add moveDealStage to app/dashboard/pipeline/actions.ts**

```ts
import type { Stage } from '@/types/database'
```

Add this import to the top of the existing file, then append:

```ts
export async function moveDealStage(dealId: string, stage: Stage) {
  const supabase = await createClient()
  await supabase
    .from('deals')
    .update({ stage, updated_at: new Date().toISOString() })
    .eq('id', dealId)

  revalidatePath('/dashboard/pipeline')
  revalidatePath('/dashboard')
}
```

Also add `revalidatePath` to the existing `next/navigation`/`next/cache` imports at the top of the file:

```ts
import { revalidatePath } from 'next/cache'
```

- [ ] **Step 2: Write app/dashboard/pipeline/StageSelect.tsx**

```tsx
'use client'

import { useTransition } from 'react'
import { moveDealStage } from './actions'
import { STAGES, type Stage } from '@/types/database'

export function StageSelect({ dealId, currentStage }: { dealId: string; currentStage: Stage }) {
  const [isPending, startTransition] = useTransition()

  return (
    <select
      defaultValue={currentStage}
      disabled={isPending}
      onChange={(e) => startTransition(() => moveDealStage(dealId, e.target.value as Stage))}
      className="mt-2 w-full rounded border border-slate-300 px-2 py-1 text-xs"
    >
      {STAGES.map((stage) => (
        <option key={stage.value} value={stage.value}>
          {stage.label}
        </option>
      ))}
    </select>
  )
}
```

- [ ] **Step 3: Render StageSelect in app/dashboard/pipeline/page.tsx**

Add the import at the top:

```ts
import { StageSelect } from './StageSelect'
```

Inside the deal card `<div>`, right after the value `<p>` and before the closing `</div>`, add:

```tsx
<StageSelect dealId={deal.id} currentStage={deal.stage} />
```

- [ ] **Step 4: Verify manually**

Run: `npm run dev`, log in, visit `/dashboard/pipeline`.
Find the deal created in Task 10, use its stage dropdown to select "Negociação" → expect the card to move from the "Novo" column to the "Negociação" column without a full page reload.
Visit `/dashboard` → expect the "Negociação" stage card count to have incremented and "Novo" to have decremented, reflecting the move.

- [ ] **Step 5: Commit**

```bash
git add app/dashboard/pipeline/actions.ts app/dashboard/pipeline/StageSelect.tsx app/dashboard/pipeline/page.tsx
git commit -m "feat: allow moving deals between pipeline stages"
```

---

### Task 12: Global error boundary (generic connection-failure UI)

**Files:**
- Create: `app/error.tsx`

**Interfaces:**
- None — this is a root-level Client Component error boundary that Next.js automatically wraps around every route under `app/` (including `/login` and all of `/dashboard/*`) unless a more specific `error.tsx` overrides it.

- [ ] **Step 1: Write app/error.tsx**

```tsx
'use client'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-slate-50 p-6 text-center">
      <p className="text-slate-700">
        Não foi possível carregar esta página. Verifique sua conexão e tente novamente.
      </p>
      <button onClick={() => reset()} className="rounded bg-slate-900 px-4 py-2 text-sm text-white">
        Tentar novamente
      </button>
    </div>
  )
}
```

- [ ] **Step 2: Verify manually**

Stop the dev server. In `.env.local`, temporarily break `NEXT_PUBLIC_SUPABASE_URL` (append an extra character so it points nowhere real).
Run: `npm run dev`, log in (or reuse an existing authenticated session) and visit `/dashboard`.
Expected: instead of a raw crash/stack trace, the generic screen appears with the message "Não foi possível carregar esta página..." and a "Tentar novamente" button.
Restore the correct `NEXT_PUBLIC_SUPABASE_URL` value in `.env.local`, restart the dev server, and confirm `/dashboard` loads normally again.

- [ ] **Step 3: Commit**

```bash
git add app/error.tsx
git commit -m "feat: add generic error boundary for Supabase connection failures"
```

---

### Task 13: Docker packaging + EasyPanel deployment

**Files:**
- Create: `Dockerfile`
- Create: `.dockerignore`
- Create: `README.md`

**Interfaces:**
- Consumes: `output: 'standalone'` from `next.config.ts` (Task 1).

- [ ] **Step 1: Write Dockerfile**

```dockerfile
FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
EXPOSE 3000
CMD ["node", "server.js"]
```

Note: `next build` needs `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` available at build time because they're inlined into the client bundle. When building locally with Docker, pass them as build args, or (simpler, and what EasyPanel does) just make sure the same env vars are set in the environment before `docker build` runs, matching the ones in `.env.local`.

- [ ] **Step 2: Write .dockerignore**

```
node_modules
.next
.git
.env.local
docs
```

- [ ] **Step 3: Write README.md**

```markdown
# CRM

Sistema pessoal de login + dashboard de CRM (contatos e pipeline de vendas).

## Rodando localmente

1. Copie `.env.example` para `.env.local` e preencha com as credenciais do seu projeto Supabase.
2. `npm install`
3. `npm run dev`
4. Acesse http://localhost:3000

## Deploy no EasyPanel

1. No EasyPanel, crie um novo app do tipo "App" apontando para este repositório Git (build via Dockerfile).
2. Defina as variáveis de ambiente do app:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
3. Configure a porta do container como `3000`.
4. Faça o deploy. O EasyPanel vai buildar a imagem a partir do `Dockerfile` e subir o container.
5. Acesse a URL fornecida pelo EasyPanel e confirme que a tela de login carrega.
```

- [ ] **Step 4: Verify manually**

Run: `docker build -t crm-app .` (with the Supabase env vars set in your shell, e.g. `export NEXT_PUBLIC_SUPABASE_URL=... NEXT_PUBLIC_SUPABASE_ANON_KEY=...` before building, or pass them via `--build-arg`/a temporary `.env` read by your Docker setup).
Expected: image builds successfully through all three stages.
Run: `docker run -p 3000:3000 crm-app`
Visit `http://localhost:3000` → expect a redirect to `/login` and the login form to render, confirming the containerized build serves the app correctly.
Stop the container (Ctrl+C).

- [ ] **Step 5: Commit**

```bash
git add Dockerfile .dockerignore README.md
git commit -m "chore: add Docker packaging and EasyPanel deployment instructions"
```
