'use client'

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from './ui/dropdown-menu'
import { ChevronsUpDown, PlusCircle, User, Users } from 'lucide-react'
import { WorkspaceForm } from './workspace-form'
import { Skeleton } from './ui/skeleton'
import { useWorkspace } from '../hooks/use-workspace'

export default function WorkspaceSelector() {
  const {
    workspaces,
    isLoading,
    setActiveWorkspaceId,
    workspaceActive,
  } = useWorkspace()

  if (!workspaces) {
    return null
  }

  if (isLoading) {
    return (
      <Skeleton className="w-[100px] h-[20px] rounded-full" />
    )
  }

  return (
    <Dialog>
      <DropdownMenu>
        <DropdownMenuTrigger className="flex items-center justify-center gap-2">
          {workspaceActive?.type && workspaceActive.type === "personal" ? <User className="w-4 h-4"/> : <Users className="w-4 h-4"/>}
          {workspaceActive?.name ?? 'Selecione um Workspace'}
          <ChevronsUpDown className="w-4 h-4 text-muted" />
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuLabel>Caixinha</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {workspaces.length > 0 ? (
            <ul className="space-y-2">
              {workspaces?.map((workspace) => (
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
            <p>Você ainda não tem caixinhas. Crie uma para começar!</p>
          )}
          <DropdownMenuSeparator />
          <DialogTrigger asChild>
            <DropdownMenuItem>
              <PlusCircle />
              Criar nova caixinha
            </DropdownMenuItem>
          </DialogTrigger>
        </DropdownMenuContent>
      </DropdownMenu>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Criar nova caixinha</DialogTitle>
        </DialogHeader>
        <WorkspaceForm isDialog />
      </DialogContent>
    </Dialog>
  )
}
