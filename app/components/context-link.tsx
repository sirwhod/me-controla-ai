"use client"

import * as React from "react"
import NextLink from "next/link"

import { useDateFilter } from "@/app/contexts/date-filter-context"
import { withDateQuery } from "@/app/lib/contextual-navigation"

type ContextLinkProps = React.ComponentProps<typeof NextLink>

const ContextLink = React.forwardRef<HTMLAnchorElement, ContextLinkProps>(
  function ContextLink({ href, ...props }, ref) {
    const { queryString } = useDateFilter()
    const contextualHref = typeof href === "string" ? withDateQuery(href, queryString) : href

    return <NextLink ref={ref} href={contextualHref} {...props} />
  }
)

export default ContextLink

