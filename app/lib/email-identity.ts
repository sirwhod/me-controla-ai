import 'server-only'

import { createHash } from 'node:crypto'

export function normalizeEmail(email: string) {
  return email.normalize('NFKC').trim().toLowerCase()
}

export function emailIdentityId(email: string) {
  return createHash('sha256').update(normalizeEmail(email)).digest('hex')
}
