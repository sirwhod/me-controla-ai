import { api } from '@/app/lib/axios'
import { UpdatePaymentMethod } from '@/app/types/financial'

interface UpdatePaymentMethodResponse {
  message: string;
}

export async function updatePaymentMethod(
  workspaceId: string, 
  paymentmethodId: string,
  {
    name,
    type,
    bankId,
    invoiceClosingDay,
    invoiceDueDate
  }: UpdatePaymentMethod
): Promise<UpdatePaymentMethodResponse> {
  if (!workspaceId) {
    return {
      message: "O Id da Caixinha é nescessário para a alteração do método de pagamento."
    }
  }

  if (!paymentmethodId) {
    return {
      message: "O Id do método de pagamento é nescessário para a alteração do método de pagamento."
    }
  }

  const response = await api.patch<UpdatePaymentMethodResponse>(
    `/workspaces/${workspaceId}/payment-methods/${paymentmethodId}`,
    {
      name,
      type,
      bankId,
      invoiceClosingDay,
      invoiceDueDate
    }
  )

  return response.data
}