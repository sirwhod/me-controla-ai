# Security Remediation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Corrigir os riscos de identidade, convites, comprovantes, concorrência, abuso de recursos, dependências e configuração Firebase identificados no check-up de segurança.

**Architecture:** A autorização continuará centralizada no servidor Next.js usando Firebase Admin; Firestore e Storage permanecerão fechados para acesso direto do cliente. Identidades, convites e arquivos passarão a ter referências determinísticas, transacionais e revogáveis, com testes no Firebase Emulator antes de qualquer publicação.

**Tech Stack:** Next.js 15, Auth.js/NextAuth, Firebase Admin, Firestore, Firebase Storage, Firebase Emulator Suite, Zod, pnpm, TypeScript.

**Spec:** `SECURITY_REAUDIT.md`, seções F, G, H, I e J, complementado pelo check-up de segurança de 2026-09-14.

## Global Constraints

- Não executar escritas, migrações ou deploy contra o projeto Firebase real; usar exclusivamente Emulator ou projeto explicitamente identificado como teste.
- Não expor valores de `.env.local`, service accounts, tokens, cookies, URLs assinadas ou credenciais nos logs, commits ou documentação.
- Toda autorização deve ser derivada no servidor e reler o estado atual do Firestore; `session.user.workspaceIds` é apenas dica de UI.
- Firestore Rules e Storage Rules devem continuar negando acesso direto do cliente.
- Toda nova mutation deve ser validada com Zod, limitada em tamanho e coberta por teste de membro, não membro, owner, usuário removido e sessão antiga.
- Não publicar até os testes do Emulator, build de produção e validação read-only do Firebase Console passarem.
- Cada tarefa deve terminar com teste específico, revisão do diff e commit pequeno.

### Task 1: Baseline, inventário e harness de segurança

**Files:**
- Modify: `scripts/security-emulator-suite.ts`
- Modify: `package.json`
- Create: `docs/security-remediation-runbook.md`
- Test: `scripts/security-emulator-suite.ts`

**Interfaces:**
- Produces: comando repetível `pnpm security:test:emulator` e checklist operacional para o executor.

- [ ] **Step 1: Registrar o baseline antes das mudanças**

Executar e salvar somente resultados não sensíveis de `git status --short`, `pnpm exec tsc --noEmit`, lint e inventário das rotas/API. Confirmar que `.env*` reais não estão rastreados.

- [ ] **Step 2: Corrigir o fluxo de execução do Emulator**

Fazer a suíte falhar explicitamente quando `FIRESTORE_EMULATOR_HOST` ou `FIREBASE_STORAGE_EMULATOR_HOST` estiverem ausentes e aceitar apenas projetos `demo-*`, sem fallback para produção.

- [ ] **Step 3: Documentar o runbook**

Documentar inicialização, variáveis do Emulator, limpeza, execução e interpretação dos resultados. Incluir que `firebase deploy` e scripts `--apply` são proibidos durante testes.

- [ ] **Step 4: Verificar o baseline**

Executar `pnpm security:test:emulator` em projeto demo e confirmar que a suíte inicia e termina com resumo determinístico.

- [ ] **Step 5: Commit**

`git add scripts/security-emulator-suite.ts package.json docs/security-remediation-runbook.md` e criar commit `test: establish security emulator baseline`.

### Task 2: Verificação de e-mail e proteção de convites

**Files:**
- Modify: `app/actions/register-action.ts`
- Modify: `app/lib/auth.ts`
- Modify: `app/lib/email-verification.ts`
- Modify: `app/api/email-verification/confirm/route.ts`
- Modify: `app/lib/invitations.ts`
- Modify: `app/api/invitations/[invitationId]/route.ts`
- Modify: `app/api/invitations/route.ts`
- Test: `scripts/security-emulator-suite.ts`

**Interfaces:**
- Consumes: modelo atual de usuário, tokens de verificação e convite.
- Produces: aceitação de convite somente para usuário autenticado com e-mail verificado, e token de verificação de uso único e expiração curta.

- [ ] **Step 1: Escrever testes que falham**

Adicionar casos para: conta local não verificada recebe 403 ao aceitar convite; e-mail verificado aceita; token expirado falha; token confirmado duas vezes falha; e-mail normalizado divergente falha; OAuth com e-mail verificado preserva o fluxo.

- [ ] **Step 2: Implementar estado de verificação**

Persistir `emailVerificationTokenHash`, `emailVerificationExpiresAt` e `emailVerifiedAt`; nunca persistir o token em claro. A confirmação deve usar transação, aceitar apenas token não expirado e apagar/inutilizar o hash após sucesso.

- [ ] **Step 3: Reforçar autenticação local**

Manter login possível para conta não verificada apenas se o produto exigir, mas impedir qualquer fluxo privilegiado — especialmente aceite de convite — até `emailVerifiedAt` existir. Não usar apenas o campo do JWT.

- [ ] **Step 4: Reforçar aceite de convite**

Dentro da transação, reler usuário e convite, exigir `pending`, validade, e-mail normalizado igual e `emailVerifiedAt` válido. Retornar mensagem genérica para não permitir enumeração de convites ou contas.

- [ ] **Step 5: Executar testes direcionados**

Executar `pnpm security:test:emulator` e os testes de confirmação/convite; verificar que não há token em logs ou resposta HTTP.

- [ ] **Step 6: Commit**

`git add app scripts/security-emulator-suite.ts` e criar commit `fix: require verified email for workspace invitations`.

### Task 3: Unicidade transacional de identidade

**Files:**
- Modify: `app/actions/register-action.ts`
- Modify: `app/lib/email-identity.ts`
- Modify: `app/lib/auth.ts`
- Modify: `scripts/security-emulator-suite.ts`
- Create: `scripts/audit-duplicate-identities.ts`

**Interfaces:**
- Produces: `emailIdentities/{normalizedEmailHash}` como índice transacional da conta canônica.

- [ ] **Step 1: Escrever testes concorrentes**

Disparar duas criações simultâneas para o mesmo e-mail e exigir exatamente uma identidade e uma conta vinculada. Testar normalização de maiúsculas, espaços e Unicode conforme a política escolhida.

- [ ] **Step 2: Implementar índice determinístico**

Usar hash HMAC ou SHA-256 de e-mail normalizado com namespace fixo. Criar o índice em transação com `create`; se já existir, rejeitar cadastro sem revelar qual conta existe.

- [ ] **Step 3: Ajustar login e recuperação de identidade**

Fazer login resolver a conta pelo índice canônico, mantendo compatibilidade controlada com contas legadas somente durante migração auditada.

- [ ] **Step 4: Auditar duplicatas sem escrever**

Criar script que lista e-mails duplicados por hash normalizado sem imprimir e-mails completos. O script deve exigir Emulator ou projeto explicitamente de teste.

- [ ] **Step 5: Verificar e commitar**

Executar testes concorrentes, TypeScript e Emulator; criar commit `fix: make email identity uniqueness transactional`.

### Task 4: Convites idempotentes e consistentes sob concorrência

**Files:**
- Modify: `app/lib/invitations.ts`
- Modify: `app/api/invitations/route.ts`
- Modify: `app/api/invitations/[invitationId]/route.ts`
- Modify: `scripts/security-emulator-suite.ts`

**Interfaces:**
- Produces: operações de criar, cancelar e aceitar convite com precondições transacionais e chave determinística por workspace + e-mail.

- [ ] **Step 1: Escrever testes de corrida**

Testar duas criações simultâneas, aceite/cancelamento simultâneos, aceite após expiração, aceite após remoção e replay do mesmo convite. Exigir estado final único e associação coerente.

- [ ] **Step 2: Implementar chave e estado**

Usar documento determinístico por workspace e destinatário normalizado, com campos `status`, `createdAt`, `expiresAt`, `cancelledAt` e versão/tombstone quando necessário.

- [ ] **Step 3: Tornar cancelamento transacional**

Ler e atualizar o mesmo documento dentro de transação, recusando cancelamento de convite não pendente e fazendo o aceite respeitar a versão/estado final.

- [ ] **Step 4: Verificar todos os papéis**

Garantir owner-only para criar/cancelar, membro ativo e e-mail verificado para aceitar, e 401/403 para anônimo, externo e removido.

- [ ] **Step 5: Commit**

Criar commit `fix: make invitation lifecycle atomic and idempotent`.

### Task 5: Migrar comprovantes para Storage privado

**Files:**
- Modify: `app/types/financial.ts`
- Modify: rotas de créditos e débitos sob `app/api/workspaces/`
- Create: `app/api/workspaces/[workspaceId]/proofs/route.ts`
- Create: `app/lib/proofs.ts`
- Modify: `storage.rules`
- Modify: `scripts/migrate-legacy-storage-urls.ts`
- Modify: `scripts/security-emulator-suite.ts`
- Create: `scripts/audit-legacy-proof-urls.ts`

**Interfaces:**
- Produces: `proofPath` privado, upload validado e download autorizado; novos registros não aceitam `proofUrl` externo.

- [ ] **Step 1: Escrever testes de autorização e conteúdo**

Testar upload de membro, leitura por membro, negação a externo/removido, exclusão autorizada, tamanho máximo, MIME permitido, assinatura mágica, extensão enganosa e path traversal.

- [ ] **Step 2: Definir o modelo de dados**

Persistir somente path aleatório sob `proofs/{workspaceId}/{randomId}` e metadados mínimos. Rejeitar `http`, `https`, `javascript`, data URLs e caminhos recebidos diretamente do cliente.

- [ ] **Step 3: Implementar upload/download/delete server-side**

Validar sessão, membership atual, tamanho, MIME e conteúdo; gerar nome no servidor; usar stream/URL assinada curta; conferir autorização novamente no download e delete.

- [ ] **Step 4: Migrar legado com dry-run**

Auditar URLs antigas sem baixá-las automaticamente. Implementar migração idempotente e bloqueada fora do Emulator/projeto de teste; preservar backup lógico e registrar somente contagens/IDs anonimizados.

- [ ] **Step 5: Verificar Rules e limpeza**

Manter acesso direto negado e testar objeto existente contra Storage Emulator. Confirmar que apagar o lançamento não deixa arquivo órfão sem política definida.

- [ ] **Step 6: Commit**

Criar commit `fix: move financial proofs to private storage`.

### Task 6: Limites, paginação e proteção contra custo abusivo

**Files:**
- Modify: rotas de listagem de débitos, créditos, responsáveis, metas e notificações.
- Modify: `app/api/workspaces/[workspaceId]/summary/route.ts`
- Modify: `app/api/workspaces/[workspaceId]/analytics/route.ts`
- Modify: `app/lib/rate-limit.ts`
- Modify: `scripts/security-emulator-suite.ts`

- [ ] **Step 1: Escrever testes de limites**

Testar omissão de `limit`, limite negativo, limite acima do máximo, cursor inválido, `refresh=true` repetido e chamadas concorrentes. Exigir limite server-side e resposta 429 quando aplicável.

- [ ] **Step 2: Tornar paginação obrigatória**

Definir máximo global por endpoint, aplicar `limit` no servidor e retornar cursor opaco. Nunca aceitar uma coleção inteira por omissão.

- [ ] **Step 3: Restringir recomputação**

Remover refresh arbitrário para membros comuns ou limitar a owner/job idempotente; preferir atualização incremental após mutations.

- [ ] **Step 4: Ampliar rate limit**

Usar chaves compostas por usuário, workspace, operação e IP quando disponível, com limites distintos para leitura, escrita e recomputação.

- [ ] **Step 5: Verificar e commitar**

Executar testes de abuso no Emulator e criar commit `fix: bound financial queries and recomputation`.

### Task 7: Dependências e hardening de aplicação

**Files:**
- Modify: `package.json`
- Modify: `pnpm-lock.yaml`
- Modify: `next.config.mjs`
- Modify: `auth.config.ts`
- Modify: `app/lib/observability.ts`
- Create: `.github/workflows/security.yml` se CI existir

- [ ] **Step 1: Capturar auditoria de dependências**

Em ambiente com registry acessível, executar `pnpm audit --prod --json`, registrar advisories, confirmar alcance e atualizar primeiro NextAuth/Auth.js e Firebase SDK/Admin para versões compatíveis e suportadas.

- [ ] **Step 2: Validar lockfile e testes**

Executar `pnpm install --frozen-lockfile`, TypeScript, lint, suíte de regressão e build. Não aceitar atualização sem revisar breaking changes.

- [ ] **Step 3: Endurecer CSP**

Remover `unsafe-eval` em produção; reduzir `unsafe-inline` com nonce/hash quando compatível com Next.js. Manter exceções somente em desenvolvimento e documentá-las.

- [ ] **Step 4: Endurecer secrets e host**

Manter `OBSERVABILITY_HASH_SECRET` obrigatório em produção, validar `AUTH_SECRET`, revisar `trustHost: true` com allowlist/proxy confiável e garantir cookies Secure/HttpOnly/SameSite em HTTPS.

- [ ] **Step 5: Commit**

Criar commit `chore: update security dependencies and production hardening`.

### Task 8: Validação read-only do Firebase real

**Files:**
- Modify: `docs/security-remediation-runbook.md`
- Create: `scripts/firebase-readonly-security-check.ts` se a CLI não cobrir o inventário necessário

- [ ] **Step 1: Confirmar identidade sem exibir credenciais**

Executar `firebase login:list` e `firebase use`; se houver erro de permissão, corrigir o ambiente da CLI sem copiar tokens para o repositório.

- [ ] **Step 2: Comparar configuração local e publicada**

Usar comandos read-only para verificar projeto, Rules e índices publicados. Registrar hashes/versões e não conteúdo sensível.

- [ ] **Step 3: Revisar IAM e Storage**

No Console, confirmar papéis mínimos, bucket não público, CORS restrito, objetos legados e ausência de ACL pública.

- [ ] **Step 4: Revisar Authentication e operação**

Verificar providers, domínios autorizados, App Check, orçamento, quotas, logs e endpoints de Functions.

- [ ] **Step 5: Registrar evidências**

Atualizar o runbook com data, projeto, operador, comandos, resultado e limitações; nunca registrar tokens ou dados de usuários.

### Task 9: Certificação final e release gate

**Files:**
- Modify: `SECURITY_REAUDIT.md`
- Modify: `docs/security-operations.md`
- Modify: `README.md` se os comandos mudarem

- [ ] **Step 1: Executar validações obrigatórias**

Executar `pnpm exec tsc --noEmit`, lint, `pnpm build`, iniciar `pnpm start` usando o build mais recente e testar as rotas críticas no preview local.

- [ ] **Step 2: Executar Emulator Suite completa**

Confirmar casos de autorização, verificação, concorrência, Storage, paginação, rate limit, replay e migração dry-run. Exigir 100% de aprovação dos casos obrigatórios.

- [ ] **Step 3: Reexecutar scans**

Executar `pnpm audit --prod`, secret scan e auditoria de segurança do projeto. Comparar findings com o baseline e investigar toda regressão.

- [ ] **Step 4: Atualizar reauditoria**

Marcar cada achado como corrigido somente com evidência de código e teste; separar controles locais de controles Firebase ainda não verificados.

- [ ] **Step 5: Revisão final e commit**

Solicitar code review, revisar diff completo, confirmar que não há alterações não relacionadas e criar commit final `security: certify remediation baseline` somente após todas as validações.

## Critérios de aceite

- Não é possível aceitar convite com conta local não verificada.
- Verificação de e-mail é de uso único, expira e não grava token em claro.
- Duas criações concorrentes para o mesmo e-mail resultam em uma única identidade.
- Criação, cancelamento e aceite concorrentes de convite têm estado final consistente.
- Novos comprovantes não aceitam URL externa e são entregues somente mediante autorização atual.
- Objetos de Storage não podem ser lidos diretamente por cliente não autenticado.
- Consultas sem `limit` não retornam coleções ilimitadas.
- Refresh/recomputação possui autorização, quota e idempotência.
- Dependências críticas/altas alcançáveis foram corrigidas ou formalmente aceitas com justificativa.
- Build, lint, TypeScript, Emulator Suite e preview local passam.
- IAM, Rules publicadas, bucket, Authentication, App Check e alertas do Firebase foram verificados.

## Ordem recomendada

1. Task 1 — baseline e harness.
2. Task 2 — e-mail verificado e convites.
3. Task 3 — unicidade de identidade.
4. Task 4 — concorrência de convites.
5. Task 5 — comprovantes privados.
6. Task 6 — limites e custo.
7. Task 7 — dependências e hardening.
8. Task 8 — Firebase remoto.
9. Task 9 — certificação e release gate.

As Tasks 2–4 formam o bloqueio P0 de segurança de workspaces; a Task 5 é o bloqueio de privacidade de arquivos; Tasks 6–8 devem ser concluídas antes do lançamento público.
