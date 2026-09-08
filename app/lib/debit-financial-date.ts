import { FINANCIAL_MONTHS } from '@/app/lib/financial-period'

export function getDebitFinancialDate(date: Date, paymentMethod: string | null | undefined, closingDay: unknown) {
  const financialDate = new Date(date)
  const parsedClosingDay = typeof closingDay === 'number' ? closingDay : Number.parseInt(String(closingDay ?? ''), 10)

  if (paymentMethod === 'Crédito' && Number.isInteger(parsedClosingDay) && parsedClosingDay > 0 && date.getDate() > parsedClosingDay) {
    financialDate.setMonth(financialDate.getMonth() + 1)
  }

  return {
    month: FINANCIAL_MONTHS[financialDate.getMonth()],
    year: financialDate.getFullYear(),
  }
}
