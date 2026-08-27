'use client'

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog'
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
        <DropdownMenuTrigger className="flex items-center justify-center gap-1.5 sm:gap-2 text-xs sm:text-sm font-semibold hover:text-primary transition-colors cursor-pointer outline-hidden">
          {workspaceActive?.type && workspaceActive.type === "personal" ? (
            <User className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary shrink-0" />
          ) : (
            <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary shrink-0" />
          )}
          <span className="truncate max-w-[130px] sm:max-w-[200px] md:max-w-none">
            {workspaceActive?.name ?? 'Selecione um Workspace'}
          </span>
          <ChevronsUpDown className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
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
      <DialogContent className="w-xs">
        <DialogHeader>
          <DialogTitle>Criar nova caixinha</DialogTitle>
          <DialogDescription>Crie uma nova caixinha para gerenciar suas finanças.</DialogDescription>
        </DialogHeader>
        <WorkspaceForm isDialog />
      </DialogContent>
    </Dialog>
  )
}
