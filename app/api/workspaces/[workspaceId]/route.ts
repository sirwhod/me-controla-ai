import { NextResponse } from 'next/server'
import { auth } from '@/app/lib/auth'
import { deleteWorkspace, WorkspaceDeletionError } from '@/app/lib/delete-workspace'

export async function DELETE(request: Request, { params }: { params: Promise<{ workspaceId: string }> }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ message: 'Não autenticado.' }, { status: 401 })
  let body: { confirmationName?: unknown }
  try { body = await request.json() } catch {
    return NextResponse.json({ message: 'Confirmação inválida.' }, { status: 400 })
  }
  if (!body || typeof body !== 'object') return NextResponse.json({ message: 'Confirmação inválida.' }, { status: 400 })
  const { workspaceId } = await params
  try {
    await deleteWorkspace(workspaceId, session.user.id, body.confirmationName)
    return NextResponse.json({ message: 'Caixinha excluída com sucesso.' })
  } catch (error) {
    if (error instanceof WorkspaceDeletionError) return NextResponse.json({ message: error.message }, { status: error.status })
    console.error('Erro ao excluir caixinha:', error)
    return NextResponse.json({ message: 'Não foi possível concluir a exclusão. Tente novamente para finalizar.' }, { status: 500 })
  }
}
