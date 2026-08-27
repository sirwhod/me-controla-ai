"use client"

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/app/components/ui/breadcrumb"
import { Separator } from "@/app/components/ui/separator"
import { SidebarTrigger } from "@/app/components/ui/sidebar"
import WorkspaceSelector from "@/app/components/workspace-selector"
import { useWorkspace } from "@/app/hooks/use-workspace"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { getWorkspaceMembers, removeWorkspaceMember, cancelWorkspaceInvitation, WorkspaceMembersResponse } from "@/app/http/members"
import { Skeleton } from "@/app/components/ui/skeleton"
import Link from "next/link"
import { Button } from "@/app/components/ui/button"
import { Users, Crown, Mail, Clock, Trash2, ShieldCheck, UserMinus } from "lucide-react"
import { InviteMemberDialog } from "@/app/components/invite-member-dialog"
import { toast } from "sonner"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card"
import { Badge } from "@/app/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/app/components/ui/avatar"
import { LoadingState } from "@/app/components/states/loading-state"
import { ErrorState } from "@/app/components/states/error-state"
import { ConfirmationDialog } from "@/app/components/ui/confirmation-dialog"
import { useState } from "react"

export default function MembersPage() {
  const { workspaceActive, isLoading: isWorkspaceLoading, error: workspaceError } = useWorkspace()
  const queryClient = useQueryClient()

  // Estados de confirmação
  const [memberToRemove, setMemberToRemove] = useState<{ id: string; name: string } | null>(null)
  const [inviteToCancel, setInviteToCancel] = useState<{ id: string; email: string } | null>(null)

  const { data, isLoading, error: membersError, refetch } = useQuery<WorkspaceMembersResponse, Error>({
    queryKey: ["workspace-members", workspaceActive?.id],
    queryFn: () => getWorkspaceMembers(workspaceActive!.id),
    staleTime: 1000 * 60 * 2,
    enabled: !!workspaceActive && !isWorkspaceLoading && !workspaceError,
  })

  const { mutateAsync: removeMemberMutation, isPending: isRemoving } = useMutation({
    mutationFn: (memberId: string) => removeWorkspaceMember(workspaceActive!.id, memberId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workspace-members", workspaceActive?.id] })
      toast.success("Membro removido da caixinha com sucesso!")
      setMemberToRemove(null)
    },
    onError: (err: Error) => {
      toast.error(err.message || "Erro ao remover membro.")
    },
  })

  const { mutateAsync: cancelInviteMutation, isPending: isCancelingInvite } = useMutation({
    mutationFn: (inviteId: string) => cancelWorkspaceInvitation(inviteId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workspace-members", workspaceActive?.id] })
      toast.success("Convite cancelado com sucesso!")
      setInviteToCancel(null)
    },
    onError: (err: Error) => {
      toast.error(err.message || "Erro ao cancelar convite.")
    },
  })

  const isPageLoading = isWorkspaceLoading || !workspaceActive || isLoading
  const error = workspaceError || membersError

  return (
    <>
      <header className="flex h-14 md:h-16 shrink-0 items-center gap-2 border-b border-border/40 bg-background/95 backdrop-blur-md px-3 md:px-4">
        <div className="flex items-center gap-2 w-full">
          <SidebarTrigger className="-ml-1 text-muted-foreground hover:text-foreground" />
          <Separator orientation="vertical" className="mr-1 md:mr-2 h-4" />
          <Breadcrumb>
            <BreadcrumbList className="text-xs sm:text-sm">
              <BreadcrumbItem>
                <BreadcrumbPage>
                  {isWorkspaceLoading || !workspaceActive ? (
                    <Skeleton className="h-5 w-32 md:w-48" />
                  ) : (
                    <WorkspaceSelector />
                  )}
                </BreadcrumbPage>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden md:block" />
              <BreadcrumbItem className="hidden md:block">
                <Link href={`${workspaceActive?.id ? `/${workspaceActive.id}` : ""}/dashboard`}>
                  Dashboard
                </Link>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage className="font-semibold text-foreground">
                  Membros & Acesso
                </BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </header>

      <div className="flex flex-1 flex-col gap-4 p-3 md:p-4 pt-3">
        <div className="bg-muted/40 min-h-[calc(100vh-5rem)] md:min-h-min flex-1 rounded-xl p-3 md:p-4 space-y-6">
          {isPageLoading ? (
            <LoadingState variant="list" count={4} />
          ) : error ? (
            <ErrorState
              title="Erro ao carregar membros"
              message={error.message}
              onRetry={() => refetch()}
            />
          ) : data ? (
            <>
              {/* Header da Seção */}
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                  <h1 className="text-lg sm:text-xl font-bold tracking-tight flex items-center gap-2">
                    <Users className="h-5 w-5 text-primary" />
                    Membros com Acesso à Caixinha
                  </h1>
                  <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                    Gerencie quem pode visualizar e lançar despesas nesta caixinha ({data.workspace.name}).
                  </p>
                </div>

                <InviteMemberDialog />
              </div>

              {/* Lista de Membros Ativos */}
              <Card className="border-border/60 bg-card/60">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm sm:text-base flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 text-emerald-500" />
                    Membros Ativos ({data.members.length})
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Usuários com permissão ativa nesta caixinha.
                  </CardDescription>
                </CardHeader>
                <CardContent className="divide-y divide-border/40">
                  {data.members.map((member) => (
                    <div
                      key={member.id}
                      className="flex items-center justify-between py-3.5 first:pt-0 last:pb-0 gap-3"
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <Avatar className="h-10 w-10 shrink-0 border border-border/50">
                          {member.image && <AvatarImage src={member.image} />}
                          <AvatarFallback className="bg-primary/10 text-primary font-bold text-xs">
                            {member.name.slice(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-semibold text-sm text-foreground truncate">
                              {member.name}
                            </span>
                            {member.role === "owner" ? (
                              <Badge
                                variant="secondary"
                                className="gap-1 text-[10px] bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20"
                              >
                                <Crown className="h-3 w-3" />
                                Proprietário
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-[10px]">
                                Membro
                              </Badge>
                            )}
                          </div>
                          <span className="text-xs text-muted-foreground truncate">
                            {member.email}
                          </span>
                        </div>
                      </div>

                      {data.isOwner && member.role !== "owner" && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:bg-destructive/10 gap-1.5 text-xs h-8 px-2.5 shrink-0"
                          onClick={() => setMemberToRemove({ id: member.id, name: member.name })}
                        >
                          <UserMinus className="h-3.5 w-3.5" />
                          <span className="hidden sm:inline">Remover Acesso</span>
                        </Button>
                      )}
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Lista de Convites Pendentes */}
              {data.pendingInvites && data.pendingInvites.length > 0 && (
                <Card className="border-border/60 bg-card/60">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm sm:text-base flex items-center gap-2">
                      <Clock className="h-4 w-4 text-amber-500" />
                      Convites Pendentes ({data.pendingInvites.length})
                    </CardTitle>
                    <CardDescription className="text-xs">
                      Convites enviados aguardando confirmação do usuário.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="divide-y divide-border/40">
                    {data.pendingInvites.map((invite) => (
                      <div
                        key={invite.id}
                        className="flex items-center justify-between py-3.5 first:pt-0 last:pb-0 gap-3"
                      >
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <div className="bg-muted p-2 rounded-full text-muted-foreground shrink-0">
                            <Mail className="h-4 w-4" />
                          </div>
                          <div className="flex flex-col min-w-0 flex-1">
                            <span className="font-medium text-xs sm:text-sm text-foreground truncate">
                              {invite.inviteeEmail}
                            </span>
                            <span className="text-[11px] text-amber-500 font-medium">
                              Aguardando aceite
                            </span>
                          </div>
                        </div>

                        {data.isOwner && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-muted-foreground hover:text-destructive text-xs gap-1.5 h-8 px-2.5 shrink-0"
                            onClick={() => setInviteToCancel({ id: invite.id, email: invite.inviteeEmail })}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            <span className="hidden sm:inline">Cancelar</span>
                          </Button>
                        )}
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}

              {/* Dialog de Confirmação: Remover Membro */}
              <ConfirmationDialog
                open={!!memberToRemove}
                onOpenChange={(open) => !open && setMemberToRemove(null)}
                title="Remover Acesso do Membro"
                description={`Tem certeza de que deseja revogar o acesso de "${memberToRemove?.name}" a esta caixinha? Ele não poderá mais visualizar lançamentos nem criar novos registros.`}
                confirmText="Remover Membro"
                isPending={isRemoving}
                onConfirm={() => {
                  if (memberToRemove) removeMemberMutation(memberToRemove.id)
                }}
              />

              {/* Dialog de Confirmação: Cancelar Convite */}
              <ConfirmationDialog
                open={!!inviteToCancel}
                onOpenChange={(open) => !open && setInviteToCancel(null)}
                title="Cancelar Convite"
                description={`Deseja cancelar o convite enviado para "${inviteToCancel?.email}"? O link de convite deixará de ser válido.`}
                confirmText="Cancelar Convite"
                isPending={isCancelingInvite}
                onConfirm={() => {
                  if (inviteToCancel) cancelInviteMutation(inviteToCancel.id)
                }}
              />
            </>
          ) : null}
        </div>
      </div>
    </>
  )
}
