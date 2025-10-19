# 📘 Nome do Projeto

<!--
Breve descrição do projeto, incluindo o objetivo, nome do cliente e o setor envolvido.
-->

Exemplo: _Aplicação web para gestão de processos internos da Empresa X, no setor de logística._

Acesse a solução por meio deste [🔗 Link](https://www.nasa.gov/)

---

## 📄 Documentação

A documentação completa do projeto pode ser acessada através deste **[link](https://intelijr.github.io/data_analysis/)**

> A documentação é mantida utilizando o [Docusaurus](https://docusaurus.io/). Para informações sobre como configurar e manter a documentação, consulte o [guia de configuração](./docs/README.md).

---

## 🚀 Tecnologias Utilizadas

### Frontend
- React 18
- Vite
- TypeScript
- TailwindCSS

### Backend

<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>

[circleci-image]: https://img.shields.io/circleci/build/github/nestjs/nest/master?token=abc123def456
[circleci-url]: https://circleci.com/gh/nestjs/nest

  <p align="center">A progressive <a href="http://nodejs.org" target="_blank">Node.js</a> framework for building efficient and scalable server-side applications.</p>
    <p align="center">
</p>

- NestJS
- Prisma ORM
- PostgreSQL
- Docker & Docker Compose

### Infraestrutura
- Docker (desenvolvimento)
- DBaaS - PostgreSQL (produção)

---

## 🛠️ Como Rodar o Projeto

### Pré-requisitos

- Node.js 20+
- Docker e Docker Compose
- npm ou yarn

### 🐳 Opção 1: Rodar com Docker (Recomendado para Desenvolvimento)

```bash
# Clone o repositório
git clone https://github.com/inteli-junior/nomedoprojeto.git
cd nomedoprojeto

# Configure as variáveis de ambiente
cp .env.example .env
cp backend/.env.example backend/.env

# Inicie todos os serviços (backend + banco de dados)
docker-compose up -d

# Execute as migrations do Prisma
docker-compose exec api npx prisma migrate dev

# Acesse:
# - Backend: http://localhost:3000
# - Frontend: Configure separadamente (veja abaixo)
# - PgAdmin: http://localhost:5050
```

### 💻 Opção 2: Rodar Localmente (Sem Docker)

#### Backend

```bash
# Acesse o diretório do backend
cd backend

# Instale as dependências
npm install

# Configure o arquivo .env com a DATABASE_URL
# Exemplo: DATABASE_URL="postgresql://user:pass@localhost:5432/projeto_dev"

# Gere o Prisma Client
npx prisma generate

# Execute as migrations
npx prisma migrate dev

# Inicie o servidor
npm run start:dev

# Backend rodando em: http://localhost:3000
```

#### Frontend

```bash
# Em outro terminal, acesse o diretório do frontend
cd frontend

# Instale as dependências
npm install

# Configure o arquivo .env (se necessário)
# Exemplo: VITE_API_URL=http://localhost:3000

# Inicie o servidor de desenvolvimento
npm run dev

# Frontend rodando em: http://localhost:5173
```

---

## 🗂️ Estrutura de Diretórios

```bash
.
├── .github/                       # Configurações de CI/CD e templates de PR
│
├── backend/                       # Código backend (NestJS + Prisma)
│   ├── src/                       # Código fonte
│   ├── prisma/                    # Schema e migrations do Prisma
│   │   └── schema.prisma          # Definição do banco de dados
│   ├── Dockerfile                 # Build da imagem Docker
│   ├── .dockerignore              # Arquivos ignorados no build
│   └── .env.example               # Exemplo de variáveis de ambiente
│
├── frontend/                      # Código frontend (React + Vite)
│   ├── src/                       # Código fonte
│   ├── public/                    # Arquivos estáticos
│   └── .env.example               # Exemplo de variáveis de ambiente
│
├── docs/                          # Documentação Docusaurus
│   ├── docs/
│   │   ├── visao-produto.md       # Documento elaborado pela área de Visão de Produto
│   │   ├── design.md              # Documento elaborado pela área de Design
│   │   ├── desenvolvimento.md     # Documento elaborado pela área de Desenvolvimento
│
├── docker-compose.yml             # Orquestração dos containers (dev)
├── .env.example                   # Exemplo de variáveis para Docker Compose
├── .gitignore                     # Arquivos ignorados pelo Git
└── README.md                      # Este documento
```

---

## 🔧 Comandos Úteis

### Prisma

```bash
# Criar nova migration
npx prisma migrate dev --name nome_migration

# Aplicar migrations em produção
npx prisma migrate deploy

# Abrir Prisma Studio (visualizar dados)
npx prisma studio

# Resetar banco (CUIDADO! Apaga todos os dados)
npx prisma migrate reset
```

### Docker

```bash
# Iniciar containers
docker-compose up -d

# Ver logs
docker-compose logs -f api

# Parar containers
docker-compose down

# Rebuild dos containers
docker-compose build --no-cache

# Executar comandos no container
docker-compose exec api <comando>
```

---

## 🚀 Deploy em Produção

### Banco de Dados

O projeto está configurado para usar **DBaaS (Database as a Service)** em produção, garantindo:

- ✅ Backups automáticos
- ✅ Alta disponibilidade
- ✅ Escalabilidade
- ✅ Segurança

**Opções recomendadas de DBaaS:**
- AWS RDS (PostgreSQL)
- AWS Aurora Serverless
- Supabase
- Render PostgreSQL
- Railway
- Neon

**Para trocar o banco de dados**, basta alterar a variável de ambiente `DATABASE_URL`:

```bash
# Desenvolvimento (Docker local)
DATABASE_URL="postgresql://postgres:senha@localhost:5432/projeto_dev"

# Produção (DBaaS)
DATABASE_URL="postgresql://user:senha@seu-rds.amazonaws.com:5432/projeto_prod?sslmode=require"
```

### Backend

1. Faça build da imagem Docker:
   ```bash
   docker build -t projeto-api:latest ./backend
   ```

2. Configure as variáveis de ambiente no serviço de deploy:
   - `DATABASE_URL` (apontando para o DBaaS)
   - `NODE_ENV=production`
   - `JWT_SECRET` (se aplicável)

3. Execute as migrations antes do primeiro deploy:
   ```bash
   npx prisma migrate deploy
   ```

### Frontend

1. Faça build do projeto:
   ```bash
   cd frontend
   npm run build
   ```

2. Faça deploy da pasta `dist/` para:
   - Vercel
   - Netlify
   - AWS S3 + CloudFront
   - Ou seu serviço preferido

---

## 👥 Time do Projeto

Conheça quem participou do desenvolvimento deste projeto:

- **Nome da Pessoa 1**  
  [![GitHub](https://img.shields.io/badge/GitHub-100000?style=for-the-badge&logo=github&logoColor=white)](https://github.com/usuario1)
  [![LinkedIn](https://img.shields.io/badge/LinkedIn-blue?style=for-the-badge&logo=linkedin&logoColor=white)](https://linkedin.com/in/usuario1)

- **Nome da Pessoa 2**  
  [![GitHub](https://img.shields.io/badge/GitHub-100000?style=for-the-badge&logo=github&logoColor=white)](https://github.com/usuario2)
  [![LinkedIn](https://img.shields.io/badge/LinkedIn-blue?style=for-the-badge&logo=linkedin&logoColor=white)](https://linkedin.com/in/usuario2)

- **Nome da Pessoa 3**  
  [![GitHub](https://img.shields.io/badge/GitHub-100000?style=for-the-badge&logo=github&logoColor=white)](https://github.com/usuario3)
  [![LinkedIn](https://img.shields.io/badge/LinkedIn-blue?style=for-the-badge&logo=linkedin&logoColor=white)](https://linkedin.com/in/usuario3)

---

## 🆘 Suporte

Para dúvidas ou problemas:
1. Verifique a [documentação completa](https://intelijr.github.io/data_analysis/)
2. Abra uma issue no GitHub
3. Entre em contato com o time através do email: inteli.junior@gmail.com