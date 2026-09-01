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
assert(receivableOnly.receivable === 120 && receivableOnly.outstandingReceivable === 100 && receivableOnly.payable === 0 && receivableOnly.netBalance === 100, 'cobrança parcial deve manter o total a receber e reduzir somente o saldo líquido')

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
assert(mixed.receivable === 150 && mixed.outstandingReceivable === 100 && mixed.payable === 40 && mixed.netBalance === 60, 'direções mistas não podem ser compensadas incorretamente')

const overpaid = calculateResponsibleBalance(
  [{ value: 16.65, debtDirection: 'responsible_owes_me' }],
  [{ value: 16.65 }, { value: 16.65 }],
)
assert(overpaid.receivable === 16.65, 'o total gerado a receber deve permanecer fixo')
assert(overpaid.received === 33.3 && overpaid.appliedReceived === 16.65, 'somente o valor da cobrança pode ser aplicado')
assert(overpaid.outstandingReceivable === 0 && overpaid.netBalance === 0, 'pagamento excedente não pode criar dívida a pagar')
assert(overpaid.overpayment === 16.65, 'pagamento excedente deve ser informado separadamente')

console.log('Responsible balance regression tests passed.')
