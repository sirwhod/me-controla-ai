import axios from 'axios'

export function shouldRetryQuery(failureCount: number, error: unknown): boolean {
  if (!axios.isAxiosError(error)) return failureCount < 2
  const status = error.response?.status
  const code = (error.response?.data as { code?: string } | undefined)?.code
  const retryable = (error.response?.data as { retryable?: boolean } | undefined)?.retryable
  if (code === 'FIRESTORE_INDEX_NOT_READY' && retryable) return failureCount < 4
  if (status && [400, 401, 403, 404].includes(status)) return false
  return failureCount < 2
}

export function queryRetryDelay(attempt: number, error: unknown): number {
  if (axios.isAxiosError(error) && (error.response?.data as { code?: string } | undefined)?.code === 'FIRESTORE_INDEX_NOT_READY') {
    return Math.min(2 ** attempt * 1000, 15_000)
  }
  return Math.min(2 ** attempt * 500, 5_000)
}
