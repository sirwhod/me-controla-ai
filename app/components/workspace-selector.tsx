'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { Button } from './ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from './ui/dropdown-menu'
import { ChevronsUpDown, PlusCircle, User, Users } from 'lucide-react'
import { WorkspaceForm } from './workspace-form'

interface Workspace {
  id: string
  name: string
  ownerId: string
  members: string[]
  type: 'personal' | 'shared'
  createdAt: string 
  updatedAt: string 
}

export default function WorkspaceSelector() {
  const { data: session, status } = useSession()
  const [workspaces, setWorkspaces] = useState<Workspace[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [activeWorkspaceId, setActiveWorkspaceId] = useState<string | null>(null)

  const fetchWorkspaces = async () => {
    if (status !== 'authenticated') return

    setIsLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/workspaces')
      if (!res.ok) {
        throw new Error(`Erro ao buscar workspaces: ${res.statusText}`)
      }
      const data: Workspace[] = await res.json()
      setWorkspaces(data)
      // Opcional: selecionar o primeiro workspace automaticamente se houver
      if (data.length > 0 && !activeWorkspaceId) {
          setActiveWorkspaceId(data[0].id)
      }
    } catch (err: any) {
      console.error('Erro ao buscar workspaces:', err)
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (status === 'authenticated') {
      fetchWorkspaces()
    }
  }, [status])

  // Se estiver carregando a sessão ou os workspaces
  if (status === 'loading' || isLoading) {
    return <div>Carregando workspaces...</div>
  }

  // Se não estiver autenticado, talvez redirecionar ou mostrar mensagem
  if (status === 'unauthenticated') {
      // Redirecionar para página de login ou mostrar um botão de login
      return <div>Por favor, faça login para gerenciar seus workspaces.</div>
  }

  // Se houver erro ao carregar workspaces
  if (error) {
      return <div>Erro: {error} <Button onClick={fetchWorkspaces}>Tentar Novamente</Button></div>
  }

  const workspaceActive = workspaces.find((wsp) => wsp.id === activeWorkspaceId)

  return (
    <Dialog>
      <DropdownMenu>
        <DropdownMenuTrigger className="flex items-center justify-center gap-2">
          {workspaceActive?.type && workspaceActive.type === "personal" ? <User className="w-4 h-4"/> : <Users className="w-4 h-4"/>}
          {workspaceActive?.name ?? 'Selecione um Workspace'}
          <ChevronsUpDown className="w-4 h-4 text-muted" />
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuLabel>Workspaces</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {workspaces.length > 0 ? (
            <ul className="space-y-2">
              {workspaces.map((workspace) => (
                <li key={workspace.id}>
                  <DropdownMenuItem
                    className="w-full justify-start"
                    onClick={() => setActiveWorkspaceId(workspace.id)}
                  >
                    {workspace.type === "personal" ? <User /> : <Users />}
                    {workspace.name} 
                  </DropdownMenuItem>
                </li>
              ))}
            </ul>
          ) : (
            <p>Você ainda não tem workspaces. Crie um para começar!</p>
          )}
          <DropdownMenuSeparator />
          <DialogTrigger asChild>
            <DropdownMenuItem>
              <PlusCircle />
              Criar Novo Workspace
            </DropdownMenuItem>
          </DialogTrigger>
        </DropdownMenuContent>
      </DropdownMenu>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Criar Novo Workspace</DialogTitle>
        </DialogHeader>
        <WorkspaceForm isDialog />
      </DialogContent>
    </Dialog>
  )
}
