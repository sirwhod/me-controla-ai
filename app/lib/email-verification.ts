import 'server-only'
import { createHash, randomBytes } from 'node:crypto'
import { db } from '@/app/lib/firebase'
import { normalizeEmail } from '@/app/lib/email-identity'
import { enqueueVerificationEmail, processEmailOutbox } from '@/app/lib/email/outbox'

const TOKEN_TTL_MS = 30 * 60 * 1000

function hashToken(token: string) { return createHash('sha256').update(token).digest('hex') }

export async function requestEmailVerification(userId: string) {
  const userRef = db.collection('users').doc(userId)
  const user = await userRef.get()
  if (!user.exists || !user.data()?.email) throw new Error('Usuário não encontrado')
  const userData = user.data()!
  if (userData.emailVerified || userData.emailVerifiedAt) return { alreadyVerified: true }
  const email = normalizeEmail(String(userData.email))
  const token = randomBytes(32).toString('base64url')
  const tokenHash = hashToken(token)
  const expiresAt = new Date(Date.now() + TOKEN_TTL_MS)
  await db.collection('_emailVerifications').doc(tokenHash).set({ userId, normalizedEmail: email, expiresAt, usedAt: null, createdAt: new Date() })
  const jobId = await enqueueVerificationEmail({ to: email, name: String(userData.name || 'usuário'), token })
  await processEmailOutbox(1, jobId)
  return { alreadyVerified: false }
}

export async function confirmEmailVerification(token: string) {
  const tokenHash = hashToken(token)
  const tokenRef = db.collection('_emailVerifications').doc(tokenHash)
  return db.runTransaction(async transaction => {
    const tokenDoc = await transaction.get(tokenRef)
    if (!tokenDoc.exists) throw new Error('TOKEN_INVALID')
    const data = tokenDoc.data()!
    const expiresAt = data.expiresAt?.toDate?.() ?? new Date(data.expiresAt)
    if (data.usedAt || expiresAt.getTime() <= Date.now()) throw new Error('TOKEN_EXPIRED')
    const userRef = db.collection('users').doc(String(data.userId))
    const userDoc = await transaction.get(userRef)
    if (!userDoc.exists || normalizeEmail(String(userDoc.data()?.email || '')) !== data.normalizedEmail) throw new Error('TOKEN_INVALID')
    const verifiedAt = new Date()
    transaction.update(userRef, { emailVerified: verifiedAt, emailVerifiedAt: verifiedAt, updatedAt: verifiedAt })
    transaction.update(tokenRef, { usedAt: verifiedAt })
    return { userId: String(data.userId) }
  })
}
