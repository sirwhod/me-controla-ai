"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { api } from "@/app/lib/axios"
import { toast } from "sonner"
import { Check, MailCheck, X, Loader2 } from "lucide-react"
import { Button } from "@/app/components/ui/button"
import { useSession } from "next-auth/react"

interface InvitationItem {
  id: string
  workspaceId: string
  workspaceName: string
  inviterName: string
  inviterEmail: string
  createdAt: string
}

export function InvitationsBanner() {
  const queryClient = useQueryClient()
  const { data: session } = useSession()

  const { data: invitations = [] } = useQuery<InvitationItem[]>({
    queryKey: ["user-invitations", session?.user?.id],
    queryFn: async () => {
      const res = await api.get<InvitationItem[]>("/invitations")
      return res.data
    },
    enabled: !!session?.user?.id,
  })

  const { mutateAsync: processInvitationMutation, isPending } = useMutation({
    mutationFn: async ({ invitationId, action }: { invitationId: string; action: "accept" | "reject" }) => {
      const res = await api.post<{ message: string }>("/invitations", { invitationId, action })
      return res.data
    },
    onSuccess: (data) => {
      toast.success(data.message)
      queryClient.invalidateQueries({ queryKey: ["user-invitations"] })
      queryClient.invalidateQueries({ queryKey: ["workspaces"] })
    },
    onError: (err: Error) => {
      toast.error(err.message || "Erro ao responder convite.")
    },
  })

  if (invitations.length === 0) return null

  return (
    <div className="space-y-2 mb-4">
      {invitations.map((invite) => (
        <div
          key={invite.id}
          className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 rounded-xl border border-primary/40 bg-primary/10 p-4 shadow-sm backdrop-blur-md"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
              <MailCheck className="h-5 w-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-foreground">
                Convite para Caixinha Compartilhada:{" "}
                <span className="text-primary">{invite.workspaceName}</span>
              </h4>
              <p className="text-xs text-muted-foreground">
                <strong>{invite.inviterName}</strong> ({invite.inviterEmail}) convidou você para gerenciar finanças em conjunto.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-center">
            <Button
              size="sm"
              variant="outline"
              disabled={isPending}
              onClick={() => processInvitationMutation({ invitationId: invite.id, action: "reject" })}
              className="gap-1 text-xs"
            >
              <X className="h-3.5 w-3.5" />
              Recusar
            </Button>
            <Button
              size="sm"
              disabled={isPending}
              onClick={() => processInvitationMutation({ invitationId: invite.id, action: "accept" })}
              className="gap-1 text-xs font-bold shadow-sm"
            >
              {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
              Aceitar Convite
            </Button>
          </div>
        </div>
      ))}
    </div>
  )
}
