import { api } from '@/app/lib/axios'
import { CreatePaymentMethod } from '@/app/types/financial'

interface CreatePaymentMethodResponse {
  message: string;
  paymentmethodId: string; // O ID do categoria criada
}

interface CreatePaymentMethodProps extends CreatePaymentMethod {
  workspaceId: string, 
}

export async function createPaymentMethod(
  {
    name,
    type,
    bankId,
    invoiceClosingDay,
    invoiceDueDate,
    workspaceId
  }: CreatePaymentMethodProps
): Promise<CreatePaymentMethodResponse> {
  if (!workspaceId) {
    return {
      message: "O Id da Caixinha é nescessário para a criação do método de pagamento.",
      paymentmethodId: ""
    }
  }

  const response = await api.post<CreatePaymentMethodResponse>(
    `/workspaces/${workspaceId}/banks/${bankId}/payment-methods`,
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