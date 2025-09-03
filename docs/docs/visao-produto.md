---
sidebar_position: 2
---

# 📄 Visão de Produto


## 🗓 Informações Gerais

- **Nome do Projeto:** 
Sistema de calculo de valor de produto.

- **Cliente:** 
GR Water Solutions

- **Responsável da Visão de Produto (PO):**
Yanomã Fernandes Piont Konwski

- **Duração Total Estimada:** 
10 semanas

- **Período na Etapa de Design (estimado):** 
3 semanas:
- 2 semanas para wireframe 
- 1 semanas para protótipo 

- **Período na Etapa de Desenvolvimento (estimado):** 
6 semanas

---

## ✅ Checklist de Entrada (para iniciar o projeto)

- [X] Reunião de Kickoff com o cliente realizada
- [X] Objetivo do projeto compreendido
- [ ] Tecnologias necessárias mapeadas
- [ ] Estimativa de esforço feita
- [ ] Capacidade do time verificada
- [ ] Escopo inicial aprovado pelo cliente

---

## 📤 Checklist de Saída (para encaminhar o projeto às próximas áreas)

- [X] Documento de Visão preenchido e validado
- [X] Matriz “é/não é/faz/não faz” definida
- [ ] Wireframes (se aplicável) finalizados
- [X] Epics e User Stories redigidas
- [X] Datas de entrada/saída em cada área definidas
- [X] Contrato e escopo revisados e claros
- [ ] Alinhamento com área de Design ou Desenvolvimento realizado

---

## 📘 Resumo do Projeto

O projeto consiste em um sistema web para cálculo do valor de produtos, voltado para a empresa GR Water Solutions. O sistema permite cadastrar e atualizar matérias-primas, seus preços e o valor do frete fornecido por diferentes fornecedores. Além disso, possibilita o cálculo do valor dos produtos com e sem impostos, utilizando uma tabela editável de percentuais de impostos. O sistema também oferece uma área para criação e edição de fórmulas de produtos, onde é possível alocar todas as matérias-primas disponíveis. Por fim, há uma funcionalidade de simulação do valor final dos produtos e exportação dos dados em formato CSV para integração com o sistema RP da empresa. A motivação é automatizar e facilitar o processo de precificação, tornando-o mais ágil, preciso e integrado às necessidades do negócio.

**Descrição:**
Desenvolver um sistema web para gerenciar o cadastro de matérias-primas, fórmulas de produtos, preços, frete, impostos e simulações de valores, com exportação de dados em CSV para integração com RP próprio da empresa.

**Objetivos:**
Automatizar o cálculo do valor de produtos.
Facilitar a atualização de preços de matérias-primas e frete.
Permitir simulação de valores com diferentes cenários de impostos.
Gerar arquivos CSV para integração com RP.
Oferecer interface para criação/edição de fórmulas de produtos.

**Público-Alvo:**
Equipe de precificação da GR Water Solutions, gestores de produção e analistas financeiros.

## 👤 Personas


Liste aqui as personas envolvidas no uso da aplicação. Não é necessário criar nomes fictícios ou descrições elaboradas — o objetivo é identificar os tipos de usuários que interagem com o sistema, suas funções ou necessidades principais.

Exemplos:
- Aluno: acessa o sistema para reservar salas e consultar reservas.
- Funcionário da Biblioteca: administra reservas e atualiza a disponibilidade.
- Professor: visualiza dados de alunos e solicita salas para atividades.

**Principais Funcionalidades:**
Exemplo:
Analista de precificação: atualiza preços, simula valores e exporta dados.
Gestor de produção: cria/edita fórmulas de produtos.
Financeiro: analisa impacto dos impostos e custos.

---
Cadastro e edição de matérias-primas, seus preços e impostos.
Cadastro e edição de fórmulas de produtos.
Tabela editável de impostos (percentuais).
Cadastro e edição de frete (por fornecedor e transporte interno).
Simulação do valor final do produto (com/sem impostos).
Exportação de dados em CSV para RP.

## 🧩 Matriz "É / Não É / Faz / Não Faz"
<div align="center">

| Categoria  | Descrição |
|-----------|-----------|
| **É**     | Sistema web para cálculo e simulação de valores de produtos, com exportação de dados. |
| **Não É** | Aplicativo nativo para celular, sistema de controle físico de estoque. |
| **Faz**   | Calcula valores de produtos, simula cenários, edita fórmulas, exporta CSV, atualiza preços e impostos. |
| **Não Faz** | Não realiza controle de estoque físico, não faz vendas, não integra diretamente com sistemas externos. |

</div>

---

## 🧠 Matriz de Certezas, Suposições e Dúvidas

<div align="center">

| Tipo        | Descrição                                                                |
|-------------|--------------------------------------------------------------------------|
| **Certeza**   | O sistema deve permitir editar preços, fórmulas e impostos; exportar CSV. |
| **Suposição** | O usuário irá atualizar preços e impostos com frequência.               |
| **Dúvida**    | Qual o formato exato do CSV para o RP? Quais campos são obrigatórios?   |

</div>

---


## 🧱 Epics e User Stories

### 🔹 Epics

- Epic 1: Gerenciamento de Matérias-Primas
- Epic 2: Gerenciamento de Fórmulas de Produtos
- Epic 3: Simulação de Valores
- Epic 4: Exportação de Dados
- Epic 5: Gerenciamento de Impostos e Frete

### 🔸 User Stories

#### US1
- **Usuário:** Como analista de precificação
- **Objetivo:** Quero atualizar os preços das matérias-primas
- **Justificativa:** Para garantir que os cálculos estejam sempre corretos

#### US2
- **Usuário:** Como gestor de produção
- **Objetivo:** Quero criar e editar fórmulas de produtos
- **Justificativa:** Para adaptar os produtos conforme necessidade

#### US3
- **Usuário:** Como analista financeiro
- **Objetivo:** Quero simular valores com diferentes impostos
- **Justificativa:** Para prever custos e margens

#### US4
- **Usuário:** Como analista de precificação
- **Objetivo:** Quero exportar os dados em CSV
- **Justificativa:** Para integrar com o sistema RP

---

## ⚙️ Requisitos Funcionais

RF01 - O sistema deve permitir o cadastro e edição de matérias-primas e seus preços.

RF02 - O sistema deve permitir o cadastro e edição de fórmulas de produtos.

RF03 - O sistema deve permitir o cadastro e edição de percentuais de impostos.

RF04 - O sistema deve permitir o cadastro e edição de valores de frete (fornecedor e interno).

RF05 - O sistema deve calcular o valor do produto com e sem impostos.

RF06 - O sistema deve permitir simulação de valores de produtos.

RF07 - O sistema deve exportar os dados em CSV em formato específico para o RP.

RF08 - O sistema deve poder identificar as datas de adição de cada um dos processos, a caso seja atualizado essa data deve ser alterada para data da atualização.

## 📱 Responsividade

**O projeto será responsivo?**
- [x] Não, mas deve ser adaptável as diferentes telas de descktop. 

---

## 📌 Observações Finais


- É necessário definir o formato exato do CSV para exportação, com base na necessidade do cliente, template está sendo levantado, responsável irá adicionar em breve.
- O impostos serão editados manualmente, lembrando que todos os impostos serão fixos, são esses impostos: IPI, PIS, CONFINS, ICMS e CONFINS.
- Dependência de atualização frequente dos preços das matérias-primas e frete, com isso deve ter uma interface modular.
- Risco: integração com RP depende do formato correto do CSV.

---

