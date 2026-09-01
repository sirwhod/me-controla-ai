import { calculateResponsibleBalance, normalizeResponsibleDebtDirection } from '../app/lib/responsible-balance.ts'

function assert(condition: unknown, message: string) {
  if (!condition) throw new Error(message)
}

const legacyDirection = normalizeResponsibleDebtDirection(undefined)
assert(legacyDirection === 'responsible_owes_me', 'registros antigos devem continuar como valor a receber')

const receivableOnly = calculateResponsibleBalance(
  [{ value: 120, debtDirection: 'responsible_owes_me' }],
  [{ value: 20 }],
)
assert(receivableOnly.receivable === 100 && receivableOnly.payable === 0 && receivableOnly.netBalance === 100, 'cobrança parcial deve reduzir apenas o valor a receber')

const payableOnly = calculateResponsibleBalance(
  [{ value: 75, debtDirection: 'i_owe_responsible' }],
  [],
)
assert(payableOnly.payable === 75 && payableOnly.receivable === 0 && payableOnly.netBalance === -75, 'dívida a pagar deve gerar saldo líquido negativo')

const mixed = calculateResponsibleBalance(
  [
    { value: 150, debtDirection: 'responsible_owes_me' },
    { value: 40, debtDirection: 'i_owe_responsible' },
  ],
  [{ value: 50 }],
)
assert(mixed.receivable === 100 && mixed.payable === 40 && mixed.netBalance === 60, 'direções mistas não podem ser compensadas incorretamente')

console.log('Responsible balance regression tests passed.')
