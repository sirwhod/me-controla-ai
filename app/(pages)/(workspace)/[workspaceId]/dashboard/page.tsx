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
import { Skeleton } from "@/app/components/ui/skeleton"
import WorkspaceSelector from "@/app/components/workspace-selector"
import { useWorkspace } from "@/app/hooks/use-workspace"
import { useQuery } from "@tanstack/react-query"
import { getDebits } from "@/app/http/debits/get-debits"
import { getCredits } from "@/app/http/credits/get-credits"
import { getGoals } from "@/app/http/goals/get-goals"
import { Debit, Credit, Goal } from "@/app/types/financial"
import { useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card"
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
import { useDateFilter } from "@/app/contexts/date-filter-context"
import { MonthYearNavigator } from "@/app/components/month-year-navigator"
import { LoadingState } from "@/app/components/states/loading-state"
import { EmptyState } from "@/app/components/states/empty-state"
import { MobileList, MobileListItem } from "@/app/components/data-display/mobile-list"

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

const anoAtual = String(new Date().getFullYear())

export default function Page() {
  const { workspaceActive, isLoading: isWorkspaceLoading, error: workspaceError } = useWorkspace()
  const { month: monthFilter, year: yearFilterNumber } = useDateFilter()
  const yearFilter = String(yearFilterNumber)
  const prefix = workspaceActive?.id ? `/${workspaceActive.id}` : ""

  const { data: debits, isLoading: isDebitsLoading } = useQuery<Debit[], Error>({
    queryKey: ["debits", workspaceActive?.id],
    queryFn: () => getDebits(workspaceActive!.id),
    staleTime: 1000 * 60 * 5,
    enabled: !!workspaceActive && !isWorkspaceLoading && !workspaceError,
  })

  const { data: credits, isLoading: isCreditsLoading } = useQuery<Credit[], Error>({
    queryKey: ["credits", workspaceActive?.id],
    queryFn: () => getCredits(workspaceActive!.id),
    staleTime: 1000 * 60 * 5,
    enabled: !!workspaceActive && !isWorkspaceLoading && !workspaceError,
  })

  const { data: goals, isLoading: isGoalsLoading } = useQuery<Goal[], Error>({
    queryKey: ["goals", workspaceActive?.id],
    queryFn: () => getGoals(workspaceActive!.id),
    staleTime: 1000 * 60 * 5,
    enabled: !!workspaceActive && !isWorkspaceLoading && !workspaceError,
  })

  // Despesas filtradas por período
  const filteredDebits = useMemo(() => {
    if (!debits) return []
    return debits.filter((d) => {
      const matchMonth = monthFilter === "todos" ? true : d.month?.toLowerCase() === monthFilter.toLowerCase()
      const matchYear = yearFilter ? String(d.year) === yearFilter : true
      return matchMonth && matchYear
    })
  }, [debits, monthFilter, yearFilter])

  // Receitas filtradas por período
  const filteredCredits = useMemo(() => {
    if (!credits) return []
    return credits.filter((c) => {
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
      .filter((d) => d.paymentMethod === "Crédito")
      .reduce((acc, curr) => acc + (Number(curr.value) || 0), 0)
  }, [filteredDebits])

  // Agrupamento de despesas por categoria
  const expensesByCategory = useMemo(() => {
    const map: Record<string, { name: string; icon: string; total: number }> = {}
    filteredDebits.forEach((d) => {
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
    filteredDebits.forEach((d) => {
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

    return meses.map((m) => {
      const monthCredits = (credits || [])
        .filter((c) => String(c.year) === targetYear && c.month?.toLowerCase() === m.value.toLowerCase())
        .reduce((sum, c) => sum + (Number(c.value) || 0), 0)

      const monthDebits = (debits || [])
        .filter((d) => String(d.year) === targetYear && d.month?.toLowerCase() === m.value.toLowerCase())
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
      ...annualMonthlyOverview.map((m) => Math.max(m.credits, m.debits)),
      1
    )
  }, [annualMonthlyOverview])

  // Transações recentes (combinando débitos e créditos ordenados por data)
  const recentTransactions = useMemo(() => {
    const list: Array<{
      id: string
      type: "debit" | "credit"
      description: string
      value: number
      date: string
      categoryName?: string
      categoryIcon?: string
      bankName?: string
    }> = []

    filteredDebits.forEach((d) => {
      list.push({
        id: `deb-${d.id}`,
        type: "debit",
        description: d.description,
        value: Number(d.value) || 0,
        date: String(d.date),
        categoryName: d.categoryName || undefined,
        categoryIcon: d.categoryUrl || undefined,
        bankName: d.bankName || undefined,
      })
    })

    filteredCredits.forEach((c) => {
      list.push({
        id: `cred-${c.id}`,
        type: "credit",
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
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage className="font-semibold text-foreground">Dashboard</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </header>

      <div className="flex flex-1 flex-col gap-5 p-3 md:p-6 pt-3">
        <InvitationsBanner />

        {/* Barra superior de boas-vindas, botões de ação e filtros */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">Visão Geral</h1>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Acompanhe suas receitas, despesas, faturas e saldo consolidado.
            </p>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
            <MonthYearNavigator showFullMonthName compact className="flex-1 sm:flex-initial" />
            <div className="flex items-center gap-1.5 shrink-0">
              <CreateCredit />
              <CreateDebit />
            </div>
          </div>
        </div>

        {/* Cards de Métricas Principais (5 cards em grid responsivo) */}
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {/* 1. Saldo / Balanço (Destaque Principal) */}
          <Card className="shadow-xs border-border/70 bg-card/70 backdrop-blur-xs">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Balanço do Período
              </CardTitle>
              <div className={`p-2 rounded-full ${balance >= 0 ? "bg-emerald-500/10 text-emerald-500" : "bg-rose-500/10 text-rose-500"}`}>
                <Wallet className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-7 w-28" />
              ) : (
                <>
                  <div className={`text-xl font-bold ${balance >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}`}>
                    {formatCurrency(balance)}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                    {balance >= 0 ? (
                      <>
                        <TrendingUp className="h-3.5 w-3.5 text-emerald-500 inline" />
                        <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Superávit</span>
                      </>
                    ) : (
                      <>
                        <TrendingDown className="h-3.5 w-3.5 text-rose-500 inline" />
                        <span className="text-rose-600 dark:text-rose-400 font-semibold">Déficit</span>
                      </>
                    )}
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          {/* 2. Total de Receitas */}
          <Card className="shadow-xs border-border/70 bg-card/70">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
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

          {/* 3. Total de Despesas */}
          <Card className="shadow-xs border-border/70 bg-card/70">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Despesas
              </CardTitle>
              <div className="p-2 rounded-full bg-rose-500/10 text-rose-500">
                <ArrowDownCircle className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-7 w-28" />
              ) : (
                <>
                  <div className="text-xl font-bold text-rose-600 dark:text-rose-400">
                    - {formatCurrency(totalDebits)}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {filteredDebits.length} despesa(s)
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          {/* 4. Fatura do Cartão */}
          <Card className="shadow-xs border-border/70 bg-card/70">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Fatura Cartão
              </CardTitle>
              <div className="p-2 rounded-full bg-violet-500/10 text-violet-500">
                <CreditCard className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-7 w-28" />
              ) : (
                <>
                  <div className="text-xl font-bold text-violet-600 dark:text-violet-400">
                    {formatCurrency(creditCardTotal)}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    No cartão de crédito
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          {/* 5. Taxa de Economia */}
          <Card className="shadow-xs border-border/70 bg-card/70">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
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
                  <div className="text-xl font-bold text-foreground">
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
        <Card className="shadow-xs border-border/70 bg-card/70">
          <CardHeader className="pb-2">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
              <div>
                <CardTitle className="text-sm sm:text-base flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-primary" />
                  Evolução Financeira Mensal ({yearFilter || anoAtual})
                </CardTitle>
                <CardDescription className="text-xs">
                  Comparativo de receitas (verde) vs despesas (vermelho) em cada mês
                </CardDescription>
              </div>
              <div className="flex items-center gap-4 text-xs">
                <span className="flex items-center gap-1.5 font-medium">
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 inline-block" />
                  Receitas
                </span>
                <span className="flex items-center gap-1.5 font-medium">
                  <span className="h-2.5 w-2.5 rounded-full bg-rose-500 inline-block" />
                  Despesas
                </span>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            {isLoading ? (
              <Skeleton className="h-32 w-full" />
            ) : (
              <div className="grid grid-cols-6 sm:grid-cols-12 gap-1.5 sm:gap-2 items-end pt-4 pb-2 min-h-[140px]">
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
                            item.credits > 0 ? "bg-emerald-500 group-hover:bg-emerald-400" : "bg-muted/40"
                          }`}
                          style={{ height: item.credits > 0 ? `${creditHeightPct}%` : "4px" }}
                        />
                        {/* Barra de Despesas */}
                        <div
                          title={`${item.fullMonth}: Despesas ${formatCurrency(item.debits)}`}
                          className={`w-2.5 sm:w-3 rounded-t-sm transition-all duration-300 ${
                            item.debits > 0 ? "bg-rose-500 group-hover:bg-rose-400" : "bg-muted/40"
                          }`}
                          style={{ height: item.debits > 0 ? `${debitHeightPct}%` : "4px" }}
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
          <Card className="lg:col-span-4 shadow-xs border-border/70 bg-card/70">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div>
                <CardTitle className="text-sm sm:text-base">Lançamentos Recentes</CardTitle>
                <CardDescription className="text-xs">
                  Últimas movimentações no período selecionado
                </CardDescription>
              </div>
              <div className="flex gap-1.5">
                <Link href={`${prefix}/dashboard/debits`}>
                  <Button variant="outline" size="sm" className="h-7 text-xs px-2.5">
                    Despesas
                  </Button>
                </Link>
                <Link href={`${prefix}/dashboard/credits`}>
                  <Button variant="outline" size="sm" className="h-7 text-xs px-2.5">
                    Receitas
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <LoadingState variant="list" count={4} />
              ) : recentTransactions.length === 0 ? (
                <EmptyState
                  icon={Banknote}
                  title="Nenhum lançamento no período"
                  description="Crie despesas ou receitas para visualizar seu histórico recente."
                />
              ) : (
                <MobileList className="bg-transparent border-0 divide-border/30">
                  {recentTransactions.map((tx) => (
                    <MobileListItem
                      key={tx.id}
                      className="px-0 py-2.5"
                      icon={
                        <div
                          className={`p-2 rounded-lg ${
                            tx.type === "credit"
                              ? "bg-emerald-500/10 text-emerald-500"
                              : "bg-rose-500/10 text-rose-500"
                          }`}
                        >
                          {tx.type === "credit" ? (
                            <ArrowUpCircle className="h-4 w-4" />
                          ) : (
                            <ArrowDownCircle className="h-4 w-4" />
                          )}
                        </div>
                      }
                      title={tx.description}
                      subtitle={
                        <span>
                          {tx.categoryName || "Geral"}
                          {tx.bankName && ` • ${tx.bankName}`}
                        </span>
                      }
                      meta={<span>{tx.date ? format(new Date(tx.date), "dd/MM/yyyy") : ""}</span>}
                      value={`${tx.type === "credit" ? "+" : "-"} ${formatCurrency(tx.value)}`}
                      valueColor={tx.type === "credit" ? "positive" : "negative"}
                    />
                  ))}
                </MobileList>
              )}
            </CardContent>
          </Card>

          {/* Categorias + Formas de Pagamento + Metas (3 colunas) */}
          <div className="lg:col-span-3 flex flex-col gap-6">
            {/* Gastos por Categoria */}
            <Card className="shadow-xs border-border/70 bg-card/70">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm sm:text-base flex items-center gap-2">
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
            <Card className="shadow-xs border-border/70 bg-card/70">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm sm:text-base flex items-center gap-2">
                  <CreditCard className="h-4 w-4 text-violet-500" />
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
                    <div className="p-2.5 rounded-lg border bg-muted/30 flex flex-col">
                      <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                        <CreditCard className="h-3 w-3 text-violet-500" /> Crédito
                      </span>
                      <span className="text-xs font-bold mt-0.5">{formatCurrency(paymentMethodsBreakdown.Crédito || 0)}</span>
                    </div>

                    <div className="p-2.5 rounded-lg border bg-muted/30 flex flex-col">
                      <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                        <span className="text-emerald-500">⚡</span> Pix
                      </span>
                      <span className="text-xs font-bold mt-0.5">{formatCurrency(paymentMethodsBreakdown.Pix || 0)}</span>
                    </div>

                    <div className="p-2.5 rounded-lg border bg-muted/30 flex flex-col">
                      <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                        <Banknote className="h-3 w-3 text-emerald-500" /> Débito
                      </span>
                      <span className="text-xs font-bold mt-0.5">{formatCurrency(paymentMethodsBreakdown.Débito || 0)}</span>
                    </div>

                    <div className="p-2.5 rounded-lg border bg-muted/30 flex flex-col">
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
            <Card className="shadow-xs border-border/70 bg-card/70">
              <CardHeader className="pb-3 flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-sm sm:text-base flex items-center gap-2">
                    <Target className="h-4 w-4 text-emerald-500" />
                    Metas em Andamento
                  </CardTitle>
                </div>
                <Link href={`${prefix}/manage/goals`}>
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
                      const current = Number(goal.currentAmount) || 0
                      const target = Number(goal.targetAmount) || 1
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
