export type ResponsibleDebtDirection = 'i_owe_responsible' | 'responsible_owes_me'

/**
 * Records created before debtDirection existed were used by the collection
 * flow, therefore they represent money the responsible owes the workspace.
 */
export function normalizeResponsibleDebtDirection(value: unknown): ResponsibleDebtDirection {
  return value === 'i_owe_responsible' ? 'i_owe_responsible' : 'responsible_owes_me'
}

export interface ResponsibleBalance {
  expensesResponsibleOwes: number
  expensesIOwe: number
  received: number
  appliedReceived: number
  overpayment: number
  payable: number
  receivable: number
  outstandingReceivable: number
  netBalance: number
}

export function calculateResponsibleBalance(
  debits: Iterable<{ value?: unknown; debtDirection?: unknown }>,
  credits: Iterable<{ value?: unknown }>,
): ResponsibleBalance {
  let expensesResponsibleOwes = 0
  let expensesIOwe = 0
  let received = 0

  for (const debit of debits) {
    const value = Number(debit.value) || 0
    if (normalizeResponsibleDebtDirection(debit.debtDirection) === 'i_owe_responsible') {
      expensesIOwe += value
    } else {
      expensesResponsibleOwes += value
    }
  }

  for (const credit of credits) received += Number(credit.value) || 0

  // The month totals remain an immutable statement of what each side spent.
  // Credits are settlements, so only the net balance changes after a receipt.
  const receivable = Math.max(0, expensesResponsibleOwes)
  const payable = Math.max(0, expensesIOwe)
  const appliedReceived = Math.min(receivable, Math.max(0, received))
  const overpayment = Math.max(0, received - receivable)
  const outstandingReceivable = receivable - appliedReceived
  return {
    expensesResponsibleOwes,
    expensesIOwe,
    received,
    appliedReceived,
    overpayment,
    payable,
    receivable,
    outstandingReceivable,
    // A payment can settle a receivable, but it must never create a payable.
    netBalance: outstandingReceivable - payable,
  }
}
