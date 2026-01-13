# 🚀 GUIA DE DEPLOY STAGING - AWS CONSOLE (PASSO A PASSO)

## 📋 FASE 1: PREPARAÇÃO LOCAL

### 1.1 Gerar Tokens Seguros

Abra o PowerShell e execute:

```powershell
# JWT Secret
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# JWT Refresh Secret
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Password Pepper
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

**COPIE ESSES 3 VALORES** - você vai precisar deles depois!

### 1.2 Variáveis de Ambiente Necessárias

```env
# BANCO (Postgres no mesmo Task)
DATABASE_URL=postgresql://postgres:SuaSenhaSegura123!@localhost:5432/pricehub_staging

# APPLICATION
NODE_ENV=production
PORT=3000

# JWT (colar os tokens gerados acima)
JWT_SECRET=seu_token_64_chars_aqui
JWT_EXPIRATION=15m
JWT_REFRESH_SECRET=outro_token_64_chars_aqui
JWT_REFRESH_EXPIRATION=7d

# PEPPER (colar o token gerado acima)
PASSWORD_PEPPER=seu_pepper_32_chars_aqui

# API
API_PREFIX=api/v1
```

---

## 🐳 FASE 2: BACKEND (ECS FARGATE)

### PASSO 1: Criar Repositório no ECR

1. Acesse o **AWS Console** → busque por **"ECR"**
2. Clique em **"Get Started"** ou **"Create repository"**
3. Preencha:
   - **Visibility settings**: Private
   - **Repository name**: `pricehub-backend`
   - **Tag immutability**: Disabled
   - **Scan on push**: Disabled (economizar)
4. Clique em **"Create repository"**
5. **COPIE O URI** do repositório (ex: `123456789.dkr.ecr.us-east-1.amazonaws.com/pricehub-backend`)

### PASSO 2: Fazer Build e Push da Imagem

No PowerShell, navegue até a pasta `backend`:

```powershell
cd "C:\Users\Thiago Gomes\Downloads\pricehub\backend"
```

#### 2.1 Login no ECR

No console AWS, clique no repositório `pricehub-backend` → botão **"View push commands"**

Copie e execute o **primeiro comando** (login):

```powershell
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin SEU_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com
```

#### 2.2 Build da Imagem

```powershell
docker build --target production -t pricehub-backend:latest .
```

#### 2.3 Tag da Imagem

```powershell
docker tag pricehub-backend:latest SEU_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/pricehub-backend:latest
```

#### 2.4 Push para o ECR

```powershell
docker push SEU_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/pricehub-backend:latest
```

### PASSO 3: Criar Log Group no CloudWatch

1. Busque por **"CloudWatch"** no console
2. Menu lateral → **"Logs"** → **"Log groups"**
3. Clique em **"Create log group"**
4. **Log group name**: `/ecs/pricehub-staging`
5. **Retention setting**: 7 days (para economizar)
6. Clique em **"Create"**

### PASSO 4: Criar Task Definition no ECS

1. Busque por **"ECS"** no console
2. Menu lateral → **"Task Definitions"**
3. Clique em **"Create new task definition"** → **"Create new task definition with JSON"**
4. **COLE O JSON** do arquivo `backend/ecs-task-definition.json`
5. **EDITE OS VALORES**:
   - Substitua `SEU_ACCOUNT_ID` pelo seu ID da AWS
   - Substitua `SuaSenhaSegura123!` por uma senha forte
   - Cole os 3 tokens que você gerou (JWT_SECRET, JWT_REFRESH_SECRET, PASSWORD_PEPPER)
6. Clique em **"Create"**

### PASSO 5: Criar Cluster ECS

1. No menu ECS → **"Clusters"** → **"Create cluster"**
2. Preencha:
   - **Cluster name**: `pricehub-staging`
   - **Infrastructure**: AWS Fargate (serverless)
3. Clique em **"Create"**

### PASSO 6: Criar Security Group

1. Busque por **"VPC"** no console
2. Menu lateral → **"Security Groups"**
3. Clique em **"Create security group"**
4. Preencha:
   - **Security group name**: `pricehub-backend-sg`
   - **Description**: Acesso ao backend staging
   - **VPC**: Selecione a VPC default
5. **Inbound rules** → **"Add rule"**:
   - **Type**: Custom TCP
   - **Port range**: 3000
   - **Source**: Anywhere IPv4 (0.0.0.0/0)
   - **Description**: API Backend
6. Clique em **"Create security group"**

### PASSO 7: Criar Service no ECS

1. No menu ECS → **"Clusters"** → clique em `pricehub-staging`
2. Aba **"Services"** → **"Create"**
3. **Environment**:
   - **Compute options**: Launch type
   - **Launch type**: FARGATE
4. **Deployment configuration**:
   - **Application type**: Service
   - **Family**: pricehub-staging
   - **Service name**: `pricehub-backend-service`
   - **Desired tasks**: 1
5. **Networking**:
   - **VPC**: Selecione a default
   - **Subnets**: Selecione TODAS as públicas
   - **Security group**: Selecione `pricehub-backend-sg`
   - **Public IP**: ENABLED (importante!)
6. Clique em **"Create"**

### PASSO 8: Descobrir o IP Público

1. Volte para **Clusters** → `pricehub-staging`
2. Aba **"Tasks"** → clique na task em execução
3. Aba **"Networking"** → **COPIE O IP PÚBLICO**

**Este é o endereço da sua API!** Exemplo: `http://54.123.45.67:3000`

### PASSO 9: Testar o Backend

Abra o navegador:

```
http://SEU_IP_PUBLICO:3000/api/v1/health
```

Ou use o PowerShell:

```powershell
curl http://SEU_IP_PUBLICO:3000/api/v1/health
```

---

## 🌐 FASE 3: FRONTEND (S3 + CLOUDFRONT)

### PASSO 1: Configurar URL da API

1. Edite o arquivo `frontend/.env.production`
2. Substitua pelo IP público que você copiou:

```env
VITE_API_URL=http://54.123.45.67:3000
```

### PASSO 2: Build do Frontend

No PowerShell:

```powershell
cd "C:\Users\Thiago Gomes\Downloads\pricehub\frontend"
npm run build
```

Isso vai gerar a pasta `dist/` com os arquivos estáticos.

### PASSO 3: Criar Bucket S3

1. Busque por **"S3"** no console
2. Clique em **"Create bucket"**
3. Preencha:
   - **Bucket name**: `pricehub-staging-frontend` (deve ser único globalmente)
   - **AWS Region**: us-east-1
   - **Block all public access**: DESMARQUE (vamos permitir acesso público)
   - Marque o checkbox de confirmação
4. Clique em **"Create bucket"**

### PASSO 4: Configurar Bucket para Hospedagem

1. Clique no bucket criado → aba **"Properties"**
2. Role até **"Static website hosting"** → **"Edit"**
3. Preencha:
   - **Static website hosting**: Enable
   - **Hosting type**: Host a static website
   - **Index document**: `index.html`
   - **Error document**: `index.html` (para React Router funcionar)
4. Clique em **"Save changes"**

### PASSO 5: Configurar Permissões do Bucket

1. Aba **"Permissions"** → **"Bucket policy"** → **"Edit"**
2. Cole este JSON (substitua o nome do bucket):

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::pricehub-staging-frontend/*"
    }
  ]
}
```

3. Clique em **"Save changes"**

### PASSO 6: Upload dos Arquivos

No PowerShell (na pasta frontend):

```powershell
aws s3 sync ./dist s3://pricehub-staging-frontend/ --delete
```

Ou via console:

1. Aba **"Objects"** → **"Upload"**
2. Clique em **"Add files"** e **"Add folder"**
3. Selecione TODOS os arquivos dentro de `dist/`
4. Clique em **"Upload"**

### PASSO 7: Acessar o Website

1. Volte para aba **"Properties"** do bucket
2. Role até **"Static website hosting"**
3. **COPIE A URL** (ex: `http://pricehub-staging-frontend.s3-website-us-east-1.amazonaws.com`)

**Pronto! Seu frontend está no ar! 🎉**

### PASSO 8 (OPCIONAL): Configurar CloudFront

Se quiser HTTPS e melhor performance:

1. Busque por **"CloudFront"** no console
2. **"Create distribution"**
3. **Origin settings**:
   - **Origin domain**: Cole a URL do S3 website (sem http://)
   - **Origin access**: Public
4. **Default cache behavior**:
   - **Viewer protocol policy**: Redirect HTTP to HTTPS
   - **Allowed HTTP methods**: GET, HEAD, OPTIONS, PUT, POST, PATCH, DELETE
5. **Settings**:
   - **Price class**: Use only North America and Europe (economizar)
6. Clique em **"Create distribution"**
7. Aguarde 5-10 minutos para propagar
8. **COPIE O DOMAIN NAME** (ex: `d111111abcdef8.cloudfront.net`)

**URL final**: `https://d111111abcdef8.cloudfront.net`

---

## ✅ CHECKLIST FINAL

- [ ] Backend rodando no ECS (testar `/api/v1/health`)
- [ ] Migrations aplicadas automaticamente (ver logs no CloudWatch)
- [ ] Frontend acessível pelo S3 ou CloudFront
- [ ] Login funcionando (testar criar usuário)
- [ ] CORS configurado (testar chamadas da API pelo frontend)

---

## 💰 CUSTOS ESTIMADOS (Staging 24/7)

- **ECS Fargate** (512 CPU / 1GB RAM): ~$15/mês
- **S3** (poucos GB): ~$0.50/mês
- **CloudFront** (baixo tráfego): ~$1/mês
- **CloudWatch Logs** (7 dias): ~$0.50/mês

**TOTAL**: ~$17/mês

---

## 🔧 COMANDOS ÚTEIS

### Ver logs do backend:

1. Console → **CloudWatch** → **Logs** → **Log groups** → `/ecs/pricehub-staging`
2. Clique em **backend/** para ver logs da API

### Atualizar imagem do backend:

```powershell
cd backend
docker build --target production -t pricehub-backend:latest .
docker tag pricehub-backend:latest SEU_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/pricehub-backend:latest
docker push SEU_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/pricehub-backend:latest
```

Depois no console ECS:

1. Service → **Update service** → Force new deployment
2. Aguarde a nova task subir

### Atualizar frontend:

```powershell
cd frontend
npm run build
aws s3 sync ./dist s3://pricehub-staging-frontend/ --delete
```

Se usar CloudFront, invalidar cache:

```powershell
aws cloudfront create-invalidation --distribution-id SEU_DISTRIBUTION_ID --paths "/*"
```

---

## 🐛 TROUBLESHOOTING

### Backend não sobe (task ficando em PENDING)

- Verifique se o Security Group permite tráfego na porta 3000
- Veja os logs no CloudWatch → `/ecs/pricehub-staging/backend/`

### Erro "Cannot connect to database"

- O `DATABASE_URL` no Task Definition está com `localhost` (correto!)
- Senha do Postgres está correta em ambos containers

### Frontend não acessa backend (CORS error)

- Verifique se `VITE_API_URL` aponta para o IP público correto
- Confirme que `app.enableCors()` está no `main.ts` do backend

### Task reiniciando constantemente

- Veja os logs do container no CloudWatch
- Provavelmente erro nas migrations ou variáveis de ambiente erradas
