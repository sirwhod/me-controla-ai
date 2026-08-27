"use client"

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/app/components/ui/breadcrumb"
import { Separator } from "@/app/components/ui/separator"
import {
  SidebarTrigger,
} from "@/app/components/ui/sidebar"
import WorkspaceSelector from "@/app/components/workspace-selector"
import { useWorkspace } from "@/app/hooks/use-workspace"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { getWorkspaceMembers, removeWorkspaceMember, cancelWorkspaceInvitation, WorkspaceMembersResponse } from "@/app/http/members"
import { Skeleton } from "@/app/components/ui/skeleton"
import { Loader } from "@/app/components/ui/loader"
import Link from "next/link"
import { Button } from "@/app/components/ui/button"
import { Users, Crown, Mail, Clock, Trash2, ShieldCheck, UserMinus } from "lucide-react"
import { InviteMemberDialog } from "@/app/components/invite-member-dialog"
import { toast } from "sonner"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card"
import { Badge } from "@/app/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/app/components/ui/avatar"

function LoadPage() {
  return (
    <div className="flex w-full flex-col items-center justify-center space-y-8 p-4 h-96">
      <div className="flex flex-col items-center justify-center gap-2 p-4">
        <Loader size="lg" text="Carregando" />
        <span className="text-muted-foreground text-sm">Carregando membros...</span>
      </div>
    </div>
  )
}

export default function MembersPage() {
  const { workspaceActive, isLoading: isWorkspaceLoading, error: workspaceError } = useWorkspace()
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery<WorkspaceMembersResponse, Error>({
    queryKey: ['workspace-members', workspaceActive?.id],
    queryFn: () => getWorkspaceMembers(workspaceActive!.id),
    staleTime: 1000 * 60 * 2,
    enabled: !!workspaceActive && !isWorkspaceLoading && !workspaceError,
  })

  const { mutateAsync: removeMemberMutation, isPending: isRemoving } = useMutation({
    mutationFn: (memberId: string) => removeWorkspaceMember(workspaceActive!.id, memberId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspace-members', workspaceActive?.id] })
      toast.success("Membro removido da caixinha com sucesso!")
    },
    onError: (err: Error) => {
      toast.error(err.message || "Erro ao remover membro.")
    },
  })

  const { mutateAsync: cancelInviteMutation } = useMutation({
    mutationFn: (inviteId: string) => cancelWorkspaceInvitation(inviteId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspace-members', workspaceActive?.id] })
      toast.success("Convite cancelado com sucesso!")
    },
    onError: (err: Error) => {
      toast.error(err.message || "Erro ao cancelar convite.")
    },
  })

  return (
    <>
      <header className="flex h-16 shrink-0 items-center gap-2">
        <div className="flex items-center gap-2 px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator
            orientation="vertical"
            className="mr-2 data-[orientation=vertical]:h-4"
          />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                {isWorkspaceLoading || !workspaceActive ? (
                  <Skeleton className="h-5 w-48" />
                ) : (
                  <WorkspaceSelector />
                )}
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden md:block" />
              <BreadcrumbItem className="hidden md:block">
                <Link href={`${workspaceActive?.id ? `/${workspaceActive.id}` : ''}/dashboard`}>
                  Dashboard
                </Link>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>
                  Membros & Acesso
                </BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </header>

      <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
        <div className="bg-muted/50 min-h-[100vh] flex-1 rounded-xl md:min-h-min p-4 space-y-6">
          {isLoading || !data ? (
            <LoadPage />
          ) : (
            <>
              {/* Header da Seção */}
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                  <h1 className="text-xl font-bold tracking-tight flex items-center gap-2">
                    <Users className="h-5 w-5 text-primary" />
                    Membros com Acesso à Caixinha
                  </h1>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    Gerencie quem pode visualizar, lançar despesas e receitas nesta caixinha ({data.workspace.name}).
                  </p>
                </div>

                <InviteMemberDialog />
              </div>

              {/* Lista de Membros Ativos */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 text-emerald-500" />
                    Membros Ativos ({data.members.length})
                  </CardTitle>
                  <CardDescription>
                    Usuários que atualmente têm permissão de acesso e edição nesta caixinha.
                  </CardDescription>
                </CardHeader>
                <CardContent className="divide-y">
                  {data.members.map((member) => (
                    <div key={member.id} className="flex items-center justify-between py-3.5 first:pt-0 last:pb-0">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          {member.image && <AvatarImage src={member.image} />}
                          <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                            {member.name.slice(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-sm text-foreground">{member.name}</span>
                            {member.role === 'owner' ? (
                              <Badge variant="secondary" className="gap-1 text-xs bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20">
                                <Crown className="h-3 w-3" />
                                Proprietário
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-xs">
                                Membro
                              </Badge>
                            )}
                          </div>
                          <span className="text-xs text-muted-foreground">{member.email}</span>
                        </div>
                      </div>

                      {data.isOwner && member.role !== 'owner' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:bg-destructive/10 gap-1.5 text-xs"
                          onClick={() => removeMemberMutation(member.id)}
                          disabled={isRemoving}
                        >
                          <UserMinus className="h-3.5 w-3.5" />
                          Remover Acesso
                        </Button>
                      )}
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Lista de Convites Pendentes */}
              {data.pendingInvites && data.pendingInvites.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <Clock className="h-4 w-4 text-amber-500" />
                      Convites Pendentes ({data.pendingInvites.length})
                    </CardTitle>
                    <CardDescription>
                      Convites enviados que estão aguardando confirmação do usuário.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="divide-y">
                    {data.pendingInvites.map((invite) => (
                      <div key={invite.id} className="flex items-center justify-between py-3.5 first:pt-0 last:pb-0">
                        <div className="flex items-center gap-3">
                          <div className="bg-muted p-2.5 rounded-full text-muted-foreground">
                            <Mail className="h-4 w-4" />
                          </div>
                          <div>
                            <span className="font-medium text-sm text-foreground">{invite.inviteeEmail}</span>
                            <div className="flex items-center gap-2 mt-0.5">
                              <Badge variant="secondary" className="text-xs font-normal">
                                Aguardando aceite
                              </Badge>
                            </div>
                          </div>
                        </div>

                        {data.isOwner && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-muted-foreground hover:text-destructive text-xs gap-1.5"
                            onClick={() => cancelInviteMutation(invite.id)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            Cancelar Convite
                          </Button>
                        )}
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </div>
      </div>
    </>
  )
}
