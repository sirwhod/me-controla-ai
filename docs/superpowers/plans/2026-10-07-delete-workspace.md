# Exclusão de caixinha — plano de implementação

**Objetivo:** Excluir definitivamente uma caixinha e seus dados, mediante confirmação exata do nome pelo proprietário.
**Arquitetura:** Endpoint DELETE autenticado, validação transacional da propriedade e confirmação. Marcar a caixinha como em exclusão antes de limpar subcoleções, comprovantes, convites e referências; manter o documento até terminar para permitir retentativas após falhas. Interface com diálogo em Gestão e atualização do contexto após sucesso.
**Tecnologias:** Next.js, Firebase Admin, React Query, shadcn/ui.
**Especificação:** Solicitação do usuário nesta conversa em 07/10/2026; exclusão de todos os dados após digitar o nome.

## Implementação
- [x] Criar `app/lib/delete-workspace.ts` e `app/api/workspaces/[workspaceId]/route.ts`: negar visitantes, membros não proprietários e nomes incorretos; remover dados somente da caixinha selecionada.
- [x] Bloquear acesso financeiro e aceite de convites enquanto `deleting` estiver ativo.
- [x] Criar `app/components/delete-workspace.tsx`: confirmação pelo nome, cancelamento, estado pendente, erro e redirecionamento após atualizar a lista.
- [x] Inserir ação em Gestão apenas para o proprietário. Preservar criação automática de caixinha pessoal vazia após excluir a última.

## Testes e conclusão
- [x] Testar autorização e confirmação com casos de proprietário, membro, visitante e nome incorreto.
- [x] Executar regressões de navegação e dashboard e `pnpm build`.
- [x] Verificar servidores existentes e iniciar um único `pnpm start` do build novo.
- [x] No preview localhost de produção, criar caixinha descartável e testar via HTTP: visitante, membro não proprietário, nome incorreto, gravação normal, exclusão, lista atualizada, arquivos e isolamento. Verificar exclusão da última caixinha e criação de substituta vazia.
- [x] Revisar diff, corrigir problemas e fazer commit apenas depois da validação.

## Evidências e limites
- `pnpm build`: passou no build final.
- `pnpm test:navigation` e `pnpm test:dashboard`: passaram.
- `scripts/workspace-deletion-tests.ts`: passou, incluindo falhas individuais de outbox, retentativa e recuperação de lease concluída.
- `scripts/workspace-deletion-preview-tests.ts`: passou no servidor `pnpm start`; todos os dados descartáveis foram removidos pelo teste.
- `node node_modules/typescript/bin/tsc --noEmit`: passou após adicionar os testes.
- Revisão independente: sem defeitos bloqueantes remanescentes.
- Validação visual/cancelamento pelo navegador não realizados: navegador integrado falhou ao anexar a aba.
- A limpeza de notificações consulta os usuários; custo cresce com a base. Uma futura implementação pode usar índice collection-group.
- Leases de processos remotos encerrados ficam bloqueados por segurança; recuperação operacional requer comprovar que a operação terminou antes de remover o lease e ajustar a contagem. Leases concluídos e PIDs locais comprovadamente inexistentes são recuperados automaticamente.
