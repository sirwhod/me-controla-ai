# Relatório de execução E2E — 02/09/2026

## Ambiente

- URL: `http://localhost:3000`
- Navegador: Browser interno do Codex
- Usuário/workspace: sessão autenticada já existente; workspace mascarado como `OYSPR…LZsB`
- Dados criados pelo teste: nenhum
- Limpeza: não aplicável

## Resultado geral

Os testes foram executados de forma guiada pelo roteiro `docs/E2E_BROWSER_TESTS_CODEX.md`.
O redirecionamento observado ao acessar `/sign-in` foi reclassificado como **comportamento esperado** quando já há sessão válida em cache. Não foi possível provar, nesta sessão já autenticada, o comportamento de uma senha incorreta em uma sessão anônima limpa.

## Casos executados

| ID | Status | Evidência / resultado |
|---|---|---|
| E2E-001 | APROVADO parcial | Landing exibiu navbar, hero, recursos, FAQ, CTA e footer. CTA visível em `1440x900`, `768x1024` e `390x844`. Não foi detectado overflow horizontal. Âncoras, alternância de tema e foco completo não foram cobertos. |
| E2E-002 | APROVADO parcial / inconclusivo | `/sign-in` exibiu heading, labels e botões esperados. Com sessão válida em cache, o acesso redirecionou corretamente para `/{workspaceId}/dashboard`. O teste de senha incorreta ficou inconclusivo porque a sessão existente prevaleceu; deve ser repetido após logout/limpeza controlada. |
| E2E-003 | APROVADO parcial | Sidebar e rotas de Dashboard, Despesas, Receitas e Configurações funcionaram. As páginas de Bancos, Cartões, Categorias, Metas, Responsáveis e Membros carregaram headings esperados. Mobile/collapse e rotas legadas não foram cobertos. |
| E2E-004 | APROVADO parcial | Cards de receitas, despesas e saldo carregaram valores válidos. Navegação de mês alterou query string e dados; retorno para setembro preservou o período. Console sem erros/warnings observados. |
| E2E-005 | NA | CRUD de bancos/cartões não executado; requer mutações, validação de integridade e exclusão com confirmação. |
| E2E-006 | NA | CRUD de categorias/responsáveis não executado. |
| E2E-007 | NA | Wizard de receitas não executado. |
| E2E-008 | NA | Wizard de despesas e regras de recorrência não executado. |
| E2E-009 | NA | Metas e aportes não executados. |
| E2E-010 | BLOQUEADO | Não foi usado segundo e-mail autorizado; convite não foi enviado para evitar alteração de dados reais. |
| E2E-011 | NA | Auditoria completa de teclado, foco, ARIA e temas não executada. |
| E2E-012 | NA | Loading/erro acionáveis, requests duplicados e duplo clique durante gravação não foram executados. |

## Pontos para plano de ação

1. Repetir E2E-002 em contexto anônimo real: efetuar logout, confirmar redirecionamento para `/sign-in` e então enviar senha inválida; validar a mensagem `E-mail ou senha incorretos.` e permanência na tela.
2. Testar explicitamente o caso de sessão válida acessando `/` e `/sign-in`; o esperado é redirecionar para o primeiro workspace e seu dashboard.
3. Completar os cenários CRUD e wizards com dados prefixados `[E2E-CODEX]`, confirmação de limpeza e evidências após reload.
4. Executar a matriz de acessibilidade e resiliência ainda pendente.

## Evidências técnicas

- Dashboard autenticado observado em `/{workspaceId}/dashboard`.
- Query de período observada: `?month=setembro&year=2026` e `?month=outubro&year=2026`.
- Headings confirmados: `Visão Geral`, `Bancos e Contas`, `Cartões de Crédito`, `Categorias`, `Metas Financeiras`, `Responsáveis`, `Membros com Acesso à Caixinha`, `Despesas` e `Receitas`.
- Nenhum erro ou warning de console foi observado nos fluxos executados.
