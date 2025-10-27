# Documentação Completa da API - Sistema de Precificação

## Visão Geral do Sistema

Sistema de gestão de precificação de produtos que permite gerenciar matérias-primas, impostos, fretes, custos fixos e produtos finais. O sistema calcula automaticamente o preço dos produtos baseado nas matérias-primas utilizadas, impostos e fretes associados.

---

## Autenticação

Todos os endpoints (exceto login e registro) requerem autenticação via JWT Bearer Token.

```
Authorization: Bearer <token>
```

### 1. Registro de Usuário

**POST** `/auth/register`

**Permissões:** Público (mas usuário deve ser ativado por um ADMIN)

**Request Body:**
```json
{
  "email": "usuario@exemplo.com",
  "name": "Nome do Usuário",
  "password": "senha_segura_123",
  "role": "COMERCIAL"
}
```

**Response:** `201 Created`
```json
{
  "id": "uuid-v4",
  "email": "usuario@exemplo.com",
  "name": "Nome do Usuário",
  "role": "COMERCIAL",
  "isActive": false,
  "createdAt": "2025-10-26T10:00:00.000Z",
  "updatedAt": "2025-10-26T10:00:00.000Z"
}
```

**Erros:**
- `400 Bad Request`: Dados inválidos ou email já cadastrado
- `422 Unprocessable Entity`: Validação falhou

**Nota:** 
- Campo `role` é opcional. Se não informado, será criado com role padrão definido no sistema.
- Usuário é criado com `isActive: false` e precisa ser ativado por um ADMIN para fazer login.

---

### 2. Login

**POST** `/auth/login`

**Permissões:** Público

**Request Body:**
```json
{
  "email": "usuario@exemplo.com",
  "password": "senha_segura_123"
}
```

**Response:** `200 OK`
```json
{
 "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
 "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
 "user": {
  "id": "uuid-v4",
  "email": "usuario@exemplo.com",
  "name": "Nome do Usuário",
  "createdAt": "2025-10-26T10:00:00.000Z"
 }
}
```

**Erros:**
- `401 Unauthorized`: Credenciais inválidas ou usuário inativo
- `400 Bad Request`: Dados inválidos

---

### 3. Logout

**POST** `/auth/logout`

**Permissões:** Usuário autenticado

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
 "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```


**Response:** `200 OK`
```json
{
  "message": "Logout realizado com sucesso"
}
```

---

### 4. Refresh Token

**POST** `/auth/refresh`

**Permissões:** Usuário autenticado

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
 "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response:** `200 OK`
```json
{
 "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
 "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

---

### 4.5. Obter Perfil do Usuário Autenticado

**GET** `/auth/me`

**Permissões:** Usuário autenticado

**Headers:**
```
Authorization: Bearer <token>
```

**Response:** `200 OK`
```json
{
 "id": "uuid-v4",
 "email": "usuario@exemplo.com",
 "name": "Nome do Usuário",
 "role": "COMERCIAL",
 "isActive": true,
 "createdAt": "2025-10-26T10:00:00.000Z"
}
```

---

## Gestão de Usuários

### 5. Listar Usuários

**GET** `/users`

**Permissões:** ADMIN

**Query Parameters:**
```
?page=1
&limit=10
&search=nome_ou_email
&role=COMERCIAL
&isActive=true
&sortBy=name
&sortOrder=asc
```

_**Nota:** Usuários desativados (isActive: false) não conseguem fazer login, mas permanecem no sistema para preservar integridade dos logs e relações._

**Response:** `200 OK`
```json
{
  "data": [
    {
      "id": "uuid-v4",
      "email": "usuario@exemplo.com",
      "name": "Nome do Usuário",
      "role": "COMERCIAL",
      "isActive": true,
      "createdAt": "2025-10-26T10:00:00.000Z",
      "updatedAt": "2025-10-26T10:00:00.000Z"
    }
  ],
  "meta": {
    "total": 50,
    "page": 1,
    "limit": 10,
    "totalPages": 5
  }
}
```

---

### 6. Obter Usuário por ID

**GET** `/users/:id`

**Permissões:** ADMIN

**Response:** `200 OK`
```json
{
  "id": "uuid-v4",
  "email": "usuario@exemplo.com",
  "name": "Nome do Usuário",
  "role": "COMERCIAL",
  "isActive": true,
  "createdAt": "2025-10-26T10:00:00.000Z",
  "updatedAt": "2025-10-26T10:00:00.000Z"
}
```

**Erros:**
- `404 Not Found`: Usuário não encontrado

---

### 7. Atualizar Usuário

**PATCH** `/users/:id`

**Permissões:** ADMIN

**Request Body:**
```json
{
 "name": "Novo Nome",
 "role": "LOGISTICA",
 "isActive": false,
 "password": "nova_senha_segura_123"
}
```

**Response:** `200 OK`
```json
{
  "id": "uuid-v4",
  "email": "usuario@exemplo.com",
  "name": "Novo Nome",
  "role": "LOGISTICA",
  "isActive": false,
  "createdAt": "2025-10-26T10:00:00.000Z",
  "updatedAt": "2025-10-26T10:30:00.000Z"
}
```

**Nota:** 
- _Para desativar um usuário, envie `isActive: false`. Usuários desativados não conseguem fazer login._
- _O campo `password` é opcional e permite que o ADMIN redefina a senha do usuário._
- _Apenas ADMIN pode modificar `role` e `isActive`._

**Nota sobre Exclusão de Usuários:** 
- _Não é possível deletar usuários do sistema devido às relações de auditoria (logs de alterações em matérias-primas, produtos criados, etc.). Para impedir acesso, desative o usuário através do endpoint de atualização enviando `isActive: false`._

---

### 8. Atualizar Próprio Perfil

**PATCH** `/users/me`

**Permissões:** Usuário autenticado

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
 "name": "Novo Nome",
 "password": "nova_senha_123"
}
```

**Response:** `200 OK`
```json
{
 "id": "uuid-v4",
 "email": "usuario@exemplo.com",
 "name": "Novo Nome",
 "role": "COMERCIAL",
 "isActive": true,
 "createdAt": "2025-10-26T10:00:00.000Z",
 "updatedAt": "2025-10-26T10:30:00.000Z"
}
```

_**Nota:** Usuários comuns só podem alterar seu próprio nome e senha. Não podem modificar email, role ou status._

---

### 9. Obter Próprio Perfil

**GET** `/users/me`

**Permissões:** Usuário autenticado

**Headers:**
```
Authorization: Bearer <token>
```

**Response:** `200 OK`
```json
{
  "id": "uuid-v4",
  "email": "usuario@exemplo.com",
  "name": "Nome do Usuário",
  "role": "COMERCIAL",
  "isActive": true,
  "createdAt": "2025-10-26T10:00:00.000Z",
  "updatedAt": "2025-10-26T10:00:00.000Z"
}
```

_Nota: Este endpoint retorna os dados completos do usuário autenticado. Diferente do /auth/me que retorna apenas informações básicas._

---

## Impostos (Taxes)

### 9. Criar Imposto

**POST** `/taxes`

**Permissões:** ADMIN, IMPOSTO

**Request Body:**
```json
{
  "name": "Simples Nacional",
  "description": "Regime tributário simplificado",
  "items": [
    {
      "name": "PIS",
      "rate": 1.65,
      "recoverable": true
    },
    {
      "name": "COFINS",
      "rate": 7.60,
      "recoverable": true
    },
    {
      "name": "ICMS",
      "rate": 18.00,
      "recoverable": false
    }
  ]
}
```

**Response:** `201 Created`
```json
{
  "id": "uuid-v4",
  "name": "Simples Nacional",
  "description": "Regime tributário simplificado",
  "createdAt": "2025-10-26T10:00:00.000Z",
  "updatedAt": "2025-10-26T10:00:00.000Z",
  "taxItems": [
    {
      "id": "uuid-v4",
      "taxId": "uuid-v4",
      "name": "PIS",
      "rate": 1.65,
      "recoverable": true,
      "createdAt": "2025-10-26T10:00:00.000Z",
      "updatedAt": "2025-10-26T10:00:00.000Z"
    },
    {
      "id": "uuid-v4",
      "taxId": "uuid-v4",
      "name": "COFINS",
      "rate": 7.60,
      "recoverable": true,
      "createdAt": "2025-10-26T10:00:00.000Z",
      "updatedAt": "2025-10-26T10:00:00.000Z"
    }
  ]
}
```

---

### 10. Listar Impostos

**GET** `/taxes`

**Permissões:** ADMIN, IMPOSTO, COMERCIAL (para associar a matérias-primas)

**Query Parameters:**
```
?page=1
&limit=10
&search=nome
&sortBy=name
&sortOrder=asc
```

**Response:** `200 OK`
```json
{
  "data": [
    {
      "id": "uuid-v4",
      "name": "Simples Nacional",
      "description": "Regime tributário simplificado",
      "createdAt": "2025-10-26T10:00:00.000Z",
      "updatedAt": "2025-10-26T10:00:00.000Z",
      "taxItems": [
        {
          "id": "uuid-v4",
          "name": "PIS",
          "rate": 1.65,
          "recoverable": true
        },
        {
          "id": "uuid-v4",
          "name": "COFINS",
          "rate": 7.60,
          "recoverable": true
        }
      ]
    }
  ],
  "meta": {
    "total": 5,
    "page": 1,
    "limit": 10,
    "totalPages": 1
  }
}
```

---

### 11. Obter Imposto por ID

**GET** `/taxes/:id`

**Permissões:** ADMIN, IMPOSTO, COMERCIAL

**Response:** `200 OK`
```json
{
  "id": "uuid-v4",
  "name": "Simples Nacional",
  "description": "Regime tributário simplificado",
  "createdAt": "2025-10-26T10:00:00.000Z",
  "updatedAt": "2025-10-26T10:00:00.000Z",
  "taxItems": [
    {
      "id": "uuid-v4",
      "taxId": "uuid-v4",
      "name": "PIS",
      "rate": 1.65,
      "recoverable": true,
      "createdAt": "2025-10-26T10:00:00.000Z",
      "updatedAt": "2025-10-26T10:00:00.000Z"
    }
  ]
}
```

---

### 12. Atualizar Imposto

**PATCH** `/taxes/:id`

**Permissões:** ADMIN, IMPOSTO

**Request Body:**
```json
{
  "name": "Simples Nacional Atualizado",
  "description": "Nova descrição",
  "items": [
    {
      "id": "uuid-existing",
      "name": "PIS",
      "rate": 1.70,
      "recoverable": true
    },
    {
      "name": "IPI",
      "rate": 5.00,
      "recoverable": false
    }
  ]
}
```

**Nota:** Items sem ID serão criados, items com ID serão atualizados, items não enviados serão deletados.

**Response:** `200 OK`
```json
{
  "id": "uuid-v4",
  "name": "Simples Nacional Atualizado",
  "description": "Nova descrição",
  "createdAt": "2025-10-26T10:00:00.000Z",
  "updatedAt": "2025-10-26T10:30:00.000Z",
  "taxItems": [
    {
      "id": "uuid-existing",
      "taxId": "uuid-v4",
      "name": "PIS",
      "rate": 1.70,
      "recoverable": true,
      "createdAt": "2025-10-26T10:00:00.000Z",
      "updatedAt": "2025-10-26T10:30:00.000Z"
    },
    {
      "id": "uuid-new",
      "taxId": "uuid-v4",
      "name": "IPI",
      "rate": 5.00,
      "recoverable": false,
      "createdAt": "2025-10-26T10:30:00.000Z",
      "updatedAt": "2025-10-26T10:30:00.000Z"
    }
  ]
}
```

---

### 13. Deletar Imposto

**DELETE** `/taxes/:id`

**Permissões:** ADMIN, IMPOSTO

**Response:** `200 OK`
```json
{
  "message": "Imposto deletado com sucesso"
}
```

**Erros:**
- `409 Conflict`: Imposto está associado a matérias-primas

---

### 14. Exportar Impostos (CSV)

**POST** `/taxes/export`

**Permissões:** ADMIN, IMPOSTO

**Request Body:**
```json
{
  "format": "csv",
  "limit": 100,
  "sortBy": "name",
  "sortOrder": "asc",
  "filters": {
    "search": "simples"
  }
}
```

**Response:** `200 OK`
```
Content-Type: text/csv
Content-Disposition: attachment; filename="impostos-2025-10-26.csv"

ID,Nome,Descrição,Itens,Data de Criação
uuid-1,Simples Nacional,Regime simplificado,"PIS (1.65%), COFINS (7.60%)",2025-10-26
```

---

## Fretes (Freights)

### 15. Criar Frete

**POST** `/freights`

**Permissões:** ADMIN, LOGISTICA

**Request Body:**
```json
{
  "name": "Transporte Rodoviário SP-RJ",
  "description": "Frete rodoviário com prazo de 5 dias",
  "paymentTerm": 30,
  "unitPrice": 150.00,
  "currency": "BRL",
  "additionalCosts": 25.50,
  "freightTaxes": [
    {
      "name": "ICMS",
      "rate": 12.00
    },
    {
      "name": "PIS",
      "rate": 1.65
    },
    {
      "name": "COFINS",
      "rate": 7.60
    }
  ]
}
```

**Response:** `201 Created`
```json
{
  "id": "uuid-v4",
  "name": "Transporte Rodoviário SP-RJ",
  "description": "Frete rodoviário com prazo de 5 dias",
  "paymentTerm": 30,
  "unitPrice": 150.00,
  "currency": "BRL",
  "additionalCosts": 25.50,
  "createdAt": "2025-10-26T10:00:00.000Z",
  "updatedAt": "2025-10-26T10:00:00.000Z",
  "freightTaxes": [
    {
      "id": "uuid-v4",
      "freightId": "uuid-v4",
      "name": "ICMS",
      "rate": 12.00,
      "createdAt": "2025-10-26T10:00:00.000Z",
      "updatedAt": "2025-10-26T10:00:00.000Z"
    }
  ]
}
```

---

### 16. Listar Fretes

**GET** `/freights`

**Permissões:** ADMIN, LOGISTICA

**Query Parameters:**
```
?page=1
&limit=10
&search=nome_ou_descricao
&currency=BRL
&sortBy=name
&sortOrder=asc
```

**Response:** `200 OK`
```json
{
  "data": [
    {
      "id": "uuid-v4",
      "name": "Transporte Rodoviário SP-RJ",
      "description": "Frete rodoviário com prazo de 5 dias",
      "paymentTerm": 30,
      "unitPrice": 150.00,
      "currency": "BRL",
      "additionalCosts": 25.50,
      "createdAt": "2025-10-26T10:00:00.000Z",
      "updatedAt": "2025-10-26T10:00:00.000Z",
      "freightTaxes": [
        {
          "id": "uuid-v4",
          "name": "ICMS",
          "rate": 12.00
        }
      ]
    }
  ],
  "meta": {
    "total": 15,
    "page": 1,
    "limit": 10,
    "totalPages": 2
  }
}
```

---

### 17. Obter Frete por ID

**GET** `/freights/:id`

**Permissões:** ADMIN, LOGISTICA

**Response:** `200 OK`
```json
{
  "id": "uuid-v4",
  "name": "Transporte Rodoviário SP-RJ",
  "description": "Frete rodoviário com prazo de 5 dias",
  "paymentTerm": 30,
  "unitPrice": 150.00,
  "currency": "BRL",
  "additionalCosts": 25.50,
  "createdAt": "2025-10-26T10:00:00.000Z",
  "updatedAt": "2025-10-26T10:00:00.000Z",
  "freightTaxes": [
    {
      "id": "uuid-v4",
      "freightId": "uuid-v4",
      "name": "ICMS",
      "rate": 12.00,
      "createdAt": "2025-10-26T10:00:00.000Z",
      "updatedAt": "2025-10-26T10:00:00.000Z"
    }
  ]
}
```

---

### 18. Atualizar Frete

**PATCH** `/freights/:id`

**Permissões:** ADMIN, LOGISTICA

**Request Body:**
```json
{
  "name": "Transporte Rodoviário SP-RJ Atualizado",
  "unitPrice": 160.00,
  "freightTaxes": [
    {
      "id": "uuid-existing",
      "name": "ICMS",
      "rate": 13.00
    },
    {
      "name": "ISS",
      "rate": 5.00
    }
  ]
}
```

**Response:** `200 OK`
```json
{
  "id": "uuid-v4",
  "name": "Transporte Rodoviário SP-RJ Atualizado",
  "description": "Frete rodoviário com prazo de 5 dias",
  "paymentTerm": 30,
  "unitPrice": 160.00,
  "currency": "BRL",
  "additionalCosts": 25.50,
  "createdAt": "2025-10-26T10:00:00.000Z",
  "updatedAt": "2025-10-26T10:30:00.000Z",
  "freightTaxes": [
    {
      "id": "uuid-existing",
      "freightId": "uuid-v4",
      "name": "ICMS",
      "rate": 13.00,
      "createdAt": "2025-10-26T10:00:00.000Z",
      "updatedAt": "2025-10-26T10:30:00.000Z"
    },
    {
      "id": "uuid-new",
      "freightId": "uuid-v4",
      "name": "ISS",
      "rate": 5.00,
      "createdAt": "2025-10-26T10:30:00.000Z",
      "updatedAt": "2025-10-26T10:30:00.000Z"
    }
  ]
}
```

---

### 19. Deletar Frete

**DELETE** `/freights/:id`

**Permissões:** ADMIN, LOGISTICA

**Response:** `200 OK`
```json
{
  "message": "Frete deletado com sucesso"
}
```

**Erros:**
- `409 Conflict`: Frete está associado a matérias-primas

---

### 20. Exportar Fretes (CSV)

**POST** `/freights/export`

**Permissões:** ADMIN, LOGISTICA

**Request Body:**
```json
{
  "format": "csv",
  "limit": 100,
  "sortBy": "name",
  "sortOrder": "asc",
  "filters": {
    "search": "rodoviário",
    "currency": "BRL"
  }
}
```

**Response:** `200 OK`
```
Content-Type: text/csv
Content-Disposition: attachment; filename="fretes-2025-10-26.csv"

ID,Nome,Descrição,Prazo,Preço,Moeda,Custos Adicionais,Impostos
uuid-1,Transporte Rodoviário,Frete com prazo de 5 dias,30,150.00,BRL,25.50,"ICMS (12%), PIS (1.65%)"
```

---

## Matérias-Primas (Raw Materials)

### 21. Criar Matéria-Prima

**POST** `/raw-materials`

**Permissões:** ADMIN, COMERCIAL

**Request Body:**
```json
{
  "code": "MP-2024-001",
  "name": "Resina Poliéster",
  "description": "Resina de alta qualidade para laminação",
  "measurementUnit": "KG",
  "inputGroup": "Resinas",
  "paymentTerm": 30,
  "acquisitionPrice": 25.50,
  "currency": "BRL",
  "priceConvertedBrl": 25.50,
  "additionalCost": 2.30,
  "taxId": "uuid-tax",
  "freightId": "uuid-freight"
}
```

**Response:** `201 Created`
```json
{
  "id": "uuid-v4",
  "code": "MP-2024-001",
  "name": "Resina Poliéster",
  "description": "Resina de alta qualidade para laminação",
  "measurementUnit": "KG",
  "inputGroup": "Resinas",
  "paymentTerm": 30,
  "acquisitionPrice": 25.50,
  "currency": "BRL",
  "priceConvertedBrl": 25.50,
  "additionalCost": 2.30,
  "taxId": "uuid-tax",
  "freightId": "uuid-freight",
  "createdAt": "2025-10-26T10:00:00.000Z",
  "updatedAt": "2025-10-26T10:00:00.000Z",
  "tax": {
    "id": "uuid-tax",
    "name": "Simples Nacional",
    "taxItems": [
      {
        "name": "PIS",
        "rate": 1.65,
        "recoverable": true
      }
    ]
  },
  "freight": {
    "id": "uuid-freight",
    "name": "Transporte Rodoviário",
    "unitPrice": 150.00,
    "freightTaxes": [
      {
        "name": "ICMS",
        "rate": 12.00
      }
    ]
  }
}
```

---

### 22. Listar Matérias-Primas

**GET** `/raw-materials`

**Permissões:** ADMIN, COMERCIAL, IMPOSTO

**Query Parameters:**
```
?page=1
&limit=10
&search=codigo_ou_nome
&measurementUnit=KG
&inputGroup=Resinas
&currency=BRL
&sortBy=name
&sortOrder=asc
&includeTax=true
&includeFreight=true
```

**Response:** `200 OK`
```json
{
  "data": [
    {
      "id": "uuid-v4",
      "code": "MP-2024-001",
      "name": "Resina Poliéster",
      "description": "Resina de alta qualidade",
      "measurementUnit": "KG",
      "inputGroup": "Resinas",
      "paymentTerm": 30,
      "acquisitionPrice": 25.50,
      "currency": "BRL",
      "priceConvertedBrl": 25.50,
      "additionalCost": 2.30,
      "taxId": "uuid-tax",
      "freightId": "uuid-freight",
      "createdAt": "2025-10-26T10:00:00.000Z",
      "updatedAt": "2025-10-26T10:00:00.000Z",
      "tax": {
        "id": "uuid-tax",
        "name": "Simples Nacional"
      },
      "freight": {
        "id": "uuid-freight",
        "name": "Transporte Rodoviário"
      }
    }
  ],
  "meta": {
    "total": 150,
    "page": 1,
    "limit": 10,
    "totalPages": 15
  }
}
```

---

### 23. Obter Matéria-Prima por ID

**GET** `/raw-materials/:id`

**Permissões:** ADMIN, COMERCIAL, IMPOSTO

**Query Parameters:**
```
?includeChangeLogs=true
```

**Response:** `200 OK`
```json
{
  "id": "uuid-v4",
  "code": "MP-2024-001",
  "name": "Resina Poliéster",
  "description": "Resina de alta qualidade para laminação",
  "measurementUnit": "KG",
  "inputGroup": "Resinas",
  "paymentTerm": 30,
  "acquisitionPrice": 25.50,
  "currency": "BRL",
  "priceConvertedBrl": 25.50,
  "additionalCost": 2.30,
  "taxId": "uuid-tax",
  "freightId": "uuid-freight",
  "createdAt": "2025-10-26T10:00:00.000Z",
  "updatedAt": "2025-10-26T10:00:00.000Z",
  "tax": {
    "id": "uuid-tax",
    "name": "Simples Nacional",
    "taxItems": [
      {
        "name": "PIS",
        "rate": 1.65,
        "recoverable": true
      },
      {
        "name": "COFINS",
        "rate": 7.60,
        "recoverable": true
      }
    ]
  },
  "freight": {
    "id": "uuid-freight",
    "name": "Transporte Rodoviário",
    "unitPrice": 150.00,
    "currency": "BRL",
    "additionalCosts": 25.50,
    "freightTaxes": [
      {
        "name": "ICMS",
        "rate": 12.00
      }
    ]
  },
  "changeLogs": [
    {
      "id": "uuid-log",
      "field": "acquisitionPrice",
      "oldValue": "24.00",
      "newValue": "25.50",
      "changedBy": "uuid-user",
      "changedAt": "2025-10-26T10:00:00.000Z"
    }
  ]
}
```

---

### 24. Atualizar Matéria-Prima

**PATCH** `/raw-materials/:id`

**Permissões:** ADMIN, COMERCIAL

**Request Body:**
```json
{
  "name": "Resina Poliéster Premium",
  "acquisitionPrice": 27.00,
  "taxId": "uuid-new-tax",
  "additionalCost": 3.00
}
```

**Nota:** Todas as alterações são registradas no log de mudanças automaticamente.

**Response:** `200 OK`
```json
{
  "id": "uuid-v4",
  "code": "MP-2024-001",
  "name": "Resina Poliéster Premium",
  "description": "Resina de alta qualidade para laminação",
  "measurementUnit": "KG",
  "inputGroup": "Resinas",
  "paymentTerm": 30,
  "acquisitionPrice": 27.00,
  "currency": "BRL",
  "priceConvertedBrl": 27.00,
  "additionalCost": 3.00,
  "taxId": "uuid-new-tax",
  "freightId": "uuid-freight",
  "createdAt": "2025-10-26T10:00:00.000Z",
  "updatedAt": "2025-10-26T10:30:00.000Z",
  "tax": {
    "id": "uuid-new-tax",
    "name": "Lucro Real"
  },
  "freight": {
    "id": "uuid-freight",
    "name": "Transporte Rodoviário"
  }
}
```

---

### 25. Deletar Matéria-Prima

**DELETE** `/raw-materials/:id`

**Permissões:** ADMIN, COMERCIAL

**Response:** `200 OK`
```json
{
  "message": "Matéria-prima deletada com sucesso"
}
```

**Erros:**
- `409 Conflict`: Matéria-prima está associada a produtos

---

### 26. Obter Log de Alterações

**GET** `/raw-materials/:id/change-logs`

**Permissões:** ADMIN, COMERCIAL

**Query Parameters:**
```
?page=1
&limit=20
&field=acquisitionPrice
&startDate=2025-01-01
&endDate=2025-12-31
&sortOrder=desc
```

**Response:** `200 OK`
```json
{
  "data": [
    {
      "id": "uuid-log",
      "rawMaterialId": "uuid-v4",
      "field": "acquisitionPrice",
      "oldValue": "24.00",
      "newValue": "25.50",
      "changedBy": "uuid-user",
      "changedByUser": {
        "name": "João Silva",
        "email": "joao@exemplo.com"
      },
      "changedAt": "2025-10-26T10:00:00.000Z"
    },
    {
      "id": "uuid-log-2",
      "rawMaterialId": "uuid-v4",
      "field": "taxId",
      "oldValue": "uuid-old-tax",
      "newValue": "uuid-new-tax",
      "changedBy": "uuid-user",
      "changedByUser": {
        "name": "João Silva",
        "email": "joao@exemplo.com"
      },
      "changedAt": "2025-10-26T09:30:00.000Z"
    }
  ],
  "meta": {
    "total": 45,
    "page": 1,
    "limit": 20,
    "totalPages": 3
  }
}
```

---

### 27. Exportar Matérias-Primas (CSV)

**POST** `/raw-materials/export`

**Permissões:** ADMIN, COMERCIAL

**Request Body:**
```json
{
  "format": "csv",
  "limit": 500,
  "sortBy": "code",
  "sortOrder": "asc",
  "filters": {
    "search": "resina",
    "inputGroup": "Resinas",
    "measurementUnit": "KG"
  },
  "includeDetails": true
}
```

**Response:** `200 OK`
```
Content-Type: text/csv
Content-Disposition: attachment; filename="materias-primas-2025-10-26.csv"

Código,Nome,Descrição,Unidade,Grupo,Prazo Pagamento,Preço Aquisição,Moeda,Custo Adicional,Imposto,Frete,Data Criação
MP-2024-001,Resina Poliéster,Resina de alta qualidade,KG,Resinas,30,25.50,BRL,2.30,Simples Nacional,Transporte Rodoviário,2025-10-26
```

---

## Produtos (Products)

### 28. Criar Produto

**POST** `/products`

**Permissões:** ADMIN, COMERCIAL

**Request Body:**
```json
{
  "code": "20462",
  "name": "Produto X",
  "description": "Descrição do produto",
  "fixedCostId": "uuid-fixed-cost",
  "rawMaterials": [
    {
      "rawMaterialId": "uuid-rm-1",
      "quantity": 2.5
    },
    {
      "rawMaterialId": "uuid-rm-2",
      "quantity": 1.0
    }
  ]
}
```

**Nota:** 
- Código deve ser numérico
- Preço é calculado automaticamente
- fixedCostId é opcional (0 ou 1)
- Deve ter no mínimo 1 matéria-prima

**Response:** `201 Created`
```json
{
  "id": "uuid-v4",
  "code": "20462",
  "name": "Produto X",
  "description": "Descrição do produto",
  "creatorId": "uuid-user",
  "fixedCostId": "uuid-fixed-cost",
  "priceWithoutTaxesAndFreight": 125.50,
  "priceWithTaxesAndFreight": 145.80,
  "createdAt": "2025-10-26T10:00:00.000Z",
  "updatedAt": "2025-10-26T10:00:00.000Z",
  "creator": {
    "id": "uuid-user",
    "name": "João Silva",
    "email": "joao@exemplo.com"
  },
  "fixedCost": {
    "id": "uuid-fixed-cost",
    "description": "DESPESAS COM PESSOAL",
    "overheadPerUnit": 0.3695
  },
  "productRawMaterials": [
    {
      "rawMaterialId": "uuid-rm-1",
      "quantity": 2.5,
      "rawMaterial": {
        "id": "uuid-rm-1",
        "code": "MP-2024-001",
        "name": "Resina Poliéster",
        "measurementUnit": "KG",
        "acquisitionPrice": 25.50,
        "currency": "BRL"
      }
    },
    {
      "rawMaterialId": "uuid-rm-2",
      "quantity": 1.0,
      "rawMaterial": {
        "id": "uuid-rm-2",
        "code": "MP-2024-002",
        "name": "Fibra de Vidro",
        "measurementUnit": "KG",
        "acquisitionPrice": 45.00,
        "currency": "BRL"
      }
    }
  ],
  "calculations": {
    "rawMaterialsSubtotal": 108.75,
    "taxesTotal": 15.30,
    "freightTotal": 21.75,
    "priceWithoutTaxesAndFreight": 125.50,
    "priceWithTaxesAndFreight": 145.80,
    "fixedCostOverhead": 0.3695
  }
}
```

---

### 29. Listar Produtos

**GET** `/products`

**Permissões:** ADMIN, COMERCIAL

**Query Parameters:**
```
?page=1
&limit=10
&search=codigo_ou_nome
&sortBy=code
&sortOrder=asc
&includeRawMaterials=true
&includeFixedCost=true
&includeCalculations=true
```

**Response:** `200 OK`
```json
{
  "data": [
    {
      "id": "uuid-v4",
      "code": "20462",
      "name": "Produto X",
      "description": "Descrição do produto",
      "creatorId": "uuid-user",
      "fixedCostId": "uuid-fixed-cost",
      "priceWithoutTaxesAndFreight": 125.50,
      "priceWithTaxesAndFreight": 145.80,
      "createdAt": "2025-10-26T10:00:00.000Z",
      "updatedAt": "2025-10-26T10:00:00.000Z",
      "creator": {
        "name": "João Silva"
      },
      "fixedCost": {
        "description": "DESPESAS COM PESSOAL",
        "overheadPerUnit": 0.3695
      },
      "productRawMaterials": [
        {
          "quantity": 2.5,
          "rawMaterial": {
            "code": "MP-2024-001",
            "name": "Resina Poliéster",
            "measurementUnit": "KG"
          }
        }
      ]
    }
  ],
  "meta": {
    "total": 200,
    "page": 1,
    "limit": 10,
    "totalPages": 20
  }
}
```

---

### 30. Obter Produto por ID

**GET** `/products/:id`

**Permissões:** ADMIN, COMERCIAL

**Query Parameters:**
```
?includeRawMaterials=true
&includeFixedCost=true
&includeCalculations=true
&includeDetailedTaxes=true
```

**Response:** `200 OK`
```json
{
  "id": "uuid-v4",
  "code": "20462",
  "name": "Produto X",
  "description": "Descrição do produto",
  "creatorId": "uuid-user",
  "fixedCostId": "uuid-fixed-cost",
  "priceWithoutTaxesAndFreight": 125.50,
  "priceWithTaxesAndFreight": 145.80,
  "createdAt": "2025-10-26T10:00:00.000Z",
  "updatedAt": "2025-10-26T10:00:00.000Z",
  "creator": {
    "id": "uuid-user",
    "name": "João Silva",
    "email": "joao@exemplo.com",
    "role": "COMERCIAL"
  },
  "fixedCost": {
    "id": "uuid-fixed-cost",
    "description": "DESPESAS COM PESSOAL",
    "code": "FC-001",
    "personnelExpenses": 53188.59,
    "generalExpenses": 49913.50,
    "proLabore": 0,
    "depreciation": 0,
    "totalCost": 103102.09,
    "considerationPercentage": 100.00,
    "salesVolume": 130000.00,
    "overheadPerUnit": 0.3695
  },
  "productRawMaterials": [
    {
      "productId": "uuid-v4",
      "rawMaterialId": "uuid-rm-1",
      "quantity": 2.5,
      "createdAt": "2025-10-26T10:00:00.000Z",
      "updatedAt": "2025-10-26T10:00:00.000Z",
      "rawMaterial": {
        "id": "uuid-rm-1",
        "code": "MP-2024-001",
        "name": "Resina Poliéster",
        "measurementUnit": "KG",
        "acquisitionPrice": 25.50,
        "currency": "BRL",
        "priceConvertedBrl": 25.50,
        "additionalCost": 2.30,
        "tax": {
          "id": "uuid-tax",
          "name": "Simples Nacional",
          "taxItems": [
            {
              "name": "PIS",
              "rate": 1.65,
              "recoverable": true
            },
            {
              "name": "COFINS",
              "rate": 7.60,
              "recoverable": true
            }
          ]
        },
        "freight": {
          "id": "uuid-freight",
          "name": "Transporte Rodoviário",
          "unitPrice": 150.00,
          "currency": "BRL",
          "additionalCosts": 25.50,
          "freightTaxes": [
            {
              "name": "ICMS",
              "rate": 12.00
            }
          ]
        }
      }
    },
    {
      "productId": "uuid-v4",
      "rawMaterialId": "uuid-rm-2",
      "quantity": 1.0,
      "createdAt": "2025-10-26T10:00:00.000Z",
      "updatedAt": "2025-10-26T10:00:00.000Z",
      "rawMaterial": {
        "id": "uuid-rm-2",
        "code": "MP-2024-002",
        "name": "Fibra de Vidro",
        "measurementUnit": "KG",
        "acquisitionPrice": 45.00,
        "currency": "BRL",
        "priceConvertedBrl": 45.00,
        "additionalCost": 3.50,
        "tax": {
          "id": "uuid-tax-2",
          "name": "Lucro Real",
          "taxItems": [
            {
              "name": "PIS",
              "rate": 1.65,
              "recoverable": false
            },
            {
              "name": "COFINS",
              "rate": 7.60,
              "recoverable": false
            }
          ]
        },
        "freight": {
          "id": "uuid-freight-2",
          "name": "Transporte Marítimo",
          "unitPrice": 200.00,
          "currency": "USD",
          "additionalCosts": 50.00
        }
      }
    }
  ],
  "calculations": {
    "rawMaterials": [
      {
        "rawMaterialCode": "MP-2024-001",
        "rawMaterialName": "Resina Poliéster",
        "quantity": 2.5,
        "unitPrice": 25.50,
        "subtotal": 63.75,
        "taxes": {
          "PIS": 1.05,
          "COFINS": 4.85,
          "total": 5.90
        },
        "freight": {
          "unitPrice": 150.00,
          "quantity": 2.5,
          "subtotal": 6.25,
          "taxes": {
            "ICMS": 0.75
          }
        },
        "totalWithoutTaxesAndFreight": 63.75,
        "totalWithTaxesAndFreight": 76.65
      },
      {
        "rawMaterialCode": "MP-2024-002",
        "rawMaterialName": "Fibra de Vidro",
        "quantity": 1.0,
        "unitPrice": 45.00,
        "subtotal": 45.00,
        "taxes": {
          "PIS": 0.74,
          "COFINS": 3.42,
          "total": 4.16
        },
        "freight": {
          "unitPrice": 200.00,
          "quantity": 1.0,
          "subtotal": 5.00,
          "taxes": {}
        },
        "totalWithoutTaxesAndFreight": 45.00,
        "totalWithTaxesAndFreight": 54.16
      }
    ],
    "summary": {
      "rawMaterialsSubtotal": 108.75,
      "taxesTotal": 10.06,
      "freightTotal": 11.25,
      "additionalCostsTotal": 5.80,
      "priceWithoutTaxesAndFreight": 125.50,
      "priceWithTaxesAndFreight": 145.80,
      "fixedCostOverhead": 0.3695,
      "finalPriceWithOverhead": 146.17
    }
  }
}
```

---

### 31. Atualizar Produto

**PATCH** `/products/:id`

**Permissões:** ADMIN, COMERCIAL

**Request Body:**
```json
{
  "name": "Produto X Atualizado",
  "description": "Nova descrição",
  "fixedCostId": "uuid-new-fixed-cost",
  "rawMaterials": [
    {
      "rawMaterialId": "uuid-rm-1",
      "quantity": 3.0
    },
    {
      "rawMaterialId": "uuid-rm-3",
      "quantity": 0.5
    }
  ]
}
```

**Nota:** 
- Ao atualizar rawMaterials, a lista enviada substitui completamente as associações anteriores
- Preços são recalculados automaticamente

**Response:** `200 OK`
```json
{
  "id": "uuid-v4",
  "code": "20462",
  "name": "Produto X Atualizado",
  "description": "Nova descrição",
  "creatorId": "uuid-user",
  "fixedCostId": "uuid-new-fixed-cost",
  "priceWithoutTaxesAndFreight": 142.30,
  "priceWithTaxesAndFreight": 165.45,
  "createdAt": "2025-10-26T10:00:00.000Z",
  "updatedAt": "2025-10-26T11:00:00.000Z",
  "creator": {
    "name": "João Silva"
  },
  "fixedCost": {
    "description": "GASTOS GERAIS API",
    "overheadPerUnit": 0.4200
  },
  "productRawMaterials": [
    {
      "rawMaterialId": "uuid-rm-1",
      "quantity": 3.0,
      "rawMaterial": {
        "code": "MP-2024-001",
        "name": "Resina Poliéster"
      }
    },
    {
      "rawMaterialId": "uuid-rm-3",
      "quantity": 0.5,
      "rawMaterial": {
        "code": "MP-2024-003",
        "name": "Catalisador"
      }
    }
  ]
}
```

---

### 32. Deletar Produto

**DELETE** `/products/:id`

**Permissões:** ADMIN, COMERCIAL

**Response:** `200 OK`
```json
{
  "message": "Produto deletado com sucesso"
}
```

---

### 33. Calcular Preço do Produto (Preview)

**POST** `/products/calculate-price`

**Permissões:** ADMIN, COMERCIAL

**Nota:** Este endpoint permite calcular o preço sem criar o produto (útil para preview na interface)

**Request Body:**
```json
{
  "rawMaterials": [
    {
      "rawMaterialId": "uuid-rm-1",
      "quantity": 2.5
    },
    {
      "rawMaterialId": "uuid-rm-2",
      "quantity": 1.0
    }
  ],
  "fixedCostId": "uuid-fixed-cost"
}
```

**Response:** `200 OK`
```json
{
  "calculations": {
    "rawMaterialsSubtotal": 108.75,
    "taxesTotal": 10.06,
    "freightTotal": 11.25,
    "additionalCostsTotal": 5.80,
    "priceWithoutTaxesAndFreight": 125.50,
    "priceWithTaxesAndFreight": 145.80,
    "fixedCostOverhead": 0.3695,
    "finalPriceWithOverhead": 146.17
  },
  "breakdown": [
    {
      "rawMaterialCode": "MP-2024-001",
      "rawMaterialName": "Resina Poliéster",
      "quantity": 2.5,
      "unitPrice": 25.50,
      "subtotal": 63.75,
      "taxes": 5.90,
      "freight": 6.25
    },
    {
      "rawMaterialCode": "MP-2024-002",
      "rawMaterialName": "Fibra de Vidro",
      "quantity": 1.0,
      "unitPrice": 45.00,
      "subtotal": 45.00,
      "taxes": 4.16,
      "freight": 5.00
    }
  ]
}
```

---

### 34. Exportar Produtos (CSV)

**POST** `/products/export`

**Permissões:** ADMIN, COMERCIAL

**Request Body:**
```json
{
  "format": "csv",
  "limit": 500,
  "sortBy": "code",
  "sortOrder": "asc",
  "filters": {
    "search": "produto x"
  },
  "includeRawMaterials": true,
  "includeCalculations": true
}
```

**Response:** `200 OK`
```
Content-Type: text/csv
Content-Disposition: attachment; filename="produtos-2025-10-26.csv"

Código,Nome,Descrição,Grupo,Preço sem Impostos,Preço com Impostos,Moeda,Custos Adicionais,Matérias-Primas,Data Criação
20462,Produto X,Descrição,1,125.50,145.80,Real,4.95,"Resina Poliéster (2.5 KG), Fibra de Vidro (1.0 KG)",2025-10-26
```

---

## Custos Fixos (Fixed Costs)

### 35. Criar Custo Fixo

**POST** `/fixed-costs`

**Permissões:** ADMIN

**Request Body:**
```json
{
  "description": "DESPESAS COM PESSOAL",
  "code": "FC-001",
  "personnelExpenses": 53188.59,
  "generalExpenses": 49913.50,
  "proLabore": 0,
  "depreciation": 0,
  "considerationPercentage": 100.00,
  "salesVolume": 130000.00
}
```

**Nota:** 
- totalCost é calculado automaticamente (personnelExpenses + generalExpenses + proLabore + depreciation)
- overheadPerUnit é calculado automaticamente ((totalCost * considerationPercentage / 100) / salesVolume)

**Response:** `201 Created`
```json
{
  "id": "uuid-v4",
  "description": "DESPESAS COM PESSOAL",
  "code": "FC-001",
  "personnelExpenses": 53188.59,
  "generalExpenses": 49913.50,
  "proLabore": 0,
  "depreciation": 0,
  "totalCost": 103102.09,
  "considerationPercentage": 100.00,
  "salesVolume": 130000.00,
  "overheadPerUnit": 0.7931,
  "calculationDate": "2025-10-26T10:00:00.000Z",
  "createdAt": "2025-10-26T10:00:00.000Z",
  "updatedAt": "2025-10-26T10:00:00.000Z"
}
```

---

### 36. Listar Custos Fixos

**GET** `/fixed-costs`

**Permissões:** ADMIN

**Query Parameters:**
```
?page=1
&limit=10
&search=descricao_ou_codigo
&sortBy=calculationDate
&sortOrder=desc
```

**Response:** `200 OK`
```json
{
  "data": [
    {
      "id": "uuid-v4",
      "description": "DESPESAS COM PESSOAL",
      "code": "FC-001",
      "personnelExpenses": 53188.59,
      "generalExpenses": 49913.50,
      "proLabore": 0,
      "depreciation": 0,
      "totalCost": 103102.09,
      "considerationPercentage": 100.00,
      "salesVolume": 130000.00,
      "overheadPerUnit": 0.7931,
      "calculationDate": "2025-10-26T10:00:00.000Z",
      "createdAt": "2025-10-26T10:00:00.000Z",
      "updatedAt": "2025-10-26T10:00:00.000Z",
      "_count": {
        "products": 15
      }
    }
  ],
  "meta": {
    "total": 8,
    "page": 1,
    "limit": 10,
    "totalPages": 1
  }
}
```

---

### 37. Obter Custo Fixo por ID

**GET** `/fixed-costs/:id`

**Permissões:** ADMIN

**Query Parameters:**
```
?includeProducts=true
```

**Response:** `200 OK`
```json
{
  "id": "uuid-v4",
  "description": "DESPESAS COM PESSOAL",
  "code": "FC-001",
  "personnelExpenses": 53188.59,
  "generalExpenses": 49913.50,
  "proLabore": 0,
  "depreciation": 0,
  "totalCost": 103102.09,
  "considerationPercentage": 100.00,
  "salesVolume": 130000.00,
  "overheadPerUnit": 0.7931,
  "calculationDate": "2025-10-26T10:00:00.000Z",
  "createdAt": "2025-10-26T10:00:00.000Z",
  "updatedAt": "2025-10-26T10:00:00.000Z",
  "products": [
    {
      "id": "uuid-product-1",
      "code": "20462",
      "name": "Produto X",
      "priceWithoutTaxesAndFreight": 125.50,
      "priceWithTaxesAndFreight": 145.80
    }
  ]
}
```

---

### 38. Atualizar Custo Fixo

**PATCH** `/fixed-costs/:id`

**Permissões:** ADMIN

**Request Body:**
```json
{
  "description": "DESPESAS COM PESSOAL - ATUALIZADO",
  "personnelExpenses": 55000.00,
  "salesVolume": 140000.00,
  "considerationPercentage": 95.00
}
```

**Nota:** 
- totalCost e overheadPerUnit são recalculados automaticamente
- Produtos associados terão seus preços recalculados

**Response:** `200 OK`
```json
{
  "id": "uuid-v4",
  "description": "DESPESAS COM PESSOAL - ATUALIZADO",
  "code": "FC-001",
  "personnelExpenses": 55000.00,
  "generalExpenses": 49913.50,
  "proLabore": 0,
  "depreciation": 0,
  "totalCost": 104913.50,
  "considerationPercentage": 95.00,
  "salesVolume": 140000.00,
  "overheadPerUnit": 0.7119,
  "calculationDate": "2025-10-26T10:00:00.000Z",
  "createdAt": "2025-10-26T10:00:00.000Z",
  "updatedAt": "2025-10-26T11:00:00.000Z",
  "affectedProducts": {
    "count": 15,
    "recalculated": true
  }
}
```

---

### 39. Deletar Custo Fixo

**DELETE** `/fixed-costs/:id`

**Permissões:** ADMIN

**Response:** `200 OK`
```json
{
  "message": "Custo fixo deletado com sucesso",
  "affectedProducts": {
    "count": 15,
    "action": "fixedCostId set to null"
  }
}
```

**Nota:** Produtos associados terão fixedCostId definido como null, mas não serão deletados.

---

### 40. Calcular Overhead (Gerar Overhead)

**POST** `/fixed-costs/:id/calculate-overhead`

**Permissões:** ADMIN

**Nota:** Este endpoint permite recalcular o overhead e aplicar aos produtos sem precisar atualizar o custo fixo. Útil para a funcionalidade "gerar overhead" mencionada nos requisitos.

**Request Body:**
```json
{
  "applyToProducts": true,
  "productIds": ["uuid-product-1", "uuid-product-2"]
}
```

**Nota:** 
- Se applyToProducts = true e productIds está vazio, aplica a todos os produtos com este fixedCostId
- Se applyToProducts = false, apenas retorna os cálculos sem aplicar

**Response:** `200 OK`
```json
{
  "fixedCost": {
    "id": "uuid-v4",
    "description": "DESPESAS COM PESSOAL",
    "totalCost": 103102.09,
    "overheadPerUnit": 0.7931
  },
  "affectedProducts": [
    {
      "id": "uuid-product-1",
      "code": "20462",
      "name": "Produto X",
      "priceBeforeOverhead": 145.80,
      "overheadApplied": 0.7931,
      "priceAfterOverhead": 146.59,
      "updated": true
    },
    {
      "id": "uuid-product-2",
      "code": "18933",
      "name": "Produto Y",
      "priceBeforeOverhead": 89.95,
      "overheadApplied": 0.7931,
      "priceAfterOverhead": 90.74,
      "updated": true
    }
  ],
  "summary": {
    "totalProductsAffected": 15,
    "totalOverheadDistributed": 11.90,
    "applied": true
  }
}
```

---

### 41. Exportar Custos Fixos (CSV)

**POST** `/fixed-costs/export`

**Permissões:** ADMIN

**Request Body:**
```json
{
  "format": "csv",
  "limit": 100,
  "sortBy": "calculationDate",
  "sortOrder": "desc",
  "includeProducts": true
}
```

**Response:** `200 OK`
```
Content-Type: text/csv
Content-Disposition: attachment; filename="custos-fixos-2025-10-26.csv"

Código,Descrição,Pessoal,Outros,Pró-Labore,Depreciação,Total,% Considerar,Volume Vendas,Overhead/Unidade,Produtos Associados,Data Cálculo
FC-001,DESPESAS COM PESSOAL,53188.59,49913.50,0,0,103102.09,100%,130000.00,0.7931,15,2025-10-26
```

---

## Exportação Global

### 42. Exportar Relatório Consolidado

**POST** `/export/consolidated-report`

**Permissões:** ADMIN

**Request Body:**
```json
{
  "format": "csv",
  "includeProducts": true,
  "includeRawMaterials": true,
  "includeTaxes": true,
  "includeFreights": true,
  "includeFixedCosts": true,
  "filters": {
    "dateFrom": "2025-01-01",
    "dateTo": "2025-12-31"
  }
}
```

**Response:** `200 OK`
```
Content-Type: application/zip
Content-Disposition: attachment; filename="relatorio-consolidado-2025-10-26.zip"

[ZIP contendo múltiplos arquivos CSV:]
- produtos.csv
- materias-primas.csv
- impostos.csv
- fretes.csv
- custos-fixos.csv
- resumo.csv
```

---

## Health Check

### 43. Verificar Status da API

**GET** `/health`

**Permissões:** Público

**Response:** `200 OK`
```json
{
  "status": "ok",
  "timestamp": "2025-10-26T10:00:00.000Z",
  "uptime": 86400,
  "database": {
    "status": "connected",
    "responseTime": 5
  },
  "version": "1.0.0"
}
```

---

### 43.5. Exibir Documentação da AP

**GET** `/docs`

**Permissões:** Público

**Response (Success):** `200 OK`

  * Retorna uma página `Content-Type: text/html` com a documentação estática da API.

**Response (Error):** `404 Not Found`

```json
{
  "statusCode": 404,
  "message": "Documentation file not found",
  "error": "Not Found"
}
```

---

## Regras de Negócio Detalhadas

### Cálculo de Preços de Produtos

O preço de um produto é calculado seguindo estas etapas:

1. **Subtotal das Matérias-Primas:**
   ```
   Para cada matéria-prima:
   subtotal = quantidade × preço_aquisição_convertido_brl
   ```

2. **Impostos das Matérias-Primas:**
   ```
   Para cada matéria-prima:
   Para cada item de imposto:
   valor_imposto = subtotal × (taxa / 100)
   
   total_impostos_materia_prima = soma de todos os impostos
   ```

3. **Frete das Matérias-Primas:**
   ```
   Para cada matéria-prima:
   incidencia_frete = (quantidade / volume_total) × preco_unitario_frete
   
   Para cada imposto do frete:
   valor_imposto_frete = incidencia_frete × (taxa / 100)
   
   total_frete = incidencia_frete + soma_impostos_frete
   ```

4. **Custos Adicionais:**
   ```
   Para cada matéria-prima:
   custo_adicional_proporcional = custo_adicional × quantidade
   ```

5. **Preço sem Impostos e Frete:**
   ```
   preco_sem_impostos_frete = soma_subtotais + soma_custos_adicionais
   ```

6. **Preço com Impostos e Frete:**
   ```
   preco_com_impostos_frete = preco_sem_impostos_frete + soma_impostos + soma_fretes
   ```

7. **Overhead (se houver custo fixo):**
   ```
   preco_final = preco_com_impostos_frete + overhead_por_unidade
   ```

### Premissas Recuperáveis

Impostos marcados como `recoverable: true` são considerados premissas recuperáveis. No cálculo do preço:
- São somados ao custo total para transparência
- Mas podem ser exibidos separadamente na interface para análise
- O sistema registra quais impostos são recuperáveis para relatórios financeiros

### Controle de Acesso por Área (Role)

**ADMIN:**
- Acesso total ao sistema
- Gestão de usuários
- Todos os recursos de COMERCIAL, LOGISTICA e IMPOSTO

**COMERCIAL:**
- Visualizar e gerenciar produtos
- Visualizar e gerenciar matérias-primas
- Visualizar impostos (para associar a matérias-primas)
- Visualizar fretes existentes apenas através de autocomplete (para associar a matérias-primas, sem acesso à gestão completa)
- Não pode gerenciar usuários, impostos ou criar/editar/deletar fretes

**LOGISTICA:**
- Visualizar e gerenciar fretes (CRUD completo)
- Único além de ADMIN que tem acesso à gestão completa de fretes
- Não acessa produtos, matérias-primas, impostos ou usuários

**IMPOSTO:**
- Visualizar e gerenciar impostos (premissas)
- Visualizar matérias-primas (para entender impacto das premissas)
- Não acessa produtos, fretes ou usuários

---

## Códigos de Status HTTP

| Código | Significado |
|--------|-------------|
| 200 | OK - Requisição bem-sucedida |
| 201 | Created - Recurso criado com sucesso |
| 400 | Bad Request - Dados inválidos ou mal formatados |
| 401 | Unauthorized - Não autenticado ou token inválido |
| 403 | Forbidden - Autenticado mas sem permissão para o recurso |
| 404 | Not Found - Recurso não encontrado |
| 409 | Conflict - Conflito (ex: recurso está sendo usado) |
| 422 | Unprocessable Entity - Validação falhou |
| 500 | Internal Server Error - Erro interno do servidor |

---

## Estrutura de Erros

Todos os erros seguem o padrão:

```json
{
  "statusCode": 400,
  "message": "Descrição do erro",
  "error": "Bad Request",
  "details": [
    {
      "field": "email",
      "message": "Email já está em uso"
    }
  ],
  "timestamp": "2025-10-26T10:00:00.000Z",
  "path": "/auth/register"
}
```

---

## Paginação Padrão

Todos os endpoints de listagem seguem este padrão:

**Query Parameters:**
```
?page=1          // Número da página (inicia em 1)
&limit=10        // Itens por página (padrão: 10, máximo: 100)
&sortBy=field    // Campo para ordenação
&sortOrder=asc   // Direção: asc ou desc
```

**Response Structure:**
```json
{
  "data": [...],
  "meta": {
    "total": 150,      // Total de registros
    "page": 1,         // Página atual
    "limit": 10,       // Itens por página
    "totalPages": 15   // Total de páginas
  }
}
```

---

## Filtros Disponíveis por Recurso

### Usuários
- `search`: Busca por nome ou email
- `role`: Filtrar por role (ADMIN, COMERCIAL, LOGISTICA, IMPOSTO)
- `isActive`: Filtrar por status (true/false)

### Impostos
- `search`: Busca por nome

### Fretes
- `search`: Busca por nome ou descrição
- `currency`: Filtrar por moeda (BRL, USD, EUR)

### Matérias-Primas
- `search`: Busca por código ou nome
- `measurementUnit`: Filtrar por unidade de medida
- `inputGroup`: Filtrar por grupo de insumo
- `currency`: Filtrar por moeda

### Produtos
- `search`: Busca por código ou nome

### Custos Fixos
- `search`: Busca por descrição ou código

---

## Ordenação Disponível por Recurso

### Usuários
- `name`, `email`, `role`, `createdAt`, `updatedAt`

### Impostos
- `name`, `createdAt`, `updatedAt`

### Fretes
- `name`, `unitPrice`, `paymentTerm`, `createdAt`, `updatedAt`

### Matérias-Primas
- `code`, `name`, `acquisitionPrice`, `inputGroup`, `createdAt`, `updatedAt`

### Produtos
- `code`, `name`, `priceWithoutTaxesAndFreight`, `priceWithTaxesAndFreight`, `createdAt`, `updatedAt`

### Custos Fixos
- `description`, `code`, `totalCost`, `overheadPerUnit`, `calculationDate`, `createdAt`, `updatedAt`

---

## Formatos de Exportação

Todos os endpoints de exportação suportam:

**CSV:**
```json
{
  "format": "csv",
  "delimiter": ",",        // Opcional: vírgula (padrão) ou ponto-e-vírgula
  "encoding": "utf-8",     // Opcional: utf-8 (padrão) ou latin1
  "includeHeaders": true   // Opcional: incluir cabeçalhos (padrão: true)
}
```

## Rate Limiting

A API implementa rate limiting para proteger contra abuso:

- **Registro:** 5 tentativas por minuto
- **Login:** 3 tentativas por minuto (proteção contra brute force)
- **Refresh Token:** 10 tentativas por minuto
- **Logout, Perfil (me) e endpoints gerais autenticados:** Sem rate limiting (usuário já autenticado)
- **Outros endpoints públicos:** 100 requisições por minuto por IP
- **Exportações:** 10 requisições por hora por usuário

**Headers de Rate Limit:**
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1698345600
```

## Validações de Dados

### Usuários
- `email`: Formato de email válido, único no sistema, não pode ser alterado após criação
- `password`: Mínimo 8 caracteres, sem requisitos adicionais de complexidade
- `name`: Mínimo 3 caracteres, máximo 100
- `role`: Deve ser um dos valores do enum UserRole (apenas ADMIN pode alterar)
- `isActive`: Boolean, padrão true (apenas ADMIN pode alterar)

### Impostos
- `name`: Obrigatório, mínimo 3 caracteres
- `taxItems.name`: Obrigatório
- `taxItems.rate`: Decimal entre 0 e 100

### Fretes
- `name`: Obrigatório, mínimo 3 caracteres
- `paymentTerm`: Inteiro positivo (dias)
- `unitPrice`: Decimal positivo
- `currency`: Deve ser um dos valores do enum Currency
- `freightTaxes.rate`: Decimal entre 0 e 100

### Matérias-Primas
- `code`: Obrigatório, único no sistema
- `name`: Obrigatório, mínimo 3 caracteres
- `measurementUnit`: Deve ser um dos valores do enum MeasurementUnit
- `paymentTerm`: Inteiro positivo (dias)
- `acquisitionPrice`: Decimal positivo
- `currency`: Deve ser um dos valores do enum Currency
- `taxId`: UUID válido, referência existente
- `freightId`: UUID válido, referência existente

### Produtos
- `code`: Obrigatório, numérico apenas, único no sistema
- `name`: Obrigatório, mínimo 3 caracteres
- `rawMaterials`: Array com no mínimo 1 item
- `rawMaterials[].rawMaterialId`: UUID válido, referência existente
- `rawMaterials[].quantity`: Decimal positivo
- `fixedCostId`: Opcional, UUID válido se fornecido

### Custos Fixos
- `description`: Obrigatório, mínimo 3 caracteres
- `code`: Opcional, único se fornecido
- `personnelExpenses`: Decimal não negativo
- `generalExpenses`: Decimal não negativo
- `proLabore`: Decimal não negativo
- `depreciation`: Decimal não negativo
- `considerationPercentage`: Decimal entre 0 e 100
- `salesVolume`: Decimal positivo

---

## Logs de Auditoria

O sistema registra automaticamente:

### Alterações em Matérias-Primas
Todos os campos alterados são registrados em `RawMaterialChangeLog`:
- Campo alterado
- Valor antigo
- Valor novo
- Usuário que fez a alteração
- Data e hora da alteração

---

## Endpoints de Busca e Autocomplete

Os endpoints de busca/autocomplete são essenciais para a usabilidade do sistema. São utilizados quando:
- O usuário precisa **associar uma matéria-prima a um produto** e precisa buscar na lista de matérias-primas disponíveis
- Ao criar/editar uma matéria-prima e precisa **selecionar um imposto** da lista de impostos cadastrados
- Ao criar/editar uma matéria-prima e precisa **selecionar um frete** da lista de fretes cadastrados  
- Ao criar/editar um produto e precisa **selecionar um custo fixo** (opcional)

Estes endpoints retornam resultados filtrados rapidamente enquanto o usuário digita, melhorando significativamente a experiência de uso.

### 45. Buscar Matérias-Primas (Autocomplete)

**GET** `/raw-materials/search`

**Permissões:** ADMIN, COMERCIAL

**Query Parameters:**
```
?q=resina          // Termo de busca
&limit=10          // Máximo de resultados
&fields=id,code,name,measurementUnit  // Campos a retornar
```

**Response:** `200 OK`
```json
{
  "results": [
    {
      "id": "uuid-v4",
      "code": "MP-2024-001",
      "name": "Resina Poliéster",
      "measurementUnit": "KG"
    },
    {
      "id": "uuid-v5",
      "code": "MP-2024-015",
      "name": "Resina Epóxi",
      "measurementUnit": "KG"
    }
  ],
  "total": 2
}
```

---

### 46. Buscar Impostos (Autocomplete)

**GET** `/taxes/search`

**Permissões:** ADMIN, IMPOSTO, COMERCIAL

**Query Parameters:**
```
?q=simples
&limit=10
&fields=id,name
```

**Response:** `200 OK`
```json
{
  "results": [
    {
      "id": "uuid-v4",
      "name": "Simples Nacional"
    }
  ],
  "total": 1
}
```

---

### 47. Buscar Fretes (Autocomplete)

**GET** `/freights/search`

**Permissões:** ADMIN, LOGISTICA, COMERCIAL

**Query Parameters:**
```
?q=rodoviário
&limit=10
&fields=id,name,unitPrice,currency
```

**Response:** `200 OK`
```json
{
  "results": [
    {
      "id": "uuid-v4",
      "name": "Transporte Rodoviário SP-RJ",
      "unitPrice": 150.00,
      "currency": "BRL"
    }
  ],
  "total": 1
}
```

---

### 48. Buscar Custos Fixos (Autocomplete)

**GET** `/fixed-costs/search`

**Permissões:** ADMIN, COMERCIAL

**Query Parameters:**
```
?q=pessoal
&limit=10
&fields=id,description,overheadPerUnit
```

**Response:** `200 OK`
```json
{
  "results": [
    {
      "id": "uuid-v4",
      "description": "DESPESAS COM PESSOAL",
      "overheadPerUnit": 0.7931
    }
  ],
  "total": 1
}
```

---

## Importação de Dados

### 52. Importar Matérias-Primas (CSV)

**POST** `/raw-materials/import`

**Permissões:** ADMIN

**Content-Type:** `multipart/form-data`

**Form Data:**
```
file: arquivo.csv
skipErrors: true  // Continuar mesmo se houver erros
updateExisting: false  // Atualizar registros existentes pelo código
```

**Formato CSV Esperado:**
```csv
code,name,description,measurementUnit,inputGroup,paymentTerm,acquisitionPrice,currency,additionalCost,taxCode,freightCode
MP-001,Resina,Descrição,KG,Resinas,30,25.50,BRL,2.30,TAX-001,FRT-001
```

**Response:** `200 OK`
```json
{
  "imported": 45,
  "updated": 5,
  "failed": 2,
  "errors": [
    {
      "row": 3,
      "code": "MP-003",
      "error": "Tax code TAX-999 not found"
    },
    {
      "row": 7,
      "code": "MP-007",
      "error": "Invalid measurement unit"
    }
  ]
}
```

---

### 53. Importar Produtos (CSV)

**POST** `/products/import`

**Permissões:** ADMIN

**Content-Type:** `multipart/form-data`

**Form Data:**
```
file: arquivo.csv
skipErrors: true
updateExisting: false
```

**Formato CSV Esperado:**
```csv
code,name,description,fixedCostCode,rawMaterialCode1,quantity1,rawMaterialCode2,quantity2
20462,Produto X,Descrição,FC-001,MP-001,2.5,MP-002,1.0
```

**Response:** `200 OK`
```json
{
  "imported": 30,
  "updated": 3,
  "failed": 1,
  "errors": [
    {
      "row": 5,
      "code": "20465",
      "error": "Raw material MP-999 not found"
    }
  ]
}
```

---

## Observações Finais

### Performance
- Todos os endpoints de listagem suportam paginação
- Índices criados nos campos mais consultados (código, nome, datas)
- Cache pode ser implementado em endpoints de leitura frequente

### Segurança
- Todos os endpoints (exceto login/registro) requerem JWT
- Senhas hasheadas com argon2
- Rate limiting implementado
- Tokens revogados são armazenados e verificados
- CORS configurado adequadamente

### Manutenibilidade
- Estrutura modular do NestJS
- DTOs para validação de entrada
- Entities para representação de dados
- Services isolados para lógica de negócio
- Guards para controle de acesso

### Escalabilidade
- Prisma ORM para abstração de banco de dados
- Suporte a múltiplas moedas
- Log de alterações para auditoria
- Estrutura preparada para webhooks
- Batch operations para operações em massa

---

## Resumo de Endpoints por Módulo

| Módulo | Endpoints | Permissões Principais |
|--------|-----------|----------------------|
| Auth | 5 | Público, Autenticado |
| Users | 5 | ADMIN, Próprio usuário |
| Taxes | 6 | ADMIN, IMPOSTO |
| Freights | 6 | ADMIN, LOGISTICA |
| Raw Materials | 8 | ADMIN, COMERCIAL, IMPOSTO (read) |
| Products | 7 | ADMIN, COMERCIAL |
| Fixed Costs | 7 | ADMIN |
| Export | 1 | ADMIN |
| Search | 4 | Variado |
| Import | 2 | ADMIN |
| Health | 2 | Público |

**Total: 53 endpoints principais**
