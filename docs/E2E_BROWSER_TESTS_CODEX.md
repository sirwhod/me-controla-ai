# Testes E2E guiados por navegador — MeControla.AI

Este arquivo é um roteiro executável por uma IA usando o Browser interno do Codex. Ele não depende de Playwright instalado no projeto: cada caso descreve ações visíveis, verificações e critérios de parada.

## Contrato de execução

- URL base: `http://localhost:3000` (se outra porta for usada, substitua em todos os casos).
- Inicie pelo build mais recente: `pnpm build` e depois `pnpm start`.
- Use somente uma sessão e um servidor por vez.
- Para testes autenticados, use credenciais autorizadas fornecidas pelo operador no momento da execução; nunca grave senha neste arquivo, em screenshots ou no relatório.
- Prefixe todo dado criado com `[E2E-CODEX]` e remova apenas os dados criados pelo próprio teste.
- Antes de cada caso: capture URL, viewport, tema, usuário/workspace visíveis, erros de console e falhas de rede.
- Após cada mutação: aguarde o feedback visível, confira a listagem, recarregue a página e confira novamente.
- Se um seletor não existir, não improvise: registre `BLOQUEADO`, o texto/URL observado e pare somente o caso afetado.

## Regras para a IA do navegador

1. Prefira `getByRole`, `getByLabel`, `getByText` e URL; não use classes CSS ou posições como seletor primário.
2. Antes de clicar, confirme que o controle está visível, habilitado e tem o nome esperado.
3. Para dialogs, valide título, descrição, foco inicial, `Escape` e foco restaurado.
4. Para selects, use o texto da opção exibida; para datas, confirme o valor formatado na tela.
5. Não aceite apenas mudança de URL como sucesso: confirme heading, tabela/lista, toast ou estado vazio esperado.
6. Em falha, preserve evidência: screenshot, URL, texto de erro, console e request status. Não tente corrigir o código.

## Helpers reutilizáveis

### `login() — sessão autenticada`

1. Acesse `/sign-in`.
2. Confirme heading `Entre na sua conta`, labels `E-mail` e `Senha` e botão `Entrar`.
3. Preencha as credenciais autorizadas pelo operador e clique `Entrar`.
4. Espere sair de `/sign-in`; confirme URL `/{workspaceId}/dashboard`, heading de dashboard e seletor de caixinha.
5. Registre o `workspaceId` apenas de forma parcialmente mascarada no relatório.

### `logout() — encerramento de sessão`

Abra o menu do usuário, escolha a ação de sair e confirme retorno a `/sign-in`. Tente acessar a URL protegida novamente e confirme redirecionamento para login.

### `crud(entity, create, edit, delete)`

Para cada entidade, navegue pela sidebar, abra o botão de criação, preencha somente campos visíveis e obrigatórios, salve, confirme o item `[E2E-CODEX]`, recarregue, edite para `[E2E-CODEX-EDITADO]`, recarregue e exclua pelo diálogo de confirmação. Confirme que o item desapareceu e que não houve duplicata.

## Casos críticos

### E2E-001 — Landing, links e responsividade

**Pré-condição:** sessão anônima.

1. Acesse `/` e confirme navbar, hero, seções de recursos, FAQ, CTA e footer.
2. Ative cada âncora/link interno e confirme rolagem para a seção correta.
3. No viewport `1440x900`, `768x1024` e `390x844`, confirme ausência de overflow horizontal, textos legíveis e CTA acionável.
4. Alterne tema claro/escuro quando disponível e confirme contraste, foco visível e persistência após reload.

### E2E-002 — Login inválido, login válido e sessão

1. Em `/sign-in`, envie campos vazios; confirme validação nativa/visível.
2. Envie senha incorreta; confirme `E-mail ou senha incorretos.` e permanência na página.
3. Execute `login()`; confirme que a rota inclui um workspace real.
4. Recarregue e use voltar/avançar; confirme que a sessão e a caixinha permanecem corretas.
5. Abra o modo `Cadastre-se`, confirme `Nome completo` e `Confirmar senha`; valide senha curta e senhas divergentes sem criar conta.

### E2E-003 — Navegação global e workspace

**Pré-condição:** `login()`.

1. Confirme na sidebar `Dashboard`, `Despesas`, `Receitas` e `Configurações`.
2. Abra Configurações e confirme `Bancos`, `Cartões de Crédito`, `Categorias`, `Metas`, `Responsáveis` e `Membros & Acesso`.
3. Acesse cada item, valide heading e URL `/{workspaceId}/...`; retorne ao dashboard pelo item da sidebar.
4. Recolha/expanda a sidebar e teste a navegação em viewport mobile.
5. Teste `/dashboard` e `/manage` legados: confirme redirecionamento ou estado de erro amigável, sem stack trace.

### E2E-004 — Dashboard e período

1. Confirme cards de receitas, despesas e saldo, além de estado de carregamento/erro quando aplicável.
2. Use o navegador de mês/ano anterior e seguinte; confirme atualização de rótulo, URL/query string e dados.
3. Recarregue e navegue para outra seção; volte e confirme período preservado conforme o comportamento da aplicação.
4. Registre console sem erros e confirme que totais não exibem `NaN`, `undefined` ou moeda inválida.

### E2E-005 — CRUD de bancos e cartões

1. Em Bancos, crie `[E2E-CODEX] Banco PIX` com PIX, chave e dias de fechamento/vencimento válidos.
2. Crie `[E2E-CODEX] Banco sem PIX`; valide que campos dependentes de PIX não ficam inconsistentes.
3. Execute `crud` em um banco, incluindo edição e exclusão.
4. Em Cartões de Crédito, crie cartão `[E2E-CODEX] Cartão` vinculado ao banco PIX, com limite e datas válidas.
5. Confirme o cartão em lista após reload e valide edição/exclusão. Tente excluir banco ainda referenciado e confirme bloqueio ou mensagem de integridade.

### E2E-006 — CRUD de categorias e responsáveis

1. Crie categorias `[E2E-CODEX] Despesa`, `[E2E-CODEX] Receita` e `[E2E-CODEX] Universal`; escolha ícones distintos.
2. Valide busca do seletor de ícones, nenhum resultado, teclado e cancelamento.
3. Crie responsável `[E2E-CODEX] Com e-mail` com e-mail válido e `[E2E-CODEX] Sem e-mail` sem e-mail.
4. Teste e-mail inválido e confirme erro sem persistência.
5. Execute edição, reload e exclusão de cada item criado.

### E2E-007 — Wizard de receita

1. Em Receitas, abra criação e confirme etapas, breadcrumbs e botão de avançar.
2. Tente avançar sem preencher; confirme erro no primeiro campo inválido e permaneça na etapa.
3. Crie uma receita comum `[E2E-CODEX] Receita comum` com valor `10,10`.
4. Crie uma receita fixa `[E2E-CODEX] Receita fixa`; confirme campos de recorrência e lançamentos esperados.
5. Volte etapas, confirme preservação de dados, abra revisão e confira todos os valores antes de salvar.
6. Confirme lista, dashboard, reload, edição e exclusão.

### E2E-008 — Wizard de despesa e regras de recorrência

1. Crie despesa comum via Pix `[E2E-CODEX] Pix`.
2. Crie despesa fixa `[E2E-CODEX] Fixa` e confirme frequência/replicação exibidas.
3. Crie parcelamento `[E2E-CODEX] Parcelada` com valor `10,10`, total de parcelas maior que 1 e método permitido; confirme sequência, centavos e quantidade restante.
4. Crie assinatura `[E2E-CODEX] Assinatura`; confirme campos específicos e recorrência.
5. Para cartão, crie uma despesa no dia de fechamento e outra após o fechamento; confirme mês/fatura resultante no resumo/lista.
6. Teste método incompatível com parcelamento/assinatura e confirme bloqueio/erro sem gravação.
7. Para cada item, valide voltar, cancelar, revisão, duplo clique, reload, edição, exclusão e atualização do dashboard.

### E2E-009 — Metas e aportes

1. Crie meta `[E2E-CODEX] Meta` com alvo positivo e data válida.
2. Abra a meta, faça dois aportes positivos em datas diferentes.
3. Confirme histórico, total acumulado, percentual e barra de progresso; recarregue e confirme persistência.
4. Teste aporte zero/negativo e data inválida; confirme rejeição sem alteração.
5. Edite e exclua a meta somente após validar os aportes e o efeito no dashboard.

### E2E-010 — Membros, convite e autorização visual

1. Abra `Membros & Acesso`; registre se o usuário é owner ou member.
2. Se owner e houver segundo e-mail autorizado, envie convite e confirme feedback, duplicidade e cancelamento.
3. Se member, confirme que ações administrativas ficam indisponíveis ou protegidas.
4. Não use endereço inventado para alterar dados reais; marque o cenário como bloqueado quando faltar autorização.

### E2E-011 — Acessibilidade e teclado

Em `/sign-in`, dashboard, uma listagem e um formulário, faça toda a navegação usando Tab/Shift+Tab/Enter/Espaço/Escape. Confirme nomes acessíveis, labels associados, headings hierárquicos, `aria-invalid`, foco em dialogs, foco após erro e foco restaurado após fechar. Repita em 390px e em ambos os temas.

### E2E-012 — Resiliência observável

1. Em uma listagem, confirme estados loading, vazio e erro se forem acionáveis pelo ambiente.
2. Durante uma gravação, clique duas vezes rapidamente; confirme no máximo um item criado.
3. Recarregue durante uma navegação e use back/forward; confirme ausência de tela branca, loop ou stack trace.
4. Registre status HTTP inesperado, requests duplicados e erros de console, sem expor tokens, cookies ou senhas.

## Formato do relatório da execução

Para cada caso, registrar: `ID | status (APROVADO/REPROVADO/BLOQUEADO/NA) | ambiente | pré-condição | passos executados | esperado | obtido | URL | evidência | console/rede | dados criados | limpeza`.

Status `APROVADO` exige execução e evidência. Use `BLOQUEADO` quando faltar sessão, workspace, permissão, segundo usuário ou ambiente; nunca converta ausência de execução em aprovação.

