# Prompt — Auditoria e padronização de UI/UX

Você é um especialista sênior em UI/UX, design systems, acessibilidade e desenvolvimento React/Next.js.

Sua missão é realizar uma auditoria completa da UI/UX desta aplicação, corrigir inconsistências encontradas e criar uma documentação permanente para orientar futuros agentes de IA durante novas implementações.

## Contexto técnico

- Framework: Next.js 15
- React 19
- Tailwind CSS
- Componentes baseados em Radix UI/shadcn
- Ícones: lucide-react
- Aplicação financeira responsiva
- Diretório principal: `app/`
- Componentes reutilizáveis: `app/components/`
- Componentes visuais base: `app/components/ui/`
- Estilos globais: `app/globals.css`
- Documentação: `docs/`
- Scripts de build e testes: `package.json`

## Objetivos

1. Fazer uma varredura visual e estrutural de toda a aplicação.
2. Identificar inconsistências de UI/UX.
3. Corrigir as inconsistências diretamente no código.
4. Criar um guia de regras de UI/UX para orientar futuras implementações.
5. Validar as alterações no build e no preview local.
6. Não alterar regras de negócio, banco de dados, autenticação ou comportamento funcional sem necessidade explícita.

## Antes de começar

- Leia o `AGENTS.md` e respeite todas as instruções do projeto.
- Analise a estrutura completa de `app/`, especialmente `app/globals.css`, `app/components/ui/`, `app/components/forms/`, layouts, páginas, tabelas, diálogos, formulários e navegação.
- Verifique se já existe um servidor local em execução. Não inicie um segundo servidor.
- Caso existam decisões de produto ou design que não possam ser inferidas com segurança, faça perguntas ao usuário antes de alterar o código. Apresente perguntas objetivas com opções e indique uma opção recomendada.
- Se as inconsistências puderem ser resolvidas com segurança usando os padrões já existentes, prossiga sem interromper.

## Auditoria obrigatória

Analise todas as páginas e componentes quanto a:

- Consistência de cores, tipografia, pesos e tamanhos de texto.
- Hierarquia visual de títulos, subtítulos, labels e textos auxiliares.
- Espaçamentos, margens, padding e alinhamentos.
- Altura, largura, bordas, raios e sombras dos componentes.
- Estados de hover, focus, active, disabled, loading, erro e sucesso.
- Consistência entre botões primários, secundários, destrutivos e ghost.
- Inputs, selects, calendários, textareas e mensagens de validação.
- Diálogos, modais, drawers, popovers e confirmações de ações destrutivas.
- Tabelas, paginação, filtros, ordenação e estados vazios.
- Skeletons, spinners e feedback durante carregamentos.
- Responsividade em desktop, tablet e mobile.
- Navegação lateral, navegação contextual e breadcrumbs.
- Uso e consistência dos ícones.
- Contraste de cores e legibilidade.
- Acessibilidade: labels, foco por teclado, atributos ARIA, ordem de tabulação e leitores de tela.
- Clareza dos textos exibidos ao usuário.
- Consistência entre telas que realizam ações semelhantes.
- Prevenção de erros e confirmação de ações irreversíveis.
- Tratamento de estados vazios, erros de rede e ausência de dados.
- Comportamento visual em temas claro e escuro, se aplicável.
- Problemas de overflow, conteúdo cortado, layout instável ou elementos difíceis de utilizar.

## Critérios de decisão

- Priorize os padrões já presentes na aplicação.
- Evite criar componentes duplicados.
- Centralize padrões reutilizáveis em `app/components/ui/` ou em tokens/variáveis globais quando apropriado.
- Prefira corrigir a origem da inconsistência em componentes compartilhados.
- Preserve a identidade visual existente, aprimorando sua consistência.
- Evite adicionar bibliotecas sem necessidade.
- Não use valores arbitrários repetidos quando puder usar tokens ou padrões existentes.
- Não remova funcionalidades existentes.
- Não altere textos de negócio, regras financeiras ou fluxos críticos sem justificar a mudança.

## Documentação obrigatória

Crie ou atualize `docs/UI_UX_GUIDELINES.md` com:

1. Objetivo e escopo.
2. Princípios gerais de UI/UX.
3. Diretrizes de layout e responsividade.
4. Regras de espaçamento.
5. Regras de tipografia e hierarquia visual.
6. Paleta de cores e significado semântico.
7. Regras para botões e ações.
8. Regras para formulários e validações.
9. Regras para tabelas, filtros e paginação.
10. Regras para diálogos, popovers e confirmações.
11. Regras para loading, vazio, erro e sucesso.
12. Regras de acessibilidade.
13. Regras para ícones e ilustrações.
14. Regras para navegação.
15. Regras para temas claro e escuro.
16. Padrões de componentes reutilizáveis existentes.
17. Padrões proibidos ou que devem ser evitados.
18. Checklist obrigatório para novas telas e componentes.
19. Exemplos baseados no código real do projeto.
20. Instruções para agentes consultarem este arquivo antes de implementar mudanças de UI/UX.

Crie ou atualize `docs/UI_UX_AUDIT.md` registrando:

- Data da auditoria.
- Escopo analisado.
- Problemas encontrados.
- Severidade: crítica, alta, média ou baixa.
- Arquivo ou componente afetado.
- Correção realizada.
- Problemas não corrigidos e o motivo.
- Recomendações futuras.
- Pontos que dependem de decisão do produto.

Use este formato para cada problema:

```markdown
### [Severidade] Título do problema

- Local:
- Categoria:
- Problema:
- Impacto:
- Correção:
- Status:
```

## Execução e validação

1. Faça uma análise inicial e apresente um resumo dos principais problemas.
2. Se houver dúvidas relevantes, pergunte ao usuário antes de editar.
3. Faça as correções agrupadas por categoria.
4. Atualize ou crie a documentação.
5. Execute o lint disponível no projeto.
6. Execute `pnpm build`.
7. Inicie o preview local com `pnpm start`.
8. Teste visualmente autenticação, dashboard, listagens, formulários, diálogos, filtros, tabelas, estados vazios, mobile e temas.
9. Execute os testes relevantes já existentes no projeto.
10. Corrija regressões encontradas.
11. Ao final, informe arquivos alterados, inconsistências corrigidas, regras documentadas, comandos executados, resultado do build, resultado dos testes e pendências.

Não faça commit automaticamente sem autorização explícita do usuário.
