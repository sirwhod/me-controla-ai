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
        <DropdownMenuTrigger className="flex w-full items-center justify-between gap-2 border-b border-border/60 px-1 pb-3 text-left text-sm font-semibold hover:text-primary transition-colors cursor-pointer outline-hidden">
          {workspaceActive?.type && workspaceActive.type === "personal" ? (
            <User className="w-4 h-4 text-primary shrink-0" />
          ) : (
            <Users className="w-4 h-4 text-primary shrink-0" />
          )}
          <span className="truncate max-w-[200px]">
            {workspaceActive?.name ?? 'Selecione um Workspace'}
          </span>
          <ChevronsUpDown className="w-4 h-4 text-muted-foreground shrink-0" />
        </DropdownMenuTrigger>
        <DropdownMenuContent className="min-w-[240px] rounded-xl border-border/70 bg-card p-1.5">
          <DropdownMenuLabel className="px-3 py-2 text-xs uppercase tracking-wider text-primary">Caixinhas</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {workspaces.length > 0 ? (
            <ul className="space-y-2">
              {workspaces?.map((workspace) => (
                <li key={workspace.id}>
                  <DropdownMenuItem
                    className="w-full justify-start gap-3 rounded-lg px-3 py-2.5"
                    onClick={() => setActiveWorkspaceId(workspace.id)}
                  >
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-muted-foreground">{workspace.type === "personal" ? <User className="h-4 w-4" /> : <Users className="h-4 w-4" />}</span>
                    <span className="truncate">{workspace.name}</span>
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
