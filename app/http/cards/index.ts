import { api } from "@/app/lib/axios"
import { CreditCard, CreateCreditCard, UpdateCreditCard } from "@/app/types/financial"

export async function getCards(workspaceId: string): Promise<CreditCard[]> {
  if (!workspaceId) return []
  const res = await api.get<CreditCard[]>(`/workspaces/${workspaceId}/cards`)
  return res.data
}

export async function getCard(workspaceId: string, cardId: string): Promise<CreditCard> {
  const res = await api.get<CreditCard>(`/workspaces/${workspaceId}/cards/${cardId}`)
  return res.data
}

export async function createCard(
  workspaceId: string,
  data: CreateCreditCard
): Promise<{ message: string; cardId: string }> {
  const res = await api.post<{ message: string; cardId: string }>(
    `/workspaces/${workspaceId}/cards`,
    data
  )
  return res.data
}

export async function updateCard(
  workspaceId: string,
  cardId: string,
  data: UpdateCreditCard
): Promise<{ message: string }> {
  const res = await api.patch<{ message: string }>(
    `/workspaces/${workspaceId}/cards/${cardId}`,
    data
  )
  return res.data
}

export async function deleteCard(
  workspaceId: string,
  cardId: string
): Promise<{ message: string }> {
  const res = await api.delete<{ message: string }>(
    `/workspaces/${workspaceId}/cards/${cardId}`
  )
  return res.data
}
