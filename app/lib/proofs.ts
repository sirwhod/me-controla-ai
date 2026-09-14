import 'server-only'

import { randomUUID } from 'node:crypto'
import { storage } from './firebase'

export const MAX_PROOF_BYTES = 5 * 1024 * 1024
const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'application/pdf'])

export function proofPath(workspaceId: string, proofId = randomUUID()) {
  return `proofs/${workspaceId}/${proofId}`
}

function hasValidSignature(buffer: Buffer, contentType: string) {
  if (contentType === 'application/pdf') return buffer.subarray(0, 5).toString('ascii') === '%PDF-'
  if (contentType === 'image/png') return buffer.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
  return buffer.subarray(0, 3).equals(Buffer.from([255, 216, 255]))
}

export async function saveProof(input: { workspaceId: string; file: File }) {
  const contentType = input.file.type.toLowerCase()
  if (!ALLOWED_TYPES.has(contentType)) throw new Error('PROOF_TYPE_NOT_ALLOWED')
  if (input.file.size <= 0 || input.file.size > MAX_PROOF_BYTES) throw new Error('PROOF_TOO_LARGE')
  const buffer = Buffer.from(await input.file.arrayBuffer())
  if (!hasValidSignature(buffer, contentType)) throw new Error('PROOF_SIGNATURE_INVALID')
  const path = proofPath(input.workspaceId)
  await storage.file(path).save(buffer, { resumable: false, metadata: { contentType, metadata: { workspaceId: input.workspaceId } } })
  return { path, contentType, size: buffer.length }
}

export async function deleteProof(path?: string | null) {
  if (!path || !path.startsWith('proofs/')) return
  await storage.file(path).delete({ ignoreNotFound: true })
}

export async function signedProofUrl(path: string) {
  if (!path.startsWith('proofs/')) throw new Error('PROOF_PATH_INVALID')
  const [url] = await storage.file(path).getSignedUrl({ action: 'read', expires: Date.now() + 5 * 60 * 1000 })
  return url
}
