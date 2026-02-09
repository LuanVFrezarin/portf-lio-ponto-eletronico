# Sistema de Ponto — README 👥⏱️

## Visão geral 💡
**Sistema de controle de funcionários** para gestão de ponto, folgas, ausências, horas extras, aprovações e relatórios. Implementado com **Next.js (App Router)** e TypeScript, com rotas de API organizadas em `app/api`.

---

## Recursos principais ✅
- Gestão de funcionários (CRUD)
- Registro de ponto (check-in / check-out)
- Solicitação e aprovação de folgas / timeoffs
- Controle e registro de ausências
- Controle de horas extras (overtime)
- Painel analítico / estatísticas (dashboard)
- Importação de funcionários (import via csv)
- Autenticação e autorização para áreas administrativas

---

## Estrutura do projeto 🔧
- `app/` — páginas e rotas do frontend (ex.: `app/admin`, `app/login`)
- `app/api/` — endpoints server-side (`route.ts`) (ex.: `admin/employees`, `ponto/register`, `auth/login`)
- `globals.css` — estilos globais

Principais endpoints (exemplos):
- `POST /api/ponto/register` — registrar batida de ponto
- `GET/POST /api/admin/employees` — listar / criar funcionários
- `GET /api/admin/dashboard-stats` — métricas do painel
- `POST /api/auth/login` — autenticação

---

## Tech stack ⚙️
- Next.js (App Router) + React + TypeScript
- API via Route Handlers (`route.ts`)
- Recomendado: PostgreSQL + Prisma (ou outro ORM)
- Deploy: Vercel, Netlify ou similar

---

## Instalação (local) 🧭
Requisitos: Node >= 18, npm/yarn/pnpm

1. Clonar o repositório
2. Instalar dependências: `npm install` (ou `yarn`, `pnpm install`)
3. Criar `.env` com variáveis mínimas (exemplos abaixo)
4. Rodar em desenvolvimento: `npm run dev`

Exemplos de variáveis de ambiente (`.env`):
```
DATABASE_URL=postgresql://user:pass@host:5432/dbname
JWT_SECRET=uma_chave_secreta_aqui
NEXT_PUBLIC_API_BASE_URL=http://localhost:3000
```

---

## Uso rápido (exemplos) 📡
- Registrar ponto (exemplo):
```
curl -X POST http://localhost:3000/api/ponto/register -H "Content-Type: application/json" -d '{"employeeId":"123"}'
```
- Listar funcionários (admin):
```
curl http://localhost:3000/api/admin/employees
```
(Autenticação via token/cookie conforme implementação.)

---

## Testes, lint e qualidade 🧪
Recomendações:
- `eslint` + `prettier`
- Testes com Jest + React Testing Library
- `tsc` para checagem de tipos
- Scripts úteis: `npm run lint`, `npm run test`, `npm run format`

---

## Segurança & privacidade 🔐
- Proteger rotas administrativas com autenticação e políticas de autorização
- Armazenar segredos em variáveis de ambiente
- Considerar conformidade com LGPD/GDPR para dados dos funcionários

---

---

## Como explorar o código 🔎
1. Examinar `app/admin` para fluxos administrativos
2. Revisar `app/api` para contratos de endpoints e validações
3. Procurar por testes e configs (ex.: `.eslintrc`, `tsconfig.json`)
4. Rodar os principais fluxos em ambiente local

