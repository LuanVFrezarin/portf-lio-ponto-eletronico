# Sistema de Ponto Eletrônico - Guia de Deploy

Sistema completo de controle de ponto eletrônico com interface web moderna e administração.

## ✅ Status: Pronto para Produção

O projeto está **100% configurado** com PostgreSQL Neon e pronto para deploy na Vercel.

### ✨ O que foi feito:
- ✅ Migração de SQLite → PostgreSQL Neon
- ✅ Todos os dados iniciais criados (Admin + 10 funcionários)
- ✅ Schema sincronizado com banco remoto
- ✅ Todas as APIs testadas e funcionais
- ✅ Configuração Vercel pronta

## 🚀 Deploy na Vercel

### Passo 1: Adicionar DATABASE_URL na Vercel

1. Acesse seu projeto na [Vercel Dashboard](https://vercel.com)
2. Vá em **Settings** → **Environment Variables**
3. Adicione a variável:
   ```
   DATABASE_URL = postgresql://neondb_owner:npg_ulVbsLYC1nB3@ep-winter-rice-acqveiqe-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require
   ```
4. (Opcional) Se precisar de migrações: Adicione também:
   ```
   DATABASE_URL_UNPOOLED = postgresql://neondb_owner:npg_ulVbsLYC1nB3@ep-winter-rice-acqveiqe.sa-east-1.aws.neon.tech/neondb?sslmode=require
   ```

### Passo 2: Fazer Push do Código

```bash
# Commit e push
git add .
git commit -m "Setup PostgreSQL Neon para produção"
git push origin main
```

Vercel fará deploy automático com:
- ✅ `prisma generate` - Gera cliente Prisma
- ✅ `prisma db push` - Sincroniza schema com banco
- ✅ `next build` - Build da aplicação

### Passo 3: Pronto! 🎉

Após o deploy, acesse sua app na Vercel e teste:

**Admin:**
- Usuário: `admin`
- Senha: `admin123`

**Funcionários (exemplos):**
- PIN: `111111` (João Silva)
- PIN: `222222` (Maria Santos)
- PIN: `333333` (Carlos Oliveira)
- E mais 7 funcionários...

## 🗄️ Banco de Dados PostgreSQL Neon

**Credenciais atuais:**
```
Host: ep-winter-rice-acqveiqe-pooler.sa-east-1.aws.neon.tech
Database: neondb
User: neondb_owner
Password: npg_ulVbsLYC1nB3
```

### ⚡ Painel do Neon

Acesse https://console.neon.tech para:
- Ver tabelas e dados
- Fazer backup
- Configurar réplicas
- Monitorar uso

## 🔧 Desenvolvimento Local

Para continuar desenvolvendo localmente com o banco remoto:

```bash
# Já está configurado em .env! Basta rodar:
npm run dev
```

Se quiser voltar para SQLite local:

```bash
# Editar .env
DATABASE_URL="file:./dev.db"

# E alterar prisma/schema.prisma
datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}

# Depois:
npm run db:setup
```

## 📝 Variáveis de Ambiente

### .env (Local - Neon remoto)
```dotenv
DATABASE_URL="postgresql://..."
DATABASE_URL_UNPOOLED="postgresql://..."
```

### Vercel (Production)
```
DATABASE_URL=postgresql://...
DATABASE_URL_UNPOOLED=postgresql://... (opcional)
```

## 📁 Arquivos de Configuração Adicionados

```
.vercelignore       # Ignora arquivos no build da Vercel
vercel.json         # Configuração customizada da Vercel
.env.example        # Template de variáveis
```

## 🗄️ Modelos do Banco de Dados

Todas as tabelas estão criadas e sincronizadas:

- **Employee** - Funcionários (10 exemplos criados)
- **DailyRecord** - Registros de ponto diários
- **Admin** - Administradores (1 exemplo criado)
- **Notice** - Avisos gerais
- **TimeOff** - Folgas/Férias
- **Overtime** - Horas extras
- **CorrectionRequest** - Solicitações de correção
- **JustificationRequest** - Justificativas de ausência
- **EmployeeNotification** - Notificações
- **EmployeeWeeklyOffDay** - Dias de folga semanais

## 📊 Monitoramento

Na Vercel você pode acompanhar:

1. **Logs de Build** - Settings → Deployments
2. **Runtime Logs** - Durante execução das APIs
3. **Analytics** - Performance e requisições
4. **Error Tracking** - Erros em tempo real

## 🆘 Solução de Problemas

### "Connection refused"
- Verificar se DATABASE_URL está correto na Vercel
- Validar SSL: adicionar `?sslmode=require`

### "Migration failed"
- Rodar localmente: `npm run db:push`
- Se mesmo assim falhar, checar schema em prisma/schema.prisma

### "Table already exists"
- Normal na primeira execução
- Prisma não recria tabelas existentes

## ✅ Checklist Final

- [x] PostgreSQL Neon criado
- [x] DATABASE_URL no .env
- [x] Schema sincronizado (prisma db push)
- [x] Dados iniciais criados (npm run db:seed)
- [x] Código commitado e pronto
- [ ] DATABASE_URL adicionado na Vercel (fazer isto)
- [ ] Fazer push para GitHub
- [ ] Vercel faz deploy automático

## 🎯 Próximas Ações

1. **Ir para Vercel Dashboard**
2. **Adicionar DATABASE_URL** em Environment Variables
3. **Fazer git push**
4. **Deploy automático começa**
5. **Test em: `seu-projeto.vercel.app`**

Tudo pronto! 🚀
