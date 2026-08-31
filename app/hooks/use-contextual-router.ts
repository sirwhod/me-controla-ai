"use client"

import { useMemo } from "react"
import { useRouter as useNextRouter } from "next/navigation"

import { useDateFilter } from "@/app/contexts/date-filter-context"
import { withDateQuery } from "@/app/lib/contextual-navigation"

export function useContextualRouter() {
  const router = useNextRouter()
  const { queryString } = useDateFilter()

  return useMemo(
    () => ({
      ...router,
      push: (
        href: string,
        options?: Parameters<typeof router.push>[1]
      ) => router.push(withDateQuery(href, queryString), options),
      replace: (
        href: string,
        options?: Parameters<typeof router.replace>[1]
      ) => router.replace(withDateQuery(href, queryString), options),
    }),
    [queryString, router]
  )
}

