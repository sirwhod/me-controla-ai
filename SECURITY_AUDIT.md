# Auditoria de segurança — me-controla-ai

Data: 2026-08-28  
Escopo: análise estática local, sem acesso ao Firebase/produção e sem alteração de dados.  
Política de referência: política de segurança para workspaces compartilhados fornecida pelo proprietário.

## A. Veredito executivo

**Avaliação geral: risco crítico.** Foram registrados **10 achados: 1 crítico, 3 altos, 4 médios, 2 baixos/informativos**.

Os três maiores riscos são: (1) membros removidos continuam autorizados por uma lista de `workspaceIds` congelada no JWT; (2) o fluxo de convites permite que qualquer membro convide usuários e permite aceitar novamente convites já usados/cancelados, sem transação condicional; (3) arquivos são publicados por URLs assinadas válidas até 2500, impedindo revogação efetiva.

**O isolamento entre workspaces não é confiável.** A estrutura de subcoleções evita muitos IDORs diretos, mas o controle central aceita associação obsoleta da sessão. Um ex-membro com cookie ainda válido consegue ler e alterar todo recurso financeiro do workspace removido.

**Não é seguro publicar a aplicação no estado atual.** SEC-001, SEC-002, SEC-003 e SEC-004 devem ser corrigidos e cobertos por testes antes de produção.

## B. Modelo de ameaças

| Ator | Capacidade | Alvo | Possível impacto | Controle existente |
|---|---|---|---|---|
| Não autenticado/bot | Chamar registro e autenticação repetidamente | Contas, Firestore, disponibilidade | Enumeração, brute force, custo | Auth.js e Zod; sem rate limit observado |
| Usuário autenticado comum | Alterar IDs e corpos HTTP | Workspaces alheios | IDOR e acesso financeiro | `auth()` + `checkIsWorkspaceMember` vulnerável a sessão obsoleta |
| Membro ativo | Executar todos os handlers do workspace | Convites, membros, finanças | Escalada vertical e exposição de e-mails | Owner check apenas em remoção/cancelamento |
| Proprietário | Administrar workspace | Membros e dados | Exclusão/alteração legítima ou conta comprometida | Sessão JWT; sem reautenticação em ação crítica observada |
| Usuário convidado | Conhecer invitationId e usar sua conta | Convite/workspace | Replay e associação indevida | E-mail é comparado, mas status/expiração não |
| Membro removido | Reutilizar cookie/JWT anterior | Todo o workspace | Leitura e mutation após revogação | Falha: JWT é aceito como fonte de autorização |
| Atacante com IDs | Trocar workspaceId/documentId/referências | Dados financeiros | Acesso cruzado e corrupção | Subcoleções limitam IDOR; associação atual não é sempre consultada |
| Atacante com URL vazada | Reutilizar URL assinada | Arquivos/imagens | Leitura até 2500 após revogação | Nenhum controle por requisição após assinatura |
| Navegador comprometido | Roubar sessão/URLs e repetir requests | Conta e dados | Comprometimento integral da sessão | Cookies do Auth.js presumidos; atributos precisam validação dinâmica |
| Código público/segredo vazado | Reconhecer projeto e endpoints | Firebase Admin | Comprometimento amplo se a service account vazar | Segredos em env; nenhum segredo real versionado observado |

## C. Superfície de ataque

| Área | Entrada | Limite de confiança | Proteção atual | Risco |
|---|---|---|---|---|
| Auth.js | OAuth Google, credentials, cookies | Navegador → Auth.js | JWT assinado, bcrypt | Alto: stale claims, linking perigoso, sem rate limit |
| Route Handlers | URL, query, JSON, multipart | Navegador → Next.js → Admin SDK | `auth()`, Zod parcial | Crítico: autorização aceita JWT desatualizado |
| Server Actions | Objetos serializados | React/browser → servidor | `auth()`/Zod quando aplicável | Médio: registro sem rate limit/atomicidade de e-mail |
| Firestore Admin | IDs e dados derivados de requests | Next.js → Firestore | Autorização implementada na aplicação | Alto: rules não protegem Admin |
| Firestore cliente | SDK Firebase, caso habilitado | Navegador → Firestore | `firestore.rules` | Alto potencial: membro pode escrever qualquer subcoleção/campo |
| Storage | Multipart e URL assinada | Browser → Next.js → Storage; URL → Google | MIME/tamanho; assinatura duradoura | Alto |
| Frontend/cache | React Query e páginas autenticadas | Servidor/API → browser | Sem política explícita de purge/cache observada | Médio |

## D. Achados

### [SEC-001] Revogação de membro é ignorada por autorização baseada em JWT obsoleto

- **Severidade:** Crítico
- **Confiança:** Confirmada
- **CWE:** CWE-613 (Insufficient Session Expiration), CWE-863 (Incorrect Authorization)
- **OWASP:** A01:2021 Broken Access Control
- **Arquivo e linha:** `app/api/utils/check-is-workspace-member.ts:16-19`; `app/lib/auth.ts:122-166`; `app/api/workspaces/[workspaceId]/members/route.ts:123-139`; `app/api/workspaces/route.ts:20-34`
- **Componente ou endpoint:** Todos os endpoints sob `/api/workspaces/{workspaceId}/...` e `GET /api/workspaces`
- **Pré-condições:** Atacante foi membro, recebeu JWT contendo o workspace e depois foi removido.
- **Evidência:** `checkIsWorkspaceMember` retorna `true` imediatamente se o ID estiver na lista da sessão; o documento atual nem é lido. A remoção atualiza Firestore, mas não invalida o JWT. O callback só recarrega workspaces quando a lista está vazia e aceita atualização da lista enviada pela sessão.
- **Caminho de exploração:** membro autentica → JWT contém W → owner remove membro → cookie antigo chama qualquer rota de W → linha 17 retorna `true` → Firebase Admin lê/escreve ignorando rules.
- **Impacto:** Confidencialidade e integridade completas de débitos, créditos, bancos, cartões, categorias, responsáveis, metas, contribuições, membros e arquivos enquanto a sessão for válida.
- **Dados afetados:** Todos os dados financeiros e pessoais do workspace removido.
- **Cenário reproduzível:** Em emulador, autenticar U2 como membro de W; guardar cookie; U1 remove U2; com o cookie antigo executar `GET /api/workspaces/W/debits` e `POST /api/workspaces/W/credits`. Hoje ambos passam a autorização.
- **Correção recomendada:** Tornar o documento atual do workspace (ou registro de membership ativo/versionado) a fonte obrigatória em toda operação. Remover o fast-path por `workspaceIds`. Opcionalmente manter cache server-side de curtíssima duração com invalidation atômica. Adicionar `membershipVersion`/`sessionVersion` comparado ao banco e invalidar sessões ao remover membro.
- **Teste de regressão:** Após remoção, o mesmo cookie deve receber 403 em toda leitura/mutation e `GET /api/workspaces` não deve retornar W.
- **Risco da correção:** Uma leitura extra por request; mitigar com desenho de membership eficiente, não com claims sem revogação.

### [SEC-002] Membro comum pode criar convites

- **Severidade:** Alto
- **Confiança:** Confirmada
- **CWE:** CWE-862 (Missing Authorization)
- **OWASP:** A01 Broken Access Control
- **Arquivo e linha:** `app/api/workspaces/[workspaceId]/invitations/route.ts:24-32,74-86`
- **Componente ou endpoint:** `POST /api/workspaces/{workspaceId}/invitations`
- **Pré-condições:** Membro ativo (ou removido com sessão antiga).
- **Evidência:** O handler exige somente `isMember`; não compara `ownerId` com o usuário antes de criar o convite.
- **Caminho de exploração:** membro envia `{email:"terceiro@..."}` → convite pending é criado em nome dele → terceiro aceita e ganha acesso financeiro.
- **Impacto:** Escalada vertical, compartilhamento não autorizado de todo o workspace.
- **Dados afetados:** Workspaces, membros e todo dado financeiro acessível ao novo membro.
- **Cenário reproduzível:** Como U2 membro de W pertencente a U1, enviar POST para a rota; observar 201 e invitationId.
- **Correção recomendada:** Buscar W no servidor e exigir `ownerId === session.user.id` imediatamente antes da criação; registrar auditoria; implementar reenvio/cancelamento como operações owner-only.
- **Teste de regressão:** membro recebe 403; owner recebe 201; usuário removido recebe 403.
- **Risco da correção:** Pode interromper comportamento atual permissivo, conforme exigido pela política.

### [SEC-003] Convites aceitos/rejeitados sem estado, expiração ou transação condicional

- **Severidade:** Alto
- **Confiança:** Confirmada
- **CWE:** CWE-367 (TOCTOU), CWE-294 (Authentication Bypass by Capture-replay)
- **OWASP:** A01 Broken Access Control, A04 Insecure Design
- **Arquivo e linha:** `app/api/invitations/route.ts:50-89`; modelo sem expiração em `app/types/financial.ts:395-411`
- **Componente ou endpoint:** `POST /api/invitations`
- **Pré-condições:** Sessão com e-mail do destinatário e ID de qualquer convite anterior desse e-mail.
- **Evidência:** O handler compara e-mail, mas não exige `status === pending`, não verifica cancelamento/expiração e faz leitura seguida de batch; o batch não condiciona a atualização ao estado lido. Convite aceito pode ser aceito novamente. Convite cancelado é apagado, mas não existe estado/expiração uniforme.
- **Caminho de exploração:** usar invitationId aceito/rejeitado → `action=accept` → membership é adicionada novamente; duas requisições concorrentes passam pela mesma leitura.
- **Impacto:** Reentrada após remoção, quebra de revogação, corrida e inconsistência de auditoria.
- **Dados afetados:** Membership, workspace e documento do usuário.
- **Cenário reproduzível:** Em emulador, aceitar convite; owner remove usuário; repetir exatamente o POST com o mesmo ID; usuário é readicionado.
- **Correção recomendada:** Usar `runTransaction`; dentro dela reler convite e workspace, exigir `pending`, `expiresAt > now`, e-mail normalizado exato e workspace existente; trocar estado e membership no mesmo commit. Manter cancelado/consumido como tombstone e impedir replay.
- **Teste de regressão:** segundo aceite, aceite expirado/cancelado/rejeitado e duas aceitações concorrentes devem produzir no máximo um sucesso.
- **Risco da correção:** Necessidade de índice/limpeza de convites antigos e tratamento explícito de estados legados.

### [SEC-004] URLs de arquivos praticamente permanentes contornam revogação

- **Severidade:** Alto
- **Confiança:** Confirmada para ícones bancários; provável para futuros comprovantes que reutilizem o helper
- **CWE:** CWE-200 (Exposure of Sensitive Information), CWE-525 (Use of Web Browser Cache Containing Sensitive Information)
- **OWASP:** A01 Broken Access Control
- **Arquivo e linha:** `app/lib/firebase.ts:47-55`; `app/api/workspaces/[workspaceId]/banks/route.ts:130-151`; `storage.rules:5-7`
- **Componente ou endpoint:** Storage/bank icons; helper de download
- **Pré-condições:** Obter a URL por resposta, log, histórico ou compartilhamento.
- **Evidência:** URL V4 é assinada com validade até 2500; depois de emitida, a aplicação não revalida membership. As rules também declaram leitura pública em caminho diferente (`banks/...`), enquanto o upload usa `bank_icons/...`.
- **Caminho de exploração:** membro obtém URL → é removido → continua usando URL diretamente sem passar pelo Next.js.
- **Impacto:** Revogação impossível e exposição persistente; seria grave para comprovantes/documentos sensíveis.
- **Dados afetados:** Imagens atuais; qualquer arquivo futuro que use o helper.
- **Cenário reproduzível:** Gerar ícone no emulador/projeto de teste, remover membership e realizar GET da mesma URL.
- **Correção recomendada:** Armazenar apenas path; servir via endpoint autenticado que checa membership atual e emite URL de minutos, ou faz streaming privado. Comprovantes devem residir sob prefixo de workspace não público. Implementar exclusão autorizada e purge de cache.
- **Teste de regressão:** URL expira rapidamente; endpoint retorna 403 após remoção; URL anterior deixa de funcionar dentro da janela definida.
- **Risco da correção:** Migração de URLs existentes e possível aumento de tráfego do backend/CDN privado.

### [SEC-005] Regras do Firestore permitem a qualquer membro escrever qualquer campo/subcoleção

- **Severidade:** Médio (Alto se o SDK cliente for habilitado em produção)
- **Confiança:** Provável/configuração fraca; não foi encontrado uso atual do SDK cliente
- **CWE:** CWE-284 (Improper Access Control), CWE-915 (Mass Assignment)
- **OWASP:** A01 Broken Access Control
- **Arquivo e linha:** `firestore.rules:19-21,24-35`; dependência cliente em `package.json:40`
- **Componente ou endpoint:** Firestore direto
- **Pré-condições:** Cliente autenticado via Firebase Auth e acesso ao SDK/projeto.
- **Evidência:** Membro tem `read, write` irrestrito em toda subcoleção; usuário pode atualizar seu próprio `workspaceIds`; não há allowlist de campos, validação de referências ou bloqueio de `userId/workspaceId/role/status`.
- **Caminho de exploração:** cliente direto escreve campos administrativos/falsos em subcoleção. Rules não protegem chamadas Admin e tampouco garantem a política se acesso direto for ativado.
- **Impacto:** Corrupção de integridade e bypass das validações da API.
- **Dados afetados:** Todas as subcoleções do workspace e documento do usuário.
- **Cenário reproduzível:** No Rules Emulator, como membro, tentar criar `workspaces/W/debits/X` com `userId` de terceiro e `workspaceId` divergente; a regra atual permite.
- **Correção recomendada:** Se backend-only, negar tudo no Firestore ao cliente. Se acesso direto for necessário, regras específicas por coleção/ação, `diff().affectedKeys()`, owner checks e invariantes de workspace/autor.
- **Teste de regressão:** suíte `@firebase/rules-unit-testing` com owner/member/outro/revogado e campos administrativos.
- **Risco da correção:** Pode quebrar acesso direto não documentado; inventariar telemetria antes do deploy.

### [SEC-006] Integridade referencial é parcial e IDs inexistentes são aceitos

- **Severidade:** Médio
- **Confiança:** Confirmada
- **CWE:** CWE-20 (Improper Input Validation)
- **OWASP:** A04 Insecure Design
- **Arquivo e linha:** `app/api/workspaces/[workspaceId]/debits/route.ts:142-175`; `app/api/workspaces/[workspaceId]/debits/[debitId]/route.ts:114-150`; `app/api/workspaces/[workspaceId]/credits/route.ts:133-160`; `app/types/financial.ts:65-71,147-153`
- **Componente ou endpoint:** Criação/edição de débitos e créditos
- **Pré-condições:** Membro autorizado.
- **Evidência:** As referências são pesquisadas corretamente dentro do workspace (bom isolamento), porém documento inexistente não causa rejeição: o ID controlado continua sendo persistido com metadados vazios. Em update de débito, cartão inexistente também não é rejeitado.
- **Caminho de exploração:** enviar IDs aleatórios ou deletados → API retorna sucesso → registros quebrados/inconsistentes.
- **Impacto:** Corrupção de relatórios e vínculos; confused-deputy futuro se código assumir validade.
- **Dados afetados:** Débitos, créditos, bancos/cartões/categorias/responsáveis referenciados.
- **Cenário reproduzível:** POST de débito com `bankId`, `categoryId` e `responsibleId` inexistentes; observar criação bem-sucedida.
- **Correção recomendada:** Validar todos os IDs presentes com `getAll` no caminho do mesmo workspace e retornar 400/422 se qualquer um não existir; validar coerência cartão→banco.
- **Teste de regressão:** IDs de outro workspace e inexistentes devem falhar sem escrita.
- **Risco da correção:** Dados legados inválidos precisarão limpeza/migração.

### [SEC-007] `userId` de metas é controlável pelo cliente e não precisa ser membro

- **Severidade:** Médio
- **Confiança:** Confirmada
- **CWE:** CWE-639 (Authorization Bypass Through User-Controlled Key)
- **OWASP:** A01 Broken Access Control
- **Arquivo e linha:** `app/types/financial.ts:324-343`; `app/api/workspaces/[workspaceId]/goals/route.ts:88-107`; `app/api/workspaces/[workspaceId]/goals/[goalId]/route.ts:95-123`
- **Componente ou endpoint:** POST/PATCH de metas
- **Pré-condições:** Membro ativo.
- **Evidência:** Schemas aceitam qualquer string em `userId`; create e patch persistem o valor sem confirmar membership atual.
- **Caminho de exploração:** membro envia ID de vítima externa e cria/reatribui meta a ela.
- **Impacto:** Falsificação de autoria/atribuição, vazamento ou efeitos futuros vinculados à vítima.
- **Dados afetados:** Metas e identidade de usuários.
- **Cenário reproduzível:** POST/PATCH com um userId existente que não pertence ao workspace; observar sucesso.
- **Correção recomendada:** Derivar `userId` da sessão, ou, se atribuição é requisito, aceitar somente IDs de membros ativos e restringir reatribuição ao owner.
- **Teste de regressão:** membro externo é rejeitado; campos administrativos extras são descartados/rejeitados.
- **Risco da correção:** Ajuste de UX e migração de metas atribuídas incorretamente.

### [SEC-008] Ausência de rate limiting e limites uniformes favorece brute force e denial-of-wallet

- **Severidade:** Médio
- **Confiança:** Confirmada quanto à ausência no repositório; capacidade real depende da borda de produção
- **CWE:** CWE-307, CWE-770
- **OWASP:** A04 Insecure Design
- **Arquivo e linha:** `app/lib/auth.ts:48-81`; `app/actions/register-action.ts:22-74`; `app/api/workspaces/[workspaceId]/responsibles/route.ts:36-63,90-114`; `app/api/workspaces/[workspaceId]/debits/route.ts:13-60`; middleware cobre apenas autenticação em `middleware.ts:6-13`
- **Componente ou endpoint:** Login, registro e APIs de listagem/criação
- **Pré-condições:** Acesso HTTP; para APIs financeiras, uma conta válida.
- **Evidência:** Nenhum rate limiter, quota, paginação geral ou limite de body foi encontrado. Algumas listagens leem coleções completas e enriquecem com leituras adicionais. Parcelamentos estão limitados a 120, o que é positivo.
- **Caminho de exploração:** repetir login/registro/listagens e `includeBalances=true`; gerar leituras e custo Firebase.
- **Impacto:** Brute force, enumeração, indisponibilidade e denial-of-wallet.
- **Dados afetados:** Disponibilidade e custos; contas por tentativa de senha.
- **Cenário reproduzível:** Em staging, disparar taxa baixa e controlada e observar ausência de 429/quota.
- **Correção recomendada:** Rate limit distribuído por IP+conta+workspace, quotas por operação, paginação com cursor e limites máximos; limites no proxy para JSON/multipart; monitorar leituras por usuário/endpoint.
- **Teste de regressão:** excedente recebe 429/Retry-After e não atinge Firestore.
- **Risco da correção:** Falsos positivos atrás de NAT; usar chaves compostas e limites diferenciados.

### [SEC-009] Upload confia no MIME fornecido pelo cliente

- **Severidade:** Baixo
- **Confiança:** Confirmada
- **CWE:** CWE-434 (Unrestricted Upload of File with Dangerous Type)
- **OWASP:** A04 Insecure Design
- **Arquivo e linha:** `app/api/workspaces/[workspaceId]/banks/route.ts:91-140`
- **Componente ou endpoint:** Upload de imagem de banco
- **Pré-condições:** Membro autorizado.
- **Evidência:** Tamanho, nome aleatório e allowlist MIME existem; magic bytes/decodificação real não. Buffer inteiro é carregado em memória. Tipos ativos como SVG/HTML são bloqueados, reduzindo impacto.
- **Caminho de exploração:** enviar conteúdo arbitrário com `Content-Type: image/png`; objeto é armazenado como imagem.
- **Impacto:** Conteúdo poliglota/malformado, consumo de memória e risco em consumidores futuros.
- **Dados afetados:** Storage e disponibilidade do processo de upload.
- **Cenário reproduzível:** Em staging, enviar texto com MIME PNG e observar sucesso.
- **Correção recomendada:** Detectar assinatura, decodificar e reencodar imagem, impor dimensões/pixels, timeout e limite na borda; considerar scanning.
- **Teste de regressão:** MIME falso e imagem inválida são rejeitados; JPEG/PNG/WebP reais passam.
- **Risco da correção:** Custo de CPU e perda de metadados; executar em pipeline limitado.

### [SEC-010] Hardening web e autenticação incompletos

- **Severidade:** Baixo/Informativo
- **Confiança:** Confirmada para CSP/headers; configuração dinâmica de cookies não comprovada
- **CWE:** CWE-693, CWE-1390
- **OWASP:** A05 Security Misconfiguration, A07 Identification and Authentication Failures
- **Arquivo e linha:** `next.config.mjs:18-49`; `auth.config.ts:5,13-18`; `app/lib/auth.ts:64-70`
- **Componente ou endpoint:** Headers e Auth.js
- **Pré-condições:** Varia conforme vetor.
- **Evidência:** Há HSTS, frame deny, nosniff, referrer e permissions policy (positivo), mas não CSP. Google usa `allowDangerousEmailAccountLinking: true`. Erro distinto revela conta Google; registro revela e-mail já existente. Não há controles locais de força bruta.
- **Caminho de exploração:** Enumeração de e-mail e, caso outro provider seja adicionado/configurado incorretamente, linking por e-mail; ausência de CSP amplia impacto de XSS futuro.
- **Impacto:** Privacidade e defesa em profundidade; risco de takeover depende da garantia de e-mail do provider.
- **Dados afetados:** Conta/sessão.
- **Cenário reproduzível:** Comparar respostas de registro/login para e-mail existente/ausente; inspecionar resposta e confirmar ausência de `Content-Security-Policy`.
- **Correção recomendada:** Respostas uniformes, rate limit; revisar/remover linking perigoso ou permitir só provider com `email_verified`; implantar CSP com nonce e `object-src 'none'`, `base-uri 'self'`, `frame-ancestors 'none'`.
- **Teste de regressão:** Sem enumeração observável; CSP validada em build; cookies Secure/HttpOnly/SameSite confirmados em produção.
- **Risco da correção:** CSP pode bloquear scripts/imagens legítimos; começar em Report-Only.

## E. Matriz de autorização

| Recurso/ação | Não autenticado | Membro | Proprietário | Outro workspace | Proteção observada |
|---|---:|---:|---:|---:|---|
| Workspace/listar | Negado | Permitido | Permitido | Deveria negar | **Falha:** confia em JWT obsoleto |
| Dados financeiros/ler | Negado | Permitido | Permitido | Deveria negar | Subcoleção + check vulnerável a revogação |
| Lançamentos/criar-editar-excluir | Negado | Permitido | Permitido | Deveria negar | Conforme papel, mas stale JWT quebra isolamento |
| Bancos/cartões/categorias/responsáveis CRUD | Negado | Permitido | Permitido | Deveria negar | Conforme política ampla; stale JWT |
| Metas/aportes CRUD | Negado | Permitido | Permitido | Deveria negar | Meta aceita userId arbitrário |
| Membros/listar | Negado | Permitido | Permitido | Deveria negar | Expõe e-mail e convites a membros; stale JWT |
| Membro/remover | Negado | Negado | Permitido | Negado | Owner check atual; atualização não transacional |
| Proprietário/remover/transferir | Negado | Negado | Não implementado | Negado | Owner é bloqueado contra remoção; transferência ausente |
| Convite/criar | Negado | **Permitido indevidamente** | Permitido | Deveria negar | Apenas member check |
| Convite/cancelar | Negado | Permitido se inviter | Permitido | Negado | Diverge: política exige owner-only |
| Convite/aceitar | Negado | Destinatário | Destinatário | ID não deveria bastar | E-mail checado; status/expiração/atomicidade falham |
| Arquivo/ler | URL dispensa sessão | URL dispensa sessão | URL dispensa sessão | URL dispensa workspace | Assinatura até 2500 |
| Arquivo/excluir | Não observado | Não observado | Não observado | Não observado | Fluxo administrativo incompleto |
| Workspace/excluir/configuração crítica | Não implementado | Não implementado | Não implementado | Não implementado | Sem superfície observada para validar |

## F. Inventário dos endpoints

Legenda: `M*` = membership aceita JWT obsoleto; `O` = owner consultado no servidor; `Z` = Zod; `P` = validação manual/parcial. Nenhuma rota possui rate limit observado.

| Método | Endpoint | Autenticação | Autorização | Validação | Rate limit | Risco |
|---|---|---|---|---|---|---|
| GET | `/api/auth/[...nextauth]` | Auth.js | N/A | Auth.js | Não | Médio |
| POST | `/api/auth/[...nextauth]` | Auth.js | N/A | Auth.js/providers | Não | Médio |
| GET | `/api/workspaces` | Sim | JWT workspaceIds | P | Não | Crítico |
| GET | `/api/invitations` | Sim/e-mail | Próprio e-mail | P | Não | Médio |
| POST | `/api/invitations` | Sim/e-mail | Destinatário, estado falho | P | Não | Alto |
| DELETE | `/api/invitations/{invitationId}` | Sim | Owner ou inviter | P | Não | Médio |
| POST | `/api/workspaces/{workspaceId}/invitations` | Sim | M* (deveria O) | Z | Não | Alto |
| GET | `/api/workspaces/{workspaceId}/members` | Sim | M* | Params P | Não | Alto |
| DELETE | `/api/workspaces/{workspaceId}/members` | Sim | O | Body P | Não | Médio |
| GET/POST | `/api/workspaces/{workspaceId}/banks` | Sim | M* | Query P / Z+multipart | Não | Alto |
| GET/PUT/PATCH/DELETE | `/api/workspaces/{workspaceId}/banks/{bankId}` | Sim | M* | Z em mutation | Não | Alto |
| GET/POST | `/api/workspaces/{workspaceId}/cards` | Sim | M* | Z em POST | Não | Alto |
| GET/PATCH/DELETE | `/api/workspaces/{workspaceId}/cards/{cardId}` | Sim | M* | Z em PATCH | Não | Alto |
| GET/POST | `/api/workspaces/{workspaceId}/categories` | Sim | M* | Z; JSON/multipart | Não | Alto |
| GET/PUT/PATCH/DELETE | `/api/workspaces/{workspaceId}/categories/{categoryId}` | Sim | M* | Z em mutation | Não | Alto |
| GET/POST | `/api/workspaces/{workspaceId}/responsibles` | Sim | M* | Query P / Z | Não | Alto |
| GET/PATCH/DELETE | `/api/workspaces/{workspaceId}/responsibles/{responsibleId}` | Sim | M* | Query P / Z | Não | Alto |
| GET/POST | `/api/workspaces/{workspaceId}/credits` | Sim | M* | Query P / Z | Não | Alto |
| GET/PUT/PATCH/DELETE | `/api/workspaces/{workspaceId}/credits/{creditId}` | Sim | M* | Z em mutation | Não | Alto |
| GET/POST | `/api/workspaces/{workspaceId}/debits` | Sim | M* | Query P / Z | Não | Alto |
| GET/PUT/PATCH/DELETE | `/api/workspaces/{workspaceId}/debits/{debitId}` | Sim | M* | Z em mutation | Não | Alto |
| GET/POST | `/api/workspaces/{workspaceId}/goals` | Sim | M* | Query P / Z | Não | Alto |
| GET/PUT/PATCH/DELETE | `/api/workspaces/{workspaceId}/goals/{goalId}` | Sim | M* | Z em mutation | Não | Alto |
| GET/POST | `/api/workspaces/{workspaceId}/goals/{goalId}/contributions` | Sim | M* | Z em POST | Não | Alto |

Server Actions: `createWorkspaceAction` autentica e valida por Zod (`app/actions/workspace-actions.ts:21-71`); `registerAction` é público, valida por Zod, mas não tem rate limit e a unicidade por e-mail é check-then-create não transacional (`app/actions/register-action.ts:22-74`).

## G. Segredos e configuração

- Nenhum valor de segredo real foi exibido ou encontrado em arquivo versionado. `git ls-files` mostrou apenas `.env.example`; os valores ali são placeholders (`.env.example:5-26`).
- Tipos de segredo esperados: segredo Auth.js, OAuth client secret e credencial Firebase Admin (`auth.config.ts:15-16`, `app/lib/firebase.ts:8-32`). Rotação **não indicada por evidência no repositório**; validar histórico completo e plataforma de deploy.
- `firebaseCert` é criado no módulo server-side e o módulo falha ao ser carregado no browser (`app/lib/firebase.ts:1-3,28-45`), controle positivo. Recomenda-se também `import 'server-only'` para prevenção de bundle em build.
- `.firebaserc:3` expõe apenas o project ID `data-grana`, que não é segredo, mas ajuda reconhecimento.
- `trustHost: true` (`auth.config.ts:5`) exige proxy/host allowlist corretamente configurado; validar em produção.
- O script de teste contém credenciais fixas de teste e as imprime (`scripts/test-suite.ts:57-61,959-962`). Não são credenciais de produção, mas não devem ser reutilizadas; o guard de ambiente em `scripts/test-suite.ts:41-49` é positivo.

## H. Dependências

Versões instaladas no lockfile incluem Next 15.5.24, NextAuth 5.0.0-beta.27, axios 1.19.0, Firebase 11.7.1, Firebase Admin 13.3.0 e Zod 3.24.4 (`pnpm-lock.yaml:1927,2442-2446,3013-3035,3762`). O lockfile está presente e pnpm é o gerenciador.

**Vulnerabilidade instalada:** não comprovada. `pnpm audit --prod` tentou acessar `registry.npmjs.org`, mas foi bloqueado por EACCES/restrição de rede e não devolveu advisories. Não é correto inferir CVE apenas da versão.

**Alcançabilidade:** não avaliada por advisory pela limitação acima. NextAuth beta aumenta risco operacional/manutenção, mas não é por si só uma vulnerabilidade comprovada.

**Verificações locais:** `pnpm exec tsc --noEmit` não iniciou porque `tsc`/dependências não estão instalados no workspace. Nenhum pacote foi instalado ou atualizado.

## I. Plano de remediação

| Prioridade | Achado | Arquivos | Correção | Esforço | Como validar |
|---|---|---|---|---|---|
| P0 | SEC-001 | check helper, auth, todas APIs | Membership atual obrigatória; invalidar/versionar sessões | M | Matriz 2 usuários/2 workspaces + cookie antigo |
| P0 | SEC-002 | invitations route | Owner-only consultado no servidor | P | Membro 403, owner 201 |
| P0 | SEC-003 | invitation accept | Máquina de estados + expiresAt + transaction | M | Replay/concorrência/expiração |
| P0 | SEC-004 | firebase helper, upload/storage | Paths privados + URLs curtas/stream autenticado | M/G | Remoção revoga leitura de arquivo |
| P1 | SEC-005 | firestore.rules | Backend-only deny ou regras por coleção/campo | M | Emulator rules tests |
| P1 | SEC-006 | debit/credit routes | Existência/coerência obrigatória de referências | M | IDs inexistentes/cruzados falham sem escrita |
| P1 | SEC-007 | goal schemas/routes | Derivar userId ou validar membership/owner | P | User externo rejeitado |
| P1 | SEC-008 | edge/middleware/APIs | Rate limits, quotas, paginação e body limits | M/G | 429 antes de Firestore + load test controlado |
| P1 | SEC-009 | upload | Magic bytes, decode/reencode e pixel cap | M | Corpus de uploads maliciosos |
| P2 | SEC-010 | next config/auth | CSP, respostas uniformes, revisar linking | M | CSP report-only e testes de enumeração |

## J. Checklist para produção

- [ ] Autenticação: cookies Secure/HttpOnly/SameSite e duração/rotação conferidos no domínio real.
- [ ] Autenticação: brute force, enumeração e linking de contas testados.
- [ ] Autorização: toda rota consulta membership atual; owner-only centralizado.
- [ ] Autorização: testes com 2 usuários, 2 workspaces, membro removido e IDs conhecidos.
- [ ] Firestore: confirmar que clientes não acessam diretamente ou implantar regras específicas testadas no emulator.
- [ ] Storage: bucket privado; comprovantes por workspace; URL curta e revogável; autorização de delete.
- [ ] Integridade: todas as referências e campos administrativos derivados/validados no servidor.
- [ ] Segredos: secret scan no histórico; IAM least privilege; rotação se algum segredo real tiver sido versionado.
- [ ] Headers: CSP, HSTS, nosniff, frame-ancestors, referrer e permissions policy validados.
- [ ] Rate limiting: login, registro, convites, listagens, uploads e batch com quotas/429.
- [ ] Cache: `Cache-Control: private, no-store` para respostas financeiras; React Query limpo em logout/revogação/troca.
- [ ] Monitoramento: trilha de auditoria de memberships/convites e correlação sem dados sensíveis.
- [ ] Alertas: leituras/gravações/custos anômalos, 401/403/429 e falhas de autenticação.
- [ ] Backups: política, retenção, restauração testada e separação de acesso.
- [ ] Logs: sem tokens, cookies, URLs assinadas, payloads financeiros ou credenciais.
- [ ] Dependências: audit/SCA em CI, lockfile congelado, advisories triados por alcançabilidade.
- [ ] Testes: CSRF, XSS armazenado, upload, métodos inesperados, payload grande, valores extremos e concorrência.

## K. Itens não comprovados

1. **IAM Firebase/Admin:** validar no Google Cloud Console se a service account possui somente Firestore/Storage necessários, sem Owner/Editor; exportar política redigida para revisão.
2. **Rules efetivamente publicadas:** comparar hashes/versões do Console com `firestore.rules` e `storage.rules`; testar em emulator antes de deploy.
3. **Acesso direto pelo cliente:** verificar métricas/audit logs e bundles de produção; nenhum import cliente foi encontrado no código atual.
4. **Cookies Auth.js e CSRF:** capturar headers em staging HTTPS e validar `Secure`, `HttpOnly`, `SameSite`, prefixo e rotação; testar POST cross-site sem usar contas reais.
5. **Proteção de borda:** conferir Vercel/Cloudflare/WAF por rate limit, body limit, bot management e host allowlist. A ausência no repo não prova ausência na infraestrutura.
6. **CORS/cache/CDN:** inspecionar respostas reais autenticadas e confirmar ausência de cache compartilhado e CORS permissivo.
7. **Storage público e objetos existentes:** executar inventário de ACL/tokens no bucket sem baixar conteúdo; revogar/migrar URLs antigas em janela controlada.
8. **Segredos no histórico e deploy:** executar secret scanner no histórico Git completo e revisar variáveis no provedor, reportando apenas tipo/local/rotação.
9. **Dependências/CVEs:** executar `pnpm audit --prod --json` e SCA com acesso ao registry; correlacionar cada advisory com imports/caminhos alcançáveis.
10. **Build/typecheck:** instalar exatamente o lockfile em CI isolada (`pnpm install --frozen-lockfile`), rodar typecheck/lint/build; não foi possível localmente sem dependências.
11. **Revogação de conta/sessão:** testar usuário desativado/removido no provider e observar se JWT existente permanece aceito.
12. **Backups, retenção, alertas e logs:** revisar Console/observabilidade sem expor conteúdo financeiro.

## Plano de testes de segurança reproduzível

Usar somente Firebase Emulator e uma instância local/staging sem dados reais. Criar U1(owner)/W1 e U2(owner)/W2; adicionar U2 como membro de W1 e preservar o cookie anterior à remoção. Para cada endpoint do inventário, executar: anônimo (401), membro ativo (conforme matriz), owner, outro workspace (403), membro removido com cookie antigo (403). Repetir trocando todos os IDs de documento e todas as referências internas.

Casos adicionais obrigatórios: payload com `ownerId/members/workspaceId/userId/role`; convite de outro e-mail, aceito, rejeitado, cancelado, expirado e duas aceitações simultâneas; valores negativos/NaN/Infinity/extremos; 121 parcelas; JSON/multipart acima do limite; MIME falso e arquivo poliglota; XSS em nomes/descrições; URL `http(s)` maliciosa; POST cross-site; métodos inesperados; rajada controlada até 429. Cada teste deve verificar também que **nenhuma escrita parcial** ocorreu.

## Controles positivos observados

- Firebase Admin está isolado em módulo server-side (`app/lib/firebase.ts:1-3`).
- Entidades são armazenadas em subcoleções do workspace, reduzindo IDOR por ID de documento isolado.
- A maioria das mutations usa Zod; valores financeiros e parcelas possuem limites (`app/types/financial.ts:58-79,139-155`).
- Referências são buscadas sob o workspace da rota, evitando associação direta a subcoleções de outro tenant.
- Remoção do owner é explicitamente bloqueada (`app/api/workspaces/[workspaceId]/members/route.ts:107-120`).
- Cabeçalhos HSTS, frame deny, nosniff, referrer e permissions policy existem (`next.config.mjs:18-49`).
- Upload usa nome aleatório, allowlist de MIME e limite de 5 MB (`app/api/workspaces/[workspaceId]/banks/route.ts:115-138`).
- O script destrutivo de teste possui bloqueio para emulator/projeto explicitamente não produtivo (`scripts/test-suite.ts:41-49`).

## Apêndice — estado da remediação em 2026-08-28

As correções desta rodada foram implementadas, mas este documento preserva os achados originais como registro da auditoria.

| Achado | Estado após a correção | Evidência principal |
|---|---|---|
| SEC-001 | Corrigido no código | Membership sempre relida do Firestore; JWT é apenas hint de UI |
| SEC-002 | Corrigido | Criação/cancelamento de convite exige owner atual |
| SEC-003 | Corrigido para novos convites | Expiração de 7 dias, estados finais e transaction condicional; convites legados sem `expiresAt` são rejeitados |
| SEC-004 | Corrigido para novos uploads | Path privado persistido e URL assinada por 5 minutos; URLs legadas exigem migração/rotação operacional |
| SEC-005 | Corrigido | Rules backend-only agora negam todo acesso cliente |
| SEC-006 | Corrigido nas criações e atualizações financeiras | Helper valida existência dentro do workspace antes da escrita |
| SEC-007 | Corrigido | `userId` de metas é derivado exclusivamente da sessão |
| SEC-008 | Parcial | Limite local em registro/convites e no-store nas APIs; rate limit distribuído e paginação continuam tarefa de infraestrutura/P1 |
| SEC-009 | Corrigido no escopo atual | Magic bytes JPEG/PNG/WebP, MIME, tamanho e nome aleatório |
| SEC-010 | Endurecido | Linking perigoso removido e CSP adicionada; CSP com nonce e validação dinâmica de cookies continuam P2 |

Validação executada: TypeScript `--noEmit` passou; ESLint em `app/api`, `app/actions`, `app/lib` e `auth.config.ts` passou; `git diff --check` passou. O build compilou e validou tipos, mas a coleta de páginas parou porque as credenciais Firebase não estão disponíveis neste ambiente (`project_id` ausente), sem indicar erro de código nas mudanças.

Segunda rodada operacional: o limitador foi substituído por transações distribuídas no Firestore, com chaves SHA-256 e TTL lógico. Foi criada uma migração dry-run/idempotente com bloqueio de escrita fora de Emulator/projeto de teste. A matriz foi executada contra Firestore e Storage Emulator no projeto isolado `demo-me-controla-ai`: **16 de 16 casos passaram**, incluindo concorrência/replay, revogação, dry-run/apply da migração e negação de leitura direta de objeto existente. O procedimento está em `docs/security-operations.md`.
