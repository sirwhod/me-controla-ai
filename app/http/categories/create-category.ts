import { api } from '@/app/lib/axios'

interface CreateCategoryResponse {
  message: string;
  categoryId: string;
}

interface CreateCategoryFormDataProps {
  payload: FormData;
  workspaceId: string;
}

interface CreateCategoryDirectProps {
  workspaceId: string;
  name: string;
  type?: string;
  icon?: string;
  payload?: never;
}

export type CreateCategoryProps = CreateCategoryFormDataProps | CreateCategoryDirectProps

export async function createCategory(
  props: CreateCategoryProps
): Promise<CreateCategoryResponse> {
  const { workspaceId } = props
  if (!workspaceId) {
    return {
      message: "O Id da Caixinha é necessário para a criação da categoria.",
      categoryId: ""
    }
  }

  let payload: Record<string, unknown>

  if ('payload' in props && props.payload instanceof FormData) {
    payload = {
      name: props.payload.get('name')?.toString() || '',
      type: props.payload.get('type')?.toString() || 'all',
      icon: props.payload.get('icon')?.toString() || 'tag',
    }
  } else {
    payload = {
      name: (props as CreateCategoryDirectProps).name,
      type: (props as CreateCategoryDirectProps).type || 'all',
      icon: (props as CreateCategoryDirectProps).icon || 'tag',
    }
  }

  const response = await api.post<CreateCategoryResponse>(
    `/workspaces/${workspaceId}/categories`,
    payload
  )

  return response.data
}