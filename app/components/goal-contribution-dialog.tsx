"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { Coins, Loader2, Plus, TrendingUp } from "lucide-react"

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
import { Goal, GoalContribution, createGoalContributionSchema, CreateGoalContribution } from "@/app/types/financial"
import { createGoalContribution, getGoalContributions } from "@/app/http/goals/create-goal-contribution"
import { useWorkspace } from "@/app/hooks/use-workspace"
import { DropdownMenuItem } from "@/app/components/ui/dropdown-menu"
import { formatCurrency } from "@/app/lib/utils"

interface GoalContributionDialogProps {
  goal: Goal
  asDropdownItem?: boolean
}

export function GoalContributionDialog({ goal, asDropdownItem = false }: GoalContributionDialogProps) {
  const [open, setOpen] = useState(false)
  const { workspaceActive } = useWorkspace()
  const queryClient = useQueryClient()

  const form = useForm<CreateGoalContribution>({
    resolver: zodResolver(createGoalContributionSchema),
    defaultValues: {
      value: 0,
      date: new Date().toISOString(),
      description: "",
    },
  })

  const { data: contributions = [], isLoading: isLoadingContributions } = useQuery<GoalContribution[]>({
    queryKey: ["goal-contributions", workspaceActive?.id, goal.id],
    queryFn: () => getGoalContributions(workspaceActive!.id, goal.id),
    enabled: !!workspaceActive && open,
  })

  const { mutateAsync: addContributionMutation, isPending } = useMutation({
    mutationFn: (data: CreateGoalContribution) =>
      createGoalContribution(workspaceActive!.id, goal.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["goals", workspaceActive?.id] })
      queryClient.invalidateQueries({ queryKey: ["goal-contributions", workspaceActive?.id, goal.id] })
      toast.success("Aporte realizado com sucesso!")
      form.reset({
        value: 0,
        date: new Date().toISOString(),
        description: "",
      })
    },
    onError: (err: Error) => {
      toast.error(err.message || "Erro ao registrar aporte.")
    },
  })

  const onSubmit = async (data: CreateGoalContribution) => {
    if (!workspaceActive) return
    await addContributionMutation(data)
  }

  const current = goal.currentAmount || 0
  const target = goal.targetAmount || 1
  const percent = Math.min(Math.round((current / target) * 100), 100)
  const remaining = Math.max(target - current, 0)

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
            <Coins className="h-4 w-4 text-emerald-500" />
            Fazer Aporte
          </DropdownMenuItem>
        ) : (
          <Button variant="outline" size="sm" className="gap-1.5 border-emerald-500/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10">
            <Coins className="h-3.5 w-3.5" />
            Aporte
          </Button>
        )}
      </DialogTrigger>

      <DialogContent className="w-[95vw] max-w-[95vw] sm:max-w-lg max-h-[90vh] overflow-y-auto p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Aportes na Meta: {goal.name}
          </DialogTitle>
          <DialogDescription>
            Registre depósitos e acompanhe a evolução do seu objetivo financeiro.
          </DialogDescription>
        </DialogHeader>

        {/* Goal Summary Box */}
        <div className="rounded-xl border border-border/70 bg-card p-4 space-y-2">
          <div className="flex justify-between text-xs font-semibold">
            <span className="text-muted-foreground">Progresso ({percent}%)</span>
            <span className="text-foreground">
              {formatCurrency(current)} de {formatCurrency(target)}
            </span>
          </div>
          <div className="h-2.5 w-full rounded-full bg-muted overflow-hidden">
            <div className="h-full bg-primary transition-all" style={{ width: `${percent}%` }} />
          </div>
          <div className="flex justify-between text-[11px] text-muted-foreground pt-1">
            <span>Faltam: <strong>{formatCurrency(remaining)}</strong></span>
            <span>Meta: <strong>{goal.name}</strong></span>
          </div>
        </div>

        {/* Contribution Form */}
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3 pt-2">
            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="value"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Valor do Aporte (R$)</FormLabel>
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
                name="date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data do Aporte</FormLabel>
                    <FormControl>
                      <Input
                        type="date"
                        defaultValue={new Date().toISOString().slice(0, 10)}
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
            </div>

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição / Origem (opcional)</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Sobra do mês, Rendimentos..." value={field.value || ""} onChange={field.onChange} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" disabled={isPending} className="w-full gap-2 font-semibold">
              {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              Registrar Aporte
            </Button>
          </form>
        </Form>

        {/* History of Contributions */}
        <div className="pt-2">
          <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground pb-2 border-b border-border/40">
            Histórico de Aportes ({contributions.length})
          </h4>
          <div className="max-h-40 overflow-y-auto space-y-2 mt-2 pr-1">
            {isLoadingContributions ? (
              <div className="text-center py-3 text-xs text-muted-foreground">Carregando histórico...</div>
            ) : contributions.length === 0 ? (
              <div className="text-center py-3 text-xs text-muted-foreground">Nenhum aporte registrado ainda.</div>
            ) : (
              contributions.map((c) => (
                <div key={c.id} className="flex items-center justify-between rounded-lg bg-muted/40 p-2.5 text-xs">
                  <div>
                    <span className="font-semibold text-foreground">{c.description || "Aporte manual"}</span>
                    <span className="block text-[10px] text-muted-foreground">
                      {c.date ? new Date(c.date).toLocaleDateString("pt-BR") : ""}
                    </span>
                  </div>
                  <span className="font-bold text-emerald-500">
                    + {formatCurrency(c.value)}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        <DialogFooter className="pt-2">
          <DialogClose asChild>
            <Button type="button" variant="outline" className="w-full">
              Fechar
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
