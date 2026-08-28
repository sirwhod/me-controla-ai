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
import { Logo } from "@/app/components/logo"
import WorkspaceSelector from "@/app/components/workspace-selector"
import { useWorkspace } from "@/app/hooks/use-workspace"
import { useQuery } from "@tanstack/react-query"
import { getDebits } from "@/app/http/debits/get-debits"
import { getCredits } from "@/app/http/credits/get-credits"
import { getMonthlySummary } from "@/app/http/summary/get-monthly-summary"
import { getAnnualSummary } from "@/app/http/summary/get-annual-summary"
import { getGoals } from "@/app/http/goals/get-goals"
import { Debit, Credit, Goal } from "@/app/types/financial"
import { useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card"
import {
  ArrowDownCircle,
  ArrowUpCircle,
  Banknote,
  BarChart3,
  ChevronRight,
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
    queryKey: ["debits", workspaceActive?.id, monthFilter, yearFilter],
    queryFn: () => getDebits(workspaceActive!.id, { month: monthFilter, year: yearFilter }),
    staleTime: 1000 * 60 * 5,
    enabled: !!workspaceActive && !isWorkspaceLoading && !workspaceError,
  })

  const { data: credits, isLoading: isCreditsLoading } = useQuery<Credit[], Error>({
    queryKey: ["credits", workspaceActive?.id, monthFilter, yearFilter],
    queryFn: () => getCredits(workspaceActive!.id, { month: monthFilter, year: yearFilter }),
    staleTime: 1000 * 60 * 5,
    enabled: !!workspaceActive && !isWorkspaceLoading && !workspaceError,
  })
  const { data: monthlySummary } = useQuery({
    queryKey: ["monthly-summary", workspaceActive?.id, monthFilter, yearFilter],
    queryFn: () => getMonthlySummary(workspaceActive!.id, monthFilter, Number(yearFilter)),
    enabled: Boolean(workspaceActive?.id && monthFilter !== "todos" && yearFilter !== "todos"),
    staleTime: 60_000,
  })
  const { data: annualSummary } = useQuery({
    queryKey: ["annual-summary", workspaceActive?.id, yearFilter],
    queryFn: () => getAnnualSummary(workspaceActive!.id, Number(yearFilter || anoAtual)),
    enabled: Boolean(workspaceActive?.id && yearFilter !== "todos"),
    staleTime: 60_000,
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
    if (monthlySummary) return monthlySummary.totalExpenses
    return filteredDebits.reduce((acc, curr) => acc + (Number(curr.value) || 0), 0)
  }, [filteredDebits, monthlySummary])

  const totalCredits = useMemo(() => {
    if (monthlySummary) return monthlySummary.totalIncome
    return filteredCredits.reduce((acc, curr) => acc + (Number(curr.value) || 0), 0)
  }, [filteredCredits, monthlySummary])

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
    const hasCompleteSummary = annualSummary?.length === 12 && annualSummary.every((item) => item.ready)
    if (hasCompleteSummary) {
      return meses.map((m, index) => ({
        month: m.short,
        fullMonth: m.label,
        credits: annualSummary[index].totalIncome,
        debits: annualSummary[index].totalExpenses,
        balance: annualSummary[index].balance,
      }))
    }

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
  }, [debits, credits, yearFilter, annualSummary])

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
      .slice(0, 5)
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
          <Link
            href={workspaceActive?.id ? `/${workspaceActive.id}/dashboard` : "/dashboard"}
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
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage className="font-semibold text-foreground">Dashboard</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </header>

      <div className="flex flex-1 flex-col gap-4 md:gap-5 p-3 md:p-6 pt-3 max-w-7xl w-full mx-auto pb-20 md:pb-6">
        <InvitationsBanner />

        {/* ========================================================================= */}
        {/* 1. HEADER & CONTROLES MOBILE (< 768px): Cascata limpa                     */}
        {/* ========================================================================= */}
        <div className="flex flex-col gap-3 md:hidden w-full">
          <div className="flex flex-col">
            <h1 className="text-xl font-bold tracking-tight text-foreground">Visão Geral</h1>
            <p className="text-xs text-muted-foreground">
              Resumo financeiro da caixinha no período selecionado.
            </p>
          </div>

          {/* Seletor de Período em largura total */}
          <MonthYearNavigator
            showFullMonthName
            className="w-full justify-between bg-card/80 border-border/70 h-10 shadow-xs text-xs font-semibold"
          />

          {/* Ações Rápidas: Despesa (Primário) e Receita (Secundário) */}
          <div className="grid grid-cols-2 gap-2 w-full">
            <CreateDebit fullWidth className="h-10 font-semibold shadow-xs" label="Nova Despesa" />
            <CreateCredit
              fullWidth
              className="h-10 font-semibold shadow-xs bg-secondary text-secondary-foreground hover:bg-secondary/80 border border-border/60"
              label="Nova Receita"
            />
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 2. HEADER & CONTROLES DESKTOP (>= 768px): Header amplo                    */}
        {/* ========================================================================= */}
        <div className="hidden md:flex items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Visão Geral</h1>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Acompanhe suas receitas, despesas, faturas e saldo consolidado.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <MonthYearNavigator showFullMonthName compact />
            <CreateCredit label="Nova Receita" className="bg-secondary text-secondary-foreground hover:bg-secondary/80 border border-border/60" />
            <CreateDebit label="Nova Despesa" />
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 3. RESUMO FINANCEIRO PRINCIPAL (PRIMEIRA DOBRA)                           */}
        {/* ========================================================================= */}
        {/* Mobile: Balanço em destaque + 4 cards compactos (2x2) */}
        <div className="flex flex-col gap-2.5 md:hidden w-full">
          {/* Card Principal: Balanço do Período */}
          <Card className="shadow-xs border-border/70 bg-card/80 backdrop-blur-xs p-3.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                Balanço do Período
              </span>
              <div
                className={`p-1.5 rounded-lg ${
                  balance >= 0 ? "bg-emerald-500/10 text-emerald-500" : "bg-rose-500/10 text-rose-500"
                }`}
              >
                <Wallet className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-1">
              {isLoading ? (
                <Skeleton className="h-8 w-36" />
              ) : (
                <div
                  className={`text-2xl font-bold tracking-tight ${
                    balance >= 0 ? "text-emerald-500" : "text-rose-500"
                  }`}
                >
                  {formatCurrency(balance)}
                </div>
              )}
            </div>
            <div className="text-[11px] text-muted-foreground mt-1 flex items-center gap-1">
              {balance >= 0 ? (
                <>
                  <TrendingUp className="h-3.5 w-3.5 text-emerald-500 inline" />
                  <span className="text-emerald-500 font-semibold">Superávit no período</span>
                </>
              ) : (
                <>
                  <TrendingDown className="h-3.5 w-3.5 text-rose-500 inline" />
                  <span className="text-rose-500 font-semibold">Déficit no período</span>
                </>
              )}
            </div>
          </Card>

          {/* Grid 2x2 de Cards Secundários */}
          <div className="grid grid-cols-2 gap-2">
            {/* Receitas */}
            <Card className="shadow-xs border-border/70 bg-card/70 p-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Receitas
                </span>
                <ArrowUpCircle className="h-3.5 w-3.5 text-emerald-500" />
              </div>
              <div className="text-sm sm:text-base font-bold text-emerald-500 mt-1 truncate">
                {isLoading ? <Skeleton className="h-5 w-20" /> : `+ ${formatCurrency(totalCredits)}`}
              </div>
              <span className="text-[10px] text-muted-foreground mt-0.5 block">
                {filteredCredits.length} entrada(s)
              </span>
            </Card>

            {/* Despesas */}
            <Card className="shadow-xs border-border/70 bg-card/70 p-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Despesas
                </span>
                <ArrowDownCircle className="h-3.5 w-3.5 text-rose-500" />
              </div>
              <div className="text-sm sm:text-base font-bold text-rose-500 mt-1 truncate">
                {isLoading ? <Skeleton className="h-5 w-20" /> : `- ${formatCurrency(totalDebits)}`}
              </div>
              <span className="text-[10px] text-muted-foreground mt-0.5 block">
                {filteredDebits.length} despesa(s)
              </span>
            </Card>

            {/* Fatura Cartão */}
            <Card className="shadow-xs border-border/70 bg-card/70 p-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Fatura Cartão
                </span>
                <CreditCard className="h-3.5 w-3.5 text-violet-500" />
              </div>
              <div className="text-sm sm:text-base font-bold text-violet-400 mt-1 truncate">
                {isLoading ? <Skeleton className="h-5 w-20" /> : formatCurrency(creditCardTotal)}
              </div>
              <span className="text-[10px] text-muted-foreground mt-0.5 block">No crédito</span>
            </Card>

            {/* Taxa Poupança */}
            <Card className="shadow-xs border-border/70 bg-card/70 p-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Poupança
                </span>
                <Target className="h-3.5 w-3.5 text-blue-500" />
              </div>
              <div className="text-sm sm:text-base font-bold text-foreground mt-1 truncate">
                {isLoading ? <Skeleton className="h-5 w-16" /> : `${savingsRate > 0 ? savingsRate : 0}%`}
              </div>
              <span className="text-[10px] text-muted-foreground mt-0.5 block truncate">
                {savingsRate > 0 ? "Guardado" : "Sem sobra"}
              </span>
            </Card>
          </div>
        </div>

        {/* Desktop: 5 cards em grid equilibrado */}
        <div className="hidden md:grid gap-3 grid-cols-5">
          {/* 1. Saldo / Balanço */}
          <Card className="shadow-xs border-border/70 bg-card/70">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Balanço
              </CardTitle>
              <div
                className={`p-1.5 rounded-lg ${
                  balance >= 0 ? "bg-emerald-500/10 text-emerald-500" : "bg-rose-500/10 text-rose-500"
                }`}
              >
                <Wallet className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-7 w-28" />
              ) : (
                <>
                  <div
                    className={`text-lg sm:text-xl font-bold ${
                      balance >= 0 ? "text-emerald-500" : "text-rose-500"
                    }`}
                  >
                    {formatCurrency(balance)}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                    {balance >= 0 ? (
                      <>
                        <TrendingUp className="h-3.5 w-3.5 text-emerald-500 inline" />
                        <span className="text-emerald-500 font-medium">Superávit</span>
                      </>
                    ) : (
                      <>
                        <TrendingDown className="h-3.5 w-3.5 text-rose-500 inline" />
                        <span className="text-rose-500 font-medium">Déficit</span>
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
              <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-500">
                <ArrowUpCircle className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-7 w-28" />
              ) : (
                <>
                  <div className="text-lg sm:text-xl font-bold text-emerald-500">
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
              <div className="p-1.5 rounded-lg bg-rose-500/10 text-rose-500">
                <ArrowDownCircle className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-7 w-28" />
              ) : (
                <>
                  <div className="text-lg sm:text-xl font-bold text-rose-500">
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
              <div className="p-1.5 rounded-lg bg-violet-500/10 text-violet-500">
                <CreditCard className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-7 w-28" />
              ) : (
                <>
                  <div className="text-lg sm:text-xl font-bold text-violet-400">
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
              <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-500">
                <Target className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-7 w-20" />
              ) : (
                <>
                  <div className="text-lg sm:text-xl font-bold text-foreground">
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

        {/* ========================================================================= */}
        {/* 4. EVOLUÇÃO FINANCEIRA ANUAL                                              */}
        {/* ========================================================================= */}
        <Card className="shadow-xs border-border/70 bg-card/70">
          <CardHeader className="p-3.5 sm:p-5 pb-2 sm:pb-3">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
              <div>
                <CardTitle className="text-sm sm:text-base flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-primary" />
                  Evolução Financeira Mensal ({yearFilter || anoAtual})
                </CardTitle>
                <CardDescription className="text-xs">
                  Comparativo de receitas (verde) vs despesas (vermelho)
                </CardDescription>
              </div>
              <div className="flex items-center gap-3 text-xs">
                <span className="flex items-center gap-1.5 font-medium">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 inline-block" />
                  Receitas
                </span>
                <span className="flex items-center gap-1.5 font-medium">
                  <span className="h-2 w-2 rounded-full bg-rose-500 inline-block" />
                  Despesas
                </span>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-3.5 sm:p-5 pt-0 sm:pt-0">
            {isLoading ? (
              <Skeleton className="h-28 w-full" />
            ) : (
              <div className="grid grid-cols-6 sm:grid-cols-12 gap-1.5 sm:gap-2 items-end pt-3 pb-1 min-h-[120px]">
                {annualMonthlyOverview.map((item) => {
                  const creditHeightPct = Math.max(8, Math.round((item.credits / maxMonthlyValue) * 100))
                  const debitHeightPct = Math.max(8, Math.round((item.debits / maxMonthlyValue) * 100))

                  return (
                    <div key={item.month} className="flex flex-col items-center gap-1 group">
                      <div className="flex items-end gap-1 h-20 sm:h-24 w-full justify-center">
                        {/* Barra de Receitas */}
                        <div
                          title={`${item.fullMonth}: Receitas ${formatCurrency(item.credits)}`}
                          className={`w-2 sm:w-2.5 rounded-t-xs transition-all duration-300 ${
                            item.credits > 0 ? "bg-emerald-500 group-hover:bg-emerald-400" : "bg-muted/30"
                          }`}
                          style={{ height: item.credits > 0 ? `${creditHeightPct}%` : "4px" }}
                        />
                        {/* Barra de Despesas */}
                        <div
                          title={`${item.fullMonth}: Despesas ${formatCurrency(item.debits)}`}
                          className={`w-2 sm:w-2.5 rounded-t-xs transition-all duration-300 ${
                            item.debits > 0 ? "bg-rose-500 group-hover:bg-rose-400" : "bg-muted/30"
                          }`}
                          style={{ height: item.debits > 0 ? `${debitHeightPct}%` : "4px" }}
                        />
                      </div>
                      <span className="text-[10px] sm:text-xs font-medium text-muted-foreground">
                        {item.month}
                      </span>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* ========================================================================= */}
        {/* 5. LANÇAMENTOS RECENTES + GASTOS POR CATEGORIA + METAS                   */}
        {/* ========================================================================= */}
        <div className="grid gap-4 md:gap-6 md:grid-cols-2 lg:grid-cols-7">
          {/* Lançamentos Recentes (4 colunas) */}
          <Card className="lg:col-span-4 shadow-xs border-border/70 bg-card/70">
            <CardHeader className="p-3.5 sm:p-5 flex flex-row items-center justify-between pb-2 sm:pb-3">
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
            <CardContent className="p-3.5 sm:p-5 pt-0 sm:pt-0">
              {isLoading ? (
                <LoadingState variant="list" count={4} />
              ) : recentTransactions.length === 0 ? (
                <EmptyState
                  icon={Banknote}
                  title="Nenhum lançamento no período"
                  description="Crie despesas ou receitas para visualizar seu histórico recente."
                />
              ) : (
                <div className="divide-y divide-border/40">
                  {recentTransactions.map((tx) => (
                    <div
                      key={tx.id}
                      className="flex items-center justify-between py-2.5 first:pt-0 last:pb-0 gap-3"
                    >
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        <div
                          className={`p-2 rounded-lg shrink-0 ${
                            tx.type === "credit"
                              ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"
                              : "bg-rose-500/10 text-rose-500 border border-rose-500/20"
                          }`}
                        >
                          {tx.type === "credit" ? (
                            <ArrowUpCircle className="h-4 w-4" />
                          ) : (
                            <ArrowDownCircle className="h-4 w-4" />
                          )}
                        </div>
                        <div className="flex flex-col min-w-0 flex-1">
                          <span className="font-semibold text-xs sm:text-sm text-foreground truncate">
                            {tx.description}
                          </span>
                          <span className="text-[11px] text-muted-foreground truncate">
                            {tx.categoryName || "Geral"}
                            {tx.bankName && ` • ${tx.bankName}`}
                            {tx.date && ` • ${format(new Date(tx.date), "dd/MM/yyyy")}`}
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-col items-end shrink-0">
                        <span
                          className={`text-xs sm:text-sm font-bold ${
                            tx.type === "credit" ? "text-emerald-500" : "text-rose-500"
                          }`}
                        >
                          {tx.type === "credit" ? "+" : "-"} {formatCurrency(tx.value)}
                        </span>
                      </div>
                    </div>
                  ))}

                  <div className="pt-2">
                    <Link href={`${prefix}/dashboard/debits`}>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full text-xs text-muted-foreground hover:text-foreground h-8 justify-between"
                      >
                        <span>Ver todas as despesas</span>
                        <ChevronRight className="h-3.5 w-3.5" />
                      </Button>
                    </Link>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Categorias + Formas de Pagamento + Metas (3 colunas) */}
          <div className="lg:col-span-3 flex flex-col gap-4 md:gap-6">
            {/* Gastos por Categoria */}
            <Card className="shadow-xs border-border/70 bg-card/70">
              <CardHeader className="p-3.5 sm:p-5 pb-2 sm:pb-3">
                <CardTitle className="text-sm sm:text-base flex items-center gap-2">
                  <PieChart className="h-4 w-4 text-primary" />
                  Gastos por Categoria
                </CardTitle>
                <CardDescription className="text-xs">
                  Distribuição de despesas no período
                </CardDescription>
              </CardHeader>
              <CardContent className="p-3.5 sm:p-5 pt-0 sm:pt-0">
                {isLoading ? (
                  <div className="space-y-2.5">
                    {[...Array(3)].map((_, i) => (
                      <Skeleton key={i} className="h-6 w-full" />
                    ))}
                  </div>
                ) : expensesByCategory.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-3">
                    Sem despesas registradas no período.
                  </p>
                ) : (
                  <div className="space-y-2.5">
                    {expensesByCategory.slice(0, 4).map((cat) => {
                      const percentage = totalDebits > 0 ? Math.round((cat.total / totalDebits) * 100) : 0
                      return (
                        <div key={cat.name} className="space-y-1">
                          <div className="flex items-center justify-between text-xs font-medium">
                            <span className="flex items-center gap-1.5 truncate">
                              <DynamicIcon name={cat.icon as IconName} className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                              <span className="truncate">{cat.name}</span>
                            </span>
                            <span className="shrink-0 text-muted-foreground">
                              <strong className="text-foreground">{formatCurrency(cat.total)}</strong> ({percentage}%)
                            </span>
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
              <CardHeader className="p-3.5 sm:p-5 pb-2 sm:pb-3">
                <CardTitle className="text-sm sm:text-base flex items-center gap-2">
                  <CreditCard className="h-4 w-4 text-violet-500" />
                  Formas de Pagamento
                </CardTitle>
              </CardHeader>
              <CardContent className="p-3.5 sm:p-5 pt-0 sm:pt-0">
                {isLoading ? (
                  <Skeleton className="h-14 w-full" />
                ) : totalDebits === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-2">Sem dados no período.</p>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    <div className="p-2 rounded-lg border border-border/40 bg-muted/20 flex flex-col">
                      <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                        <CreditCard className="h-3 w-3 text-violet-500" /> Crédito
                      </span>
                      <span className="text-xs font-bold mt-0.5 text-foreground truncate">
                        {formatCurrency(paymentMethodsBreakdown.Crédito || 0)}
                      </span>
                    </div>

                    <div className="p-2 rounded-lg border border-border/40 bg-muted/20 flex flex-col">
                      <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                        <span className="text-emerald-500 font-bold">⚡</span> Pix
                      </span>
                      <span className="text-xs font-bold mt-0.5 text-foreground truncate">
                        {formatCurrency(paymentMethodsBreakdown.Pix || 0)}
                      </span>
                    </div>

                    <div className="p-2 rounded-lg border border-border/40 bg-muted/20 flex flex-col">
                      <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                        <Banknote className="h-3 w-3 text-emerald-500" /> Débito
                      </span>
                      <span className="text-xs font-bold mt-0.5 text-foreground truncate">
                        {formatCurrency(paymentMethodsBreakdown.Débito || 0)}
                      </span>
                    </div>

                    <div className="p-2 rounded-lg border border-border/40 bg-muted/20 flex flex-col">
                      <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                        <Landmark className="h-3 w-3 text-blue-500" /> Conta
                      </span>
                      <span className="text-xs font-bold mt-0.5 text-foreground truncate">
                        {formatCurrency(paymentMethodsBreakdown.Conta || 0)}
                      </span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Resumo de Metas */}
            <Card className="shadow-xs border-border/70 bg-card/70">
              <CardHeader className="p-3.5 sm:p-5 flex flex-row items-center justify-between pb-2 sm:pb-3">
                <CardTitle className="text-sm sm:text-base flex items-center gap-2">
                  <Target className="h-4 w-4 text-emerald-500" />
                  Metas em Andamento
                </CardTitle>
                <Link href={`${prefix}/manage/goals`}>
                  <Button variant="ghost" size="sm" className="h-7 text-xs px-2">
                    Ver metas
                  </Button>
                </Link>
              </CardHeader>
              <CardContent className="p-3.5 sm:p-5 pt-0 sm:pt-0">
                {isLoading ? (
                  <Skeleton className="h-10 w-full" />
                ) : !goals || goals.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-2">
                    Nenhuma meta cadastrada ainda.
                  </p>
                ) : (
                  <div className="space-y-2.5">
                    {goals.slice(0, 3).map((goal) => {
                      const current = Number(goal.currentAmount) || 0
                      const target = Number(goal.targetAmount) || 1
                      const pct = Math.min(100, Math.round((current / target) * 100))
                      return (
                        <div key={goal.id} className="space-y-1">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-medium truncate">{goal.name}</span>
                            <span className="text-muted-foreground shrink-0">{pct}%</span>
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
