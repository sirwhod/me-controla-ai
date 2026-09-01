import { api } from '@/app/lib/axios'
import { CreateDebit } from '@/app/types/financial'

export interface CreateDebitResponse {
  message: string;
  debitId?: string;
  count?: number;
}

interface CreateDebitProps extends CreateDebit {
  workspaceId: string;
}

export async function createDebit(
  {
    date,
    description,
    type,
    value,
    bankId,
    creditCardId,
    categoryId,
    responsibleId,
    debtDirection,
    currentInstallment,
    endDate,
    frequency,
    paymentMethod,
    startDate,
    totalInstallments,
    status,
    workspaceId
  }: CreateDebitProps
): Promise<CreateDebitResponse> {
  if (!workspaceId) {
    return {
      message: "O Id da Caixinha é necessário para a criação do débito.",
      debitId: ""
    }
  }

  const response = await api.post<CreateDebitResponse>(
    `/workspaces/${workspaceId}/debits`,
    {
      date,
      description,
      type,
      value,
      bankId,
      creditCardId,
      categoryId,
      responsibleId,
      debtDirection,
      currentInstallment,
      endDate,
      frequency,
      paymentMethod,
      startDate,
      totalInstallments,
      status
    },
    { headers: { 'Idempotency-Key': crypto.randomUUID() } }
  )

  return response.data
}
