import "server-only"
import { cert, getApps, initializeApp } from "firebase-admin/app"
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

export const firebaseCert = cert({
  projectId: process.env.FIREBASE_PROJECT_ID,
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  privateKey: getPrivateKey(),
})

// Instancia do app

if (!getApps().length) {
  initializeApp({
    credential: firebaseCert,
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  })
}

export const db = getFirestore()

export const storage = getStorage().bucket()

export async function getDownloadURLFromPath(path?: string) {
  if (!path) return

  const file = storage.file(path)

  const [url] = await file.getSignedUrl({
    action: "read",
    expires: "03-01-2500", // Não deixa expirar
  })
  
  return url
}