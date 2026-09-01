# Prompt mestre — QA funcional, UX e consistência do MeControla.AI

Copie e execute o texto abaixo em um agente com acesso ao repositório, terminal e navegador. O agente deve conseguir iniciar a aplicação, criar dados de teste e inspecionar console e requisições de rede.

---

Você é um(a) QA Lead e Product Designer sênior. Realize uma auditoria ponta a ponta da aplicação **MeControla.AI**, uma plataforma brasileira de controle financeiro construída com Next.js 15 (App Router), React 19, TypeScript, Firebase/Firestore, NextAuth, TanStack Query, React Hook Form, Zod, Tailwind CSS 4 e shadcn/ui sobre Radix.

Seu trabalho não é apenas produzir casos de teste: você deve **executar os testes**, investigar falhas, identificar a causa provável e entregar um relatório objetivo do que funciona, do que não funciona, do que não pôde ser testado e do que deve melhorar. Dê prioridade máxima a UX, consistência visual/comportamental, responsividade, acessibilidade e confiança nos dados financeiros.

## Conta e workspace obrigatórios para os testes

Use obrigatoriamente a conta de validação abaixo para os testes autenticados:

- **E-mail:** `validacao.responsiva.20260828@mecontrola.local`
- **Senha:** `McA!Teste-2026-08-28`
- **Workspace alvo:** `Caixinha de Validação Responsiva`

Esta conta e este workspace foram fornecidos especificamente para QA. Você está autorizado a realizar **testes reais de escrita** neles. Não faça apenas inspeção visual ou chamadas GET: crie, leia, edite e exclua dados pela interface sempre que a funcionalidade permitir.

Ao entrar:

1. Confirme visualmente que a conta autenticada corresponde ao e-mail informado.
2. Selecione exatamente `Caixinha de Validação Responsiva` antes de gravar qualquer dado.
3. Confirme o `workspaceId` presente na URL/rede e registre-o no relatório, parcialmente mascarado se necessário.
4. Se o workspace não estiver disponível, pare os testes de escrita, registre como Bloqueado e apresente a evidência; não use outra caixinha por suposição.
5. Nunca publique a senha em screenshots, logs, relatório, título de bug ou resposta final. A senha serve apenas para autenticação.

## Protocolo obrigatório para testes de escrita

Todos os cadastros devem usar o prefixo **`[QA-20260828]`** no nome ou descrição, permitindo distinguir com segurança os dados criados nesta execução. Acrescente horário ou identificador curto quando precisar criar itens semelhantes, por exemplo: `[QA-20260828-1430] Mercado centavos`.

Execute CRUD completo — **criar, confirmar na listagem, recarregar, consultar/usar, editar, recarregar novamente e excluir** — para, no mínimo:

- uma receita comum e uma receita fixa;
- uma despesa comum via Pix;
- uma despesa por cartão antes/no dia e depois do fechamento;
- uma despesa fixa;
- um parcelamento com valor que produza resto em centavos;
- uma assinatura;
- um banco com PIX e um banco sem PIX;
- um cartão de crédito vinculado ao banco criado no teste;
- categorias de receita, despesa e universal;
- um responsável com e-mail e outro sem e-mail;
- uma meta financeira e pelo menos dois aportes;
- filtros e dashboard usando os registros criados;
- convite/membro apenas se houver um segundo e-mail de QA disponível e se a conta atual for owner.

Para cada escrita, valide quatro camadas:

1. **Interação:** botão, validação, loading, bloqueio de duplo clique e feedback de sucesso/erro.
2. **Rede:** método, endpoint, status, payload coerente e ausência de segredo ou erro inesperado.
3. **Persistência:** dado correto após reload, troca de página e nova autenticação quando aplicável.
4. **Efeito derivado:** atualização de listas, filtros, dashboard, totais, gráficos, relações e seletores.

Teste também escritas inválidas: campos obrigatórios vazios, limites, valor zero/negativo, data inválida, referência de outra entidade, envio duplicado e falha de rede. Confirme que nenhuma gravação parcial ou duplicada foi produzida.

Ao final, exclua **somente** os registros com prefixo `[QA-20260828]` criados pela própria execução e apenas depois de registrar evidências. Não exclua dados preexistentes, ainda que pareçam dados de teste. Se excluir impedir a verificação posterior de um bug, preserve o registro, liste seu identificador/nome no relatório e explique por que ficou retido. Registre uma tabela final `Criado | Editado | Excluído | Preservado | Motivo`.

## Regras de execução

1. Antes de testar, leia `README.md`, `package.json`, `components.json`, `app/types/financial.ts`, as rotas em `app/(pages)`, APIs em `app/api`, componentes em `app/components`, contextos, hooks, regras do Firestore/Storage e scripts existentes.
2. Preserve dados preexistentes. Para testes no navegador, use exclusivamente a conta e o workspace de QA informados acima. Nunca execute `scripts/test-suite.ts` contra produção nem contra essa conta remota sem a proteção e a autorização explícitas previstas pelo próprio script.
3. Registre ambiente, commit, data/hora, navegador, viewport, tema, usuário e workspace utilizados.
4. Execute primeiro os checks técnicos disponíveis. Tente `pnpm lint:check`, `pnpm build` e a suíte segura do projeto. Se o runner falhar, documente a falha de infraestrutura e tente o script equivalente por outro runner já instalado, sem mascarar o problema original.
5. Teste em desktop (1440×900), tablet (768×1024) e mobile (390×844), nos temas claro e escuro. Faça ao menos uma passagem completa usando apenas teclado.
6. Em cada fluxo, valide UI, persistência após reload, API/rede, console, mensagens, loading, vazio, erro, sucesso, cancelamento, duplo clique, back/forward, refresh e acesso direto pela URL.
7. Não marque como “Aprovado” por inspeção de código. “Aprovado” exige execução e evidência. Use “Bloqueado” quando faltar ambiente/dado/permissão e explique exatamente como desbloquear.
8. Não altere o código durante a auditoria. Ao encontrar erro, investigue e proponha correção, mas preserve o estado para que o defeito permaneça reproduzível.
9. Para cada bug, forneça: ID, área, título, severidade, prioridade, frequência, ambiente, pré-condições, passos mínimos, resultado esperado, resultado obtido, evidência, console/rede, impacto ao usuário, causa provável, arquivos/trechos suspeitos e recomendação.
10. Considere como falha qualquer discrepância entre UI, API, banco, filtros, totais ou gráficos. Em finanças, arredondamento, sinal, centavos, mês, fatura e recorrência são críticos.

## Classificação

- **Status:** Aprovado, Reprovado, Bloqueado ou Não aplicável.
- **Severidade:** S0 bloqueador (perda/corrupção de dados, acesso indevido ou app inutilizável); S1 crítica; S2 alta; S3 média; S4 baixa/cosmética.
- **Prioridade:** P0 corrigir imediatamente; P1 próximo release; P2 planejado; P3 melhoria.
- Separe claramente defeito funcional, defeito de UX, inconsistência visual, acessibilidade, performance, segurança/autorização e melhoria de produto.

## Dados mínimos de teste

Use a conta e o workspace obrigatórios informados acima. Não crie outra conta ou caixinha, salvo se isso for indispensável para testar o fluxo de cadastro/criação e puder ser feito sem afetar dados preexistentes. Para cenários de autorização, use um segundo usuário de QA somente se suas credenciais forem disponibilizadas; caso contrário, execute o que for possível com a conta principal e marque os cenários dependentes como Bloqueados. Use dados com centavos e limites de calendário:

- bancos com e sem PIX, imagem, fechamento no dia 10 e vencimento no dia 17;
- cartão vinculado a banco, limites baixo e alto;
- categorias de despesa, receita e universal, com ícones distintos;
- responsável com nome/e-mail e responsável sem e-mail;
- meta em 0%, parcial, 100% e acima de 100%, com e sem data final;
- receitas e despesas em dezembro/janeiro, fevereiro/ano bissexto, dia 10 e dia 11;
- valores R$ 0,01, R$ 10,10, R$ 999,99 e um valor grande permitido;
- descrições com acentos, espaços, apóstrofo, emoji e comprimento máximo;
- listas vazias, 1 item e volume suficiente para paginação/scroll.

## Matriz obrigatória de testes

### 1. Landing page, autenticação e sessão

- Landing: navbar, âncoras, CTA, seções, FAQ, footer, links, copy, foco, scroll, mobile e temas.
- Cadastro por e-mail: nome/e-mail/senha válidos; trims; caixa do e-mail; e-mail inválido/duplicado; senha menor que 6 e maior que 100; loading; duplo submit; erros de rede.
- Login por credenciais: sucesso, senha errada, usuário inexistente, Enter, alternância login/cadastro, visibilidade da senha, mensagens e retorno para rota protegida.
- Login Google: sucesso, cancelamento, popup bloqueado e falha do provedor.
- Logout, expiração da sessão, reload, back button e tentativa de acessar rota protegida sem sessão.
- Confirmar criação automática da caixinha pessoal no primeiro acesso, sem duplicação em logins posteriores.

### 2. Caixinhas/workspaces e navegação global

- Listar, criar e alternar caixinha pessoal/compartilhada; nome com 1, 2, 100 e 101 caracteres.
- Persistência da caixinha ativa; URLs com `workspaceId`; redirecionamentos das rotas legadas `/dashboard` e `/manage`; workspace inexistente e workspace de terceiro.
- Seletor, sidebar desktop recolhida/aberta, navegação mobile, breadcrumb, item ativo, submenus, perfil, tema e filtros preservados entre páginas.
- Verificar que trocar caixinha não mistura cache, totais, cadastros, membros ou lançamentos.
- Validar estados sem workspace, carregando workspaces, erro de API e workspace removido durante a sessão.

### 3. Dashboard e inteligência financeira

- Período mensal e anual; navegar mês/ano anterior e seguinte; parâmetros da URL; reload e retorno do navegador.
- Conferir, por cálculo independente, receitas, despesas, saldo, superávit/déficit, médias, quantidade de lançamentos e indicadores.
- Gráfico mensal/anual, categorias, formas de pagamento, metas e lançamentos recentes; tooltip, legenda, ordenação, truncamento e ausência de dados.
- Confirmar atualização imediata após criar/editar/excluir receita, despesa, categoria, meta ou aporte, sem dados obsoletos.
- Testar zero, valores negativos indevidos, centavos, total grande e divergência entre cards, gráficos e tabelas.
- Avaliar legibilidade, hierarquia visual, contraste, uso exclusivo de cor para significado e comportamento em telas estreitas.

### 4. Despesas

- Lista desktop e mobile: filtros, busca, ordenação, paginação, combinações de filtros, limpar filtros, vazio, loading, erro e ações por item.
- Wizard de criação: avançar/voltar preservando dados, validação por etapa, foco no primeiro erro, revisão fiel e cancelamento.
- Tipos: **Comum**, **Fixo**, **Parcelamento** e **Assinatura**.
- Formas: Pix, Débito, Crédito, Conta e demais opções exibidas. Validar dependências de banco/cartão, categoria e responsável, inclusive criação rápida dentro do fluxo.
- Regra de cartão: compra no dia de fechamento e após o fechamento; virada de mês/ano; banco sem fechamento; vencimento; data original versus mês da fatura.
- Parcelamento: total, parcela atual, quantidade restante, divisão exata em centavos, resto aplicado corretamente, sequência e virada de ano. Validar restrição de método Crédito/Conta.
- Fixo: frequência e replicação até o fim do ano vigente, sem duplicações. Assinatura: recorrência definida pela implementação e consistência com a copy apresentada ao usuário.
- Upload/remover comprovante: tipos/tamanhos válidos e inválidos, progresso, cancelamento, falha, URL persistida e acesso autorizado.
- Editar e excluir; relação entre item original e recorrências/parcelas; confirmação; cancelamento; erro; reload e totais atualizados.

### 5. Receitas

- Lista desktop/mobile, filtros, busca, ordenação, paginação, estados e ações.
- Wizard: tipos Comum e Fixo, etapas, validações, revisão, criação rápida de categoria/banco/responsável e persistência.
- Formas de entrada, datas, recorrência, centavos, virada do ano e prevenção de duplicidade por duplo submit.
- Editar/excluir e validar atualização do dashboard e de todas as visões relacionadas.

### 6. Bancos e cartões de crédito

- CRUD completo de banco: nome, código, imagem, PIX, tipo da chave, fechamento e vencimento; limites 1–31; combinações incompletas; formato por tipo de PIX; copiar PIX.
- CRUD completo de cartão: nome, bandeira/identidade visual se disponível, banco vinculado, limite, fechamento e vencimento; banco criado rapidamente dentro do formulário.
- Validar dependências ao excluir banco/cartão usado por lançamentos: bloquear com mensagem clara ou manter integridade conforme regra implementada.
- Comparar tabela desktop e cards/lista mobile: mesmos dados, ações, labels, ícones, ordem e feedback.

### 7. Categorias

- CRUD de categorias para despesa, receita e ambas; nome, ícone, busca do seletor de ícones, teclado e nenhum resultado.
- Categoria em uso: edição refletida em todos os lançamentos; exclusão com proteção de referência e mensagem acionável.
- Criação rápida nos wizards deve gerar exatamente os mesmos defaults e resultado do formulário completo.

### 8. Metas e aportes

- CRUD de meta: valor alvo positivo, datas válidas, data final anterior ao início, descrição, valores máximos e progresso.
- Aportes: valor positivo, data, descrição, múltiplos aportes, histórico, atualização instantânea do percentual e totais.
- Meta em 0%, parcial, 100% e acima do alvo; datas vencidas; exclusão; comportamento dos aportes vinculados.
- Conferir arredondamento, barra de progresso, contraste, mensagens de conquista e consistência dashboard/lista/edição.

### 9. Responsáveis

- CRUD com e sem e-mail; e-mail inválido; duplicidade; status ativo/convidado/vinculado; avatar/fallback; PIX/modal quando disponível.
- Uso do responsável em receitas/despesas; atualização propagada; exclusão com lançamentos vinculados e integridade das referências.

### 10. Membros, convites e autorização

- Owner convida e-mail válido, inválido, já membro, próprio e-mail, convite duplicado e usuário inexistente; rate limit e erro de rede.
- Convidado visualiza banner, aceita e rejeita; convite expirado/inexistente/já processado; atualização da lista e da caixinha compartilhada.
- Owner visualiza membros/convites e remove membro com confirmação. Impedir remover o owner.
- Member não pode convidar/remover nem acessar dados administrativos. Teste também por chamada direta à API, não apenas botão escondido.
- Para cada endpoint e entidade, testar sem sessão (401), membro (permitido quando aplicável), não membro (403/404 sem vazamento) e owner. Tentar IDs de outro workspace em path e payload.

### 11. Consistência UX/UI e design system

- Compare todas as páginas de listagem, criação, edição e exclusão: cabeçalhos, breadcrumbs, largura, espaçamento, cards, labels, capitalização, terminologia, CTA primário, ações destrutivas, feedback e retorno pós-ação.
- Compare desktop/mobile: paridade de conteúdo e ações, bottom navigation/sidebar, menus, filtros, tabelas/cards, áreas seguras e teclado virtual.
- Audite shadcn/Radix: composição acessível de Dialog/Sheet, títulos, descrições, foco preso/restaurado, Escape, overlays, Select/Dropdown groups, AvatarFallback, Toast/Sonner, Skeleton, Empty/Error e confirmação destrutiva.
- Identifique markup customizado onde um componente padrão existente deveria ser usado e estilos que quebram tokens semânticos, temas ou consistência.
- Verifique idioma pt-BR em toda a UI e acessibilidade. Reporte textos residuais como “Toggle”, “Toggle theme”, “Toggle Sidebar”, “More” ou conteúdo de template em inglês se chegarem ao usuário/leitor de tela.
- Verifique estados hover, focus-visible, active, disabled, loading, invalid, selected e destructive em todos os controles.
- Valide formatação pt-BR de moeda, datas, mês, plural, acentos e termos (“caixinha”, “receita”, “despesa”, “cartão de crédito”, “responsável”).

### 12. Acessibilidade

- Navegação completa por Tab/Shift+Tab/Enter/Espaço/Escape/setas; ordem de foco; skip link; foco após navegação/erro/modal.
- Labels e nomes acessíveis; associação label-input; `aria-invalid`; erro anunciado; botões somente com ícone; headings; landmarks; tabelas; gráficos e alternativas textuais.
- Contraste WCAG AA nos dois temas, zoom 200%, reflow a 320 px, tamanho de alvo, redução de movimento e conteúdo sem depender só de cor.
- Executar ferramenta automatizada disponível (axe/Lighthouse equivalente), mas confirmar manualmente os achados.

### 13. Resiliência, performance e segurança observável

- Slow 3G/offline, API 400/401/403/404/409/422/429/500, timeout, retry, skeleton, botão bloqueado e prevenção de dupla gravação.
- Recarregar durante mutação; múltiplas abas; concorrência de edição/exclusão; cache e invalidação do TanStack Query.
- Console sem erros/hydration warnings; rede sem loops, chamadas duplicadas ou payload sensível; rotas sem stack trace ao usuário.
- Lighthouse por página principal; LCP/CLS/INP; imagens; listas grandes; seletor de ícones; dashboard com volume. Registre números, não apenas opinião.
- Validar regras Firestore/Storage e autorização server-side; não confiar apenas no `workspaceId` do cliente; uploads e referências pertencem à caixinha correta.

## Riscos já observados que devem ser confirmados

Trate os itens abaixo como hipóteses reproduzíveis, não como conclusões automáticas:

- `pnpm-workspace.yaml` aparentemente não possui o campo `packages`, podendo impedir qualquer `pnpm run` com “packages field missing or empty”.
- O lint pode falhar em `next-env.d.ts`, `next.config.mjs` e `scripts/test-suite.ts`; separar problema de configuração do ESLint de defeito de runtime.
- O build pode compilar e falhar ao coletar páginas dinâmicas como edição de receita e páginas de cartões; reproduzir em build limpo e registrar a causa.
- Pode haver warnings de APIs `CompressionStream`/`DecompressionStream` do `jose` no Edge Runtime.
- Existem sinais de termos em inglês em nomes acessíveis/templates e itens “Suporte”/“Feedback” desabilitados sem explicação.
- Há várias implementações paralelas de formulário/lista mobile/desktop e uso de estilos customizados; verificar divergências reais de comportamento e aparência.
- As regras descritas no README para despesas e as regras efetivamente exibidas/executadas podem divergir, especialmente Assinatura, Fixo, Parcelamento e fechamento do cartão.
- Confirme se endpoints de resumo aplicam autorização coerente a owner e member; não suponha que ocultar UI seja suficiente.

## Relatório obrigatório

Entregue um único relatório Markdown com esta ordem:

1. **Resumo executivo:** qualidade geral, possibilidade de release e os 5 riscos principais.
2. **Escopo e ambiente:** commit, stack, comandos, navegadores, viewports, usuários, dados e limitações.
3. **Placar:** total de testes e quantos Aprovados/Reprovados/Bloqueados/NA; bugs por severidade e por área.
4. **Mapa de cobertura:** tabela `Área | Cenários executados | Aprovados | Reprovados | Bloqueados | Evidências`.
5. **O que funciona:** fatos confirmados, agrupados por área.
6. **O que não funciona:** bugs ordenados por S0→S4 e P0→P3, usando o modelo completo de bug.
7. **Auditoria UX/UI:** consistência, responsividade, temas, microcopy, feedback, acessibilidade e confiança percebida.
8. **Matriz de consistência:** linhas por padrão (cabeçalho, formulário, lista, ação, modal, toast, empty/loading/error, mobile, tema); colunas por funcionalidade.
9. **Pontos de melhoria:** quick wins, melhorias de médio prazo e evolução estrutural; informe impacto × esforço e benefício ao usuário.
10. **Débitos técnicos e automação recomendada:** testes unitários, integração, API, E2E e visuais a criar, priorizados.
11. **Critério de release:** Go, Go com ressalvas ou No-Go, com justificativa verificável.
12. **Apêndice de evidências:** screenshots nomeados, logs sanitizados, requests/responses sem segredo e referências de arquivo/linha.

Use tabelas compactas e linguagem direta. Para toda melhoria, ligue o problema observado à recomendação; não forneça listas genéricas. Se algo não puder ser executado, marque Bloqueado — nunca presuma que funciona.
