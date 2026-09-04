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
        <DropdownMenuTrigger className="flex w-full items-center justify-between gap-3 rounded-xl border border-border/70 bg-card px-3 py-2.5 text-left transition-all hover:bg-accent cursor-pointer outline-hidden">
          <span className="flex min-w-0 items-center gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted text-primary">
              {workspaceActive?.type === "personal" ? <User className="h-4 w-4" /> : <Users className="h-4 w-4" />}
            </span>
            <span className="flex min-w-0 flex-col text-left">
              <span className="truncate text-sm font-semibold text-foreground">{workspaceActive?.name ?? "Selecione uma caixinha"}</span>
              <span className="text-xs text-muted-foreground">Selecione uma caixinha</span>
            </span>
          </span>
          <ChevronsUpDown className="h-4 w-4 shrink-0 text-muted-foreground" />
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
