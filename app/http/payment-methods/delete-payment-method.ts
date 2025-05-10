import { api } from '@/app/lib/axios'

interface DeletePaymentMethodResponse {
  message: string;
}

export async function deletePaymentMethod(
  workspaceId: string, 
  paymentmethodId: string,
): Promise<DeletePaymentMethodResponse> {
  if (!workspaceId) {
    return {
      message: "O Id da Caixinha é nescessário para a exclusão do método de pagamento."
    }
  }

  if (!paymentmethodId) {
    return {
      message: "O Id do método de pagamento é nescessário para a exclusão do método de pagamento."
    }
  }

  const response = await api.delete<DeletePaymentMethodResponse>(
    `/workspaces/${workspaceId}/payment-methods/${paymentmethodId}`,
  )

  return response.data
}