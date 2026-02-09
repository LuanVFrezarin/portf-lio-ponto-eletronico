# Ponto Eletrônico - Sistema de Registro de Ponto (Portfólio)

Sistema completo de registro de ponto voltado para uso em empresas — construído com **Next.js 14**, pensado para portfólio e fácil de adaptar para produção.

---

## ✅ Resumo

- Projeto full-stack (API routes no Next.js) com fallback para **localStorage** — ideal para demonstrações e deploys sem banco.
- Pode ser convertido para usar **Postgres** (Vercel Postgres, Supabase, Neon, Railway) com Prisma.

---

## 🚀 Funcionalidades Principais

- Login por PIN (funcionário)
- Painel Admin (gerenciar funcionários, aprovar correções e justificativas, gerenciar folgas e avisos)
- Registro de ponto: Entrada / Início de almoço / Fim almoço / Saída
- Solicitações: correções, justificativas, pedidos de folga
- Notificações internas e relatórios administrativos
- Layout responsivo com Tailwind CSS
- Persistência local via localStorage (dados persistem no navegador)

---

## 🎯 Para que serve

- Demonstração de um sistema de ponto para portfólio
- Pode ser usado por pequenas empresas em demonstrações internas
- Fácil migração para banco de dados real

---

## 🧰 Tecnologias

- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- Prisma (opcional: usado no projeto para desenvolvimento com SQLite)

---

## 📦 Instalação & Execução (desenvolvimento)

```bash
npm install
npm run dev
```

Abra http://localhost:3000

---

## 🛠️ Build / Produção

```bash
npm run build
npm start
```

O comando `npm run build` também valida tipos e lint.

---

## 🔧 Uso (demo)

- Aplique login com o PIN de um funcionário. Alguns PINs já incluídos para demo: **111111**, **222222**, **333333** (veja `lib/initial-employees.ts`).
- Criar novos funcionários pela interface armazena em `localStorage` e persiste entre reloads no mesmo navegador.

> Nota: por padrão o projeto usa `localStorage` para persistência útil em portfólio (sem servidor de banco). Para usar um banco real, configure `DATABASE_URL` e migre para Postgres conforme abaixo.

---

## ⚙️ Migrando para Postgres / Vercel Postgres

1. Criar um banco Postgres (Vercel Postgres, Supabase, Neon, Railway, etc.)
2. Adicionar variável de ambiente `DATABASE_URL` no painel (Vercel / .env.local)
3. Gerar client Prisma: `npx prisma generate`
4. Aplicar migrations / sincronizar: `npx prisma migrate deploy` (ou `npx prisma db push` em dev)
5. Build e deploy (Vercel): `npm run build`

---

## 🧪 Importar dados de exemplo

- Existe `exemplo_funcionarios.csv` e o script `import-employees.ts` (usa Prisma). Em modo portfólio com localStorage, apenas `lib/initial-employees.ts` já contém 10 funcionários para demo.

---

## 🧰 Scripts úteis

- `npm run dev` — roda em modo dev
- `npm run build` — build de produção (checagens)
- `npm run start` — inicia o servidor de produção
- `npm run lint` — lint

---

## ⚠️ Observações importantes

- O arquivo `prisma/dev.db` está versionado apenas por conveniência de desenvolvimento. Em produção não deve ser usado — prefira Postgres.
