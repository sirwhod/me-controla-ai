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
import { Skeleton } from "@/app/components/ui/skeleton"
import WorkspaceSelector from "@/app/components/workspace-selector"
import { useWorkspace } from "@/app/hooks/use-workspace"
import { useQuery } from "@tanstack/react-query"
import { getDebits } from "@/app/http/debits/get-debits"
import { getCredits } from "@/app/http/credits/get-credits"
import { getGoals } from "@/app/http/goals/get-goals"
import { Debit, Credit, Goal } from "@/app/types/financial"
import { useMemo, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/app/components/ui/select"
import { Input } from "@/app/components/ui/input"
import {
  ArrowDownCircle,
  ArrowUpCircle,
  Banknote,
  BarChart3,
  CreditCard,
  Landmark,
  PieChart,
  Target,
  TrendingDown,
  TrendingUp,
  Wallet,
} from "lucide-react"
import { DynamicIcon, IconName } from "lucide-react/dynamic"
import { format } from "date-fns"
import Link from "next/link"
import { Button } from "@/app/components/ui/button"
import { CreateDebit } from "@/app/components/create-debit"
import { CreateCredit } from "@/app/components/create-credit"
import { InvitationsBanner } from "@/app/components/invitations-banner"

const meses = [
  { value: "janeiro", label: "Janeiro", short: "Jan" },
  { value: "fevereiro", label: "Fevereiro", short: "Fev" },
  { value: "março", label: "Março", short: "Mar" },
  { value: "abril", label: "Abril", short: "Abr" },
  { value: "maio", label: "Maio", short: "Mai" },
  { value: "junho", label: "Junho", short: "Jun" },
  { value: "julho", label: "Julho", short: "Jul" },
  { value: "agosto", label: "Agosto", short: "Ago" },
  { value: "setembro", label: "Setembro", short: "Set" },
  { value: "outubro", label: "Outubro", short: "Out" },
  { value: "novembro", label: "Novembro", short: "Nov" },
  { value: "dezembro", label: "Dezembro", short: "Dez" },
]

const mesAtual = meses[new Date().getMonth()].value
const anoAtual = String(new Date().getFullYear())

export default function Page() {
  const { workspaceActive, isLoading: isWorkspaceLoading, error: workspaceError } = useWorkspace()

  const [monthFilter, setMonthFilter] = useState<string>(mesAtual)
  const [yearFilter, setYearFilter] = useState<string>(anoAtual)

  const { data: debits, isLoading: isDebitsLoading } = useQuery<Debit[], Error>({
    queryKey: ['debits', workspaceActive?.id],
    queryFn: () => getDebits(workspaceActive!.id),
    staleTime: 1000 * 60 * 5,
    enabled: !!workspaceActive && !isWorkspaceLoading && !workspaceError,
  })

  const { data: credits, isLoading: isCreditsLoading } = useQuery<Credit[], Error>({
    queryKey: ['credits', workspaceActive?.id],
    queryFn: () => getCredits(workspaceActive!.id),
    staleTime: 1000 * 60 * 5,
    enabled: !!workspaceActive && !isWorkspaceLoading && !workspaceError,
  })

  const { data: goals, isLoading: isGoalsLoading } = useQuery<Goal[], Error>({
    queryKey: ['goals', workspaceActive?.id],
    queryFn: () => getGoals(workspaceActive!.id),
    staleTime: 1000 * 60 * 5,
    enabled: !!workspaceActive && !isWorkspaceLoading && !workspaceError,
  })

  // Despesas filtradas por período
  const filteredDebits = useMemo(() => {
    if (!debits) return []
    return debits.filter(d => {
      const matchMonth = monthFilter === "todos" ? true : d.month?.toLowerCase() === monthFilter.toLowerCase()
      const matchYear = yearFilter ? String(d.year) === yearFilter : true
      return matchMonth && matchYear
    })
  }, [debits, monthFilter, yearFilter])

  // Receitas filtradas por período
  const filteredCredits = useMemo(() => {
    if (!credits) return []
    return credits.filter(c => {
      const matchMonth = monthFilter === "todos" ? true : c.month?.toLowerCase() === monthFilter.toLowerCase()
      const matchYear = yearFilter ? String(c.year) === yearFilter : true
      return matchMonth && matchYear
    })
  }, [credits, monthFilter, yearFilter])

  // Métricas calculadas
  const totalDebits = useMemo(() => {
    return filteredDebits.reduce((acc, curr) => acc + (Number(curr.value) || 0), 0)
  }, [filteredDebits])

  const totalCredits = useMemo(() => {
    return filteredCredits.reduce((acc, curr) => acc + (Number(curr.value) || 0), 0)
  }, [filteredCredits])

  const balance = useMemo(() => {
    return totalCredits - totalDebits
  }, [totalCredits, totalDebits])

  const savingsRate = useMemo(() => {
    if (totalCredits <= 0) return 0
    return Math.round(((totalCredits - totalDebits) / totalCredits) * 100)
  }, [totalCredits, totalDebits])

  // Total de gastos no Cartão de Crédito
  const creditCardTotal = useMemo(() => {
    return filteredDebits
      .filter(d => d.paymentMethod === 'Crédito')
      .reduce((acc, curr) => acc + (Number(curr.value) || 0), 0)
  }, [filteredDebits])

  // Agrupamento de despesas por categoria
  const expensesByCategory = useMemo(() => {
    const map: Record<string, { name: string; icon: string; total: number }> = {}
    filteredDebits.forEach(d => {
      const catName = d.categoryName || "Outros"
      const catIcon = d.categoryUrl || "Tag"
      const val = Number(d.value) || 0
      if (!map[catName]) {
        map[catName] = { name: catName, icon: catIcon, total: 0 }
      }
      map[catName].total += val
    })
    return Object.values(map).sort((a, b) => b.total - a.total)
  }, [filteredDebits])

  // Métodos de Pagamento breakdown
  const paymentMethodsBreakdown = useMemo(() => {
    const map: Record<string, number> = {
      Crédito: 0,
      Pix: 0,
      Débito: 0,
      Conta: 0,
    }
    filteredDebits.forEach(d => {
      const method = d.paymentMethod || "Outros"
      if (map[method] !== undefined) {
        map[method] += Number(d.value) || 0
      } else {
        map[method] = (map[method] || 0) + (Number(d.value) || 0)
      }
    })
    return map
  }, [filteredDebits])

  // Evolução Mensal do Ano Selecionado (12 meses)
  const annualMonthlyOverview = useMemo(() => {
    if (!debits && !credits) return []
    const targetYear = yearFilter || anoAtual

    return meses.map(m => {
      const monthCredits = (credits || [])
        .filter(c => String(c.year) === targetYear && c.month?.toLowerCase() === m.value.toLowerCase())
        .reduce((sum, c) => sum + (Number(c.value) || 0), 0)

      const monthDebits = (debits || [])
        .filter(d => String(d.year) === targetYear && d.month?.toLowerCase() === m.value.toLowerCase())
        .reduce((sum, d) => sum + (Number(d.value) || 0), 0)

      return {
        month: m.short,
        fullMonth: m.label,
        credits: monthCredits,
        debits: monthDebits,
        balance: monthCredits - monthDebits,
      }
    })
  }, [debits, credits, yearFilter])

  const maxMonthlyValue = useMemo(() => {
    return Math.max(
      ...annualMonthlyOverview.map(m => Math.max(m.credits, m.debits)),
      1
    )
  }, [annualMonthlyOverview])

  // Transações recentes (combinando débitos e créditos ordenados por data)
  const recentTransactions = useMemo(() => {
    const list: Array<{
      id: string
      type: 'debit' | 'credit'
      description: string
      value: number
      date: string
      categoryName?: string
      categoryIcon?: string
      bankName?: string
    }> = []

    filteredDebits.forEach(d => {
      list.push({
        id: `deb-${d.id}`,
        type: 'debit',
        description: d.description,
        value: Number(d.value) || 0,
        date: String(d.date),
        categoryName: d.categoryName || undefined,
        categoryIcon: d.categoryUrl || undefined,
        bankName: d.bankName || undefined,
      })
    })

    filteredCredits.forEach(c => {
      list.push({
        id: `cred-${c.id}`,
        type: 'credit',
        description: c.description,
        value: Number(c.value) || 0,
        date: String(c.date),
        categoryName: c.categoryName || undefined,
        categoryIcon: c.categoryUrl || undefined,
        bankName: c.bankName || undefined,
      })
    })

    return list
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 7)
  }, [filteredDebits, filteredCredits])

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(val)
  }

  const isLoading = isWorkspaceLoading || isDebitsLoading || isCreditsLoading || isGoalsLoading

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
                <BreadcrumbPage>
                  {isWorkspaceLoading || !workspaceActive ? (
                    <Skeleton className="h-5 w-48" />
                  ) : (
                    <WorkspaceSelector />
                  )}
                </BreadcrumbPage>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden md:block" />
              <BreadcrumbItem className="hidden md:block">
                <BreadcrumbPage>Dashboard</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </header>

      <div className="flex flex-1 flex-col gap-6 p-4 pt-0">
        <InvitationsBanner />

        {/* Barra superior de boas-vindas, botões de ação e filtros */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Visão Geral</h1>
            <p className="text-sm text-muted-foreground">
              Acompanhe suas receitas, despesas, faturas e saldo da caixinha ativa.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <CreateCredit />
            <CreateDebit />

            <Separator orientation="vertical" className="h-6 hidden sm:block mx-1" />

            <Select value={monthFilter} onValueChange={setMonthFilter}>
              <SelectTrigger className="w-32 h-8 text-xs">
                <SelectValue placeholder="Selecione o mês" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Ano todo</SelectItem>
                {meses.map(m => (
                  <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Input
              type="number"
              min={2000}
              max={2100}
              value={yearFilter}
              onChange={e => setYearFilter(e.target.value)}
              className="w-20 h-8 text-xs"
              placeholder="Ano"
            />
          </div>
        </div>

        {/* Cards de Métricas Principais (5 cards em grid responsivo) */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {/* Saldo / Balanço */}
          <Card className="shadow-xs">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Balanço do Período
              </CardTitle>
              <div className={`p-2 rounded-full ${balance >= 0 ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}>
                <Wallet className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-7 w-28" />
              ) : (
                <>
                  <div className={`text-xl font-bold ${balance >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                    {formatCurrency(balance)}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                    {balance >= 0 ? (
                      <>
                        <TrendingUp className="h-3.5 w-3.5 text-emerald-500 inline" />
                        <span className="text-emerald-600 dark:text-emerald-400 font-medium">Superávit</span>
                      </>
                    ) : (
                      <>
                        <TrendingDown className="h-3.5 w-3.5 text-red-500 inline" />
                        <span className="text-red-600 dark:text-red-400 font-medium">Déficit</span>
                      </>
                    )}
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          {/* Total de Receitas */}
          <Card className="shadow-xs">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Receitas
              </CardTitle>
              <div className="p-2 rounded-full bg-emerald-500/10 text-emerald-500">
                <ArrowUpCircle className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-7 w-28" />
              ) : (
                <>
                  <div className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
                    + {formatCurrency(totalCredits)}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {filteredCredits.length} entrada(s)
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          {/* Total de Despesas */}
          <Card className="shadow-xs">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Despesas
              </CardTitle>
              <div className="p-2 rounded-full bg-red-500/10 text-red-500">
                <ArrowDownCircle className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-7 w-28" />
              ) : (
                <>
                  <div className="text-xl font-bold text-red-600 dark:text-red-400">
                    - {formatCurrency(totalDebits)}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {filteredDebits.length} despesa(s)
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          {/* Fatura do Cartão */}
          <Card className="shadow-xs">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Fatura Cartão
              </CardTitle>
              <div className="p-2 rounded-full bg-purple-500/10 text-purple-500">
                <CreditCard className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-7 w-28" />
              ) : (
                <>
                  <div className="text-xl font-bold text-purple-600 dark:text-purple-400">
                    {formatCurrency(creditCardTotal)}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    No cartão de crédito
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          {/* Taxa de Economia */}
          <Card className="shadow-xs">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Taxa Poupança
              </CardTitle>
              <div className="p-2 rounded-full bg-blue-500/10 text-blue-500">
                <Target className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-7 w-20" />
              ) : (
                <>
                  <div className="text-xl font-bold">
                    {savingsRate > 0 ? `${savingsRate}%` : "0%"}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {savingsRate > 0 ? "Guardado da renda" : "Sem sobra no período"}
                  </p>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Gráfico Comparativo de Evolução Anual (Receitas vs Despesas) */}
        <Card className="shadow-xs">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-primary" />
                  Evolução Financeira Mensal ({yearFilter || anoAtual})
                </CardTitle>
                <CardDescription className="text-xs">
                  Comparativo de receitas (verde) vs despesas (vermelho) em cada mês do ano
                </CardDescription>
              </div>
              <div className="flex items-center gap-4 text-xs">
                <span className="flex items-center gap-1">
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 inline-block" />
                  Receitas
                </span>
                <span className="flex items-center gap-1">
                  <span className="h-2.5 w-2.5 rounded-full bg-red-500 inline-block" />
                  Despesas
                </span>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            {isLoading ? (
              <Skeleton className="h-32 w-full" />
            ) : (
              <div className="grid grid-cols-6 sm:grid-cols-12 gap-2 items-end pt-4 pb-2 min-h-[140px]">
                {annualMonthlyOverview.map((item) => {
                  const creditHeightPct = Math.max(8, Math.round((item.credits / maxMonthlyValue) * 100))
                  const debitHeightPct = Math.max(8, Math.round((item.debits / maxMonthlyValue) * 100))

                  return (
                    <div key={item.month} className="flex flex-col items-center gap-1.5 group">
                      <div className="flex items-end gap-1 h-24 w-full justify-center">
                        {/* Barra de Receitas */}
                        <div
                          title={`${item.fullMonth}: Receitas ${formatCurrency(item.credits)}`}
                          className={`w-2.5 sm:w-3 rounded-t-sm transition-all duration-300 ${
                            item.credits > 0 ? 'bg-emerald-500 group-hover:bg-emerald-400' : 'bg-muted/40'
                          }`}
                          style={{ height: item.credits > 0 ? `${creditHeightPct}%` : '4px' }}
                        />
                        {/* Barra de Despesas */}
                        <div
                          title={`${item.fullMonth}: Despesas ${formatCurrency(item.debits)}`}
                          className={`w-2.5 sm:w-3 rounded-t-sm transition-all duration-300 ${
                            item.debits > 0 ? 'bg-red-500 group-hover:bg-red-400' : 'bg-muted/40'
                          }`}
                          style={{ height: item.debits > 0 ? `${debitHeightPct}%` : '4px' }}
                        />
                      </div>
                      <span className="text-[11px] font-medium text-muted-foreground">
                        {item.month}
                      </span>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Seções Analíticas: Transações Recentes + Categorias + Formas de Pagamento */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
          {/* Lançamentos Recentes (4 colunas) */}
          <Card className="lg:col-span-4 shadow-xs">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base">Lançamentos Recentes</CardTitle>
                <CardDescription className="text-xs">
                  Últimas movimentações no período selecionado
                </CardDescription>
              </div>
              <div className="flex gap-2">
                <Link href={`${workspaceActive?.id ? `/${workspaceActive.id}` : ''}/dashboard/debits`}>
                  <Button variant="outline" size="sm" className="h-7 text-xs">
                    Ver Despesas
                  </Button>
                </Link>
                <Link href={`${workspaceActive?.id ? `/${workspaceActive.id}` : ''}/dashboard/credits`}>
                  <Button variant="outline" size="sm" className="h-7 text-xs">
                    Ver Receitas
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-3">
                  {[...Array(5)].map((_, i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : recentTransactions.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-center text-muted-foreground">
                  <Banknote className="h-8 w-8 mb-2 opacity-40" />
                  <p className="text-sm">Nenhuma transação encontrada no período selecionado.</p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {recentTransactions.map((tx) => (
                    <div
                      key={tx.id}
                      className="flex items-center justify-between p-2.5 rounded-lg border bg-card/50 hover:bg-accent/40 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`p-2 rounded-md ${
                            tx.type === 'credit'
                              ? 'bg-emerald-500/10 text-emerald-500'
                              : 'bg-red-500/10 text-red-500'
                          }`}
                        >
                          {tx.type === 'credit' ? (
                            <ArrowUpCircle className="h-4 w-4" />
                          ) : (
                            <ArrowDownCircle className="h-4 w-4" />
                          )}
                        </div>
                        <div className="flex flex-col">
                          <span className="text-sm font-medium line-clamp-1">{tx.description}</span>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            {tx.categoryName && <span>{tx.categoryName}</span>}
                            {tx.bankName && (
                              <>
                                <span>•</span>
                                <span>{tx.bankName}</span>
                              </>
                            )}
                            <span>•</span>
                            <span>{tx.date ? format(new Date(tx.date), "dd/MM/yyyy") : ""}</span>
                          </div>
                        </div>
                      </div>

                      <div
                        className={`text-sm font-semibold whitespace-nowrap ${
                          tx.type === 'credit'
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : 'text-red-600 dark:text-red-400'
                        }`}
                      >
                        {tx.type === 'credit' ? `+ ${formatCurrency(tx.value)}` : `- ${formatCurrency(tx.value)}`}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Categorias + Formas de Pagamento + Metas (3 colunas) */}
          <div className="lg:col-span-3 flex flex-col gap-6">
            {/* Gastos por Categoria */}
            <Card className="shadow-xs">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <PieChart className="h-4 w-4 text-primary" />
                  Gastos por Categoria
                </CardTitle>
                <CardDescription className="text-xs">
                  Distribuição proporcional de despesas
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-3">
                    {[...Array(4)].map((_, i) => (
                      <Skeleton key={i} className="h-8 w-full" />
                    ))}
                  </div>
                ) : expensesByCategory.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-4">
                    Sem despesas registradas no período.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {expensesByCategory.slice(0, 5).map((cat) => {
                      const percentage = totalDebits > 0 ? Math.round((cat.total / totalDebits) * 100) : 0
                      return (
                        <div key={cat.name} className="space-y-1">
                          <div className="flex items-center justify-between text-xs font-medium">
                            <span className="flex items-center gap-1.5">
                              <DynamicIcon name={cat.icon as IconName} className="h-3.5 w-3.5 text-muted-foreground" />
                              {cat.name}
                            </span>
                            <span>{formatCurrency(cat.total)} ({percentage}%)</span>
                          </div>
                          <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                            <div
                              className="h-full bg-primary rounded-full transition-all duration-300"
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Formas de Pagamento Utilizadas */}
            <Card className="shadow-xs">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <CreditCard className="h-4 w-4 text-purple-500" />
                  Formas de Pagamento (Despesas)
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <Skeleton className="h-16 w-full" />
                ) : totalDebits === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-2">Sem dados no período.</p>
                ) : (
                  <div className="grid grid-cols-2 gap-2.5">
                    <div className="p-2 rounded-lg border bg-muted/30 flex flex-col">
                      <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                        <CreditCard className="h-3 w-3 text-purple-500" /> Crédito
                      </span>
                      <span className="text-xs font-bold mt-0.5">{formatCurrency(paymentMethodsBreakdown.Crédito || 0)}</span>
                    </div>

                    <div className="p-2 rounded-lg border bg-muted/30 flex flex-col">
                      <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                        <svg fill="currentColor" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-teal-500">
                          <path d="M11.917 11.71a2.046 2.046 0 0 1-1.454-.602l-2.1-2.1a.4.4 0 0 0-.551 0l-2.108 2.108a2.044 2.044 0 0 1-1.454.602h-.414l2.66 2.66c.83.83 2.177.83 3.007 0l2.667-2.668h-.253zM4.25 4.282c.55 0 1.066.214 1.454.602l2.108 2.108a.39.39 0 0 0 .552 0l2.1-2.1a2.044 2.044 0 0 1 1.453-.602h.253L9.503 1.623a2.127 2.127 0 0 0-3.007 0l-2.66 2.66h.414z"/>
                        </svg>
                        Pix
                      </span>
                      <span className="text-xs font-bold mt-0.5">{formatCurrency(paymentMethodsBreakdown.Pix || 0)}</span>
                    </div>

                    <div className="p-2 rounded-lg border bg-muted/30 flex flex-col">
                      <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                        <Banknote className="h-3 w-3 text-emerald-500" /> Débito
                      </span>
                      <span className="text-xs font-bold mt-0.5">{formatCurrency(paymentMethodsBreakdown.Débito || 0)}</span>
                    </div>

                    <div className="p-2 rounded-lg border bg-muted/30 flex flex-col">
                      <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                        <Landmark className="h-3 w-3 text-blue-500" /> Conta
                      </span>
                      <span className="text-xs font-bold mt-0.5">{formatCurrency(paymentMethodsBreakdown.Conta || 0)}</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Resumo de Metas */}
            <Card className="shadow-xs">
              <CardHeader className="pb-3 flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Target className="h-4 w-4 text-emerald-500" />
                    Metas em Andamento
                  </CardTitle>
                </div>
                <Link href="/manage/goals">
                  <Button variant="ghost" size="sm" className="h-7 text-xs">
                    Gerenciar
                  </Button>
                </Link>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <Skeleton className="h-12 w-full" />
                ) : !goals || goals.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-2">
                    Nenhuma meta cadastrada ainda.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {goals.slice(0, 3).map((goal) => {
                      const current = goal.currentAmount || 0
                      const target = goal.targetAmount || 1
                      const pct = Math.min(100, Math.round((current / target) * 100))
                      return (
                        <div key={goal.id} className="space-y-1">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-medium">{goal.name}</span>
                            <span className="text-muted-foreground">{pct}%</span>
                          </div>
                          <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                            <div
                              className="h-full bg-emerald-500 rounded-full transition-all duration-300"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </>
  )
}
