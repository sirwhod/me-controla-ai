/**
 * Utilitário seguro para serializar datas do Firestore (Timestamps, Dates, Millis, Strings)
 * evitando exceções do tipo `val.toDate is not a function`.
 */
export function serializeFirestoreDate(val: unknown): string | null {
  if (!val) return null
  try {
    if (typeof val === 'object' && val !== null) {
      if ('toDate' in val && typeof (val as { toDate: () => Date }).toDate === 'function') {
        return (val as { toDate: () => Date }).toDate().toISOString()
      }
      if ('toMillis' in val && typeof (val as { toMillis: () => number }).toMillis === 'function') {
        return new Date((val as { toMillis: () => number }).toMillis()).toISOString()
      }
      if (val instanceof Date) {
        return val.toISOString()
      }
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
