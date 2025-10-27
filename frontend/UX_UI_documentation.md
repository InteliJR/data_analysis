
## 🎯 Visão Geral do Sistema

**Sistema de Precificação** - Aplicação web para gestão de custos e precificação de produtos baseado em matérias-primas, impostos, fretes e custos fixos, com controle de acesso granular por áreas (roles).

---

## 🗺️ Estrutura de Navegação

### Sidebar (Menu Lateral Fixo)
- Logo do sistema no topo
- Menu contextual baseado na role do usuário:
 - **ADMIN**: Todos os itens
 - **COMERCIAL**: Produtos, Matérias-primas
 - **LOGISTICA**: Frete
 - **IMPOSTO**: Premissas, Matérias-primas (leitura)

**Itens do menu:**
- Produtos
- Matérias-primas
- Premissas (Impostos)
- Frete
- Custos fixos
- Usuários (apenas ADMIN)

---

## 📄 Telas do Sistema (8 principais + modals)

---

## 1️⃣ **Tela de Login**

**Rota:** `/login`

**Acesso:** Público

**Layout:** Centralizado, sem sidebar

**Elementos:**
- Logo da empresa (esquerda)
- Card de login (direita):
 - Campo "Usuário" (email)
 - Campo "Senha"
 - Botão "Entrar"
 - Feedback de erro (credenciais inválidas/usuário inativo)

**Fluxo:**
1. Usuário preenche credenciais
2. Submit → POST `/auth/login`
3. Sucesso → Armazena JWT + Redirect baseado na role
4. Erro → Exibe mensagem

---

## 2️⃣ **Tela de Produtos**

**Rota:** `/produtos`

**Acesso:** ADMIN, COMERCIAL

**Header:**
- Título "Produtos"
- Botão "+ Novo Produto" (abre modal)
- Botão "Subir em lote" (importação CSV)
- Botão "Filtro" (ícone funil)
- Botão "Exportar CSV" (configurável)

**Tabela:**
| Código | Descrição | Grupo | Preço (sem impostos) | Moeda | Custos adicionais | Ação |
|--------|-----------|-------|---------------------|--------|-------------------|------|
| 20462 | Produto X | 1 | 4.95 | Real | 4.95 | ✏️ 🗑️ |

**Funcionalidades:**
- **Visualização:** Tabela paginada com preços calculados automaticamente
- **Filtros:** Por código, nome, grupo, faixa de preço
- **Ordenação:** Por qualquer coluna
- **Toggle de visualização:** Preço sem impostos/frete ↔ Preço com impostos/frete
- **Ações inline:**
 - ✏️ Editar (abre modal de edição)
 - 🗑️ Deletar (confirmação)
- **Exportação:** Modal para configurar CSV (limite, ordenação, colunas)

**Modal: Adicionar/Editar Produto**

**Campos:**
- **Código:** Input numérico (obrigatório, único)
- **Descrição:** Textarea
- **Matérias-primas:** 
 - Autocomplete com busca (GET `/raw-materials/search`)
 - Lista de matérias-primas selecionadas com:
  - Foto/ícone placeholder
  - Nome da matéria-prima
  - Input de quantidade (decimal)
  - Botão X (remover)
 - Mínimo 1 matéria-prima obrigatória
- **Custo Fixo:** Select/Autocomplete opcional (GET `/fixed-costs/search`)
 - Exibe overhead por unidade
- **Preview de preço:** Card fixo mostrando cálculo em tempo real:
 - Subtotal matérias-primas
 - Impostos totais
 - Frete total
 - Preço sem impostos/frete
 - Preço com impostos/frete
 - Overhead (se selecionado)
 - **Preço final**

**Validações:**
- Código numérico único
- Mínimo 1 matéria-prima
- Quantidades > 0

**Fluxo:**
1. Preencher código e descrição
2. Buscar e adicionar matérias-primas
3. Definir quantidades
4. (Opcional) Selecionar custo fixo
5. Visualizar preview de preço
6. Salvar → POST `/products`

---

## 3️⃣ **Tela de Matérias-primas**

**Rota:** `/materias-primas`

**Acesso:** ADMIN, COMERCIAL (CRUD), IMPOSTO (Leitura)

**Header:**
- Título "Matérias-primas e Insumos"
- Botão "+ Nova Matéria-prima"
- Botão "Subir em lote" (CSV)
- Botão "Filtro"
- Botão "Exportar CSV"

**Tabela:**
| ID | Nome | Descrição | Prazo | Preço | Moeda | Custos adicionais | Ação |
|----|------|-----------|-------|-------|-------|-------------------|------|
| #20462 | Matéria X | Lorem ipsum... | 13/05/2022 | 4.95 | Real | 4.95 | ✏️ 🗑️ |

**Funcionalidades:**
- Filtros: Código, nome, grupo de insumo, unidade de medida, moeda
- Ordenação por qualquer coluna
- Click na linha → Detalhe com **log de alterações**
- Exportação CSV configurável

**Modal/Página: Adicionar/Editar Matéria-prima**

**Campos:**
- **Código:** Input alfanumérico (único, obrigatório)
- **Nome:** Input texto
- **Descrição:** Textarea
- **Unidade de medida:** Select (KG, G, L, ML, M, CM, UN, CX, PC)
- **Grupo de insumo:** Input texto livre
- **Prazo de pagamento:** Input numérico (dias)
- **Preço de aquisição:** Input decimal
- **Moeda:** Select (BRL, USD, EUR)
- **Preço convertido (BRL):** Input decimal (calculado automaticamente se moeda != BRL)
- **Custo adicional:** Input decimal
- **Imposto (Premissa):** Autocomplete (GET `/taxes/search`)
 - Obrigatório (1 e apenas 1)
 - Exibe nome do imposto e itens (PIS, COFINS, etc)
- **Frete:** Autocomplete (GET `/freights/search`)
 - Obrigatório (1 e apenas 1)
 - Exibe nome, preço unitário e moeda

**Preview de cálculo:**
- Preço base + custos adicionais
- Impostos aplicados (recuperáveis destacados)
- Incidência de frete
- **Preço final por unidade**

**Log de Alterações** (Seção inferior ou tab):
- Tabela com histórico:
 - Data/hora
 - Campo alterado
 - Valor antigo → Valor novo
 - Usuário responsável
- Filtros: Por campo, período
- Paginação

**Fluxo:**
1. Preencher dados básicos
2. Selecionar 1 imposto (obrigatório)
3. Selecionar 1 frete (obrigatório)
4. Visualizar preview
5. Salvar → POST `/raw-materials`
6. Sistema registra automaticamente no log

---

## 4️⃣ **Tela de Premissas (Impostos)**

**Rota:** `/premissas`

**Acesso:** ADMIN, IMPOSTO (CRUD), COMERCIAL (Leitura)

**Layout:** Tabela diferenciada (estilo do protótipo)

**Header:**
- Título "Premissas"
- Botão "+ Nova Premissa" (se ADMIN/IMPOSTO)
- Botão "Exportar CSV"

**Tabela estilizada:**
| Itens | Grupo de Produtos 1 | Grupo de Produtos 2 |
|-------|---------------------|---------------------|
| PIS | 1,650% | 1,650% |
| COFINS | 7,600% | 7,600% |
| IR e CSLL | 0,000% | 0,000% |
| COMISSÕES | 0,000% | 0,000% |
| % SEGURO DE CARGA | 0,000% | 0,000% |
| % FRETE SOBRE PREÇO DE VENDA | 0,000% | 0,000% |
| TAXA DE FINANCIAMENTO DAS VENDAS - % MÊS | 1,760% | 1,760% |

**Cards informativos (lado direito):**
- "Taxa utilizada para cálculo dos ganhos e perdas financeiras nas compras de materiais e serviços (em % ao mês)"
- "Taxa de administração GR - API será utilizada para acréscimo no OVERHEAD: API e nos custos da formulação de preço api"

**Funcionalidades:**
- Visualização: Grupos de produtos em colunas
- Edição inline (duplo click) se tiver permissão
- Checkbox "Recuperável" em cada item
- Agrupamento por tipos de premissa

**Modal: Criar/Editar Premissa**

**Campos:**
- **Nome da Premissa:** Input texto (ex: "Simples Nacional")
- **Descrição:** Textarea
- **Itens da Premissa:** Lista dinâmica
 - Nome do item (PIS, COFINS, ICMS, IPI, etc)
 - Taxa (%)
 - Checkbox "Recuperável"
 - Botão "+" (adicionar item)
 - Botão "-" (remover item)

**Fluxo:**
1. Criar premissa com nome
2. Adicionar itens (mínimo 1)
3. Definir taxas e recuperabilidade
4. Salvar → POST `/taxes`

---

## 5️⃣ **Tela de Frete**

**Rota:** `/frete`

**Acesso:** ADMIN, LOGISTICA (CRUD)

**Header:**
- Título "Frete"
- Botão "+ Novo transporte"
- Botão "Filtro"
- Botão "Exportar CSV"

**Tabela:**
| ID | Nome | Descrição | Prazo | Preço | Moeda | Custos adicionais | Ação |
|----|------|-----------|-------|-------|-------|-------------------|------|
| #20462 | Transporte X | Lorem... | 13/05/2022 | 4.95 | Real | 4.95 | ✏️ 🗑️ |

**Funcionalidades:**
- Filtros: Nome, moeda, faixa de preço
- Ordenação
- Exportação CSV

**Modal: Adicionar/Editar Frete**

**Campos:**
- **Nome:** Input texto (ex: "Transporte Rodoviário SP-RJ")
- **Descrição:** Textarea
- **Prazo de pagamento:** Input numérico (dias)
- **Preço unitário:** Input decimal
- **Moeda:** Select (BRL, USD, EUR)
- **Custos adicionais:** Input decimal
- **Impostos do Frete:** Lista dinâmica
 - Nome (ICMS, PIS, COFINS)
 - Taxa (%)
 - Botão "+" / "-"

**Preview:**
- Preço base
- Custos adicionais
- Impostos sobre frete
- **Total por unidade de frete**

**Fluxo:**
1. Preencher dados do frete
2. Adicionar impostos específicos do frete
3. Visualizar preview
4. Salvar → POST `/freights`

---

## 6️⃣ **Tela de Custos Fixos**

**Rota:** `/custos-fixos`

**Acesso:** ADMIN

**Layout:** Tabela + Cards de resumo (estilo do protótipo)

**Header:**
- Título "Custos fixos"
- Botão "+ Novo custo fixo"
- Botão "Gerar Overhead" (destaque)
- Botão "Exportar CSV"

**Tabela:**
| Descrição | Código | Pessoal | Outros | Pró-Labore | Depreciação | Total | % Gastos a Considerar | Overhead a considerar |
|-----------|--------|---------|--------|------------|-------------|-------|----------------------|----------------------|
| DESPESAS COM PESSOAL | - | 53.188,59 | - | - | - | 53.188,59 | 100% | 53.188,59 |
| GASTOS GERAIS API | - | - | 49.913,50 | - | - | 49.913,50 | 100% | 49.913,50 |
| PRÓ LABORE *** | - | - | - | - | - | - | 100% | - |
| **TOTAL** | - | 53.188,59 | 49.913,50 | - | - | 103.102,09 | - | 103.102,09 |

**Cards inferiores:**
1. "Unidade de medida a considerar para volume de venda"
  - Input: "Quilograma"
2. "Volume de vendas a considerar para o cálculo do preço de venda - em um de venda"
  - Input: "130.000,00"
3. "Valor do overhead a considerar por unidade de venda na formação do preço de venda"
  - Output calculado: "R$ 0,3695"

**Modal: Adicionar/Editar Custo Fixo**

**Campos:**
- **Descrição:** Input texto
- **Código:** Input alfanumérico (opcional, único)
- **Despesas com Pessoal:** Input decimal
- **Gastos Gerais (Outros):** Input decimal
- **Pró-Labore:** Input decimal
- **Depreciação:** Input decimal
- **Total:** Calculado automaticamente (soma dos acima)
- **% Gastos a Considerar:** Input decimal (0-100%, padrão 100%)
- **Volume de Vendas:** Input decimal (para cálculo do overhead)
- **Overhead por Unidade:** Calculado automaticamente
 - Fórmula: `(totalCost × considerationPercentage / 100) / salesVolume`

**Preview:**
- Total de custos
- % considerado
- Volume de vendas
- **Overhead por unidade** (destaque)

**Funcionalidade: Gerar Overhead**

Botão "Gerar Overhead" abre modal:
- Seleciona custo fixo (se múltiplos)
- Opções:
 - "Aplicar a todos os produtos" (checkbox)
 - OU "Selecionar produtos específicos" (autocomplete múltiplo)
- Preview:
 - Lista de produtos afetados
 - Preço antes do overhead
 - Overhead aplicado
 - Preço final
- Botão "Aplicar"

**Fluxo:**
1. Criar custos fixos
2. Definir parâmetros de cálculo
3. Sistema calcula overhead automaticamente
4. Usar "Gerar Overhead" para aplicar aos produtos
5. POST `/fixed-costs/:id/calculate-overhead`

---

## 7️⃣ **Tela de Gestão de Usuários**

**Rota:** `/usuarios`

**Acesso:** ADMIN

**Header:**
- Título "Gestão de usuários"
- Busca (por nome/email)
- Botão "+ Novo usuário"

**Tabela:**
| Usuário | Filial | Status | Área | Ação |
|---------|--------|--------|------|------|
| camila.alves@gmail.com | A | Ativo | Comercial | ✏️ 🗑️ |
| angela.souza@gmail.com | B | Inativo | Logística | ✏️ 🗑️ |

**Funcionalidades:**
- Filtros: Status (Ativo/Inativo), Área (Role)
- Busca por email/nome
- Ordenação

**Modal: Adicionar/Editar Usuário**

**Campos:**
- **Email:** Input email (único, não editável após criação)
- **Nome:** Input texto
- **Senha:** Input password (obrigatório na criação, opcional na edição)
- **Área (Role):** Select (ADMIN, COMERCIAL, LOGISTICA, IMPOSTO)
- **Status:** Toggle Ativo/Inativo
- **Filial:** Input texto (opcional, para organização)

**Observação:** 
- Usuários criados ficam inativos por padrão
- ADMIN deve ativar manualmente
- Usuários inativos não conseguem fazer login
- Não é possível deletar usuários (preservação de logs)

**Fluxo:**
1. ADMIN cria usuário
2. Define role e dados
3. Usuário recebe email (futuro)
4. ADMIN ativa manualmente
5. Usuário pode fazer login

---

## 8️⃣ **Tela de Perfil do Usuário**

**Rota:** `/perfil` ou `/me`

**Acesso:** Usuário autenticado

**Layout:** Card centralizado

**Seções:**
- **Informações:**
 - Foto (placeholder)
 - Nome
 - Email (não editável)
 - Área (Role) (não editável)
 - Status (não editável)

- **Edição permitida:**
 - Nome
 - Senha (com confirmação)

**Botões:**
- "Salvar alterações" → PATCH `/users/me`
- "Cancelar"

---

## 🔄 Fluxos Principais Completos

### **Fluxo 1: Criar Produto Completo**

1. Login → Dashboard
2. Menu "Produtos" → Tela de listagem
3. "+ Novo Produto" → Modal
4. Preencher código (numérico)
5. Buscar matéria-prima (autocomplete)
  - GET `/raw-materials/search?q=resina`
6. Selecionar matéria-prima → Adiciona à lista
7. Definir quantidade
8. Repetir para outras matérias-primas (mínimo 1)
9. (Opcional) Buscar e selecionar custo fixo
  - GET `/fixed-costs/search?q=pessoal`
10. Sistema exibe preview de preço em tempo real:
  - Chama POST `/products/calculate-price` (preview)
11. Usuário verifica cálculo
12. "Adicionar produto" → POST `/products`
13. Modal fecha → Lista atualiza
14. Produto aparece com preços calculados

### **Fluxo 2: Gestão de Custos Fixos e Overhead**

1. Login como ADMIN
2. Menu "Custos fixos" → Tela
3. "+ Novo custo fixo" → Modal
4. Preencher:
  - Descrição: "DESPESAS COM PESSOAL"
  - Despesas: 53.188,59
  - Outros: 49.913,50
  - % Considerar: 100%
  - Volume de vendas: 130.000,00
5. Sistema calcula automaticamente:
  - Total: 103.102,09
  - Overhead por unidade: 0,7931
6. Salvar → POST `/fixed-costs`
7. Botão "Gerar Overhead" → Modal
8. Selecionar opção:
  - "Aplicar a todos os produtos com este custo fixo"
  - OU selecionar produtos específicos
9. Preview mostra produtos afetados
10. "Aplicar" → POST `/fixed-costs/:id/calculate-overhead`
11. Sistema atualiza preços de todos os produtos
12. Feedback de sucesso com contagem

### **Fluxo 3: Exportação CSV Configurável**

1. Em qualquer tela com tabela
2. Botão "Exportar CSV" → Modal
3. Configuração:
  - Formato: CSV
  - Limite de linhas: Input (ex: 500)
  - Ordenação: Select (ex: "Código - Crescente")
  - Colunas: Checkboxes (selecionar quais colunas)
  - Filtros ativos: Mantém ou limpa
4. "Gerar CSV" → POST `/[recurso]/export`
5. Download automático do arquivo
6. Feedback de sucesso

---

## 🎨 Padrões de UI/UX

### **Componentes Reutilizáveis:**

1. **Tabela com ações:**
  - Hover em linha (destaque)
  - Ações inline (ícones: ✏️ editar, 🗑️ deletar)
  - Paginação inferior
  - Ordenação por coluna (click no header)

2. **Autocomplete:**
  - Busca com debounce (300ms)
  - Resultados em dropdown
  - Placeholder com ícone de lupa
  - "Nenhum resultado" se vazio

3. **Modal padrão:**
  - Overlay escuro (backdrop)
  - Card centralizado
  - Botão X (fechar) no canto superior direito
  - Botões de ação no rodapé (Cancelar à esquerda, Ação principal à direita)

4. **Preview de cálculo (Card fixo):**
  - Background diferenciado
  - Valores em tempo real
  - Destaque no valor final (maior, negrito)
  - Breakdown de componentes (impostos, frete, etc)

5. **Feedback visual:**
  - Toast notifications (sucesso/erro)
  - Loading spinners em operações assíncronas
  - Confirmação antes de deletar

### **Responsividade:**
- Sidebar colapsável em mobile
- Tabelas com scroll horizontal
- Modais adaptados (full-screen em mobile)

---

## 🔐 Controle de Acesso Visual

Cada tela/funcionalidade mostra/esconde elementos baseado na role:

| Funcionalidade | ADMIN | COMERCIAL | LOGISTICA | IMPOSTO |
|---------------|-------|-----------|-----------|---------|
| Ver Produtos | ✅ | ✅ | ❌ | ❌ |
| Criar/Editar Produtos | ✅ | ✅ | ❌ | ❌ |
| Ver Matérias-primas | ✅ | ✅ | ❌ | ✅ (leitura) |
| Criar/Editar Matérias-primas | ✅ | ✅ | ❌ | ❌ |
| Ver Premissas | ✅ | ✅ (leitura) | ❌ | ✅ |
| Criar/Editar Premissas | ✅ | ❌ | ❌ | ✅ |
| Ver Frete | ✅ | ❌ | ✅ | ❌ |
| Criar/Editar Frete | ✅ | ❌ | ✅ | ❌ |
| Ver Custos Fixos | ✅ | ❌ | ❌ | ❌ |
| Gerar Overhead | ✅ | ❌ | ❌ | ❌ |
| Gestão de Usuários | ✅ | ❌ | ❌ | ❌ |

---

## 📊 Resumo de Telas

| # | Tela | Rotas | Acesso | Funcionalidade Principal |
|---|------|-------|--------|-------------------------|
| 1 | Login | `/login` | Público | Autenticação |
| 2 | Produtos | `/produtos` | ADMIN, COMERCIAL | CRUD de produtos com cálculo automático |
| 3 | Matérias-primas | `/materias-primas` | ADMIN, COMERCIAL, IMPOSTO (read) | CRUD de matérias-primas + log |
| 4 | Premissas | `/premissas` | ADMIN, IMPOSTO, COMERCIAL (read) | Gestão de impostos e taxas |
| 5 | Frete | `/frete` | ADMIN, LOGISTICA | CRUD de fretes |
| 6 | Custos Fixos | `/custos-fixos` | ADMIN | Gestão de overhead |
| 7 | Usuários | `/usuarios` | ADMIN | Gestão de usuários |
| 8 | Perfil | `/perfil` | Autenticado | Edição de dados próprios |

**Total: 8 telas principais + modals contextuais**