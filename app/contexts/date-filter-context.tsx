"use client"

import React, { createContext, useContext, useMemo, useCallback } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"

export interface MonthInfo {
  index: number
  key: string
  label: string
  short: string
}

export const MONTHS: MonthInfo[] = [
  { index: 0, key: "janeiro", label: "Janeiro", short: "Jan." },
  { index: 1, key: "fevereiro", label: "Fevereiro", short: "Fev." },
  { index: 2, key: "março", label: "Março", short: "Mar." },
  { index: 3, key: "abril", label: "Abril", short: "Abr." },
  { index: 4, key: "maio", label: "Maio", short: "Mai." },
  { index: 5, key: "junho", label: "Junho", short: "Jun." },
  { index: 6, key: "julho", label: "Julho", short: "Jul." },
  { index: 7, key: "agosto", label: "Agosto", short: "Ago." },
  { index: 8, key: "setembro", label: "Setembro", short: "Set." },
  { index: 9, key: "outubro", label: "Outubro", short: "Out." },
  { index: 10, key: "novembro", label: "Novembro", short: "Nov." },
  { index: 11, key: "dezembro", label: "Dezembro", short: "Dez." },
]

export function getMonthInfoByKey(key: string): MonthInfo {
  const normalized = key?.toLowerCase().trim()
  const found = MONTHS.find((m) => m.key === normalized)
  if (found) return found
  const now = new Date()
  return MONTHS[now.getMonth()]
}

export function getMonthInfoByIndex(index: number): MonthInfo {
  const normalizedIndex = ((index % 12) + 12) % 12
  return MONTHS[normalizedIndex]
}

interface DateFilterContextValue {
  month: string // e.g. "setembro"
  year: number // e.g. 2026
  monthIndex: number // 0-11
  monthLabel: string // "Setembro"
  monthShort: string // "Set."
  formattedLabel: string // "Set. 2026"
  goToPreviousMonth: () => void
  goToNextMonth: () => void
  setDate: (month: string, year: number) => void
  setYear: (year: number) => void
  goToCurrentMonth: () => void
  queryString: string // "?month=setembro&year=2026"
}

const DateFilterContext = createContext<DateFilterContextValue | undefined>(undefined)

export function DateFilterProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const currentMonthParam = searchParams.get("month")
  const currentYearParam = searchParams.get("year")

  // Obter mês e ano dos query params ou usar data atual como default
  const { monthInfo, year } = useMemo(() => {
    const now = new Date()
    const defaultMonthInfo = MONTHS[now.getMonth()]
    const defaultYear = now.getFullYear()

    let mInfo = defaultMonthInfo
    if (currentMonthParam) {
      mInfo = getMonthInfoByKey(currentMonthParam)
    }

    let y = defaultYear
    if (currentYearParam) {
      const parsedYear = parseInt(currentYearParam, 10)
      if (!isNaN(parsedYear) && parsedYear >= 2000 && parsedYear <= 2100) {
        y = parsedYear
      }
    }

    return { monthInfo: mInfo, year: y }
  }, [currentMonthParam, currentYearParam])

  // Função para sincronizar com os query params da URL
  const updateUrlParams = useCallback(
    (newMonthKey: string, newYear: number) => {
      const params = new URLSearchParams(searchParams.toString())
      params.set("month", newMonthKey)
      params.set("year", String(newYear))
      router.replace(`${pathname}?${params.toString()}`, { scroll: false })
    },
    [pathname, router, searchParams]
  )

  const goToPreviousMonth = useCallback(() => {
    let newIndex = monthInfo.index - 1
    let newYear = year
    if (newIndex < 0) {
      newIndex = 11
      newYear -= 1
    }
    const targetMonth = MONTHS[newIndex]
    updateUrlParams(targetMonth.key, newYear)
  }, [monthInfo.index, year, updateUrlParams])

  const goToNextMonth = useCallback(() => {
    let newIndex = monthInfo.index + 1
    let newYear = year
    if (newIndex > 11) {
      newIndex = 0
      newYear += 1
    }
    const targetMonth = MONTHS[newIndex]
    updateUrlParams(targetMonth.key, newYear)
  }, [monthInfo.index, year, updateUrlParams])

  const setDate = useCallback(
    (newMonth: string, newYear: number) => {
      const info = getMonthInfoByKey(newMonth)
      updateUrlParams(info.key, newYear)
    },
    [updateUrlParams]
  )

  const setYear = useCallback(
    (newYear: number) => {
      updateUrlParams(monthInfo.key, newYear)
    },
    [monthInfo.key, updateUrlParams]
  )

  const goToCurrentMonth = useCallback(() => {
    const now = new Date()
    const info = MONTHS[now.getMonth()]
    updateUrlParams(info.key, now.getFullYear())
  }, [updateUrlParams])

  const queryString = useMemo(() => {
    return `?month=${monthInfo.key}&year=${year}`
  }, [monthInfo.key, year])

  const value: DateFilterContextValue = {
    month: monthInfo.key,
    year,
    monthIndex: monthInfo.index,
    monthLabel: monthInfo.label,
    monthShort: monthInfo.short,
    formattedLabel: `${monthInfo.short} ${year}`,
    goToPreviousMonth,
    goToNextMonth,
    setDate,
    setYear,
    goToCurrentMonth,
    queryString,
  }

  return (
    <DateFilterContext.Provider value={value}>
      {children}
    </DateFilterContext.Provider>
  )
}

export function useDateFilter() {
  const context = useContext(DateFilterContext)
  if (!context) {
    throw new Error("useDateFilter must be used within a DateFilterProvider")
  }
  return context
}
