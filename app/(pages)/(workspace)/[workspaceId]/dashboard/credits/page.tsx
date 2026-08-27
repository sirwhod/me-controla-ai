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
import { getCredits } from "@/app/http/credits/get-credits"
import { Bank, Category, Credit } from "@/app/types/financial"
import { useQuery } from "@tanstack/react-query"
import Link from "next/link"
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
import { Banknote, CreditCard, Landmark, Tags, X } from "lucide-react"
import { SummaryKpiBar } from "@/app/components/summary-kpi-bar"
import { BottomSheetFilters } from "@/app/components/ui/bottom-sheet-filters"
import { LoadingState } from "@/app/components/states/loading-state"
import { ErrorState } from "@/app/components/states/error-state"

export default function Page() {
  const { workspaceActive, isLoading: isWorkspaceLoading, error: workspaceError } = useWorkspace()
  const { month: monthFilter, year: yearFilterNumber } = useDateFilter()
  const yearFilter = String(yearFilterNumber)

  const {
    data: credits,
    isLoading: isCreditsLoading,
    error: creditsError,
    refetch,
  } = useQuery<Credit[], Error>({
    queryKey: ["credits", workspaceActive?.id],
    queryFn: () => getCredits(workspaceActive!.id),
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

  // Filtros locais
  const [categoryFilter, setCategoryFilter] = useState<string>("")
  const [bankFilter, setBankFilter] = useState<string>("")
  const [paymentMethodFilter, setPaymentMethodFilter] = useState<string>("")

  const incomeCategories = useMemo(() => {
    return categories?.filter((cat) => cat.type === "income" || cat.type === "all") || categories
  }, [categories])

  // Filtragem local de receitas
  const filteredCredits = useMemo(() => {
    if (!credits) return []
    return credits.filter((credit) => {
      const matchCategory = categoryFilter ? credit.categoryId === categoryFilter : true
      const matchBank = bankFilter ? credit.bankId === bankFilter : true
      const matchPayment = paymentMethodFilter ? credit.paymentMethod === paymentMethodFilter : true
      const matchMonth = monthFilter ? credit.month?.toLowerCase() === monthFilter.toLowerCase() : true
      const matchYear = yearFilter ? String(credit.year) === yearFilter : true

      return matchCategory && matchBank && matchPayment && matchMonth && matchYear
    })
  }, [credits, categoryFilter, bankFilter, paymentMethodFilter, monthFilter, yearFilter])

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

  const hasActiveFilters = Boolean(categoryFilter || bankFilter || paymentMethodFilter)

  const clearFilters = () => {
    setCategoryFilter("")
    setBankFilter("")
    setPaymentMethodFilter("")
  }

  const isLoading = isWorkspaceLoading || !workspaceActive || isCreditsLoading
  const error = workspaceError || creditsError

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
              <BreadcrumbSeparator className="hidden md:block" />
              <BreadcrumbItem className="hidden md:block">
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

      <div className="flex flex-1 flex-col gap-3.5 p-3 md:p-4 pt-3">
        <div className="bg-muted/40 min-h-[calc(100vh-5rem)] md:min-h-min flex-1 rounded-xl p-3 md:p-4 gap-3.5 flex flex-col">
          {/* 1. SEÇÃO DE FILTROS & AÇÃO - MOBILE (md:hidden) */}
          <div className="flex flex-col gap-2.5 md:hidden w-full">
            {/* Barra de Período + Filtros em BottomSheet + CTA */}
            <div className="flex items-center justify-between gap-2 w-full">
              <MonthYearNavigator
                showFullMonthName
                compact
                className="flex-1 justify-between bg-card/80 border-border/70 h-9"
              />

              <BottomSheetFilters
                categories={incomeCategories}
                banks={banks}
                categoryFilter={categoryFilter}
                onCategoryChange={setCategoryFilter}
                bankFilter={bankFilter}
                onBankChange={setBankFilter}
                paymentMethodFilter={paymentMethodFilter}
                onPaymentMethodChange={setPaymentMethodFilter}
                onClearFilters={clearFilters}
                totalCount={filteredCredits.length}
              />

              <div className="shrink-0">
                <CreateCredit />
              </div>
            </div>
          </div>

          {/* 2. SEÇÃO DE FILTROS & AÇÃO - DESKTOP (hidden md:flex) */}
          <div className="hidden md:flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-2">
              {/* Categoria */}
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-44 h-8 text-xs font-medium">
                  <div className="flex items-center gap-1.5 truncate">
                    <Tags className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    <SelectValue placeholder="Todas categorias" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  {incomeCategories?.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      <DynamicIcon
                        name={cat.icon as IconName}
                        className="w-4 h-4 mr-1.5 inline-block"
                      />
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Banco */}
              <Select value={bankFilter} onValueChange={setBankFilter}>
                <SelectTrigger className="w-44 h-8 text-xs font-medium">
                  <div className="flex items-center gap-1.5 truncate">
                    <Landmark className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    <SelectValue placeholder="Todos bancos" />
                  </div>
                </SelectTrigger>
                <SelectContent>
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
                <SelectTrigger className="w-40 h-8 text-xs font-medium">
                  <div className="flex items-center gap-1.5 truncate">
                    <CreditCard className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    <SelectValue placeholder="Todas formas" />
                  </div>
                </SelectTrigger>
                <SelectContent>
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
                  className="h-8 text-xs gap-1"
                  onClick={clearFilters}
                >
                  <X className="h-3 w-3" />
                  Limpar
                </Button>
              )}
            </div>

            <CreateCredit />
          </div>

          {/* 3. CARD COM MÉTRICAS KPI (TOTAL, QTD, MÉDIA POR DIA) */}
          <SummaryKpiBar
            type="credit"
            total={totalCredits}
            count={countCredits}
            dailyAverage={dailyAverage}
          />

          {/* 4. LISTAGEM DE DADOS (MOBILE CARDS / DESKTOP TABLE) */}
          {isLoading ? (
            <LoadingState variant="list" count={6} />
          ) : error ? (
            <ErrorState
              title="Erro ao carregar receitas"
              message={error.message}
              onRetry={() => refetch()}
            />
          ) : (
            <DataTable columns={columns} data={filteredCredits} />
          )}
        </div>
      </div>
    </>
  )
}
