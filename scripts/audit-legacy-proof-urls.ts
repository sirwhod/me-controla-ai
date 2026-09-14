import { db } from '../app/lib/firebase'

/**
 * Read-only inventory of legacy external proof URLs.
 * It deliberately does not fetch or print URLs, because they may contain
 * access tokens or personal data.
 */
async function main() {
  const projectId = process.env.FIREBASE_PROJECT_ID || ''
  const isEmulator = Boolean(process.env.FIRESTORE_EMULATOR_HOST)
  const isExplicitTestProject = /(test|dev|demo|local)/i.test(projectId)
  if (!isEmulator && !isExplicitTestProject) {
    throw new Error('Auditoria bloqueada: use o Firebase Emulator ou um projeto explicitamente de teste.')
  }

  const collections = ['debits', 'credits']
  let scanned = 0
  let legacyCount = 0
  const byCollection: Record<string, number> = {}

  for (const collection of collections) {
    const snapshot = await db.collectionGroup(collection).get()
    let count = 0
    for (const document of snapshot.docs) {
      scanned += 1
      const value = document.data().proofUrl
      if (typeof value === 'string' && value.length > 0) count += 1
    }
    byCollection[collection] = count
    legacyCount += count
  }

  console.log(JSON.stringify({ mode: 'read-only', scanned, legacyCount, byCollection }))
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : 'Falha na auditoria')
  process.exitCode = 1
})
