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
