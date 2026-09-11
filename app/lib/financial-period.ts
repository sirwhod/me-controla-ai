export const FINANCIAL_MONTHS = [
  'janeiro',
  'fevereiro',
  'março',
  'abril',
  'maio',
  'junho',
  'julho',
  'agosto',
  'setembro',
  'outubro',
  'novembro',
  'dezembro',
] as const

export function isValidFinancialPeriod(month: string, year: number) {
  return (
    FINANCIAL_MONTHS.includes(month.toLowerCase() as (typeof FINANCIAL_MONTHS)[number]) &&
    Number.isInteger(year) &&
    year >= 2000 &&
    year <= 2200
  )
}

/** Returns a stable date for a financial period created from a month filter. */
export function dateForFinancialPeriod(month: string | undefined, year: string | number | undefined, now = new Date()) {
  const monthIndex = FINANCIAL_MONTHS.indexOf(String(month ?? '').toLowerCase() as (typeof FINANCIAL_MONTHS)[number])
  const parsedYear = Number(year)

  if (monthIndex < 0 || !Number.isInteger(parsedYear)) return new Date(now)

  const isCurrentPeriod = now.getFullYear() === parsedYear && now.getMonth() === monthIndex
  const day = isCurrentPeriod ? now.getDate() : 1
  return new Date(parsedYear, monthIndex, day, 12, 0, 0)
}
