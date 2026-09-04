if (typeof window !== "undefined") {
  throw new Error("This module cannot be imported from a Client Component.");
}
import { applicationDefault, cert, getApps, initializeApp } from "firebase-admin/app"
import { getFirestore } from "firebase-admin/firestore"
import { getStorage } from "firebase-admin/storage"

function getPrivateKey(): string | undefined {
  const rawKey = process.env.FIREBASE_PRIVATE_KEY
  if (!rawKey) return undefined

  if (rawKey.includes("-----BEGIN PRIVATE KEY-----")) {
    return rawKey.replace(/\\n/g, "\n")
  }

  try {
    const decoded = Buffer.from(rawKey, "base64").toString("utf-8")
    if (decoded.includes("-----BEGIN PRIVATE KEY-----")) {
      return decoded.replace(/\\n/g, "\n")
    }
  } catch {
    // Continua para o fallback
  }

  return rawKey.replace(/\\n/g, "\n")
}

const isFirestoreEmulator = Boolean(process.env.FIRESTORE_EMULATOR_HOST)
const usesApplicationDefault = Boolean(process.env.GOOGLE_APPLICATION_CREDENTIALS)
function getServiceAccount() {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT
  if (!raw) return undefined
  try { return JSON.parse(raw) as { project_id?: string; client_email?: string; private_key?: string } } catch { throw new Error('FIREBASE_SERVICE_ACCOUNT contém JSON inválido') }
}
const serviceAccount = getServiceAccount()
const firebaseProjectId = serviceAccount?.project_id || process.env.FIREBASE_PROJECT_ID || (isFirestoreEmulator ? 'demo-me-controla-ai' : undefined)

export const firebaseCert = isFirestoreEmulator || usesApplicationDefault
  ? applicationDefault()
  : cert({
      projectId: firebaseProjectId,
      clientEmail: serviceAccount?.client_email || process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: serviceAccount?.private_key?.replace(/\\n/g, "\n") || getPrivateKey(),
    })

// Instancia do app

if (!getApps().length) {
  initializeApp({
    ...(isFirestoreEmulator ? { projectId: firebaseProjectId } : { credential: firebaseCert }),
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET ||
      (isFirestoreEmulator && firebaseProjectId ? `${firebaseProjectId}.appspot.com` : undefined),
  })
}

export const db = getFirestore()

export const storage = getStorage().bucket()

const signedUrlCache = new Map<string, { url: string; expiresAt: number }>()

export async function getDownloadURLFromPath(path?: string) {
  if (!path) return

  const cached = signedUrlCache.get(path)
  if (cached && cached.expiresAt > Date.now()) return cached.url

  const file = storage.file(path)

  const [url] = await file.getSignedUrl({
    action: "read",
    expires: Date.now() + 5 * 60 * 1000,
  })
  // Cache expires one minute before the signed URL itself. The persistent
  // reference remains `iconPath`; signed URLs are transient Storage data.
  signedUrlCache.set(path, { url, expiresAt: Date.now() + 4 * 60 * 1000 })
  return url
}
