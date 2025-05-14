import { api } from '@/app/lib/axios'
import { UpdateBank } from '@/app/types/financial'

interface UpdateBankResponse {
  message: string;
}

export async function updateBanks(
  workspaceId: string, 
  bankId: string,
  {name, code, iconUrl, invoiceClosingDay, invoiceDueDate}: UpdateBank
): Promise<UpdateBankResponse> {
  if (!workspaceId) {
    return {
      message: "O Id da Caixinha é nescessário para a alteração do banco."
    }
  }

  if (!bankId) {
    return {
      message: "O Id do banco é nescessário para a alteração do banco."
    }
  }

  const response = await api.patch<UpdateBankResponse>(
    `/workspaces/${workspaceId}/banks/${bankId}`,
    {
      name,
      code,
      iconUrl,
      invoiceClosingDay,
      invoiceDueDate
    }
  )

  return response.data
}