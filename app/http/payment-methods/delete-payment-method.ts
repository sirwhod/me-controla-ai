import { api } from '@/app/lib/axios'

interface DeletePaymentMethodResponse {
  message: string;
}

interface DeletePaymentMethod {
  workspaceId: string, 
  paymentMethodId: string,
}

export async function deletePaymentMethod(
  {
    paymentMethodId,
    workspaceId
  }: DeletePaymentMethod
): Promise<DeletePaymentMethodResponse> {
  if (!workspaceId) {
    return {
      message: "O Id da Caixinha é nescessário para a exclusão do método de pagamento."
    }
  }

  if (!paymentMethodId) {
    return {
      message: "O Id do método de pagamento é nescessário para a exclusão do método de pagamento."
    }
  }

  const response = await api.delete<DeletePaymentMethodResponse>(
    `/workspaces/${workspaceId}/payment-methods/${paymentMethodId}`,
  )

  return response.data
}