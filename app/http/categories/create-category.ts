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

  let body: FormData | Record<string, unknown>
  let headers: Record<string, string | undefined> | undefined = undefined

  if ('payload' in props && props.payload instanceof FormData) {
    body = props.payload
    headers = { 'Content-Type': undefined }
  } else {
    const formData = new FormData()
    formData.append("name", (props as CreateCategoryDirectProps).name)
    formData.append("type", (props as CreateCategoryDirectProps).type || "all")
    formData.append("icon", (props as CreateCategoryDirectProps).icon || "tag")
    body = formData
    headers = { 'Content-Type': undefined }
  }

  const response = await api.post<CreateCategoryResponse>(
    `/workspaces/${workspaceId}/categories`,
    body,
    { headers }
  )

  return response.data
}