"use client"

import { CalendarIcon, PlusCircle, Target } from "lucide-react"
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
import { useForm } from "react-hook-form"
import { Goal, CreateGoal as CreateGoalProps, createGoalSchema } from "../types/financial" 
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "./ui/form"
import { useMutation, useQuery } from "@tanstack/react-query"
import { createGoal } from "../http/goals/create-goal"
import { useWorkspace } from "../hooks/use-workspace"
import { getGoals } from "../http/goals/get-goals"
import { useEffect, useState } from "react" 
import { Input } from "./ui/input"
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover"
import { cn } from "../lib/utils"
import { format } from "date-fns"
import { Calendar } from "./ui/calendar"

type CreateGoalFormData = CreateGoalProps

export function CreateGoal() {
  const { workspaceActive, isLoading: isWorkspaceLoading, error: workspaceError } = useWorkspace()
  const [modalIsOpen, setModalIsOpen] = useState<boolean>(false)

  const form = useForm<CreateGoalFormData>({
    resolver: zodResolver(createGoalSchema),
    defaultValues: {
      name: "",
      targetAmount: 0,
      description: "",
      startDate: new Date().toISOString(),
      endDate: "",
    },
  })

  const { mutateAsync: createGoalFn } = useMutation({
    mutationFn: createGoal,
  })

  const { refetch } = useQuery<Goal[], Error>({
    queryKey: ['goals', workspaceActive?.id],
    queryFn: () => getGoals(workspaceActive!.id),
    staleTime: 1000 * 60 * 5,
    enabled: !!workspaceActive && !isWorkspaceLoading && !workspaceError,
  })

  async function handleCreateGoalSubmit(data: CreateGoalProps) {
    if (!workspaceActive || isWorkspaceLoading || workspaceError) {
      toast.error("Caixinha não está pronta. Tente novamente.")
      return
    }

    try {
      const response = await createGoalFn({
        workspaceId: workspaceActive.id,
        ...data,
      })

      if (response) {
        refetch()
        toast.success(response.message || "Meta criada com sucesso!")
        setModalIsOpen(false)
        form.reset()
      }
    } catch (error: unknown) {
      const errMessage = error instanceof Error ? error.message : "Ocorreu um erro desconhecido."
      toast.error(`Erro ao criar meta: ${errMessage}`)
    }
  }

  const handleModalOpenChange = (open: boolean) => {
    setModalIsOpen(open)
    if (!open) {
      form.reset()
    }
  }

  useEffect(() => {
    if (modalIsOpen) {
      form.setValue("startDate", new Date().toISOString())
    }
  }, [modalIsOpen, form])

  return (
    <Dialog open={modalIsOpen} onOpenChange={handleModalOpenChange}>
      <DialogTrigger asChild>
        <Button onClick={() => setModalIsOpen(true)} variant="default">
          <PlusCircle className="w-4 h-4 mr-2" />
          Nova Meta
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" />
            Nova Meta Financeira
          </DialogTitle>
          <DialogDescription>
            Defina um objetivo financeiro e valor alvo para acompanhar seu progresso.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleCreateGoalSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome da Meta</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Reserva de Emergência, Viagem" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

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
                      placeholder="R$ 10.000,00"
                      {...field}
                      value={field.value || ''}
                      onChange={e => field.onChange(e.target.value === '' ? '' : Number(e.target.value))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex flex-col md:flex-row gap-2 w-full">
              <FormField
                control={form.control}
                name="startDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col w-full">
                    <FormLabel>Data de Início</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "w-full pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(new Date(field.value), "PPP")
                            ) : (
                              <span>Selecione uma data</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value ? new Date(field.value) : new Date()}
                          onSelect={date => {
                            field.onChange(date ? date.toISOString() : '')
                          }}
                          captionLayout="dropdown"
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="endDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col w-full">
                    <FormLabel>Data Alvo (Opcional)</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "w-full pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(new Date(field.value), "PPP")
                            ) : (
                              <span>Sem data limite</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value ? new Date(field.value) : undefined}
                          onSelect={date => {
                            field.onChange(date ? date.toISOString() : '')
                          }}
                          captionLayout="dropdown"
                        />
                      </PopoverContent>
                    </Popover>
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
                  <FormLabel>Descrição (Opcional)</FormLabel>
                  <FormControl>
                    <Input placeholder="Detalhes ou motivação da meta" {...field} />
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
              <Button type="submit" disabled={form.formState.isSubmitting}>
                <PlusCircle className="h-4 w-4 mr-2" />
                {form.formState.isSubmitting ? "Criando..." : "Criar Meta"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
