import { createHmac, randomUUID } from 'node:crypto'

const configuredHashSecret = process.env.OBSERVABILITY_HASH_SECRET
if (process.env.NODE_ENV === 'production' && !configuredHashSecret) {
  throw new Error('OBSERVABILITY_HASH_SECRET é obrigatório em produção')
}
const hashSecret = configuredHashSecret || 'development-only-observability-secret'

export function getRequestId(request?: Request): string {
  return request?.headers.get('x-request-id') || randomUUID()
}

export function anonymizeIdentifier(value?: string | null): string | null {
  if (!value) return null
  return createHmac('sha256', hashSecret).update(value).digest('hex').slice(0, 16)
}

export function logFirestoreQuery(input: {
  requestId: string
  endpoint: string
  collection: string
  operation: string
  documents: number
  durationMs: number
  userId?: string | null
  workspaceId?: string | null
  origin?: string
}) {
  console.info(JSON.stringify({
    event: 'firestore_query',
    requestId: input.requestId,
    endpoint: input.endpoint,
    collection: input.collection,
    operation: input.operation,
    documents: input.documents,
    durationMs: Math.round(input.durationMs),
    userHash: anonymizeIdentifier(input.userId),
    workspaceHash: anonymizeIdentifier(input.workspaceId),
    origin: input.origin || null,
    timestamp: new Date().toISOString(),
  }))
}

export function logHttpRequest(input: {
  requestId: string
  endpoint: string
  method: string
  status: number
  durationMs: number
  userId?: string | null
  workspaceId?: string | null
}) {
  console.info(JSON.stringify({
    event: 'http_request',
    requestId: input.requestId,
    endpoint: input.endpoint,
    method: input.method,
    status: input.status,
    durationMs: Math.round(input.durationMs),
    userHash: anonymizeIdentifier(input.userId),
    workspaceHash: anonymizeIdentifier(input.workspaceId),
    timestamp: new Date().toISOString(),
  }))
}
