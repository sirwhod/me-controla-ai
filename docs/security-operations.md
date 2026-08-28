# Operações de segurança

## Rate limiting distribuído

O limitador usa transações na coleção administrativa `_securityRateLimits`. As chaves são hashes SHA-256; e-mails e IDs não são persistidos no nome do documento.

Em produção, configure uma política TTL do Firestore para o campo `expiresAt` dessa coleção. A ausência de TTL não permite bypass, mas acumula documentos expirados.

Escopos atualmente protegidos:

- `credentials-login`: 10 tentativas por e-mail normalizado a cada 15 minutos;
- `register`: 5 tentativas por e-mail normalizado a cada 15 minutos;
- `invite`: 20 convites por proprietário/workspace a cada hora.

O Firestore é fail-closed: se a transação do limitador falhar, a operação protegida não prossegue. Mantenha também limites por IP/WAF na borda para absorver tráfego antes de chegar ao Firestore.

## Migração de URLs legadas

O comando é dry-run por padrão:

```powershell
pnpm security:migrate-storage:dry-run
```

Ele lista somente contagens e nunca imprime URLs. São elegíveis apenas URLs HTTPS de `storage.googleapis.com` cujo objeto esteja sob `bank_icons/`.

Aplicação:

```powershell
pnpm security:migrate-storage:apply
```

`--apply` é bloqueado, exceto quando:

- `FIRESTORE_EMULATOR_HOST` está definido; ou
- `ALLOW_STORAGE_URL_MIGRATION=true` e `FIREBASE_PROJECT_ID` contém `test`, `dev`, `demo` ou `local`.

Para produção, revise primeiro o dry-run e execute a migração por uma ferramenta operacional aprovada. O bloqueio intencional do script deve ser removido ou ampliado somente em uma mudança separada e explicitamente autorizada. Depois da migração dos documentos, URLs assinadas antigas já distribuídas continuam válidas até a rotação/revogação da chave que as assinou; planeje essa rotação no IAM e confirme impacto sobre outras assinaturas.

## Matriz no Emulator

A suíte recusa execução sem `FIRESTORE_EMULATOR_HOST`:

```powershell
pnpm security:test:emulator
```

Ela cobre isolamento owner/member/outro, revogação com claim antiga, e-mail/expiração/concorrência/replay de convites, concorrência do rate limiter, migração dry-run/apply e bloqueio direto do Storage. Todos os fixtures usam prefixo aleatório e são removidos ao final.
