/**
 * Utilitário seguro para serializar datas do Firestore (Timestamps, Dates, Millis, Strings)
 * evitando exceções do tipo `val.toDate is not a function`.
 */
export function serializeFirestoreDate(val: any): string | null {
  if (!val) return null
  try {
    if (typeof val.toDate === 'function') {
      return val.toDate().toISOString()
    }
    if (typeof val.toMillis === 'function') {
      return new Date(val.toMillis()).toISOString()
    }
    if (val instanceof Date) {
      return val.toISOString()
    }
    if (typeof val === 'number' || typeof val === 'string') {
      const d = new Date(val)
      if (!isNaN(d.getTime())) {
        return d.toISOString()
      }
    }
  } catch (e) {
    console.warn('Erro ao serializar data do Firestore:', e)
  }
  return null
}
