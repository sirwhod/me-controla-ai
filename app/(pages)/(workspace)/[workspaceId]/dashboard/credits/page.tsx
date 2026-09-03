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
import { getCredits } from "@/app/http/credits/get-credits"
import { getResponsibles } from "@/app/http/responsibles"
import { Bank, Category, PersonResponsible } from "@/app/types/financial"
import { useQuery } from "@tanstack/react-query"
import Link from "@/app/components/context-link"
import { DataTable } from "./data-table"
import { columns } from "./columns"
import { CreateCredit } from "@/app/components/create-credit"
import { useMemo, useState } from "react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/components/ui/select"
import { Button } from "@/app/components/ui/button"
import { getBanks } from "@/app/http/banks/get-banks"
import { DynamicIcon, IconName } from "lucide-react/dynamic"
import Image from "next/image"
import { MONTHS, useDateFilter } from "@/app/contexts/date-filter-context"
import { MonthYearNavigator } from "@/app/components/month-year-navigator"
import { getCategories } from "@/app/http/categories/get-categories"
import { Banknote, CreditCard, HandCoins, Landmark, Tags, X, User, Layers } from "lucide-react"
import { SummaryKpiBar } from "@/app/components/summary-kpi-bar"
import { BottomSheetFilters } from "@/app/components/ui/bottom-sheet-filters"
import { LoadingState } from "@/app/components/states/loading-state"
import { ErrorState } from "@/app/components/states/error-state"
import { EmptyState } from "@/app/components/states/empty-state"
import { PageHeader } from "@/app/components/page-header"
import { isFinancialIconName } from "@/app/lib/icons-catalog"
import { queryKeys } from "@/app/lib/query-keys"

const CREDIT_TYPES = [
  { value: "Comum", label: "Receita Comum" },
  { value: "Fixo", label: "Receita Fixa" },
]

export default function Page() {
  const { workspaceActive, isLoading: isWorkspaceLoading, error: workspaceError } = useWorkspace()
  const { month: monthFilter, year: yearFilterNumber } = useDateFilter()
  const yearFilter = String(yearFilterNumber)

  const {
    data: credits = [],
    isLoading: isCreditsLoading,
    error: creditsError,
    refetch,
  } = useQuery({
    queryKey: queryKeys.credits(workspaceActive?.id || "", monthFilter, yearFilterNumber),
    queryFn: () => getCredits(workspaceActive!.id, { month: monthFilter, year: yearFilter }),
    staleTime: 1000 * 60 * 5,
    enabled: !!workspaceActive && !isWorkspaceLoading && !workspaceError,
  })

  const { data: banks } = useQuery<Bank[], Error>({
    queryKey: ["banks", workspaceActive?.id],
    queryFn: () => getBanks(workspaceActive!.id),
    staleTime: 1000 * 60 * 5,
    enabled: !!workspaceActive && !isWorkspaceLoading && !workspaceError,
  })

  const { data: categories } = useQuery<Category[], Error>({
    queryKey: ["categories", workspaceActive?.id],
    queryFn: () => getCategories(workspaceActive!.id),
    staleTime: 1000 * 60 * 5,
    enabled: !!workspaceActive && !isWorkspaceLoading && !workspaceError,
  })

  const { data: responsibles } = useQuery<PersonResponsible[], Error>({
    queryKey: ["responsibles", workspaceActive?.id],
    queryFn: () => getResponsibles(workspaceActive!.id),
    staleTime: 1000 * 60 * 5,
    enabled: !!workspaceActive && !isWorkspaceLoading && !workspaceError,
  })

  // Filtros locais
  const [categoryFilter, setCategoryFilter] = useState<string>("")
  const [bankFilter, setBankFilter] = useState<string>("")
  const [paymentMethodFilter, setPaymentMethodFilter] = useState<string>("")
  const [responsibleFilter, setResponsibleFilter] = useState<string>("")
  const [typeFilter, setTypeFilter] = useState<string>("")

  const incomeCategories = useMemo(() => {
    return Array.isArray(categories)
      ? categories.filter((cat) => cat.type === "income" || cat.type === "all")
      : []
  }, [categories])

  // Filtragem local de receitas
  const filteredCredits = useMemo(() => {
    if (!credits.length) return []
    return credits.filter((credit) => {
      const matchCategory = categoryFilter ? credit.categoryId === categoryFilter : true
      const matchBank = bankFilter ? credit.bankId === bankFilter : true
      const matchPayment = paymentMethodFilter ? credit.paymentMethod === paymentMethodFilter : true
      const matchResponsible = !responsibleFilter
        ? true
        : responsibleFilter === "none"
        ? !credit.responsibleId
        : credit.responsibleId === responsibleFilter
      const matchType = typeFilter ? credit.type === typeFilter : true
      const matchMonth = monthFilter ? credit.month?.toLowerCase() === monthFilter.toLowerCase() : true
      const matchYear = yearFilter ? String(credit.year) === yearFilter : true

      return (
        matchCategory &&
        matchBank &&
        matchPayment &&
        matchResponsible &&
        matchType &&
        matchMonth &&
        matchYear
      )
    })
  }, [
    credits,
    categoryFilter,
    bankFilter,
    paymentMethodFilter,
    responsibleFilter,
    typeFilter,
    monthFilter,
    yearFilter,
  ])

  // Cálculos consolidados para os cards KPI
  const monthIndex = useMemo(() => {
    const idx = MONTHS.findIndex((m) => m.key.toLowerCase() === monthFilter.toLowerCase())
    return idx >= 0 ? idx : new Date().getMonth()
  }, [monthFilter])

  const daysInMonth = useMemo(() => {
    return new Date(yearFilterNumber, monthIndex + 1, 0).getDate()
  }, [yearFilterNumber, monthIndex])

  const totalCredits = useMemo(() => {
    return filteredCredits.reduce((sum, c) => sum + (Number(c.value) || 0), 0)
  }, [filteredCredits])

  const countCredits = useMemo(() => {
    return filteredCredits.length
  }, [filteredCredits])

  const dailyAverage = useMemo(() => {
    return daysInMonth > 0 ? totalCredits / daysInMonth : 0
  }, [totalCredits, daysInMonth])

  const hasActiveFilters = Boolean(
    categoryFilter || bankFilter || paymentMethodFilter || responsibleFilter || typeFilter
  )

  const clearFilters = () => {
    setCategoryFilter("")
    setBankFilter("")
    setPaymentMethodFilter("")
    setResponsibleFilter("")
    setTypeFilter("")
  }

  const isLoading = isWorkspaceLoading || !workspaceActive || isCreditsLoading
  const error = workspaceError || creditsError

  return (
    <>
      <header className="flex h-14 md:h-16 shrink-0 items-center gap-2 border-b border-border/40 bg-background/95 backdrop-blur-md px-3 md:px-4">
        <div className="flex items-center gap-2 w-full">
          <Link
            href={workspaceActive?.id ? `/${workspaceActive.id}/dashboard` : "/dashboard"}
            className="flex items-center shrink-0 lg:hidden"
            aria-label="MeControla.AI"
          >
            <Logo className="h-6 w-6 text-primary" />
          </Link>
          <SidebarTrigger className="-ml-1 hidden text-muted-foreground hover:text-foreground lg:flex" />
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
              <BreadcrumbSeparator className="hidden lg:block" />
              <BreadcrumbItem className="hidden lg:block">
                <Link href={`${workspaceActive?.id ? `/${workspaceActive.id}` : ""}/dashboard`}>
                  Dashboard
                </Link>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage className="font-semibold text-foreground">
                  Receitas
                </BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </header>

      <div className="mx-auto flex w-full min-w-0 max-w-7xl flex-1 flex-col gap-4 p-3 pt-3 pb-20 md:p-6 md:pt-3 lg:pb-6">
        {/* ========================================================================= */}
        {/* 1. ESTRUTURA MOBILE/TABLET (< 1024px): Header + Período + CTA + Filtros + Listagem */}
        {/* ========================================================================= */}
        <div className="flex w-full flex-col gap-3 lg:hidden">
          {/* Título da Página */}
          <PageHeader title="Receitas" description="Acompanhe e gerencie todas as entradas e receitas desta caixinha." icon={<HandCoins className="size-5 shrink-0 text-success" aria-hidden="true" />} />

          {/* Seletor de Período em Largura Confortável */}
          <MonthYearNavigator
            showFullMonthName
            className="w-full justify-between bg-card/80 border-border/70 h-10 shadow-xs text-xs font-semibold"
          />

          {/* CTA Principal Full Width */}
          <CreateCredit fullWidth className="h-10 font-semibold shadow-xs" />

          {/* Linha de Filtros & Contador de Receitas */}
          <div className="flex items-center justify-between gap-2 pt-1 border-t border-border/30">
            <BottomSheetFilters
              categories={incomeCategories}
              banks={banks}
              responsibles={responsibles}
              types={CREDIT_TYPES}
              categoryFilter={categoryFilter}
              onCategoryChange={setCategoryFilter}
              bankFilter={bankFilter}
              onBankChange={setBankFilter}
              paymentMethodFilter={paymentMethodFilter}
              onPaymentMethodChange={setPaymentMethodFilter}
              responsibleFilter={responsibleFilter}
              onResponsibleChange={setResponsibleFilter}
              typeFilter={typeFilter}
              onTypeChange={setTypeFilter}
              onClearFilters={clearFilters}
              totalCount={filteredCredits.length}
            />

            <span className="text-xs font-bold text-muted-foreground">
              {countCredits} receita{countCredits !== 1 ? "s" : ""}
            </span>
          </div>

          {/* Resumo de Métricas (KPIs) */}
          <SummaryKpiBar
            type="credit"
            total={totalCredits}
            count={countCredits}
            dailyAverage={dailyAverage}
          />
        </div>

        {/* ========================================================================= */}
        {/* 2. ESTRUTURA DESKTOP (>= 1024px): Header Amplo + Filtros Inline           */}
        {/* ========================================================================= */}
        <div className="hidden w-full flex-col gap-4 lg:flex">
          <div className="flex items-center justify-between gap-3">
            <PageHeader title="Receitas" description="Acompanhe e gerencie todas as entradas financeiras desta caixinha." icon={<HandCoins className="size-5 shrink-0 text-success md:size-6" aria-hidden="true" />} />

            <CreateCredit />
          </div>

          {/* Filtros em linha no Desktop */}
          <div className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-xl border border-border/60 bg-card/50">
            <div className="flex flex-wrap items-center gap-2">
              {/* Responsável */}
              <Select value={responsibleFilter} onValueChange={setResponsibleFilter}>
                <SelectTrigger className="w-40 h-9 text-xs font-medium">
                  <div className="flex items-center gap-1.5 truncate">
                    <User className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    <SelectValue placeholder="Responsável" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos responsáveis</SelectItem>
                  <SelectItem value="none">Sem responsável</SelectItem>
                  {responsibles?.map((resp) => (
                    <SelectItem key={resp.id} value={resp.id}>
                      {resp.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Tipo */}
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-36 h-9 text-xs font-medium">
                  <div className="flex items-center gap-1.5 truncate">
                    <Layers className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    <SelectValue placeholder="Tipo" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os tipos</SelectItem>
                  {CREDIT_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Categoria */}
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-40 h-9 text-xs font-medium">
                  <div className="flex items-center gap-1.5 truncate">
                    <Tags className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    <SelectValue placeholder="Categorias" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas categorias</SelectItem>
                  {incomeCategories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {isFinancialIconName(cat.icon) ? (
                        <DynamicIcon name={cat.icon as IconName} className="w-4 h-4 mr-1.5 inline-block" />
                      ) : (
                        <Tags className="w-4 h-4 mr-1.5 inline-block" />
                      )}
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Banco */}
              <Select value={bankFilter} onValueChange={setBankFilter}>
                <SelectTrigger className="w-40 h-9 text-xs font-medium">
                  <div className="flex items-center gap-1.5 truncate">
                    <Landmark className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    <SelectValue placeholder="Bancos" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos bancos</SelectItem>
                  {banks?.map((bank) => (
                    <SelectItem key={bank.id} value={bank.id}>
                      {bank.iconUrl ? (
                        <Image
                          src={bank.iconUrl}
                          alt=""
                          width={18}
                          height={18}
                          className="h-4 w-4 rounded-xs inline-block mr-1.5"
                        />
                      ) : (
                        <Landmark className="h-4 w-4 inline-block mr-1.5 text-muted-foreground" />
                      )}
                      {bank.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Forma de Pagamento */}
              <Select value={paymentMethodFilter} onValueChange={setPaymentMethodFilter}>
                <SelectTrigger className="w-36 h-9 text-xs font-medium">
                  <div className="flex items-center gap-1.5 truncate">
                    <CreditCard className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    <SelectValue placeholder="Pagamento" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas formas</SelectItem>
                  <SelectItem value="Pix">
                    <svg
                      fill="currentColor"
                      viewBox="0 0 16 16"
                      xmlns="http://www.w3.org/2000/svg"
                      className="w-3.5 h-3.5 mr-1.5 inline-block"
                    >
                      <path d="M11.917 11.71a2.046 2.046 0 0 1-1.454-.602l-2.1-2.1a.4.4 0 0 0-.551 0l-2.108 2.108a2.044 2.044 0 0 1-1.454.602h-.414l2.66 2.66c.83.83 2.177.83 3.007 0l2.667-2.668h-.253zM4.25 4.282c.55 0 1.066.214 1.454.602l2.108 2.108a.39.39 0 0 0 .552 0l2.1-2.1a2.044 2.044 0 0 1 1.453-.602h.253L9.503 1.623a2.127 2.127 0 0 0-3.007 0l-2.66 2.66h.414z" />
                      <path d="m14.377 6.496-1.612-1.612a.307.307 0 0 1-.114.023h-.733c-.379 0-.75.154-1.017.422l-2.1 2.1a1.005 1.005 0 0 1-1.425 0L5.268 5.32a1.448 1.448 0 0 0-1.018-.422h-.9a.306.306 0 0 1-.109-.021L1.623 6.496c-.83.83-.83 2.177 0 3.008l1.618 1.618a.305.305 0 0 1 .108-.022h.901c.38 0 .75-.153 1.018-.421L7.375 8.57a1.034 1.034 0 0 1 1.426 0l2.1 2.1c.267.268.638.421 1.017.421h.733c.04 0 .079.01.114.024l1.612-1.612c.83-.83.83-2.178 0-3.008z" />
                    </svg>
                    Pix
                  </SelectItem>
                  <SelectItem value="Conta">
                    <Landmark className="w-4 h-4 mr-1.5 inline-block" />
                    Conta
                  </SelectItem>
                  <SelectItem value="Débito">
                    <Banknote className="w-4 h-4 mr-1.5 inline-block" />
                    Débito
                  </SelectItem>
                  <SelectItem value="Crédito">
                    <CreditCard className="w-4 h-4 mr-1.5 inline-block" />
                    Crédito
                  </SelectItem>
                </SelectContent>
              </Select>

              {/* Período */}
              <MonthYearNavigator compact />

              {/* Limpar Filtros */}
              {hasActiveFilters && (
                <Button
                  variant="outline"
                  size="sm"
                  className="h-9 text-xs gap-1"
                  onClick={clearFilters}
                >
                  <X className="h-3.5 w-3.5" />
                  Limpar
                </Button>
              )}
            </div>
          </div>

          {/* Resumo de Métricas Desktop */}
          <SummaryKpiBar
            type="credit"
            total={totalCredits}
            count={countCredits}
            dailyAverage={dailyAverage}
          />
        </div>

        {/* ========================================================================= */}
        {/* 3. LISTAGEM DE DADOS (MOBILE: RevenueList / DESKTOP: DataTable)          */}
        {/* ========================================================================= */}
        <div className="w-full">
          {isLoading ? (
            <LoadingState variant="list" count={6} />
          ) : error ? (
            <ErrorState
              title="Não foi possível carregar as receitas"
              message={error.message}
              onRetry={() => refetch()}
            />
          ) : filteredCredits.length === 0 ? (
            <EmptyState
              icon={HandCoins}
              title={hasActiveFilters ? "Nenhuma receita encontrada" : "Nenhuma receita neste período"}
              description={hasActiveFilters
                ? "Ajuste ou limpe os filtros para consultar outros lançamentos."
                : "Registre uma receita para começar a acompanhar suas entradas."}
              action={hasActiveFilters
                ? <Button variant="outline" onClick={clearFilters}>Limpar filtros</Button>
                : <CreateCredit />}
            />
          ) : (
            <DataTable
              columns={columns}
              data={filteredCredits}
              hasActiveFilters={hasActiveFilters}
              onClearFilters={clearFilters}
            />
          )}
        </div>
      </div>
    </>
  )
}
