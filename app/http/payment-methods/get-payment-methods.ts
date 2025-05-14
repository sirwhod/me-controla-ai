import { api } from '@/app/lib/axios'
import { PaymentMethod } from '@/app/types/financial'

interface GetPaymentMethodsProps { 
  workspaceId: string
  bankId: string
}

export async function getPaymentMethods({ workspaceId, bankId }: GetPaymentMethodsProps): Promise<PaymentMethod[]> {
  const response = await api.get<PaymentMethod[]>(`/workspaces/${workspaceId}/banks/${bankId}/payment-methods`)

  return response.data
}