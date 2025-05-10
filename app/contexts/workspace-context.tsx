'use client'

import { createContext, useContext, useState, Dispatch, SetStateAction, ReactNode, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useQuery, UseQueryResult } from '@tanstack/react-query'
import { getWorkspaces, Workspace } from '../http/get-workspaces'

interface WorkspaceContextValue {
  workspaces: Workspace[] | undefined 
  isLoading: boolean
  error: Error | null 
  refetch: UseQueryResult<Workspace[], Error>['refetch'] 
  activeWorkspaceId: string | null 
  setActiveWorkspaceId: Dispatch<SetStateAction<string | null>>
  workspaceActive: Workspace | undefined
}

export const WorkspaceContext = createContext<WorkspaceContextValue | undefined>(undefined)

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const { data: session, status } = useSession()

  const [activeWorkspaceId, setActiveWorkspaceId] = useState<string | null>(null)

  const { data: workspaces, isLoading, error, refetch } = useQuery<Workspace[], Error>({
    queryKey: ['workspaces', session?.user?.id],
    queryFn: getWorkspaces,
    enabled: status === 'authenticated',
    staleTime: 1000 * 60 * 5,
  })

  useEffect(() => {
    if (workspaces && workspaces.length > 0) {
      const sortedWorkspaces = [...workspaces].sort((a, b) => {
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0

        return dateA - dateB
      })

      if (activeWorkspaceId === null) {
          setActiveWorkspaceId(sortedWorkspaces[0].id)
      }
    }
  }, [workspaces, activeWorkspaceId])

  const workspaceActive = workspaces?.find((wsp) => wsp.id === activeWorkspaceId)

  const contextValue: WorkspaceContextValue = {
    workspaces,
    isLoading,
    error,
    refetch,
    activeWorkspaceId,
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
