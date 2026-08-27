import { api } from '@/app/lib/axios'
import { CreateDebit } from '@/app/types/financial'

interface CreateDebitResponse {
  message: string;
  debitId: string;
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
    currentInstallment,
    endDate,
    frequency,
    paymentMethod,
    proofUrl,
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
      currentInstallment,
      endDate,
      frequency,
      paymentMethod,
      proofUrl,
      startDate,
      totalInstallments,
      status
    }
  )

  return response.data
}