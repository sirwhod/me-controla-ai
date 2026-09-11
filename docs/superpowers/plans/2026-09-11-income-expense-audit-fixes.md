# Auditoria e Correções de Despesas e Receitas — Plano de Implementação

> **Para agentes:** executar as tarefas em ordem, validando cada etapa antes do commit.

**Objetivo:** tornar as páginas de Despesas e Receitas consistentes, sem CTAs duplicados, com filtros e formulários mais claros, acessíveis e previsíveis no desktop e no mobile.

**Arquitetura:** manter o `PageHeader` como ponto único de criação nas páginas de listagem e deixar os estados vazios orientados apenas para recuperação da busca/filtro. Consolidar padrões compartilhados entre Receita e Despesa sem alterar as regras de negócio ou os contratos das APIs.

**Stack:** Next.js 15, React, TypeScript, Tailwind CSS, React Hook Form, Zod, TanStack Table, date-fns e componentes shadcn/ui existentes.

**Referência:** auditoria de `dashboard/credits` e `dashboard/debits` realizada em 2026-09-11.

## Restrições globais

- Não alterar os payloads ou regras de persistência das APIs de créditos e débitos.
- Manter uma única ação primária de criação visível por breakpoint.
- Preservar os filtros na URL quando o estado já for controlado pelo contexto de data; avaliar sincronização dos demais filtros antes de alterar comportamento.
- Usar `…` nos placeholders e substituir `transition-all` por propriedades explícitas.
- Validar com `pnpm build`, `pnpm test:dashboard`, `git diff --check` e preview local via `pnpm start`.
- Gerar commits pequenos por etapa funcional.

---

### Tarefa 1: Remover CTAs duplicados nas listagens

**Arquivos:**
- Modificar: `app/(pages)/(workspace)/[workspaceId]/dashboard/debits/page.tsx`
- Modificar: `app/(pages)/(workspace)/[workspaceId]/dashboard/debits/data-table.tsx`
- Modificar: `app/(pages)/(workspace)/[workspaceId]/dashboard/credits/page.tsx`
- Modificar: `app/(pages)/(workspace)/[workspaceId]/dashboard/credits/data-table.tsx`

- [ ] Manter o botão `CreateDebit`/`CreateCredit` do cabeçalho responsivo como único CTA de criação.
- [ ] Remover o CTA de criação dos estados vazios que aparecem junto do cabeçalho.
- [ ] Remover o CTA de criação dos estados vazios internos das tabelas; manter somente ações de recuperação, como `Limpar filtros`.
- [ ] Confirmar visualmente que uma lista preenchida, uma lista vazia e uma busca sem resultado exibem no máximo um botão de criação.
- [ ] Executar build, teste de dashboard e commit `fix: remove duplicate income and expense actions`.

### Tarefa 2: Padronizar filtros e estados de listagem

**Arquivos:**
- Modificar: `app/(pages)/(workspace)/[workspaceId]/dashboard/debits/page.tsx`
- Modificar: `app/(pages)/(workspace)/[workspaceId]/dashboard/credits/page.tsx`
- Modificar: `app/(pages)/(workspace)/[workspaceId]/dashboard/debits/data-table.tsx`
- Modificar: `app/(pages)/(workspace)/[workspaceId]/dashboard/credits/data-table.tsx`
- Reutilizar: `app/components/states/config-empty-state.tsx`

- [ ] Aplicar `ConfigEmptyState` aos estados de receita e despesa para alinhar espaçamento, fundo e bordas às páginas de configuração.
- [ ] Adicionar `aria-label` aos campos de busca e trocar `Buscar receitas...`/equivalentes por placeholders terminados em `…`.
- [ ] Agrupar semanticamente os filtros relacionados e garantir que cada `SelectTrigger` tenha nome acessível compreensível fora do placeholder.
- [ ] Padronizar rótulos de filtros no singular/plural e a ação de limpeza entre Receita e Despesa.
- [ ] Verificar que filtros ativos, contagem e paginação não criam duas mensagens concorrentes para o mesmo estado vazio.
- [ ] Executar `pnpm test:dashboard` e commit `refactor: standardize income and expense filters`.

### Tarefa 3: Corrigir acessibilidade e copy dos formulários de criação

**Arquivos:**
- Modificar: `app/(pages)/(workspace)/[workspaceId]/dashboard/debits/new/step-details.tsx`
- Modificar: `app/(pages)/(workspace)/[workspaceId]/dashboard/debits/new/step-payment.tsx`
- Modificar: `app/(pages)/(workspace)/[workspaceId]/dashboard/credits/new/step-credit-details.tsx`
- Modificar: `app/(pages)/(workspace)/[workspaceId]/dashboard/credits/new/step-credit-payment.tsx`
- Modificar: `app/(pages)/(workspace)/[workspaceId]/dashboard/debits/new/new-debit-form.tsx`
- Modificar: `app/(pages)/(workspace)/[workspaceId]/dashboard/credits/new/new-credit-form.tsx`

- [ ] Trocar placeholders com `...` por `…` e revisar exemplos para refletir o campo esperado.
- [ ] Garantir `name`, `autocomplete` apropriado e `inputMode`/`type` coerentes nos inputs controlados.
- [ ] Fazer os cards de forma de pagamento/entrada funcionarem como controles de rádio completos: foco visível, teclado, `aria-checked` e sem depender apenas de `onClick`.
- [ ] Manter mensagens de erro próximas ao campo e anunciar erros assíncronos com `aria-live` quando o componente existente permitir.
- [ ] Trocar `transition-all` por `transition-colors`/`transition-opacity` conforme a propriedade animada.
- [ ] Adicionar proteção para saída com alterações não salvas se o fluxo permitir navegação antes da confirmação; não bloquear a navegação após sucesso.
- [ ] Executar build, teste de dashboard e commit `fix: improve income and expense form accessibility`.

### Tarefa 4: Unificar estrutura visual entre Receita e Despesa

**Arquivos:**
- Avaliar: `app/(pages)/(workspace)/[workspaceId]/dashboard/credits/page.tsx`
- Avaliar: `app/(pages)/(workspace)/[workspaceId]/dashboard/debits/page.tsx`
- Avaliar: `app/(pages)/(workspace)/[workspaceId]/dashboard/credits/new/page.tsx`
- Avaliar: `app/(pages)/(workspace)/[workspaceId]/dashboard/debits/new/page.tsx`
- Avaliar: `app/components/page-header.tsx`

- [ ] Alinhar títulos, descrições, espaçamento do cabeçalho, período selecionado e posicionamento do CTA entre as duas páginas.
- [ ] Garantir que o seletor de workspace permaneça no nav lateral no desktop e não seja renderizado como ação concorrente no cabeçalho.
- [ ] Padronizar a hierarquia dos títulos dos passos e o resumo final dos formulários.
- [ ] Validar em viewport desktop e mobile, incluindo overflow horizontal, foco e estados de carregamento.
- [ ] Executar build, teste de dashboard e commit `refactor: align income and expense page structure`.

### Tarefa 5: Validação final no preview

**Arquivos:**
- Testar: rotas `/[workspaceId]/dashboard/credits`, `/[workspaceId]/dashboard/debits`, `/credits/new` e `/debits/new`.

- [ ] Executar `pnpm build`.
- [ ] Encerrar qualquer processo antigo da porta 3000 e iniciar apenas `pnpm start` a partir do build atual.
- [ ] Validar listagem preenchida, estado vazio, filtro sem resultado, criação, avanço/retorno entre passos e erro de validação.
- [ ] Confirmar que não há CTAs duplicados nem barras horizontais indevidas.
- [ ] Executar `pnpm test:dashboard` e `git diff --check`.
- [ ] Fazer revisão final e registrar qualquer pendência residual antes do merge.
