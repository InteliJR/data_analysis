---
sidebar_position: 3
---

# ⚙️ Tecnologias

## 🗓 Informações Gerais

- **Nome do Projeto:** [Nome do Projeto]

- **Tech Lead:** Thiago Gomes

- **Data de Entrada na Área:** [17/10/2025]

- **Data Estimada de Conclusão da Área:** [20/10/2025]

## Checklist de Entrada e Saída da Área de Tecnologia

### ✅ Checklist de Entrada

- [✅] Documento de Visão de Produto validado

### 📤 Checklist de Saída

- [✅] Stack definida e aprovada
- [✅] Diagrama de arquitetura completo
- [✅] Plano de implantação claro
- [✅] Documento validado com o time de Desenvolvimento

## Stack Tecnológica

### Frontend
- **Framework/Biblioteca:** React 18
- **Linguagem principal:** TypeScript
- **Build Tool:** Vite
- **Ferramentas adicionais:** TailwindCSS, React Router, Axios
- **Justificativa da escolha:** 
  - React oferece ecossistema maduro e ampla adoção no mercado
  - TypeScript garante type-safety e melhor manutenibilidade
  - Vite proporciona desenvolvimento rápido com HMR eficiente
  - TailwindCSS acelera desenvolvimento com utility-first CSS

### Backend
- **Linguagem:** TypeScript (Node.js)
- **Framework:** NestJS
- **ORM:** Prisma
- **Estratégia de autenticação/autorização:** JWT (JSON Web Tokens) com Passport.js
- **Justificativa da escolha:**
  - NestJS oferece arquitetura modular e escalável, inspirada no Angular
  - TypeScript garante consistência entre frontend e backend
  - Prisma proporciona type-safety no banco, migrations automáticas e facilita mudanças de provedor
  - Estrutura orientada a injeção de dependências facilita testes e manutenção

### Banco de Dados
- **Tipo:** Relacional
- **Tecnologia:** PostgreSQL 16
- **Justificativa da escolha:**
  - Banco robusto e confiável para dados estruturados
  - Suporte excelente a ACID e transações complexas
  - Compatível com diversos provedores de DBaaS (AWS RDS, Supabase, Render, Railway, Neon)
  - Prisma oferece excelente integração com PostgreSQL

### Outras Tecnologias
- **Containerização:** Docker e Docker Compose (desenvolvimento local)
- **Testes automatizados:** Jest (backend), Vitest (frontend), Cypress (E2E)
- **Validação de dados:** class-validator e class-transformer (backend)
- **Documentação de API:** Swagger/OpenAPI
- **Monitoramento e logs:** A definir em produção (Sentry, DataDog ou CloudWatch)
- **Justificativa da escolha:**
  - Docker garante consistência entre ambientes de desenvolvimento
  - Jest/Vitest são padrão do ecossistema e bem integrados aos frameworks
  - Swagger facilita documentação automática e testabilidade da API

## Arquitetura da Solução

### Visão Geral da Arquitetura

A solução segue uma arquitetura **cliente-servidor tradicional** com separação clara entre frontend e backend:

- **Frontend (React + Vite):** SPA (Single Page Application) que consome a API REST do backend
- **Backend (NestJS + Prisma):** API REST que implementa a lógica de negócio e gerencia persistência de dados
- **Banco de Dados (PostgreSQL):** Armazenamento persistente em ambiente gerenciado (DBaaS)

A arquitetura foi projetada para **desenvolvimento local com Docker** e **deploy em produção com banco gerenciado**, garantindo:
- Facilidade de desenvolvimento (ambiente consistente via Docker)
- Confiabilidade em produção (DBaaS com backups automáticos)
- Portabilidade (troca de provedor de banco via variável de ambiente)

### Componentes Principais

#### Frontend
- **Componentes React:** Interface do usuário com componentes reutilizáveis
- **State Management:** Context API ou Zustand (a definir conforme complexidade)
- **HTTP Client:** Axios para comunicação com backend
- **Roteamento:** React Router para navegação

#### Backend
- **Controllers:** Endpoints REST que recebem requisições HTTP
- **Services:** Lógica de negócio e orquestração
- **Prisma Service:** Camada de acesso a dados (ORM)
- **Guards/Interceptors:** Autenticação, autorização e validação
- **DTOs:** Validação de entrada/saída com class-validator

#### Banco de Dados
- **PostgreSQL:** Instância gerenciada via DBaaS
- **Prisma Migrations:** Controle de versão do schema do banco
- **Connection Pooling:** Gerenciado pelo provedor DBaaS

### Diagrama da Arquitetura

```
┌─────────────────────────────────────────────────────────────┐
│                         USUÁRIO                              │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                    FRONTEND (React + Vite)                   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  Components  │  │     Pages    │  │   Services   │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│                         │                                    │
│                         │ HTTP/REST (Axios)                  │
└─────────────────────────┼────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│              BACKEND (NestJS + Prisma)                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ Controllers  │→ │   Services   │→ │Prisma Service│      │
│  └──────────────┘  └──────────────┘  └──────┬───────┘      │
│                                              │              │
│  ┌──────────────┐  ┌──────────────┐         │              │
│  │    Guards    │  │     DTOs     │         │              │
│  └──────────────┘  └──────────────┘         │              │
└──────────────────────────────────────────────┼──────────────┘
                                               │
                                               │ SQL/TCP
                                               ▼
┌─────────────────────────────────────────────────────────────┐
│          BANCO DE DADOS (PostgreSQL - DBaaS)                 │
│  ┌──────────────────────────────────────────────────┐       │
│  │  • Dados persistentes                            │       │
│  │  • Backups automáticos                           │       │
│  │  • Alta disponibilidade                          │       │
│  │  • Escalabilidade gerenciada                     │       │
│  └──────────────────────────────────────────────────┘       │
└─────────────────────────────────────────────────────────────┘
```

## Estrutura de Implantação

### Ambiente de Desenvolvimento

#### Como os devs devem subir localmente:

**Opção 1 - Com Docker (Recomendado):**
```bash
# Clonar repositório
git clone <repo-url>
cd projeto

# Configurar variáveis de ambiente
cp .env.example .env
cp backend/.env.example backend/.env

# Subir backend + banco com Docker
docker-compose up -d

# Executar migrations
docker-compose exec api npx prisma migrate dev

# Subir frontend separadamente
cd frontend
npm install
npm run dev
```

**Opção 2 - Sem Docker:**
```bash
# Backend
cd backend
npm install
npx prisma generate
npx prisma migrate dev
npm run start:dev

# Frontend (outro terminal)
cd frontend
npm install
npm run dev
```

#### Docker/Compose disponível?
✅ Sim. `docker-compose.yml` na raiz orquestra:
- Serviço `api` (NestJS)
- Serviço `db` (PostgreSQL)
- Serviço `pgadmin` (opcional, interface gráfica para o banco)

#### Variáveis de ambiente principais:

**Backend (`backend/.env`):**
```bash
DATABASE_URL="postgresql://postgres:senha@localhost:5432/projeto_dev"
NODE_ENV=development
PORT=3000
JWT_SECRET=seu-secret-aqui
```

**Frontend (`frontend/.env`):**
```bash
VITE_API_URL=http://localhost:3000
```

**Docker Compose (`.env` na raiz):**
```bash
DB_USER=postgres
DB_PASSWORD=postgres123
DB_NAME=projeto_dev
DB_PORT=5432
```

### Ambiente de Produção

#### URL:
- Frontend: `https://app.projeto.com` (a definir)
- Backend API: `https://api.projeto.com` (a definir)

#### Estratégia de deploy:
- **Frontend:** Deploy contínuo via Vercel/Netlify/AWS S3+CloudFront
- **Backend:** Deploy via AWS App Runner, ECS, ou plataforma similar (Render, Railway)
- **Banco de Dados:** DBaaS gerenciado (RDS, Supabase, Render PostgreSQL)

#### Infraestrutura:
- **Frontend:** Vercel (opção 1) ou AWS S3 + CloudFront (opção 2)
- **Backend:** AWS App Runner (opção 1) ou Render (opção 2)
- **Banco de Dados:** AWS RDS PostgreSQL (opção 1) ou Supabase (opção 2)
- **DNS:** Cloudflare ou Route 53
- **SSL/TLS:** Certificados gerenciados automaticamente pelo provedor

#### Ferramentas de observabilidade ativas:
- **Logs:** CloudWatch (AWS) ou logs nativos do provedor
- **Monitoramento de erros:** Sentry (a configurar)
- **Métricas de performance:** A definir (DataDog, New Relic, ou nativo do provedor)
- **Uptime monitoring:** UptimeRobot ou similar

### Diagrama de Implantação

#### Desenvolvimento (Local)
```
┌─────────────────────────────────────────┐
│         Máquina do Desenvolvedor        │
│  ┌──────────────────────────────────┐   │
│  │   Docker Compose                 │   │
│  │  ┌────────────┐  ┌────────────┐  │   │
│  │  │ Container  │  │ Container  │  │   │
│  │  │   API      │  │    DB      │  │   │
│  │  │  (NestJS)  │→ │(PostgreSQL)│  │   │
│  │  └────────────┘  └────────────┘  │   │
│  └──────────────────────────────────┘   │
│                                          │
│  ┌──────────────────────────────────┐   │
│  │   Frontend (Vite Dev Server)     │   │
│  │         localhost:5173           │   │
│  └──────────────────────────────────┘   │
└─────────────────────────────────────────┘
```

#### Produção
```
┌──────────────────────────────────────────────────────────┐
│                      USUÁRIOS                             │
└────────────────────┬─────────────────────────────────────┘
                     │
                     ▼
┌────────────────────────────────────────────────────────────┐
│                 CDN / Cloudflare                            │
└────────┬───────────────────────────────────┬───────────────┘
         │                                   │
         │ HTTPS                             │ HTTPS
         ▼                                   ▼
┌──────────────────────┐      ┌─────────────────────────────┐
│  Vercel/S3           │      │  AWS App Runner / Render    │
│  (Frontend React)    │      │  (Backend NestJS)           │
│                      │      │                             │
│  • Build estático    │      │  • Container Docker         │
│  • Edge caching      │      │  • Auto-scaling             │
│  • SSL automático    │      │  • Health checks            │
└──────────────────────┘      └──────────┬──────────────────┘
                                         │
                                         │ TCP/SSL
                                         ▼
                              ┌────────────────────────────┐
                              │   AWS RDS / Supabase       │
                              │   (PostgreSQL DBaaS)       │
                              │                            │
                              │  • Backups automáticos     │
                              │  • Multi-AZ (HA)           │
                              │  • Encryption at rest      │
                              │  • Connection pooling      │
                              └────────────────────────────┘
```

## Considerações de Segurança

### Políticas de CORS:
- **Desenvolvimento:** CORS habilitado para `localhost:5173` (frontend)
- **Produção:** CORS configurado apenas para domínio do frontend (`https://app.projeto.com`)
- Implementado via `@nestjs/cors` no `main.ts`

### Proteção de dados sensíveis:
- **Senhas:** Hash com bcrypt (salt rounds: 10)
- **Tokens JWT:** Assinados com secret forte, expiração de 7 dias (refresh token) e 15min (access token)
- **Dados em trânsito:** HTTPS/TLS obrigatório em produção
- **Dados em repouso:** Encryption at rest habilitada no DBaaS
- **Variáveis sensíveis:** Nunca commitadas no Git, sempre via `.env`

### Gestão de segredos:
- **Desenvolvimento:** Arquivo `.env` local (não versionado)
- **Produção:** 
  - AWS Secrets Manager (opção 1)
  - Variáveis de ambiente do provedor de deploy (App Runner, Render)
  - Rotação automática de credenciais do banco (RDS)

### Autenticação e autorização:
- **Método:** JWT (JSON Web Tokens) via Passport.js
- **Fluxo:**
  1. Login → Backend valida credenciais → Retorna access token + refresh token
  2. Requisições autenticadas enviam token no header `Authorization: Bearer <token>`
  3. Backend valida token via `JwtGuard` antes de processar requisição
- **Autorização:** Guards personalizados verificam roles/permissions do usuário
- **Refresh tokens:** Armazenados de forma segura (HttpOnly cookies ou storage encriptado)
- **Logout:** Invalidação de tokens (blacklist ou rotação)

### Outras Medidas:
- **Rate Limiting:** Implementado via `@nestjs/throttler` para prevenir DDoS/brute force
- **Validação de Input:** class-validator em todos os DTOs para prevenir injection
- **Sanitização:** Prisma automaticamente previne SQL injection via prepared statements
- **Headers de Segurança:** Helmet.js configurado (CSP, HSTS, X-Frame-Options, etc)
- **Dependências:** Auditoria regular com `npm audit` e atualizações de segurança
- **Logs:** Não logar informações sensíveis (senhas, tokens, PII desnecessário)