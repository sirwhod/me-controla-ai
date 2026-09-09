"use client"

import * as React from "react"
import { EmptyState } from "./empty-state"

type ConfigEmptyStateProps = React.ComponentProps<typeof EmptyState>

/** Empty state shared by configuration collections and their filtered views. */
export function ConfigEmptyState({ className, ...props }: ConfigEmptyStateProps) {
  return (
    <EmptyState
      {...props}
      className={`min-h-40 rounded-lg bg-background/40 p-6 sm:p-8 ${className ?? ""}`}
    />
  )
}
