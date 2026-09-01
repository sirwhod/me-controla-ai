export interface CursorPage<T> {
  items: T[]
  nextCursor: string | null
}

export async function collectFinancialPages<T>(
  loadPage: (cursor?: string) => Promise<CursorPage<T>>,
): Promise<T[]> {
  const items: T[] = []
  const visitedCursors = new Set<string>()
  let cursor: string | undefined

  do {
    const page = await loadPage(cursor)
    if (!Array.isArray(page.items)) throw new TypeError('Resposta financeira inválida')
    items.push(...page.items)
    if (!page.nextCursor) break
    if (visitedCursors.has(page.nextCursor)) throw new Error('Cursor repetido ao carregar lançamentos')
    visitedCursors.add(page.nextCursor)
    cursor = page.nextCursor
  } while (cursor)

  return items
}
