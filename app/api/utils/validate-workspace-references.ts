import { db } from '@/app/lib/firebase'

type WorkspaceReference = {
  collection: 'banks' | 'cards' | 'categories' | 'responsibles'
  id?: string | null
  field: string
}

export async function validateWorkspaceReferences(workspaceId: string, references: WorkspaceReference[]) {
  const present = references.filter((reference) => Boolean(reference.id))
  if (present.length === 0) return new Map<string, FirebaseFirestore.DocumentData>()

  const snapshots = await db.getAll(...present.map((reference) =>
    db.collection('workspaces').doc(workspaceId).collection(reference.collection).doc(reference.id!),
  ))
  const result = new Map<string, FirebaseFirestore.DocumentData>()
  snapshots.forEach((snapshot, index) => {
    const reference = present[index]
    if (!snapshot.exists) throw new InvalidWorkspaceReferenceError(reference.field)
    result.set(reference.field, snapshot.data() || {})
  })
  return result
}

export class InvalidWorkspaceReferenceError extends Error {
  constructor(readonly field: string) {
    super(`Referência inválida para ${field}`)
  }
}
