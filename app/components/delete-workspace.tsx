"use client"

import { useState } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useQueryClient } from "@tanstack/react-query"
import { isAxiosError } from "axios"
import { Trash2 } from "lucide-react"
import { toast } from "sonner"
import { api } from "@/app/lib/axios"
import { useWorkspace } from "@/app/hooks/use-workspace"
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import { Label } from "./ui/label"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "./ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from "./ui/dialog"

export function DeleteWorkspace() {
  const { data: session } = useSession()
  const { workspaceActive, refetch } = useWorkspace()
  const queryClient = useQueryClient()
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [name, setName] = useState("")
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!workspaceActive || workspaceActive.ownerId !== session?.user?.id) return null
  const workspace = workspaceActive

  async function handleDelete(event: React.FormEvent) {
    event.preventDefault()
    if (pending || name !== workspace.name) return
    setPending(true)
    setError(null)
    try {
      await api.delete(`/workspaces/${encodeURIComponent(workspace.id)}`, { data: { confirmationName: name } })
      // Remove cached financial records so the deleted workspace cannot flash on navigation.
      queryClient.removeQueries({ predicate: query => query.queryKey.some(key => key === workspace.id) })
      setOpen(false)
      toast.success("Caixinha excluída com sucesso.")
      const result = await refetch()
      router.replace(result.data?.[0] ? `/${result.data[0].id}/dashboard` : "/dashboard")
    } catch (cause) {
      setError(isAxiosError(cause) ? cause.response?.data?.message || "Não foi possível excluir a caixinha. Tente novamente." : "Não foi possível excluir a caixinha. Tente novamente.")
    } finally { setPending(false) }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Excluir caixinha</CardTitle>
        <CardDescription>Exclua permanentemente esta caixinha, seu histórico financeiro, metas, convites e comprovantes. Todos os membros perderão o acesso.</CardDescription>
      </CardHeader>
      <CardContent>
        <Dialog open={open} onOpenChange={next => { if (!pending) { setOpen(next); setName(""); setError(null) } }}>
          <DialogTrigger asChild><Button variant="destructive"><Trash2 data-icon="inline-start" />Excluir caixinha</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Excluir {workspace.name}?</DialogTitle>
              <DialogDescription>Esta ação é permanente. Todos os dados desta caixinha serão excluídos para você e os demais membros. Se esta for sua última caixinha, uma nova caixinha pessoal vazia será criada.</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleDelete} className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="delete-workspace-name">Digite o nome exato: {workspace.name}</Label>
                <Input id="delete-workspace-name" value={name} onChange={event => setName(event.target.value)} disabled={pending} autoComplete="off" aria-describedby={error ? "delete-workspace-error" : undefined} />
              </div>
              {error ? <p id="delete-workspace-error" role="alert" className="text-sm text-destructive">{error}</p> : null}
              <DialogFooter>
                <Button type="button" variant="outline" disabled={pending} onClick={() => { setOpen(false); setName(""); setError(null) }}>Cancelar</Button>
                <Button type="submit" variant="destructive" disabled={pending || name !== workspace.name}>{pending ? "Excluindo..." : "Excluir permanentemente"}</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  )
}
