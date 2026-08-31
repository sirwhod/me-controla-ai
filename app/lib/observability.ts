import { createHmac, randomUUID } from 'node:crypto'

const configuredHashSecret = process.env.OBSERVABILITY_HASH_SECRET
if (process.env.NODE_ENV === 'production' && !configuredHashSecret) {
  throw new Error('OBSERVABILITY_HASH_SECRET é obrigatório em produção')
}
const hashSecret = configuredHashSecret || 'development-only-observability-secret'
const enabled = process.env.FIRESTORE_OBSERVABILITY !== 'off'
const sampleRate = Math.max(0, Math.min(1, Number(process.env.FIRESTORE_OBSERVABILITY_SAMPLE_RATE ?? 1)))

export type FirestoreReadOrigin =
  | 'authentication' | 'authorization' | 'summary.monthly' | 'summary.annual'
  | 'analytics' | 'debits' | 'credits' | 'responsibles' | 'banks' | 'cards'
  | 'rate-limit' | 'aggregate-fallback' | 'reconciliation' | string

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
  origin?: FirestoreReadOrigin
  queries?: number
  aggregationQueries?: number
  cache?: 'hit' | 'miss' | 'bypass'
}) {
  if (!enabled || Math.random() > sampleRate) return
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
    queries: input.queries ?? 1,
    aggregationQueries: input.aggregationQueries ?? 0,
    cache: input.cache ?? 'bypass',
    // `documents` mede documentos retornados, não a cobrança total: consultas
    // podem também cobrar entradas de índice conforme o plano da consulta.
    billingEstimate: false,
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
  if (!enabled || Math.random() > sampleRate) return
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
