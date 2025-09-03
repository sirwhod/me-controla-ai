# Documentação Técnica e Regras de Negócio da Plataforma

## Sumário

- [Visão Geral](#visão-geral)
- [Regras de Negócio](#regras-de-negócio)
- [Regras de Desenvolvimento](#regras-de-desenvolvimento)
- [Bibliotecas Utilizadas](#bibliotecas-utilizadas)
- [Lógica da Plataforma](#lógica-da-plataforma)
- [Estrutura de Pastas](#estrutura-de-pastas)

---

## Visão Geral

Esta plataforma é um sistema de controle financeiro multi-workspace, permitindo ao usuário gerenciar diferentes "caixinhas" (workspaces) com categorias, bancos, débitos, créditos e metas. O sistema é construído com Next.js, React, Firebase e integrações modernas para autenticação, formulários e UI.

---

## Regras de Negócio

- **Workspaces (Caixinhas):**
  - Cada usuário pode criar múltiplos workspaces.
  - O workspace armazena bancos, categorias, débitos, créditos e metas.
  - O usuário pode alternar entre workspaces ativos.
  - Apenas usuários autenticados podem criar e acessar workspaces.

- **Bancos:**
  - Bancos são cadastrados por workspace.
  - Cada banco pode ter nome, código, ícone e datas de fechamento/vencimento de fatura.
  - O cadastro de banco aceita upload de imagem.

- **Categorias:**
  - Categorias são associadas ao workspace.
  - Cada categoria tem nome, tipo (ex: despesa ou receita) e ícone.
  - O cadastro de categoria aceita upload de ícone.

- **Débitos:**
  - Débitos são lançamentos financeiros negativos.
  - Associados a banco, categoria, workspace e podem conter comprovante.
  - Suportam recorrência, parcelamento e métodos de pagamento.

- **Créditos:**
  - Créditos são lançamentos financeiros positivos.
  - Associados a banco, categoria, workspace e podem conter comprovante.

- **Metas:**
  - Metas financeiras podem ser criadas por workspace.
  - Cada meta tem nome, descrição, datas e valor alvo.

---

## Regras de Desenvolvimento

- **Estrutura de Pastas:**
  - Componentes reutilizáveis em `app/components/ui/`.
  - Lógicas de negócio e chamadas HTTP em `app/http/`.
  - Contextos globais em `app/contexts/`.
  - Tipos e schemas em `app/types/`.
  - Documentação em `docs/`.

- **Formulários:**
  - Utilizar `react-hook-form` para gerenciamento de estado.
  - Validação com `zod` via `zodResolver`.
  - Componentes de formulário customizados para integração com UI.

- **API:**
  - Todas as chamadas HTTP usam o Axios configurado em [`app/lib/axios.ts`](../app/lib/axios.ts).
  - Endpoints RESTful para cada entidade (`/workspaces/:id/banks`, `/categories`, `/debits`, etc).

- **Autenticação:**
  - Utilizar NextAuth para autenticação.
  - Usuário precisa estar autenticado para acessar workspaces e realizar operações.

- **Estado Global:**
  - Contextos React para workspace ativo e dados do usuário.
  - React Query para cache e sincronização de dados.

- **UI/UX:**
  - Componentes visuais baseados em Radix UI e Lucide Icons.
  - Feedback ao usuário via `sonner` (toast).
  - Suporte a responsividade e acessibilidade.

---

## Bibliotecas Utilizadas

- **Next.js:** Framework principal para SSR/SSG e rotas.
- **React:** Biblioteca de UI.
- **Firebase:** Backend para autenticação e banco de dados.
- **React Hook Form:** Gerenciamento de formulários.
- **Zod:** Validação de schemas.
- **React Query:** Gerenciamento de dados assíncronos.
- **Radix UI:** Componentes de UI acessíveis.
- **Lucide React:** Ícones SVG.
- **Sonner:** Toasts para feedback.
- **Axios:** Cliente HTTP.
- **NextAuth:** Autenticação.
- **TanStack Query:** Cache e sincronização de dados.

---

## Lógica da Plataforma

- **Criação de Workspace:**  
  [`createWorkspaceAction`](../app/actions/workspace-actions.ts) recebe nome e tipo, verifica autenticação, cria documento no Firebase e associa ao usuário.

- **Cadastro de Banco:**  
  [`createBank`](../app/http/banks/create-bank.ts) recebe dados e imagem, envia via FormData para o endpoint do workspace.

- **Cadastro de Categoria:**  
  [`createCategory`](../app/http/categories/create-category.ts) recebe dados e ícone, envia via FormData para o endpoint do workspace.

- **Cadastro de Débito:**  
  [`createDebit`](../app/http/debits/create-debit.ts) recebe dados do débito, workspaceId, envia para o endpoint REST.

- **Cadastro de Crédito:**  
  [`createCredit`](../app/http/credits/create-credit.ts) recebe dados do crédito, workspaceId, envia para o endpoint REST.

- **Cadastro de Meta:**  
  [`createGoal`](../app/http/goals/create-goal.ts) recebe dados da meta, workspaceId, envia para o endpoint REST.

- **Atualização de Listas:**  
  Após cada operação de criação, o React Query faz `refetch` para atualizar as listas exibidas ao usuário.

- **Validação:**  
  Todos os formulários validam dados antes do envio, exibindo mensagens de erro via toast.

---

## Estrutura de Pastas

```
docs/
  README.md         # Este documento
app/
  components/       # Componentes React
  contexts/         # Contextos globais
  http/             # Lógicas de chamada HTTP
  lib/              # Utilitários e configuração
  types/            # Tipos e schemas
public/             # Arquivos públicos
```

---

## Observações

- O sistema é extensível para múltiplos usuários e workspaces.
- Todas as operações críticas são protegidas por autenticação.
- O padrão de desenvolvimento segue boas práticas de modularização, tipagem e validação.

---
