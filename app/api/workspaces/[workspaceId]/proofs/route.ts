import { withWorkspaceMutation } from '@/app/api/utils/with-workspace-mutation'
import { NextRequest, NextResponse } from 'next/server'
import type { Session } from 'next-auth'
import { auth } from '@/app/lib/auth'
import { checkIsWorkspaceMember } from '@/app/api/utils/check-is-workspace-member'
import { db } from '@/app/lib/firebase'
import { deleteProof, saveProof, signedProofUrl } from '@/app/lib/proofs'
import { consumeRateLimit } from '@/app/lib/rate-limit'

type Params = { params: Promise<{ workspaceId: string }> }
const resourceName = (value: string | null) => value === 'debits' || value === 'credits' ? value : null

async function authorize(workspaceId: string): Promise<{ error: NextResponse } | { session: Session }> {
  const session = await auth()
  if (!session?.user?.id) return { error: NextResponse.json({ message: 'Não autenticado' }, { status: 401 }) }
  const member = await checkIsWorkspaceMember({ workspaceId, workspaceIds: session.user.workspaceIds, userId: session.user.id })
  if (!member) return { error: NextResponse.json({ message: 'Acesso negado ao workspace' }, { status: 403 }) }
  return { session }
}

async function postHandler(request: NextRequest, { params }: Params) {
  const { workspaceId } = await params
  const access = await authorize(workspaceId)
  if ('error' in access) return access.error
  const contentLength = Number(request.headers.get('content-length') || 0)
  if (contentLength > 6 * 1024 * 1024) return NextResponse.json({ message: 'Arquivo acima do limite permitido' }, { status: 413 })
  const rateLimit = await consumeRateLimit('proof-upload', `${access.session.user.id}:${workspaceId}`, 20, 60 * 60 * 1000)
  if (!rateLimit.allowed) return NextResponse.json({ message: 'Limite de uploads excedido' }, { status: 429, headers: { 'Retry-After': String(rateLimit.retryAfterSeconds) } })
  const form = await request.formData().catch(() => null)
  const file = form?.get('file')
  const collection = resourceName(String(form?.get('collection') || ''))
  const resourceId = String(form?.get('resourceId') || '')
  if (!(file instanceof File) || !collection || !resourceId) return NextResponse.json({ message: 'Arquivo e lançamento são obrigatórios' }, { status: 400 })
  const ref = db.collection('workspaces').doc(workspaceId).collection(collection).doc(resourceId)
  const existing = await ref.get()
  if (!existing.exists) return NextResponse.json({ message: 'Lançamento não encontrado' }, { status: 404 })
  try {
    const saved = await saveProof({ workspaceId, file })
    const oldPath = existing.data()?.proofPath
    await ref.update({ proofPath: saved.path, updatedAt: new Date() })
    await deleteProof(oldPath)
    return NextResponse.json({ proofPath: saved.path, contentType: saved.contentType, size: saved.size }, { status: 201 })
  } catch (error) {
    const code = error instanceof Error ? error.message : ''
    const status = code === 'PROOF_TYPE_NOT_ALLOWED' || code === 'PROOF_TOO_LARGE' || code === 'PROOF_SIGNATURE_INVALID' ? 400 : 500
    return NextResponse.json({ message: status === 400 ? 'Arquivo inválido' : 'Não foi possível armazenar o comprovante' }, { status })
  }
}

export async function GET(request: NextRequest, { params }: Params) {
  const { workspaceId } = await params
  const access = await authorize(workspaceId)
  if ('error' in access) return access.error
  const search = new URL(request.url).searchParams
  const collection = resourceName(search.get('collection'))
  const resourceId = search.get('resourceId') || ''
  if (!collection || !resourceId) return NextResponse.json({ message: 'Lançamento inválido' }, { status: 400 })
  const doc = await db.collection('workspaces').doc(workspaceId).collection(collection).doc(resourceId).get()
  const path = doc.data()?.proofPath
  if (!doc.exists || typeof path !== 'string') return NextResponse.json({ message: 'Comprovante não encontrado' }, { status: 404 })
  try { return NextResponse.json({ url: await signedProofUrl(path) }, { headers: { 'Cache-Control': 'private, no-store' } }) }
  catch { return NextResponse.json({ message: 'Comprovante inválido' }, { status: 404 }) }
}

async function deleteHandler(request: NextRequest, { params }: Params) {
  const { workspaceId } = await params
  const access = await authorize(workspaceId)
  if ('error' in access) return access.error
  const search = new URL(request.url).searchParams
  const collection = resourceName(search.get('collection'))
  const resourceId = search.get('resourceId') || ''
  if (!collection || !resourceId) return NextResponse.json({ message: 'Lançamento inválido' }, { status: 400 })
  const ref = db.collection('workspaces').doc(workspaceId).collection(collection).doc(resourceId)
  const doc = await ref.get()
  if (!doc.exists) return NextResponse.json({ message: 'Lançamento não encontrado' }, { status: 404 })
  await ref.update({ proofPath: null, updatedAt: new Date() })
  await deleteProof(doc.data()?.proofPath)
  return NextResponse.json({ ok: true })
}

export const POST = withWorkspaceMutation(postHandler)
export const DELETE = withWorkspaceMutation(deleteHandler)
