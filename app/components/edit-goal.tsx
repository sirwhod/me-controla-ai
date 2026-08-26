"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { Edit2, Loader2, Save } from "lucide-react"

import { Button } from "@/app/components/ui/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/app/components/ui/dialog"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/app/components/ui/form"
import { Input } from "@/app/components/ui/input"
import { Goal, updateGoalSchema, UpdateGoal as UpdateGoalProps } from "@/app/types/financial"
import { updateGoal } from "@/app/http/goals/update-goal"
import { useWorkspace } from "@/app/hooks/use-workspace"
import { DropdownMenuItem } from "@/app/components/ui/dropdown-menu"

interface EditGoalProps {
  goal: Goal
  asDropdownItem?: boolean
}

export function EditGoal({ goal, asDropdownItem = false }: EditGoalProps) {
  const [open, setOpen] = useState(false)
  const { workspaceActive } = useWorkspace()
  const queryClient = useQueryClient()

  const startDateString = goal.startDate ? new Date(goal.startDate).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10)
  const endDateString = goal.endDate ? new Date(goal.endDate).toISOString().slice(0, 10) : ""

  const form = useForm<UpdateGoalProps>({
    resolver: zodResolver(updateGoalSchema),
    defaultValues: {
      name: goal.name || "",
      targetAmount: goal.targetAmount || 0,
      currentAmount: goal.currentAmount || 0,
      description: goal.description || "",
      startDate: goal.startDate ? new Date(goal.startDate).toISOString() : new Date().toISOString(),
      endDate: goal.endDate ? new Date(goal.endDate).toISOString() : "",
    },
  })

  const { mutateAsync: updateGoalMutation, isPending } = useMutation({
    mutationFn: (data: UpdateGoalProps) =>
      updateGoal(workspaceActive!.id, goal.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["goals", workspaceActive?.id] })
      toast.success("Meta atualizada com sucesso!")
      setOpen(false)
    },
    onError: (err: Error) => {
      toast.error(err.message || "Erro ao atualizar meta.")
    },
  })

  const onSubmit = async (data: UpdateGoalProps) => {
    if (!workspaceActive) return
    await updateGoalMutation(data)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {asDropdownItem ? (
          <DropdownMenuItem
            onSelect={(e) => {
              e.preventDefault()
              setOpen(true)
            }}
            className="cursor-pointer gap-2"
          >
            <Edit2 className="h-4 w-4" />
            Editar meta
          </DropdownMenuItem>
        ) : (
          <Button variant="outline" size="sm" className="gap-1.5">
            <Edit2 className="h-3.5 w-3.5" />
            Editar
          </Button>
        )}
      </DialogTrigger>

      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Editar Meta Financeira</DialogTitle>
          <DialogDescription>
            Atualize o nome, valor alvo ou datas da sua meta.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome da Meta</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Reserva de Emergência, Viagem..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="targetAmount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Valor Alvo (R$)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="0,00"
                        value={field.value || ""}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="currentAmount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Valor Atual (R$)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="0,00"
                        value={field.value || 0}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="startDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data de Início</FormLabel>
                    <FormControl>
                      <Input
                        type="date"
                        defaultValue={startDateString}
                        onChange={(e) => {
                          const val = e.target.value
                          if (val) field.onChange(new Date(val + "T12:00:00Z").toISOString())
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="endDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Prazo Final (opcional)</FormLabel>
                    <FormControl>
                      <Input
                        type="date"
                        defaultValue={endDateString}
                        onChange={(e) => {
                          const val = e.target.value
                          field.onChange(val ? new Date(val + "T12:00:00Z").toISOString() : "")
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição / Notas (opcional)</FormLabel>
                  <FormControl>
                    <Input placeholder="Detalhes do seu objetivo..." value={field.value || ""} onChange={field.onChange} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="justify-between pt-2">
              <DialogClose asChild>
                <Button type="button" variant="secondary">
                  Cancelar
                </Button>
              </DialogClose>
              <Button type="submit" disabled={isPending}>
                {isPending ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                Salvar Alterações
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
