"use client"

import React from "react"
import Link from "@/app/components/context-link"
import { PlusCircle } from "lucide-react"
import { Button } from "@/app/components/ui/button"
import { useWorkspace } from "../hooks/use-workspace"
import { cn } from "../lib/utils"

interface CreateCreditComponentProps {
  className?: string
  fullWidth?: boolean
  label?: string
}

export function CreateCredit({ className, fullWidth, label = "Nova Receita" }: CreateCreditComponentProps = {}) {
  const { workspaceActive } = useWorkspace()

  return (
    <Link
      href={workspaceActive?.id ? `/${workspaceActive.id}/dashboard/credits/new` : "#"}
      aria-disabled={!workspaceActive?.id}
      tabIndex={workspaceActive?.id ? undefined : -1}
      className={cn(fullWidth && "w-full inline-block", !workspaceActive?.id && "pointer-events-none opacity-60")}
    >
      <Button
        variant="default"
        className={cn(fullWidth && "w-full", className)}
      >
        <PlusCircle className="w-4 h-4 mr-2" />
        {label}
      </Button>
    </Link>
  )
}
