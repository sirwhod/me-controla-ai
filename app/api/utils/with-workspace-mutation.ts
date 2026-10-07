import { NextResponse } from 'next/server'
import { randomUUID } from 'node:crypto'
import { hostname } from 'node:os'
import { FieldValue } from 'firebase-admin/firestore'
import { auth } from '@/app/lib/auth'
import { db } from '@/app/lib/firebase'

// Durable request leases coordinate deletion with writes, including Storage and
// notification side effects, across server processes. No timeout can expire a
// lease while its request is still writing.
export function withWorkspaceMutation<R extends Request, C extends { params: Promise<{ workspaceId: string }> }>(
  handler: (request: R, context: C) => Promise<Response>,
) {
  return async (request: R, context: C): Promise<Response> => {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ message: 'Não autenticado.' }, { status: 401 })
    const { workspaceId } = await context.params
    return runWorkspaceMutation(workspaceId, session.user.id, () => handler(request, context))
  }
}

export async function runWorkspaceMutation(workspaceId: string, userId: string, handler: () => Promise<Response>, requireMembership = true): Promise<Response> {
    const ref = db.collection('workspaces').doc(workspaceId)
    const leaseRef = ref.collection('mutationLeases').doc(randomUUID())
    const acquired = await db.runTransaction(async transaction => {
      const doc = await transaction.get(ref)
      const data = doc.data()
      if (!doc.exists || data?.deleting) return false
      if (requireMembership && data?.ownerId !== userId && !data?.members?.includes(userId)) return false
      transaction.update(ref, { activeMutations: FieldValue.increment(1) })
      transaction.create(leaseRef, { hostname: hostname(), pid: process.pid, status: 'running', createdAt: new Date() })
      return true
    })
    if (!acquired) return NextResponse.json({ message: 'Caixinha indisponível ou acesso negado.' }, { status: 403 })
    try { return await handler() }
    finally {
      // A completed lease is safe to recover even if releasing it fails. A
      // running lease is never expired merely because a request took too long.
      try { await leaseRef.update({ status: 'finished' }) } catch (error) { console.error('Não foi possível marcar operação concluída:', error) }
      for (let attempt = 0; attempt < 3; attempt++) {
        try {
          await db.runTransaction(async transaction => {
            const lease = await transaction.get(leaseRef)
            if (!lease.exists) return
            transaction.delete(leaseRef)
            transaction.update(ref, { activeMutations: FieldValue.increment(-1) })
          })
          break
        } catch (error) {
          if (attempt === 2) console.error('Liberação da operação será recuperada na exclusão:', error)
        }
      }
    }
}
