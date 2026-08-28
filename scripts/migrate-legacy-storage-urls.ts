import { db } from '../app/lib/firebase'

async function main() {
const apply = process.argv.includes('--apply')
const projectId = process.env.FIREBASE_PROJECT_ID || ''
const isEmulator = Boolean(process.env.FIRESTORE_EMULATOR_HOST)
const isExplicitTestProject =
  process.env.ALLOW_STORAGE_URL_MIGRATION === 'true' && /(test|dev|demo|local)/i.test(projectId)

if (apply && !isEmulator && !isExplicitTestProject) {
  throw new Error(
    'Escrita bloqueada: --apply exige Firestore Emulator ou ALLOW_STORAGE_URL_MIGRATION=true em projeto test/dev/demo/local.',
  )
}

function extractStoragePath(value: unknown): string | null {
  if (typeof value !== 'string' || value.length > 8192) return null
  try {
    const url = new URL(value)
    if (url.protocol !== 'https:' || url.hostname !== 'storage.googleapis.com') return null
    const segments = url.pathname.split('/').filter(Boolean)
    if (segments.length < 2) return null
    const objectPath = decodeURIComponent(segments.slice(1).join('/'))
    if (!objectPath.startsWith('bank_icons/') || objectPath.includes('..')) return null
    return objectPath
  } catch {
    return null
  }
}

const snapshot = await db.collectionGroup('banks').get()
let eligible = 0
let skipped = 0
let migrated = 0
let batch = db.batch()
let pendingWrites = 0

for (const document of snapshot.docs) {
  const data = document.data()
  if (data.iconPath || !data.iconUrl) {
    skipped += 1
    continue
  }

  const iconPath = extractStoragePath(data.iconUrl)
  if (!iconPath) {
    skipped += 1
    continue
  }

  eligible += 1
  if (!apply) continue

  batch.update(document.ref, { iconPath, iconUrl: null, updatedAt: new Date() })
  pendingWrites += 1
  migrated += 1
  if (pendingWrites === 400) {
    await batch.commit()
    batch = db.batch()
    pendingWrites = 0
  }
}

if (apply && pendingWrites > 0) await batch.commit()

console.log(JSON.stringify({ mode: apply ? 'apply' : 'dry-run', scanned: snapshot.size, eligible, migrated, skipped }))
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
