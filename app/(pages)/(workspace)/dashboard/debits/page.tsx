"use client"

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/app/components/ui/breadcrumb"
import { Loader } from "@/app/components/ui/loader"
import { Separator } from "@/app/components/ui/separator"
import {
  SidebarTrigger,
} from "@/app/components/ui/sidebar"
import { Skeleton } from "@/app/components/ui/skeleton"
import WorkspaceSelector from "@/app/components/workspace-selector"
import { useWorkspace } from "@/app/hooks/use-workspace"
import { getDebits } from "@/app/http/debits/get-debits"
import { Bank, Category, Debit } from "@/app/types/financial"
import { useQuery } from "@tanstack/react-query"
import Link from "next/link"
import { DataTable } from "./data-table"
import { columns } from "./columns"
import { CreateDebit } from "@/app/components/create-debit"
import { useMemo, useState } from "react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/app/components/ui/select"
import { Input } from "@/app/components/ui/input"
import { Button } from "@/app/components/ui/button"
import { getBanks } from "@/app/http/banks/get-banks"
import { getCategories } from "@/app/http/categories/get-categories"
import { Banknote, CreditCard, Landmark } from "lucide-react"
import { DynamicIcon, IconName } from "lucide-react/dynamic"
import Image from "next/image"

function LoadPage() {
  return (
    <div className="flex w-full flex-col items-center justify-center space-y-8 p-4 h-96">
      <div>
          <div
            className="flex flex-col items-center justify-center gap-2 p-4"
          >
            <Loader size="lg" text="Carregando" />
            <span className="text-muted-foreground text-sm">Carregando</span>
          </div>
      </div>
    </div>
  )
}

const meses = [
  { value: "janeiro", label: "Janeiro" },
  { value: "fevereiro", label: "Fevereiro" },
  { value: "março", label: "Março" },
  { value: "abril", label: "Abril" },
  { value: "maio", label: "Maio" },
  { value: "junho", label: "Junho" },
  { value: "julho", label: "Julho" },
  { value: "agosto", label: "Agosto" },
  { value: "setembro", label: "Setembro" },
  { value: "outubro", label: "Outubro" },
  { value: "novembro", label: "Novembro" },
  { value: "dezembro", label: "Dezembro" },
]

const mesAtual = meses[new Date().getMonth()].value
const anoAtual = String(new Date().getFullYear())


export default function Page() {
  const { workspaceActive, isLoading: isWorkspaceLoading, error: workspaceError } = useWorkspace()

  const { data: debits, isLoading: isDebitsLoading } = useQuery<Debit[], Error>({
    queryKey: ['debits', workspaceActive?.id],
    queryFn: () => getDebits(workspaceActive!.id),
    staleTime: 1000 * 60 * 5,
    enabled: !!workspaceActive && !isWorkspaceLoading && !workspaceError,
  })

  const { data: banks } = useQuery<Bank[], Error>({
      queryKey: ['banks', workspaceActive?.id],
      queryFn: () => getBanks(workspaceActive!.id),
      staleTime: 1000 * 60 * 5,
      enabled: !!workspaceActive && !isWorkspaceLoading && !workspaceError,
    })

  const { data: categories } = useQuery<Category[], Error>({
      queryKey: ['categories', workspaceActive?.id],
      queryFn: () => getCategories(workspaceActive!.id),
      staleTime: 1000 * 60 * 5,
      enabled: !!workspaceActive && !isWorkspaceLoading && !workspaceError,
    })

  // Estados dos filtros
  const [categoryFilter, setCategoryFilter] = useState<string>("")
  const [bankFilter, setBankFilter] = useState<string>("")
  const [paymentMethodFilter, setPaymentMethodFilter] = useState<string>("")
  const [monthFilter, setMonthFilter] = useState<string>(mesAtual)
  const [yearFilter, setYearFilter] = useState<string>(anoAtual)

  // Filtro local dos débitos
  const filteredDebits = useMemo(() => {
    if (!debits) return []
    return debits.filter(debit => {
      const matchCategory = categoryFilter ? debit.categoryId === categoryFilter : true
      const matchBank = bankFilter ? debit.bankId === bankFilter : true
      const matchPayment = paymentMethodFilter ? debit.paymentMethod === paymentMethodFilter : true
      const matchMonth = monthFilter ? debit.month === monthFilter : true
      const matchYear = yearFilter ? String(debit.year) === yearFilter : true

      return matchCategory && matchBank && matchPayment && matchMonth && matchYear
    })
  }, [debits, categoryFilter, bankFilter, paymentMethodFilter, monthFilter, yearFilter])



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
                    {isWorkspaceLoading || !workspaceActive  &&  (
                      <Skeleton className="h-5 w-48" />
                    )}
                    {isWorkspaceLoading &&  (
                      <Skeleton className="h-5 w-48" />
                    )}
                    <WorkspaceSelector />
                  </BreadcrumbPage>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="hidden md:block" />
                <BreadcrumbItem className="hidden md:block">
                  <Link href="#">
                    Dashboard
                  </Link>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>
                    Despesas
                  </BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
          <div className="bg-muted/50 min-h-[100vh] flex-1 rounded-xl md:min-h-min p-4 gap-4 flex flex-col">
            <div className="flex flex-wrap items-center gap-2 justify-between">
             <div className="flex flex-wrap gap-2 mb-2">
                {/* Categoria */}
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="w-40 h-6">
                    <SelectValue placeholder="Todas categorias" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories?.map(cat => (
                      <SelectItem key={cat.id} value={cat.id}>
                        <DynamicIcon
                          name={cat.icon as IconName}
                          className="w-6 md:w-4 h-6 md:h-4"
                        />
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Banco */}
                <Select value={bankFilter} onValueChange={setBankFilter}>
                  <SelectTrigger className="w-40 h-6">
                    <SelectValue placeholder="Todos bancos" />
                  </SelectTrigger>
                  <SelectContent>
                    {banks?.map(bank => (
                      <SelectItem key={bank.id} value={bank.id}>
                        {bank.iconUrl ? (
                          <Image src={bank.iconUrl} alt="" width={28} height={28} className="h-6 w-6 rounded-sm" />
                        ) : (
                          <div className="bg-primary p-1 rounded-xs">
                            <Landmark className="h-4 w-4 text-foreground" />
                          </div>
                        )}
                        {bank.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Método de pagamento */}
                <Select value={paymentMethodFilter} onValueChange={setPaymentMethodFilter}>
                  <SelectTrigger className="w-40 h-6">
                    <SelectValue placeholder="Todos métodos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Crédito">
                      <CreditCard className="w-6 md:w-4 h-6 md:h-4"/>
                      Crédito
                    </SelectItem>
                    <SelectItem value="Débito">
                      <Banknote className="w-6 md:w-4 h-6 md:h-4"/>
                      Débito
                    </SelectItem>
                    <SelectItem value="Pix">
                      <svg fill="currentColor" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg" className="w-6 md:w-4 h-6 md:h-4">
                      <path d="M11.917 11.71a2.046 2.046 0 0 1-1.454-.602l-2.1-2.1a.4.4 0 0 0-.551 0l-2.108 2.108a2.044 2.044 0 0 1-1.454.602h-.414l2.66 2.66c.83.83 2.177.83 3.007 0l2.667-2.668h-.253zM4.25 4.282c.55 0 1.066.214 1.454.602l2.108 2.108a.39.39 0 0 0 .552 0l2.1-2.1a2.044 2.044 0 0 1 1.453-.602h.253L9.503 1.623a2.127 2.127 0 0 0-3.007 0l-2.66 2.66h.414z"/>
                      <path d="m14.377 6.496-1.612-1.612a.307.307 0 0 1-.114.023h-.733c-.379 0-.75.154-1.017.422l-2.1 2.1a1.005 1.005 0 0 1-1.425 0L5.268 5.32a1.448 1.448 0 0 0-1.018-.422h-.9a.306.306 0 0 1-.109-.021L1.623 6.496c-.83.83-.83 2.177 0 3.008l1.618 1.618a.305.305 0 0 1 .108-.022h.901c.38 0 .75-.153 1.018-.421L7.375 8.57a1.034 1.034 0 0 1 1.426 0l2.1 2.1c.267.268.638.421 1.017.421h.733c.04 0 .079.01.114.024l1.612-1.612c.83-.83.83-2.178 0-3.008z"/>
                      </svg>
                      Pix
                    </SelectItem>
                    <SelectItem value="Conta">
                      <Landmark className="w-6 md:w-4 h-6 md:h-4"/>
                      Conta
                    </SelectItem>
                  </SelectContent>
                </Select>

                {/* Período */}
                <Select value={monthFilter} onValueChange={setMonthFilter}>
                  <SelectTrigger className="w-32 h-6">
                    <SelectValue placeholder="Todos meses" />
                  </SelectTrigger>
                  <SelectContent>
                    {meses.map(mes => (
                      <SelectItem key={mes.value} value={mes.value}>{mes.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  type="number"
                  min={2000}
                  max={2100}
                  value={yearFilter}
                  onChange={e => setYearFilter(e.target.value)}
                  className="w-24"
                  placeholder="Ano"
                />

                {/* Botão para limpar filtros */}
                <Button
                  variant="outline"
                  onClick={() => {
                    setCategoryFilter("")
                    setBankFilter("")
                    setPaymentMethodFilter("")
                    setMonthFilter("")
                    setYearFilter("")
                  }}
                >
                  Limpar filtros
                </Button>
              </div>
              <CreateDebit />
            </div>
            {isWorkspaceLoading || !workspaceActive  &&  (
              <LoadPage />
            )}
            {isWorkspaceLoading &&  (
              <LoadPage />
            )}
            {isDebitsLoading && (
              <LoadPage />
            )}
            {debits && (
              <DataTable columns={columns} data={filteredDebits} />
            )}
          </div>
        </div>
    </>
  )
}
