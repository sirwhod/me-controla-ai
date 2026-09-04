import { NextResponse } from 'next/server'
import { processPushOutbox } from '@/app/lib/push'

export async function POST(request: Request) {
  const expected = process.env.PUSH_WORKER_SECRET
  if (!expected || request.headers.get('authorization') !== `Bearer ${expected}`) return NextResponse.json({ message: 'Não autorizado' }, { status: 401 })
  const limit = Math.min(Math.max(Number(new URL(request.url).searchParams.get('limit') || 20), 1), 50)
  return NextResponse.json({ results: await processPushOutbox(limit) })
}
