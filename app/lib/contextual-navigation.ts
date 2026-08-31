const CONTEXTUAL_ROUTE_PATTERN = /^\/(?:[^/?#]+\/)?(?:dashboard|manage)(?:[/?#]|$)/

export function withDateQuery(href: string, dateQuery: string): string {
  if (!CONTEXTUAL_ROUTE_PATTERN.test(href)) return href

  const [urlWithoutHash, hash = ""] = href.split("#", 2)
  const [pathname, currentQuery = ""] = urlWithoutHash.split("?", 2)
  const params = new URLSearchParams(currentQuery)
  const dateParams = new URLSearchParams(dateQuery.replace(/^\?/, ""))
  const month = dateParams.get("month")
  const year = dateParams.get("year")

  if (month) params.set("month", month)
  if (year) params.set("year", year)

  const query = params.toString()
  return `${pathname}${query ? `?${query}` : ""}${hash ? `#${hash}` : ""}`
}

