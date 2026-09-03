# Instruções para agentes

## Execução local

- Como o modo de desenvolvimento pode ser demorado, prefira sempre o fluxo de produção local:
  1. Execute `pnpm build`.
  2. Inicie a aplicação com `pnpm start` (preview local do build do Next.js).
- Antes de iniciar um servidor, verifique se já existe um servidor da aplicação em execução. Mantenha somente um servidor rodando por vez.
- Para testar a aplicação, use sempre o servidor iniciado a partir do build mais recente.

## Credenciais para testes

Use estas credenciais somente para testes autorizados na plataforma local:

- E-mail: `rodrigobrandao98@gmail.com`
- Senha: `@23062931Karol`

Não exponha essas credenciais em logs, commits, documentação pública ou mensagens desnecessárias.

## Implementação e validação

- Para toda nova funcionalidade, antes do commit:
  - solicite detalhes adicionais ao usuário usando perguntas com opções, indicando qual opção é recomendada;
  - faça um plano das tarefas de implementação;
  - faça um plano de testes cobrindo a funcionalidade nova e possíveis regressões;
  - execute `pnpm build`;
  - inicie o servidor com `pnpm start` após o build;
  - teste a funcionalidade nova no preview local;
  - só então faça o commit obrigatório.
- Para toda melhoria solicitada, crie um plano de implementação e um plano de testes antes de alterar o código.
- Após qualquer alteração, confirme que o build e os testes relevantes foram executados antes de concluir o trabalho.
