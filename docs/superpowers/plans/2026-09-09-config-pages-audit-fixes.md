# Páginas de Configuração — Plano de Implementação

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Padronizar a experiência desktop e mobile das páginas de configuração, removendo duplicidades, melhorando estados vazios, acessibilidade e consistência visual.

**Architecture:** O workspace permanece como responsabilidade do sidebar desktop e do menu móvel. Estados vazios e shells de listagem serão padronizados primeiro nos componentes compartilhados, enquanto formulários receberão correções de conteúdo e navegação sem reescrita ampla.

**Tech Stack:** Next.js 15, React 19, TypeScript, Tailwind CSS v4, shadcn/ui, TanStack Table, React Hook Form.

**Spec:** `docs/UI_UX_AUDIT.md` e auditoria de páginas de configuração realizada em 2026-09-09.

## Global Constraints

- Manter o seletor de workspace no sidebar no desktop e no menu móvel no mobile.
- Não expor credenciais de teste em logs, commits ou documentação pública.
- Executar `pnpm build` e `pnpm start` após alterações.
- Executar `pnpm test:dashboard` e `git diff --check` antes de cada commit relevante.
- Preservar comportamento de criação, edição e exclusão existente.

### Task 1: Remover seletores duplicados dos headers

**Files:**
- Modify: todas as `page.tsx` em `app/(pages)/(workspace)/[workspaceId]/manage/**` que importam `WorkspaceSelector`.
- Modify: `app/components/workspace-selector.tsx` e `app/globals.css`.

- [ ] Remover imports e blocos de seletor dos headers das páginas de configuração.
- [ ] Manter a instância do sidebar e a instância do mobile nav.
- [ ] Confirmar que breadcrumbs continuam com contexto de navegação.
- [ ] Executar build e teste de regressão.
- [ ] Commit: `refactor: remove duplicate workspace selectors from config headers`.

### Task 2: Padronizar estados vazios e busca

**Files:**
- Create: `app/components/states/config-empty-state.tsx`.
- Modify: `manage/{banks,cards,categories,goals,responsibles}/data-table.tsx`.
- Modify: `manage/{banks,cards,categories,goals,responsibles}/data-table.tsx` placeholders.

- [ ] Criar `ConfigEmptyState` com título, descrição e ação opcional.
- [ ] Usar o componente tanto para coleção vazia quanto para busca sem resultado.
- [ ] Adicionar `aria-label` específico aos campos de busca.
- [ ] Substituir `...` por `…` nos placeholders.
- [ ] Executar build, teste e inspeção de diff.
- [ ] Commit: `feat: standardize configuration empty states`.

### Task 3: Refinar filtros, transições e copy

**Files:**
- Modify: `manage/responsibles/data-table.tsx`.
- Modify: listas e cards de configuração que usam `transition-all`.
- Modify: `app/components/forms/{bank,card,category,goal,responsible}-form.tsx`.

- [ ] Agrupar filtros de responsáveis com label acessível.
- [ ] Trocar `transition-all` por propriedades explícitas.
- [ ] Padronizar labels e placeholders dos formulários.
- [ ] Preservar validações e submits existentes.
- [ ] Executar build, testes e verificação visual no preview.
- [ ] Commit: `refactor: refine configuration accessibility and motion`.

### Task 4: Validar responsividade e fluxo de edição

**Files:**
- Review: todas as páginas e componentes de configuração alterados.
- Test: `scripts/dashboard-regression-tests.ts` e navegação manual no preview.

- [ ] Validar desktop e mobile em estados com dados, sem dados e sem resultados de busca.
- [ ] Validar foco visível, labels e menus de ações.
- [ ] Validar rotas de criação e edição.
- [ ] Executar `pnpm build`, `pnpm start`, `pnpm test:dashboard` e `git diff --check`.
- [ ] Confirmar worktree limpo após commits.
