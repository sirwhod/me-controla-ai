import { api } from '@/app/lib/axios'
import { UpdateDebit } from '@/app/types/financial'

interface UpdateDebitResponse {
  message: string;
}

export async function updateDebit(
  workspaceId: string, 
  debitId: string,
  {
    date,
    description,
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
  }: UpdateDebit
): Promise<UpdateDebitResponse> {
  if (!workspaceId) {
    return {
      message: "O Id da Caixinha é necessário para a alteração do débito."
    }
  }

  if (!debitId) {
    return {
      message: "O Id do débito é necessário para a alteração do débito."
    }
  }

  const response = await api.patch<UpdateDebitResponse>(
    `/workspaces/${workspaceId}/debits/${debitId}`,
    {
      date,
      description,
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
    }
  )

  return response.data
}
