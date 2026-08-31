import { readFile } from 'node:fs/promises'
import { firebaseCert } from '../app/lib/firebase.ts'

interface IndexField { fieldPath: string; order?: string; arrayConfig?: string }
interface RemoteIndex { name: string; state?: string; queryScope?: string; fields?: IndexField[] }

const projectId = process.env.FIREBASE_PROJECT_ID
if (!projectId) throw new Error('FIREBASE_PROJECT_ID é obrigatório para verificar índices')

const local = JSON.parse(await readFile(new URL('../firestore.indexes.json', import.meta.url), 'utf8')) as {
  indexes: Array<{ collectionGroup: string; queryScope: string; fields: IndexField[] }>
}
const required = local.indexes.filter((index) =>
  ['credits', 'debits'].includes(index.collectionGroup) &&
  index.fields.some((field) => field.fieldPath === 'date')
)

const accessToken = await firebaseCert.getAccessToken()
const remoteByGroup = new Map<string, RemoteIndex[]>()
for (const collectionGroup of new Set(required.map((index) => index.collectionGroup))) {
  const url = `https://firestore.googleapis.com/v1/projects/${encodeURIComponent(projectId)}/databases/(default)/collectionGroups/${encodeURIComponent(collectionGroup)}/indexes`
  const response = await fetch(url, { headers: { authorization: `Bearer ${accessToken.access_token}` } })
  if (!response.ok) throw new Error(`Falha ao consultar índices de ${collectionGroup}: HTTP ${response.status}`)
  const payload = await response.json() as { indexes?: RemoteIndex[] }
  remoteByGroup.set(collectionGroup, payload.indexes || [])
}

const signature = (fields: IndexField[]) => fields
  .filter((field) => field.fieldPath !== '__name__')
  .map((field) => `${field.fieldPath}:${field.order || field.arrayConfig || ''}`)
  .join('|')

const failures: string[] = []
for (const expected of required) {
  const expectedSignature = signature(expected.fields)
  const match = remoteByGroup.get(expected.collectionGroup)?.find((index) => signature(index.fields || []) === expectedSignature)
  if (!match) failures.push(`${expected.collectionGroup} (${expectedSignature}): ausente`)
  else if (match.state !== 'READY') failures.push(`${expected.collectionGroup} (${expectedSignature}): ${match.state || 'estado desconhecido'}`)
}

if (failures.length) {
  console.error('Índices obrigatórios ainda não estão prontos:')
  failures.forEach((failure) => console.error(`- ${failure}`))
  process.exitCode = 1
} else {
  console.log(`Índices obrigatórios prontos: ${required.length}/${required.length}`)
}
