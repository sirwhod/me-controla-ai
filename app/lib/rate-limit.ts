import 'server-only'

import { createHash } from 'node:crypto'
import { db } from '@/app/lib/firebase'

export async function consumeRateLimit(scope: string, subject: string, limit: number, windowMs: number) {
  if (!scope || !subject || limit < 1 || windowMs < 1) throw new Error('Configuração inválida de rate limit')

  const now = Date.now()
  const key = createHash('sha256').update(`${scope}:${subject}`).digest('hex')
  const ref = db.collection('_securityRateLimits').doc(key)

  return db.runTransaction(async (transaction) => {
    const snapshot = await transaction.get(ref)
    const current = snapshot.data()
    const resetAtMillis = current?.resetAt?.toMillis?.() ??
      (current?.resetAt ? new Date(current.resetAt).getTime() : 0)

    if (!snapshot.exists || !Number.isFinite(resetAtMillis) || resetAtMillis <= now) {
      transaction.set(ref, {
        scope,
        count: 1,
        resetAt: new Date(now + windowMs),
        // Configure this field as a Firestore TTL policy in production.
        expiresAt: new Date(now + windowMs + 24 * 60 * 60 * 1000),
        updatedAt: new Date(now),
      })
      return { allowed: true, retryAfterSeconds: 0, remaining: limit - 1 }
    }

    const count = Number(current?.count || 0)
    if (count >= limit) {
      return {
        allowed: false,
        retryAfterSeconds: Math.max(1, Math.ceil((resetAtMillis - now) / 1000)),
        remaining: 0,
      }
    }

    transaction.update(ref, { count: count + 1, updatedAt: new Date(now) })
    return { allowed: true, retryAfterSeconds: 0, remaining: limit - count - 1 }
  })
}
