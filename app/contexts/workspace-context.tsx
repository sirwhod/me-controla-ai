'use client'

import { createContext, useState, ReactNode, useEffect, useMemo, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { useQuery, UseQueryResult } from '@tanstack/react-query'
import { useParams, usePathname, useRouter } from 'next/navigation'
import { getWorkspaces, Workspace } from '../http/get-workspaces'

interface WorkspaceContextValue {
  workspaces: Workspace[] | undefined 
  isLoading: boolean
  error: Error | null 
  refetch: UseQueryResult<Workspace[], Error>['refetch'] 
  activeWorkspaceId: string | null 
  setActiveWorkspaceId: (workspaceId: string | null) => void
  workspaceActive: Workspace | undefined
}

export const WorkspaceContext = createContext<WorkspaceContextValue | undefined>(undefined)

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const { data: session, status } = useSession()
  const params = useParams()
  const pathname = usePathname()
  const router = useRouter()

  const urlWorkspaceId = (params?.workspaceId as string) || null

  const [stateWorkspaceId, setStateWorkspaceId] = useState<string | null>(urlWorkspaceId)

  const { data: workspaces, isLoading, error, refetch } = useQuery<Workspace[], Error>({
    queryKey: ['workspaces', session?.user?.id],
    queryFn: getWorkspaces,
    enabled: status === 'authenticated',
    staleTime: 1000 * 60 * 5,
  })

  // Sincronizar com URL caso mude por navegação direta
  useEffect(() => {
    if (urlWorkspaceId) {
      setStateWorkspaceId(urlWorkspaceId)
    }
  }, [urlWorkspaceId])

  // Determinar o ID da caixinha ativa
  const activeWorkspaceId = urlWorkspaceId || stateWorkspaceId || (workspaces && workspaces.length > 0 ? workspaces[0].id : null)

  // Encontrar o objeto da caixinha ativa
  const workspaceActive = useMemo(() => {
    if (!workspaces || workspaces.length === 0) return undefined
    if (activeWorkspaceId) {
      const found = workspaces.find((wsp) => wsp.id === activeWorkspaceId)
      if (found) return found
    }
    return workspaces[0]
  }, [workspaces, activeWorkspaceId])

  // Função para trocar a caixinha ativa e navegar na rota correspondente
  const setActiveWorkspaceId = useCallback((newWorkspaceId: string | null) => {
    if (!newWorkspaceId) return
    setStateWorkspaceId(newWorkspaceId)

    if (urlWorkspaceId && pathname.includes(urlWorkspaceId)) {
      const newPath = pathname.replace(`/${urlWorkspaceId}`, `/${newWorkspaceId}`)
      router.push(newPath)
    } else if (pathname.startsWith('/dashboard') || pathname.startsWith('/manage')) {
      router.push(`/${newWorkspaceId}${pathname}`)
    } else {
      router.push(`/${newWorkspaceId}/dashboard`)
    }
  }, [urlWorkspaceId, pathname, router])

  const contextValue: WorkspaceContextValue = {
    workspaces,
    isLoading,
    error,
    refetch,
    activeWorkspaceId: workspaceActive?.id || activeWorkspaceId,
    setActiveWorkspaceId,
    workspaceActive,
  }

  return (
    <WorkspaceContext.Provider value={contextValue}>
      {children}
    </WorkspaceContext.Provider>
  )
}

export type { Workspace }
