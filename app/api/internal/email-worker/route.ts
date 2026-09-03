import { NextRequest, NextResponse } from 'next/server'
import { timingSafeEqual } from 'node:crypto'
import { processEmailOutbox } from '@/app/lib/email/outbox'

export async function POST(request: NextRequest) {
  const expected = process.env.EMAIL_WORKER_SECRET
  const supplied = request.headers.get('x-email-worker-secret') || ''
  if (!expected || supplied.length !== expected.length || !timingSafeEqual(Buffer.from(supplied), Buffer.from(expected))) {
    return NextResponse.json({ message: 'Não autorizado' }, { status: 401 })
  }
  const jobId = new URL(request.url).searchParams.get('jobId') || undefined
  if (!jobId && process.env.NODE_ENV === 'production') {
    return NextResponse.json({ message: 'jobId obrigatório em produção' }, { status: 400 })
  }
  return NextResponse.json({ results: await processEmailOutbox(10, jobId) })
}
