# Prompt de implementação — Resend e módulo de notificações

Você é uma IA de engenharia de software trabalhando no repositório **MeControla.AI**. Implemente, valide e documente um sistema completo de e-mail transacional com Resend e notificações internas. Não entregue apenas um plano: faça as alterações no código, execute os testes e apresente evidências. Preserve mudanças preexistentes do usuário.

## 1. Contexto obrigatório

Antes de editar qualquer arquivo:

1. Leia `SECURITY_REAUDIT.md`, `firestore.rules`, `storage.rules`, `.env.example`, `auth.config.ts`, `app/lib/auth.ts`, `app/lib/invitations.ts` e as rotas relacionadas a workspaces, membros e convites.
2. Leia `components.json`, `app/globals.css`, `app/components/app-sidebar.tsx`, `app/components/nav-user.tsx`, `app/components/mobile-nav.tsx`, `app/components/invitations-banner.tsx` e os componentes existentes em `app/components/ui`.
3. Se o skill shadcn estiver disponível, use-o. Obtenha o contexto do projeto e consulte a documentação dos componentes antes de adicioná-los. Use o package runner indicado pelo projeto.
4. Inspecione a versão atual das dependências e as APIs oficiais mais recentes do Resend e React Email. Não suponha APIs pela memória.
5. Execute `git status` e não sobrescreva alterações não relacionadas.

Arquitetura atual relevante:

- Next.js App Router, React 19 e TypeScript estrito.
- Auth.js com Google e credenciais.
- Firebase Admin/Firestore no servidor.
- TanStack React Query no cliente.
- shadcn/ui estilo `new-york`, base Radix, Tailwind v4, CSS variables e Lucide.
- Feedback efêmero com Sonner.
- Autorização de workspace sempre confirmada no servidor.
- Contas locais começam com `emailVerified: null` e não podem processar convites até verificar o endereço.

## 2. Resultado esperado

Entregar um subsistema reutilizável que:

- verifica o e-mail de contas locais;
- envia convites de workspace por e-mail;
- cria notificações in-app persistentes;
- permite marcar como lida, marcar todas como lidas e excluir/arquivar quando aplicável;
- oferece preferências por categoria e canal;
- processa e-mails de forma assíncrona, idempotente e observável;
- trata webhooks de entrega, bounce, complaint e suppression do Resend;
- preserva isolamento de workspace, revogação e privacidade;
- funciona bem em desktop e mobile e segue o design atual.

## 3. Decisões de produto

### 3.1 Canais

Cada evento pode gerar:

- `in_app`: persistente dentro da plataforma;
- `email`: mensagem transacional pelo Resend;
- ambos.

Não use e-mail para toda mutation financeira. Evite fadiga e custo. Eventos de segurança, acesso e colaboração têm prioridade. Eventos financeiros rotineiros ficam inicialmente apenas in-app ou em resumo configurável.

### 3.2 Eventos obrigatórios

Implemente inicialmente estes tipos estáveis:

| Evento | Destinatário | In-app | E-mail | Pode desativar? |
|---|---|---:|---:|---:|
| `account.email_verification_requested` | próprio usuário | não | sim | não |
| `account.email_verified` | próprio usuário | sim | opcional | não |
| `workspace.invitation_created` | convidado | após identificação da conta | sim | não |
| `workspace.invitation_accepted` | proprietário | sim | sim | sim |
| `workspace.invitation_rejected` | proprietário | sim | opcional | sim |
| `workspace.invitation_cancelled` | convidado identificado | sim | opcional | sim |
| `workspace.member_removed` | membro removido | sim antes da revogação ou global por usuário | sim | não |
| `workspace.member_joined` | demais membros | sim | não por padrão | sim |
| `security.password_changed` | próprio usuário | sim | sim | não |
| `security.email_changed` | endereço antigo e novo | sim | sim | não |
| `workspace.debit_created` | membros exceto autor | sim | não por padrão | sim |
| `workspace.credit_created` | membros exceto autor | sim | não por padrão | sim |
| `workspace.goal_reached` | membros ativos | sim | sim | sim |

Se algum fluxo, como alteração de senha/e-mail, ainda não existir, prepare o tipo e o template apenas se isso não aumentar desnecessariamente o escopo; documente como evento futuro.

### 3.3 Eventos recomendados para fase seguinte

- lançamento relevante alterado ou excluído;
- aporte em meta compartilhada;
- meta próxima do prazo;
- resumo semanal/mensal opt-in;
- falha recorrente no processamento de uma automação financeira;
- tentativa sensível bloqueada, sem expor dados que auxiliem o atacante.

## 4. Modelo de dados

Adapte nomes se a convenção encontrada no repositório exigir, mantendo as propriedades de segurança abaixo.

### 4.1 Notificações in-app

Preferência recomendada: coleção global por usuário, porque uma notificação de remoção precisa continuar visível depois que o usuário perde acesso ao workspace.

```ts
users/{userId}/notifications/{notificationId} {
  type: NotificationType
  category: 'account' | 'security' | 'workspace' | 'financial' | 'goals'
  title: string
  body: string
  actorUserId: string | null
  workspaceId: string | null
  resourceType: string | null
  resourceId: string | null
  actionUrl: string | null
  dedupeKey: string
  createdAt: Timestamp
  readAt: Timestamp | null
  archivedAt: Timestamp | null
  expiresAt: Timestamp | null
}
```

Regras:

- o servidor define `userId`, `workspaceId`, tipo, destinatários, URLs e metadados;
- `actionUrl` deve ser uma rota interna relativa e validada, nunca URL arbitrária;
- textos não podem conter saldo, valor financeiro ou dados pessoais desnecessários;
- `dedupeKey` deve impedir duplicação do mesmo evento por destinatário;
- notificações de workspace só podem incluir recursos do mesmo workspace;
- para notificações históricas após revogação, a mensagem pode ser lida, mas o link deve falhar fechado e preferencialmente ser omitido/invalidado.

### 4.2 Preferências

```ts
users/{userId}/notificationSettings/preferences {
  emailEnabled: boolean
  inAppEnabled: boolean
  categories: {
    workspace: { email: boolean; inApp: boolean }
    financial: { email: boolean; inApp: boolean }
    goals: { email: boolean; inApp: boolean }
  }
  digestFrequency: 'off' | 'daily' | 'weekly'
  timezone: string
  updatedAt: Timestamp
}
```

Eventos obrigatórios de segurança, verificação e revogação ignoram opt-out. O usuário nunca pode desabilitar mensagens necessárias para proteger a conta.

### 4.3 Outbox de e-mail

Não chame o Resend dentro de uma transação Firestore nem antes de a mutation principal confirmar. Grave uma outbox durável:

```ts
_emailOutbox/{jobId} {
  eventId: string
  type: EmailTemplateType
  recipientUserId: string | null
  toNormalized: string
  templateData: Record<string, unknown>
  dedupeKey: string
  status: 'pending' | 'processing' | 'sent' | 'failed' | 'suppressed'
  attempts: number
  availableAt: Timestamp
  leaseUntil: Timestamp | null
  providerMessageId: string | null
  lastErrorCode: string | null
  createdAt: Timestamp
  updatedAt: Timestamp
  expiresAt: Timestamp
}
```

Nunca armazene token de verificação em claro na outbox ou logs. Caso o token precise chegar ao renderer, limite o ciclo de vida do job, proteja o documento exclusivamente no Admin SDK e remova/redija os dados sensíveis após envio.

## 5. Verificação de e-mail

Implemente o fluxo completo para contas de credenciais.

1. Gere 32 bytes com `crypto.randomBytes` e codifique como base64url.
2. Armazene apenas SHA-256 do token.
3. Validade recomendada: 30 minutos.
4. Um novo pedido invalida tokens anteriores do mesmo usuário/e-mail.
5. Limite reenvio por usuário e por endereço: no máximo 1/minuto e 5/hora. Se houver proxy confiável, acrescente limite por IP no edge; não confie cegamente em `x-forwarded-for` sem configuração documentada.
6. A resposta de recuperação/reenvio não deve revelar se um e-mail está cadastrado.
7. O endpoint de confirmação usa transação e exige token existente, não utilizado, não expirado e e-mail atual igual ao e-mail do token.
8. Grave `emailVerified` como timestamp compatível com Auth.js e marque o token como utilizado na mesma transação.
9. Não autentique automaticamente uma sessão diferente apenas por conhecer o token.
10. Após sucesso, invalide/refresque a sessão de forma segura e permita processar convites.

Modelo sugerido:

```ts
_emailVerifications/{tokenHash} {
  userId: string
  normalizedEmail: string
  expiresAt: Timestamp
  usedAt: Timestamp | null
  createdAt: Timestamp
}
```

Adicione página `/verify-email` com estados: aguardando, enviando, enviado, verificando, sucesso, expirado e erro. Permita reenvio com cooldown visível. Contas Google com e-mail verificado não precisam desse fluxo.

## 6. Integração com Resend

Use SDK oficial do Resend e React Email, seguindo a documentação atual.

Variáveis esperadas:

```env
RESEND_API_KEY=
EMAIL_FROM="MeControla.AI <conta@notificacoes.exemplo.com>"
EMAIL_REPLY_TO="suporte@exemplo.com"
APP_URL="https://app.exemplo.com"
RESEND_WEBHOOK_SECRET=
EMAIL_WORKER_SECRET=
```

Requisitos:

- validar configuração no servidor e falhar claramente em produção;
- nunca importar cliente Resend em Client Components;
- aceitar somente `APP_URL` configurada e HTTPS em produção;
- enviar versão HTML e texto simples;
- definir `replyTo` quando apropriado;
- usar idempotency key/dedupeKey suportada pelo provedor;
- desabilitar tracking de abertura/clique em e-mails de autenticação e segurança;
- não registrar API key, token, link completo, corpo ou destinatário em texto puro;
- mascarar/hash de destinatários na observabilidade;
- separar remetente transacional em subdomínio com SPF, DKIM e DMARC;
- documentar que não se deve criar dois registros SPF no mesmo hostname.

Crie uma abstração como `app/lib/email/provider.ts`, uma implementação Resend e uma implementação fake/in-memory para testes. O domínio de notificações não deve depender diretamente do SDK do provedor.

## 7. Processamento assíncrono e confiabilidade

Implemente um worker compatível com o ambiente de implantação encontrado. Se não houver fila gerenciada:

- use Route Handler protegido por segredo constante e comparação timing-safe;
- adquira jobs em transação com lease curto;
- processe lote limitado;
- use retry exponencial com jitter;
- defina máximo de tentativas e dead-letter/falha final;
- recupere leases abandonados;
- torne cada envio idempotente;
- não permita que o cliente invoque envio para destinatário arbitrário;
- documente como agendar o worker no provedor de hospedagem.

Não trate um `200` do Resend como entrega final. Registre `providerMessageId` e processe webhooks autenticados para atualizar entrega, bounce, complaint e suppression.

No webhook:

- valide assinatura com o segredo oficial;
- rejeite timestamp fora da tolerância recomendada;
- persista o ID do evento do provedor para impedir replay;
- responda rapidamente e faça trabalho pesado de forma assíncrona;
- marque endereço como suprimido em bounce permanente/complaint;
- nunca aceite `userId` ou `workspaceId` do payload como autorização.

## 8. Serviço de notificações

Crie uma API de domínio central, por exemplo:

```ts
publishNotificationEvent({
  type,
  actorUserId,
  workspaceId,
  resource,
  recipients,
  data,
  dedupeKey,
})
```

O chamador informa o fato ocorrido; o serviço decide templates, canais, preferências e destinatários. Não espalhe chamadas diretas ao Resend pelas rotas.

Ao derivar destinatários:

- releia associação atual no servidor;
- não confie em `workspaceIds` da sessão;
- exclua o autor quando o evento assim exigir;
- confirme que IDs relacionados pertencem ao workspace;
- em remoção, capture o destinatário antes da mutation e grave a notificação global na mesma unidade lógica;
- não deixe falha de e-mail desfazer uma mutation financeira válida; a outbox é quem garante retry.

## 9. APIs in-app

Implemente no mínimo:

- `GET /api/notifications?limit=&cursor=&unreadOnly=`;
- `GET /api/notifications/unread-count` ou incorpore a contagem na primeira resposta;
- `PATCH /api/notifications/:id/read`;
- `POST /api/notifications/read-all`;
- `DELETE /api/notifications/:id` ou arquivamento equivalente;
- `GET/PATCH /api/notification-settings`;
- endpoints de solicitar/reenviar/confirmar verificação;
- webhook Resend;
- worker da outbox.

Requisitos das APIs:

- autenticação server-side em toda rota privada;
- documento sempre sob o usuário autenticado;
- paginação obrigatória, cursor validado e máximo de 50;
- esquemas Zod com limites de tamanho;
- `Cache-Control: private, no-store`;
- rate limiting em mutations e verificação;
- respostas sem stack trace ou detalhes do provedor;
- operações em lote limitadas;
- contagem de não lidas eficiente, sem varrer coleção ilimitada a cada render.

## 10. Design da experiência in-app

Siga estritamente o design existente:

- shadcn/ui `new-york`, Radix, Tailwind v4 e Lucide;
- cores semânticas (`bg-background`, `text-muted-foreground`, `border-border`, `text-primary`), sem cores cruas;
- `gap-*`, nunca `space-x-*`/`space-y-*` em código novo;
- use `size-*` para dimensões iguais;
- use `cn()` para classes condicionais;
- use componentes existentes antes de criar markup customizado;
- use Sonner para confirmação efêmera, não como substituto da central persistente;
- todo `Avatar` precisa de `AvatarFallback`;
- ícones em `Button` usam `data-icon` e não recebem tamanho manual;
- menus precisam usar seus grupos; Dialog/Sheet precisam de título acessível;
- loading com `Skeleton`/`Spinner`, vazio com o componente de empty state do projeto, erro com o componente de error state.

### 10.1 Central de notificações

Adicione um botão de sino com contador não lido:

- desktop: integrado à área de navegação/usuário sem competir com o seletor de workspace;
- mobile: ação acessível no `MobileNav` ou em Sheet apropriado;
- badge deve mostrar `9+` quando exceder nove;
- nome acessível: “Notificações, N não lidas”;
- indicador não deve depender apenas de cor.

Ao abrir:

- use `Popover` no desktop e `Sheet` no mobile se isso combinar com os padrões existentes;
- cabeçalho “Notificações”, contador e ação “Marcar todas como lidas”;
- lista em `ScrollArea`, agrupada em “Hoje”, “Esta semana” e “Anteriores”;
- item com ícone por categoria, título, resumo, tempo relativo, indicador de não lida e menu de ações;
- clique marca como lida e só navega para `actionUrl` validada;
- suporte a teclado, foco visível e screen reader;
- atualização otimista com rollback via React Query;
- polling moderado ou atualização por foco; não introduza listener Firestore direto se ele contornar a arquitetura server-side.

Crie também uma página completa, por exemplo `/notifications`, para histórico paginado e filtros “Todas”/“Não lidas”. Use componentes shadcn disponíveis; se Tabs não estiver instalado, consulte a documentação e adicione pelo CLI.

### 10.2 Preferências

Adicione uma seção “Notificações” nas configurações do usuário:

- Card completo com título, descrição e conteúdo;
- switches por canal/categoria;
- eventos obrigatórios aparecem desabilitados com explicação;
- frequência de resumo com Select;
- timezone detectado, mas salvo explicitamente;
- estados de salvamento e falha acessíveis;
- não misture preferências pessoais com configurações owner-only do workspace.

### 10.3 E-mails

Use React Email e mantenha a identidade visual da plataforma sem depender de CSS externo:

- logotipo textual “MeControla.AI” e cor primária compatível;
- largura legível, tipografia segura e botão de ação destacado;
- texto claro em português do Brasil;
- endereço do link também visível em texto quando for autenticação;
- rodapé com motivo do recebimento e suporte;
- modo escuro não é obrigatório, mas deve degradar bem;
- nunca incluir saldo, valores, descrição de lançamentos, chave Pix ou outros dados financeiros sensíveis;
- templates devem renderizar corretamente em mobile e fornecer texto simples.

Templates mínimos:

1. `VerifyEmail` — assunto “Confirme seu e-mail no MeControla.AI”.
2. `WorkspaceInvitation` — informa quem convidou, nome do workspace, permissões de membro e expiração.
3. `InvitationAccepted`.
4. `MemberRemoved`.
5. `SecurityAlert` genérico para eventos de conta.

## 11. Convites e segurança

Integre o e-mail sem enfraquecer as correções existentes:

- somente owner cria/cancela/reenvia convite;
- convite continua pendente, expirável, atômico e single-use;
- aceitar exige sessão, usuário atual, e-mail verificado e e-mail normalizado correspondente;
- conhecer `invitationId` não concede acesso;
- prefira incluir no e-mail um token secreto separado, armazenando apenas seu hash;
- a página do link não revela dados do workspace antes da autenticação correta;
- reenvio rotaciona token, respeita cooldown e não duplica convite concorrente;
- cancelamento invalida imediatamente token/link;
- aceite concorrente tem exatamente um sucesso;
- convite duplicado não pode readicionar membro removido sem nova ação explícita do owner.

## 12. Migrações e compatibilidade

- crie script idempotente e com dry-run para dados necessários;
- não marque contas locais antigas como verificadas automaticamente;
- preserve `emailVerified` já válido de contas Google/Auth.js;
- faça backfill de preferências com defaults seguros apenas sob demanda ou em lotes limitados;
- defina política TTL para tokens, eventos de webhook, outbox e notificações expiradas;
- documente índices Firestore requeridos;
- mantenha regras de Firestore/Storage negando acesso direto do cliente, salvo decisão explícita e auditada — a preferência é continuar via API server-side.

## 13. Testes obrigatórios

Adicione testes unitários e de integração com Firebase Emulator/fake do provedor cobrindo:

### Identidade

- conta local não verificada não aceita convite;
- token válido verifica uma única vez;
- token expirado, utilizado ou de outro e-mail falha;
- dois consumos concorrentes têm um sucesso;
- reenvio invalida token anterior;
- rate limit de reenvio funciona;
- resposta não enumera contas.

### Notificações

- isolamento entre usuários e workspaces;
- membro removido não lê recursos antigos, mas recebe aviso global de remoção;
- cliente não escolhe destinatário, tipo privilegiado ou URL externa;
- dedupe impede duplicata;
- paginação e contagem de não lidas;
- marcar uma/todas como lida só afeta o usuário autenticado;
- preferências desabilitam eventos opcionais e não desabilitam segurança.

### E-mail/outbox

- mutation principal confirma mesmo se provedor estiver indisponível;
- retry, lease expirado, máximo de tentativas e idempotência;
- nenhuma chamada real ao Resend nos testes;
- webhook com assinatura inválida/replay é rejeitado;
- bounce permanente gera suppression;
- logs não contêm e-mail puro, token ou API key;
- templates HTML e texto renderizam e passam snapshot/asserções essenciais.

### UI

- sino e contador acessíveis;
- estados loading/empty/error;
- interação por teclado;
- comportamento responsivo de Popover/Sheet;
- atualização otimista com rollback;
- preferências e eventos obrigatórios.

Amplie `scripts/security-emulator-suite.ts` sem remover os testes existentes.

## 14. Observabilidade e operação

Registre eventos estruturados com request ID e identificadores pseudonimizados:

- notificação criada/deduplicada;
- job adquirido/enviado/reagendado/falho/suprimido;
- webhook aceito/rejeitado/repetido;
- verificação solicitada/concluída/falha por categoria, nunca pelo token.

Inclua métricas úteis: tamanho da fila, idade do job mais antigo, taxa de envio, bounce, complaint, retries e falhas finais. Documente alertas recomendados e um runbook curto para API key inválida, DNS não verificado, aumento de bounce e fila parada.

## 15. Ordem de implementação

1. Tipos, normalização, configuração e provider fake/Resend.
2. Tokens transacionais de verificação e endpoints.
3. Outbox, worker, retry e webhooks.
4. Serviço central de eventos e notificações in-app.
5. Integração com convites e membership.
6. APIs de leitura/preferências.
7. Central visual, página completa e configurações.
8. Templates React Email.
9. Migrações, índices, TTL, documentação e testes.
10. Reauditoria específica de autenticação, autorização, concorrência, SSRF/open redirect, segredos e privacidade.

## 16. Critérios de aceite

A implementação só está concluída quando:

- uma conta local consegue solicitar e confirmar e-mail com token single-use;
- uma conta não verificada continua impedida de aceitar convites;
- convite cria e-mail via outbox e notificação adequada sem bloquear a API;
- o sino mostra contagem correta, lista paginada e ações de leitura;
- desktop e mobile seguem os componentes/tokens existentes;
- preferências funcionam sem permitir opt-out de alertas obrigatórios;
- e-mails usam domínio configurável, React Email, HTML e texto;
- webhook é autenticado, idempotente e trata suppression;
- nenhum segredo ou token aparece no cliente, Firestore legível pelo cliente ou logs;
- isolamento e revogação atuais permanecem intactos;
- TypeScript, lint dos arquivos alterados, build e testes passam;
- a matriz Emulator passa integralmente e inclui os casos novos;
- `.env.example` e documentação de DNS/Resend/deploy estão atualizados;
- `git diff --check` passa e o working tree contém apenas mudanças do escopo.

## 17. Entrega final esperada da IA

Ao terminar, informe:

1. resumo do comportamento entregue;
2. arquivos principais alterados;
3. modelo de dados, índices e TTL necessários;
4. variáveis de ambiente e configuração DNS/deploy;
5. testes executados e resultados exatos;
6. limitações ou itens que dependem de credenciais/infraestrutura externa;
7. riscos residuais e recomendação de release;
8. passos manuais para conectar a conta Resend sem revelar a API key.

Não faça push, deploy, alteração de DNS, criação de conta externa ou envio real para usuários sem autorização explícita do proprietário.
