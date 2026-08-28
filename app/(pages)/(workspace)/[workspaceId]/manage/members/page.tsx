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
import { Logo } from "@/app/components/logo"
import WorkspaceSelector from "@/app/components/workspace-selector"
import { useWorkspace } from "@/app/hooks/use-workspace"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import {
  getWorkspaceMembers,
  removeWorkspaceMember,
  cancelWorkspaceInvitation,
  WorkspaceMembersResponse,
  WorkspaceMemberInfo,
  WorkspacePendingInvite,
} from "@/app/http/members"
import { Skeleton } from "@/app/components/ui/skeleton"
import Link from "next/link"
import { Users, Clock, ShieldCheck } from "lucide-react"
import { InviteMemberDialog } from "@/app/components/invite-member-dialog"
import { toast } from "sonner"
import { LoadingState } from "@/app/components/states/loading-state"
import { ErrorState } from "@/app/components/states/error-state"
import { ConfirmationDialog } from "@/app/components/ui/confirmation-dialog"
import { useState } from "react"
import { MemberList, MemberListItem, PendingInviteItem } from "./member-list"
import { EmptyState } from "@/app/components/states/empty-state"

export default function MembersPage() {
  const { workspaceActive, isLoading: isWorkspaceLoading, error: workspaceError } = useWorkspace()
  const queryClient = useQueryClient()

  // Estados de confirmação
  const [memberToRemove, setMemberToRemove] = useState<WorkspaceMemberInfo | null>(null)
  const [inviteToCancel, setInviteToCancel] = useState<WorkspacePendingInvite | null>(null)

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
          <Link
            href={`${workspaceActive?.id ? `/${workspaceActive.id}` : ""}/dashboard`}
            className="flex md:hidden items-center shrink-0"
            aria-label="MeControla.AI"
          >
            <Logo className="h-6 w-6 text-primary" />
          </Link>
          <SidebarTrigger className="-ml-1 text-muted-foreground hover:text-foreground hidden md:flex" />
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

      <div className="flex flex-1 flex-col gap-5 p-3 md:p-6 pt-3 max-w-7xl w-full mx-auto pb-20 md:pb-6">
        {/* ========================================================================= */}
        {/* 1. ESTRUTURA MOBILE (< 768px): Header + CTA Full Width                    */}
        {/* ========================================================================= */}
        <div className="flex flex-col gap-3 md:hidden w-full">
          <div className="flex flex-col">
            <h1 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              Membros & Acesso
            </h1>
            <p className="text-xs text-muted-foreground">
              {data?.workspace?.name
                ? `Gerencie os acessos e permissões da caixinha "${data.workspace.name}".`
                : "Gerencie os membros com acesso a esta caixinha."}
            </p>
          </div>

          {/* CTA Principal Full Width */}
          <InviteMemberDialog fullWidth className="h-10 font-semibold shadow-xs" label="Convidar Membro" />
        </div>

        {/* ========================================================================= */}
        {/* 2. ESTRUTURA DESKTOP (>= 768px): Header Amplo com CTA à Direita           */}
        {/* ========================================================================= */}
        <div className="hidden md:flex items-center justify-between gap-3 w-full">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
              <Users className="h-6 w-6 text-primary" />
              Membros com Acesso à Caixinha
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground">
              {data?.workspace?.name
                ? `Gerencie quem pode visualizar e lançar despesas na caixinha "${data.workspace.name}".`
                : "Gerencie os membros e convites desta caixinha."}
            </p>
          </div>

          <InviteMemberDialog label="Convidar Membro" />
        </div>

        {/* ========================================================================= */}
        {/* 3. CONTEÚDO PRINCIPAL: MEMBROS ATIVOS E CONVITES PENDENTES               */}
        {/* ========================================================================= */}
        <div className="w-full space-y-6">
          {isPageLoading ? (
            <LoadingState variant="list" count={3} />
          ) : error ? (
            <ErrorState
              title="Não foi possível carregar os membros"
              message={error.message}
              onRetry={() => refetch()}
            />
          ) : data ? (
            <>
              {/* Seção: Membros Ativos */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 text-emerald-500" />
                    <h2 className="text-sm sm:text-base font-semibold text-foreground">
                      Membros Ativos ({data.members.length})
                    </h2>
                  </div>
                  <span className="text-xs text-muted-foreground hidden sm:inline">
                    Usuários com permissão ativa nesta caixinha
                  </span>
                </div>

                {data.members.length > 0 ? (
                  <MemberList>
                    {data.members.map((member) => (
                      <MemberListItem
                        key={member.id}
                        member={member}
                        isOwner={data.isOwner}
                        onRemove={(m) => setMemberToRemove(m)}
                      />
                    ))}
                  </MemberList>
                ) : (
                  <EmptyState
                    icon={Users}
                    title="Nenhum membro ativo encontrado"
                    description="Convide novos membros para compartilhar o gerenciamento financeiro."
                    action={<InviteMemberDialog label="Convidar Membro" />}
                  />
                )}
              </div>

              {/* Seção: Convites Pendentes (renderizada se existirem convites) */}
              {data.pendingInvites && data.pendingInvites.length > 0 && (
                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-amber-500" />
                      <h2 className="text-sm sm:text-base font-semibold text-foreground">
                        Convites Pendentes ({data.pendingInvites.length})
                      </h2>
                    </div>
                    <span className="text-xs text-muted-foreground hidden sm:inline">
                      Aguardando confirmação por e-mail
                    </span>
                  </div>

                  <MemberList>
                    {data.pendingInvites.map((invite) => (
                      <PendingInviteItem
                        key={invite.id}
                        invite={invite}
                        isOwner={data.isOwner}
                        onCancel={(inv) => setInviteToCancel(inv)}
                      />
                    ))}
                  </MemberList>
                </div>
              )}

              {/* Dialog de Confirmação: Remover Membro */}
              <ConfirmationDialog
                open={!!memberToRemove}
                onOpenChange={(open) => !open && setMemberToRemove(null)}
                title="Remover Acesso do Membro"
                description={`Tem certeza de que deseja revogar o acesso de "${memberToRemove?.name}" a esta caixinha? O usuário não poderá mais visualizar dados nem lançar transações.`}
                confirmText="Remover Acesso"
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
                description={`Deseja cancelar o convite enviado para "${inviteToCancel?.inviteeEmail}"? O link de convite deixará de ser válido imediatamente.`}
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
