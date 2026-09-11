"use client"

import { useCallback } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"

export function useUrlFilterState(key: string) {
  const pathname = usePathname()
  const router = useRouter()
  const searchParams = useSearchParams()
  const value = searchParams.get(key) ?? ""

  const setValue = useCallback(
    (nextValue: string) => {
      const params = new URLSearchParams(searchParams.toString())

      if (nextValue) {
        params.set(key, nextValue)
      } else {
        params.delete(key)
      }

      const query = params.toString()
      router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false })
    },
    [key, pathname, router, searchParams]
  )

  return [value, setValue] as const
}

export function useClearUrlFilters(keys: string[]) {
  const pathname = usePathname()
  const router = useRouter()
  const searchParams = useSearchParams()

  return useCallback(() => {
    const params = new URLSearchParams(searchParams.toString())
    keys.forEach((key) => params.delete(key))
    const query = params.toString()
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false })
  }, [keys, pathname, router, searchParams])
}
