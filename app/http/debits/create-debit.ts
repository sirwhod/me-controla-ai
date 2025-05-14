import { api } from '@/app/lib/axios'
import { CreateDebit } from '@/app/types/financial'

interface CreateDebitResponse {
  message: string;
  debitId: string; // O ID do débito criada
}

export async function createDebit(
  workspaceId: string, 
  {
    date,
    description,
    type,
    value,
    bankId,
    categoryId,
    currentInstallment,
    endDate,
    frequency,
    paymentMethod,
    proofUrl,
    startDate,
    totalInstallments
  }: CreateDebit
): Promise<CreateDebitResponse> {
  if (!workspaceId) {
    return {
      message: "O Id da Caixinha é nescessário para a criação do débito.",
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
      categoryId,
      currentInstallment,
      endDate,
      frequency,
      paymentMethod,
      proofUrl,
      startDate,
      totalInstallments
    }
  )

  return response.data
}