# Reauditoria de segurança pós-remediação

**Aplicação:** Me Controla AI  
**Data:** 28 de agosto de 2026  
**Revisão:** `e41736c` (`main`, sincronizada com `origin/main`)  
**Escopo:** aplicação Next.js, autenticação, rotas de API, Firestore, Storage, convites, workspaces compartilhados, arquivos, dependências e controles operacionais.  
**Política de referência:** política de segurança para workspaces compartilhados fornecida pelo proprietário do sistema.

> **Atualização de remediação — 28/08/2026:** SEC-R001, SEC-R003, SEC-R004 e a aceitação de novos `proofUrl` de SEC-R002 foram corrigidos no working tree após esta fotografia de auditoria. Contas sem e-mail verificado agora são bloqueadas em convites; identidades locais e convites possuem chaves determinísticas/transações; cancelamento é transacional; listagens têm limite padrão; refresh de resumo é owner-only e limitado; Auth.js foi atualizado; `unsafe-eval` ficou restrito ao desenvolvimento e o segredo de observabilidade passou a ser obrigatório em produção. A suíte do Emulator passou em 17/17. Permanecem necessários o provedor de verificação para contas locais, a migração dos comprovantes legados, a atualização major da pilha Firebase e nova reauditoria antes do release.

## A. Resumo executivo

As modificações corrigiram os principais defeitos anteriormente identificados em autorização por workspace: a associação atual é consultada no servidor, a remoção de membros é transacional, convites são aceitos transacionalmente, referências financeiras são validadas no workspace correto e Firestore/Storage recusam acesso direto do cliente.

Apesar disso, a aplicação **ainda não está pronta para publicação com workspaces compartilhados**. Esta reauditoria encontrou um caminho crítico não coberto pelas correções: qualquer pessoa pode cadastrar uma conta de senha usando o e-mail de outra pessoa, sem comprovar posse do endereço. Como a aceitação de convite confia apenas no e-mail presente na sessão, essa conta pode aceitar convites destinados à vítima e obter acesso financeiro completo ao workspace.

Também permanecem comprovantes externos não revogáveis, condições de corrida no ciclo de convites, superfícies de negação de serviço/custo e dependências vulneráveis.

### Classificação global

**Risco crítico — publicação bloqueada.**

| Severidade | Quantidade |
|---|---:|
| Crítica | 1 |
| Alta | 1 |
| Média | 4 |
| Baixa | 2 |
| Total | 8 |

### Decisão de release

Não publicar até, no mínimo:

1. exigir e validar e-mail verificado antes de permitir aceitar convites;
2. impedir unicidade concorrente de contas por e-mail;
3. substituir `proofUrl` arbitrária por armazenamento privado e autorização no servidor;
4. tornar criação/cancelamento/aceitação de convites mutuamente consistentes;
5. limitar consultas financeiras e recomputações de resumo.

## B. Escopo e metodologia

Foram inspecionados os fluxos de cadastro e login, callbacks de sessão, middleware, todas as rotas em `app/api`, helpers de autorização, regras de Firestore e Storage, esquemas Zod, upload de imagens, convites, remoção de membros, sumarização/analytics, rate limiting, headers, observabilidade, scripts de migração e dependências de produção.

A análise combinou:

- revisão estática de origem e configuração;
- rastreamento de dados controlados pelo cliente até consultas e gravações;
- matriz proprietário/membro/removido/externo;
- análise de concorrência em transações Firestore;
- busca de segredos e configuração insegura;
- `pnpm audit --prod --json`;
- TypeScript e ESLint;
- tentativa de execução da suíte dos emuladores.

Não foram realizados testes contra produção, contas reais, e-mail transacional, proxy/WAF, IAM do projeto Google Cloud, regras implantadas ou dados/mídias existentes. Portanto, qualquer afirmação sobre o estado operacional desses componentes é explicitamente marcada como não verificada.

## C. Arquitetura de segurança observada

- Next.js 15 com Route Handlers e Server Actions.
- Auth.js/NextAuth com Google e credenciais locais.
- Firebase Admin SDK no servidor.
- Firestore organizado por `workspaces/{workspaceId}/...` para dados financeiros.
- Regras de Firestore e Storage negam acesso direto do cliente; o acesso esperado passa pelo servidor.
- Associação efetiva é conferida no documento atual do workspace por `checkIsWorkspaceMember`.
- `workspaceIds` presente na sessão é tratado como dica de interface, não como autoridade.
- Imagens de bancos são gravadas por workspace e servidas por URL assinada curta.
- Comprovantes financeiros ainda são representados por URL HTTP(S) fornecida pelo cliente.

## D. Modelo de ameaça

Atacantes considerados:

- usuário não autenticado;
- usuário autenticado sem associação ao workspace;
- membro ativo tentando executar ações de proprietário;
- membro removido com sessão antiga;
- proprietário ou destinatário concorrendo operações de convite;
- cliente malicioso que altera `workspaceId`, IDs relacionados ou campos protegidos;
- usuário autenticado tentando amplificar leituras/gravações e custo;
- pessoa que conhece ou adivinha o e-mail de um convidado.

Ativos prioritários:

- dados financeiros e metadados pessoais;
- associação e propriedade dos workspaces;
- convites e identidade dos destinatários;
- comprovantes e imagens;
- disponibilidade e orçamento Firestore/Storage;
- integridade de auditoria e revogação.

Fronteiras de confiança:

- browser → aplicação Next.js;
- sessão Auth.js → autorização da API;
- aplicação → Firebase Admin/Firestore/Storage;
- aplicação → URLs externas de comprovantes;
- pipeline/configuração → runtime de produção.

## E. Matriz de autorização esperada e resultado

| Operação | Proprietário | Membro ativo | Removido/externo | Resultado atual |
|---|---:|---:|---:|---|
| Ler dados financeiros | Sim | Sim | Não | Conforme |
| Criar/editar/excluir lançamentos | Sim | Sim | Não | Conforme na API |
| Administrar membros | Sim | Não | Não | Conforme |
| Criar/cancelar convites | Sim | Não | Não | Conforme quanto ao papel; há corridas de estado |
| Aceitar convite válido do próprio e-mail | Sim | Sim | Não | **Não conforme: e-mail local não é verificado** |
| Alterar proprietário/papéis | Somente operação explícita autorizada | Não | Não | Nenhuma transferência genérica encontrada |
| Excluir workspace | Sim | Não | Não | Operação não encontrada |
| Acessar após remoção | Não | Não | Não | Conforme: associação atual é relida |
| Usar referência de outro workspace | Não | Não | Não | Conforme nos fluxos financeiros auditados |
| Acessar arquivo privado | Sim | Sim | Não | Conforme para ícones novos; não conforme para comprovantes externos |

## F. Achados detalhados

### SEC-R001 — Conta com e-mail não verificado pode tomar convite da vítima

**Severidade:** Crítica  
**Confiança:** Confirmada por fluxo de código  
**CWE:** CWE-287 (autenticação imprópria), CWE-345 (verificação insuficiente de autenticidade)

**Evidência**

- `app/actions/register-action.ts:23-79` aceita qualquer e-mail sintaticamente válido e cria imediatamente usuário e senha, sem desafio por e-mail e sem `emailVerified`.
- `app/lib/auth.ts:49-87` autentica a conta local por e-mail/senha e devolve esse e-mail à sessão.
- `app/lib/invitations.ts:15-24` autoriza o destinatário comparando somente o e-mail normalizado da sessão com `inviteeEmail`.
- `app/lib/invitations.ts:50-58` concede associação ao workspace ao usuário que passou nessa comparação.

**Cenário de exploração**

1. O atacante cadastra `vitima@empresa.com` com uma senha controlada por ele.
2. Um proprietário envia convite para `vitima@empresa.com`, antes ou depois desse cadastro.
3. O atacante entra na conta local e aceita o convite.
4. A transação o adiciona como membro, permitindo leitura, criação, alteração e exclusão de dados financeiros.

O atacante não precisa controlar a caixa postal. Conhecer o e-mail e obter um convite pendente é suficiente. A consulta prévia de unicidade reduz alguns cenários após a vítima já ter conta, mas não protege cadastro antecipado e também possui corrida própria.

**Impacto:** quebra de isolamento entre tenants, exposição e alteração de dados financeiros e persistência como membro legítimo.

**Correção recomendada**

- introduzir verificação de e-mail de uso único e curta validade para credenciais;
- manter a conta sem privilégios de convite até `emailVerifiedAt` ser confirmado no servidor;
- na aceitação, reler o usuário dentro da transação e exigir e-mail verificado igual ao destinatário;
- invalidar/reavaliar convites aceitos por contas locais não verificadas;
- considerar vincular o convite a um token secreto enviado à caixa postal, além do ID público;
- registrar evento de segurança e notificar proprietário/destinatário após aceite.

**Teste de regressão obrigatório:** conta não verificada com e-mail idêntico recebe 403; após verificação válida recebe sucesso; token de verificação não pode ser reutilizado.

### SEC-R002 — Comprovantes podem usar URLs externas permanentes e contornar revogação

**Severidade:** Alta  
**Confiança:** Confirmada  
**CWE:** CWE-284, CWE-639

**Evidência**

- `app/types/financial.ts:49-56` permite qualquer URL `http` ou `https`.
- `app/types/financial.ts:72,94,153,173` expõe `proofUrl` nos esquemas de criação e atualização.
- rotas de débitos e créditos persistem o valor fornecido pelo cliente.
- não foi encontrado fluxo privado de upload/download/delete para comprovantes.

**Impacto:** o arquivo não é isolado pelo workspace; uma URL pública, permanente ou hospedada por terceiro continua acessível após remoção do membro ou logout. A política de revogação não pode ser aplicada.

**Correção recomendada:** aceitar upload binário validado, armazenar em caminho aleatório sob o workspace, persistir somente `proofPath`, servir por endpoint autenticado ou URL assinada de poucos minutos e apagar conforme a permissão do lançamento. Bloquear novos `proofUrl` externos e migrar os existentes.

### SEC-R003 — Unicidade de e-mail no cadastro não é atômica

**Severidade:** Média  
**Confiança:** Confirmada por análise de concorrência  
**CWE:** CWE-367

**Evidência:** `app/actions/register-action.ts:40-79` consulta por e-mail, cria referências aleatórias e só depois grava um batch. Duas requisições concorrentes podem observar ausência e criar dois usuários com o mesmo e-mail.

**Impacto:** login e resolução de identidade tornam-se ambíguos; convites podem ser associados a uma das contas duplicadas; recuperação e futura vinculação OAuth ficam inseguras.

**Correção recomendada:** usar chave canônica determinística/índice de identidade (`emailIdentities/{hashDoEmailNormalizado}`) criada em transação com precondição de inexistência. Definir uma normalização única e tratar Unicode antes da validação.

### SEC-R004 — Criação e cancelamento de convites possuem corridas de estado

**Severidade:** Média  
**Confiança:** Confirmada por análise de concorrência  
**CWE:** CWE-362

**Evidência**

- a criação consulta convites pendentes e depois cria documento com ID aleatório, fora de uma garantia de unicidade;
- `app/api/invitations/[invitationId]/route.ts:18-42` lê `pending` e atualiza para `cancelled` fora de transação;
- o aceite é transacional, mas não compartilha uma precondição atômica com o cancelamento externo.

**Cenários:** duas criações concorrentes geram convites válidos duplicados; após remoção, um convite duplicado pode readicionar o usuário. Cancelamento concorrente ao aceite pode deixar associação efetiva com convite marcado como cancelado.

**Correção recomendada:** chave determinística por workspace+destinatário ou documento de trava; criar, reenviar, cancelar e aceitar em transações com leitura e atualização da mesma versão; ao aceitar, conferir que não existe revogação/tombstone posterior.

### SEC-R005 — Consultas ilimitadas e refresh de resumo permitem amplificação de custo

**Severidade:** Média  
**Confiança:** Confirmada  
**CWE:** CWE-770

**Evidência**

- listagens de débitos e créditos só aplicam `limit` quando o cliente envia valor positivo; a omissão retorna toda a coleção filtrada;
- `app/api/workspaces/[workspaceId]/summary/route.ts:26-40` permite a qualquer membro usar `refresh=true`, ler todos os débitos/créditos do período e escrever o resumo;
- endpoints financeiros, analytics e summary não têm quota distribuída por usuário/workspace/IP;
- o limitador de login/cadastro/convites é indexado principalmente por identidade informada, que pode ser variada pelo atacante.

**Impacto:** aumento deliberado de leituras/gravações Firestore, latência, indisponibilidade e custo financeiro.

**Correção recomendada:** paginação obrigatória com limite máximo, proibir refresh arbitrário ou restringi-lo a job/owner, invalidação incremental do resumo nas mutations, limites por usuário+workspace e proteção por IP no edge/WAF, quotas e alertas de orçamento.

### SEC-R006 — Dependências de produção contêm advisories conhecidos

**Severidade:** Média  
**Confiança:** Confirmada para versões instaladas; exploração remota não demonstrada  
**CWE:** CWE-1104

`pnpm audit --prod --json` reportou **7 críticas, 26 altas, 16 moderadas e 2 baixas** na árvore de produção. A dependência direta `next-auth@5.0.0-beta.27` está abaixo da versão corrigida `5.0.0-beta.32` para advisories publicados em julho de 2026. Também há achados transitivos em componentes usados por Firebase Admin/Google Cloud.

O bypass por checagem `!!auth` do GHSA-8fpg-xm3f-6cx3 é mitigado neste código porque `auth.config.ts` exige `auth?.user`, que é o workaround indicado pelo mantenedor. O advisory de múltiplos provedores OAuth não atende às precondições observadas, pois há somente um provedor OAuth. O uso direto de `getToken()` vulnerável não foi encontrado. Essas mitigações reduzem a explorabilidade imediata, mas não justificam manter a versão vulnerável.

**Correção recomendada:** atualizar no mínimo para `next-auth@5.0.0-beta.32` ou estável compatível, atualizar Firebase Admin/SDK e executar testes completos. Gerar SBOM e bloquear CI para vulnerabilidades altas/críticas alcançáveis.

### SEC-R007 — CSP permite `unsafe-inline` e `unsafe-eval`

**Severidade:** Baixa  
**Confiança:** Confirmada  
**CWE:** CWE-693

`next.config.mjs` define CSP, porém `script-src` inclui `'unsafe-inline'` e `'unsafe-eval'`. Nenhum sink XSS direto foi confirmado, mas esses valores reduzem significativamente a contenção caso uma injeção apareça.

**Correção recomendada:** remover `unsafe-eval` em produção e migrar scripts inline para nonce/hash, mantendo política distinta para desenvolvimento se necessário.

### SEC-R008 — Segredo de pseudonimização possui fallback conhecido

**Severidade:** Baixa  
**Confiança:** Confirmada  
**CWE:** CWE-798

`app/lib/observability.ts` usa `development-only-observability-secret` quando `OBSERVABILITY_HASH_SECRET` não está definido. Os logs não expõem IDs crus, mas em produção o fallback torna a pseudonimização determinística e conhecida.

**Correção recomendada:** falhar a inicialização em produção sem segredo aleatório, rotacionável e separado de outros segredos; documentar retenção e acesso aos logs.

## G. Controles corrigidos e validados estaticamente

1. **Revogação imediata:** `checkIsWorkspaceMember` ignora a lista antiga da sessão e relê `workspaces/{id}`.
2. **Remoção de membro:** a rota revalida proprietário e atualiza workspace/usuário em transação.
3. **Owner-only:** administração de membros e convites confere `ownerId` no servidor.
4. **Aceite único:** o aceite usa transação, exige `pending`, verifica expiração e impede replay do mesmo convite.
5. **Referências cruzadas:** bancos, cartões, categorias e responsáveis são resolvidos sob o workspace da operação antes da gravação.
6. **Campos protegidos:** `workspaceId`, `ownerId`, `members`, `role` e `userId` relevante são derivados no servidor nos fluxos auditados.
7. **Acesso direto:** `firestore.rules` e `storage.rules` negam leituras e gravações do cliente.
8. **Ícones bancários:** MIME, tamanho e assinatura mágica são validados; o caminho contém workspace e nome aleatório; a URL assinada dura cinco minutos.
9. **Headers:** HSTS, anti-framing, `nosniff`, referrer policy, permissions policy e `no-store` para API estão configurados.
10. **Segredos no Git:** não foram encontrados arquivos de segredo rastreados além do modelo `.env.example`.

## H. Testes e evidências de execução

| Verificação | Resultado |
|---|---|
| Estado Git | limpo antes da geração deste relatório; `main` igual a `origin/main` em `e41736c` |
| TypeScript | aprovado |
| ESLint | aprovado |
| Auditoria de dependências | 7 críticas, 26 altas, 16 moderadas, 2 baixas em produção |
| Suíte Firestore/Storage Emulator | tentativa atual inconclusiva: inicializou emuladores e dados, mas não concluiu/produziu sumário; não contabilizada como aprovação |
| Teste contra produção | não executado |

A suíte existente cobre associação atual, revogação com claim antiga, e-mail divergente, expiração, aceite concorrente, replay, limitador distribuído, migração de URL e negação direta do Storage. Ela **não cobre** comprovação de propriedade do e-mail, criação concorrente de convite, cancelamento concorrente, comprovantes nem amplificação de custo. Esses casos precisam ser acrescentados.

O build completo depende de configuração Firebase válida durante a geração de páginas; a validação de compilação foi coberta por TypeScript, mas um artefato de produção não foi certificado nesta reauditoria.

## I. Plano de remediação priorizado

### P0 — antes de qualquer publicação

1. Verificação de e-mail obrigatória e server-side para aceitar convite.
2. Bloqueio transacional da unicidade de e-mail e saneamento das duplicatas existentes.
3. Revogação/revisão de membros adicionados por contas locais sem e-mail verificado.
4. Comprovantes em Storage privado com autorização atual a cada acesso.

### P1 — antes de habilitar workspaces compartilhados amplamente

1. Transações/idempotência para todo o ciclo de convites.
2. Paginação obrigatória e rate limit/quotas em summary, analytics e coleções financeiras.
3. Upgrade de Auth.js e dependências Firebase, seguido de nova auditoria de dependências.
4. Testes de integração com as matrizes de concorrência e abuso.

### P2 — hardening operacional

1. CSP por nonce/hash sem `unsafe-eval`.
2. Segredo obrigatório de observabilidade.
3. Verificação de IAM, regras realmente implantadas, CORS do bucket, WAF, alertas e orçamento.
4. Migração dos `iconUrl` legados em produção e rotação da chave de assinatura, se aplicável.
5. Inventário e expiração de comprovantes/URLs já persistidos.

## J. Checklist de publicação

- [ ] Cadastro local só produz identidade convidável após e-mail verificado.
- [ ] Unicidade de e-mail comprovada sob concorrência.
- [ ] Aceite exige usuário atual, e-mail verificado, convite pendente e não expirado na mesma transação.
- [ ] Criação/cancelamento/aceite concorrentes possuem testes determinísticos.
- [ ] Nenhum comprovante depende de URL pública/permanente.
- [ ] Listagens têm limite obrigatório e cursores validados.
- [ ] Refresh de resumo não pode ser abusado por membro.
- [ ] Dependências críticas/altas alcançáveis foram eliminadas.
- [ ] Suíte de emuladores conclui sem hangs e cobre a política completa.
- [ ] Configuração de produção, IAM e regras implantadas foram revisadas.
- [ ] Cache do cliente é limpo no logout e na perda de acesso.
- [ ] Migração de dados legados concluída e evidenciada.
- [ ] Monitoramento, quotas e alertas de orçamento estão ativos.

## K. Conclusão

O núcleo de autorização por workspace está substancialmente melhor: IDs conhecidos não bastam para acesso, claims antigas não preservam associação e as referências principais são confinadas ao workspace. Entretanto, a cadeia de confiança do convite começa em uma identidade de e-mail que o cadastro local não comprova. Isso transforma um controle aparentemente correto — igualdade de e-mail — em um bypass de isolamento de impacto crítico.

Até que SEC-R001 e SEC-R002 sejam corrigidos e validados dinamicamente, a garantia esperada pela política não é atendida. A recomendação formal desta reauditoria é **não liberar workspaces compartilhados em produção**.
