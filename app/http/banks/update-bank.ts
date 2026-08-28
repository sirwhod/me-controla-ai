import { api } from '@/app/lib/axios'
import { UpdateBank } from '@/app/types/financial'

interface UpdateBankResponse {
  message: string;
}

export async function updateBank(
  workspaceId: string, 
  bankId: string,
  { name, code, pixKey, pixKeyType, invoiceClosingDay, invoiceDueDate }: UpdateBank
): Promise<UpdateBankResponse> {
  if (!workspaceId) {
    return {
      message: "O Id da Caixinha é necessário para a alteração do banco."
    }
  }

  if (!bankId) {
    return {
      message: "O Id do banco é necessário para a alteração do banco."
    }
  }

  const response = await api.patch<UpdateBankResponse>(
    `/workspaces/${workspaceId}/banks/${bankId}`,
    {
      name,
      code,
      pixKey,
      pixKeyType,
      invoiceClosingDay,
      invoiceDueDate
    }
  )

  return response.data
}

export const updateBanks = updateBank
