# THERMATIS — versão com persistência de dados

Esta versão mantém o site igual no visual, mas troca o salvamento em `localStorage` por persistência real via:

- **Vercel Functions** no diretório `api/`
- **Supabase Postgres** como banco

## O que agora fica persistido

- conteúdo do site (`thermatis_master_store`)
- orçamentos enviados pelo formulário
- clientes
- visitas / agenda
- credenciais do admin salvas no banco

## Estrutura nova

- `persistence.js` → hidrata cache local e sincroniza com a API
- `api/` → funções da Vercel
- `sql/supabase_schema.sql` → estrutura do banco
- `.env.example` → variáveis necessárias
- `vercel.json` → headers e clean URLs

## Configuração rápida

### 1) Criar projeto no Supabase
Crie um projeto e abra o SQL Editor.

### 2) Rodar o schema
Execute o arquivo:

- `sql/supabase_schema.sql`

### 3) Configurar variáveis na Vercel
No projeto da Vercel, adicione:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `ADMIN_TOKEN_SECRET`
- `ADMIN_DEFAULT_USER`
- `ADMIN_DEFAULT_PASS`

Use `.env.example` como referência.

### 4) Subir no Git
```bash
 git init
 git add .
 git commit -m "feat: persistencia real com vercel + supabase"
```

### 5) Publicar na Vercel
Importe o repositório e faça o deploy.

## Como funciona

### Site público
- carrega o conteúdo salvo em `/api/store`
- quando o visitante envia o formulário, cria um orçamento em `/api/orcamentos`

### Admin
- faz login via `/api/auth-login`
- ao entrar, carrega store, orçamentos, clientes e visitas do banco
- quando você altera dados no painel, o cache local é sincronizado automaticamente com a API

## Observações importantes

- Sem configurar as variáveis da Vercel + Supabase, o projeto ainda abre, mas cai no modo local.
- O `.htaccess` não é usado na Vercel. A configuração válida para produção está em `vercel.json`.
- A primeira credencial do admin vem de `ADMIN_DEFAULT_USER` e `ADMIN_DEFAULT_PASS`. Depois que você salvar novas credenciais no painel, elas passam a ser lidas do banco.
