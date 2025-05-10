import { api } from '@/app/lib/axios'
import { CreatePaymentMethod } from '@/app/types/financial'

interface CreatePaymentMethodResponse {
  message: string;
  paymentmethodId: string; // O ID do categoria criada
}

export async function createPaymentMethod(
  workspaceId: string, 
  {
    name,
    type,
    bankId,
    invoiceClosingDay,
    invoiceDueDate
  }: CreatePaymentMethod
): Promise<CreatePaymentMethodResponse> {
  if (!workspaceId) {
    return {
      message: "O Id da Caixinha é nescessário para a criação do método de pagamento.",
      paymentmethodId: ""
    }
  }

  const response = await api.post<CreatePaymentMethodResponse>(
    `/workspaces/${workspaceId}/payment-methods`,
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