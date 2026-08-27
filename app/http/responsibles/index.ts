import { api } from '@/app/lib/axios'
import { CreatePersonResponsible, PersonResponsible, UpdatePersonResponsible } from '@/app/types/financial'

export interface ResponsiblePendingDebit {
  id: string
  description: string
  value: number
  date: string | null
  dateFormatted: string
  paymentMethod: string
  categoryName: string | null
  month?: string
  year?: number
}

export type ResponsiblePendingCredit = ResponsiblePendingDebit

export interface ResponsibleDetails extends PersonResponsible {
  totalPending: number
  totalDebits?: number
  totalCredits?: number
  pendingDebits?: ResponsiblePendingDebit[]
  pendingCredits?: ResponsiblePendingCredit[]
}

export async function getResponsibles(
  workspaceId: string,
  params?: { month?: string; year?: string }
): Promise<(PersonResponsible & { pendingBalance: number })[]> {
  const response = await api.get<(PersonResponsible & { pendingBalance: number })[]>(
    `/workspaces/${workspaceId}/responsibles`,
    { params }
  )
  return response.data
}

export async function createResponsible(
  workspaceId: string,
  data: CreatePersonResponsible
): Promise<{ message: string; responsibleId: string }> {
  const response = await api.post<{ message: string; responsibleId: string }>(
    `/workspaces/${workspaceId}/responsibles`,
    data
  )
  return response.data
}

export async function getResponsibleDetails(
  workspaceId: string,
  responsibleId: string,
  params?: { month?: string; year?: string }
): Promise<ResponsibleDetails> {
  const response = await api.get<ResponsibleDetails>(
    `/workspaces/${workspaceId}/responsibles/${responsibleId}`,
    { params }
  )
  return response.data
}

export async function updateResponsible(
  workspaceId: string,
  responsibleId: string,
  data: UpdatePersonResponsible
): Promise<{ message: string }> {
  const response = await api.patch<{ message: string }>(
    `/workspaces/${workspaceId}/responsibles/${responsibleId}`,
    data
  )
  return response.data
}

export async function deleteResponsible(
  workspaceId: string,
  responsibleId: string
): Promise<{ message: string }> {
  const response = await api.delete<{ message: string }>(
    `/workspaces/${workspaceId}/responsibles/${responsibleId}`
  )
  return response.data
}
