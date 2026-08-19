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
