import { api } from '@/app/lib/axios'

export async function uploadProof(input: { workspaceId: string; collection: 'debits' | 'credits'; resourceId: string; file: File }) {
  const form = new FormData()
  form.append('collection', input.collection)
  form.append('resourceId', input.resourceId)
  form.append('file', input.file)
  const response = await api.post(`/workspaces/${input.workspaceId}/proofs`, form)
  return response.data as { proofPath: string; contentType: string; size: number }
}

export async function deleteProof(input: { workspaceId: string; collection: 'debits' | 'credits'; resourceId: string }) {
  await api.delete(`/workspaces/${input.workspaceId}/proofs`, { params: { collection: input.collection, resourceId: input.resourceId } })
}
