import { api } from '@/app/lib/axios'
import { PaymentMethod } from '@/app/types/financial'

export async function getPaymentMethods(workspaceId: string): Promise<PaymentMethod[]> {
  const response = await api.get<PaymentMethod[]>(`/workspaces/${workspaceId}/payment-methods`)

  return response.data
}