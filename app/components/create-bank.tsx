"use client"

import React from "react"
import Link from "@/app/components/context-link"
import { Plus } from "lucide-react"
import { Button } from "@/app/components/ui/button"
import { useWorkspace } from "../hooks/use-workspace"
import { cn } from "../lib/utils"

interface CreateBankComponentProps {
  className?: string
  fullWidth?: boolean
  label?: string
}

export function CreateBank({
  className,
  fullWidth,
  label = "Novo Banco",
}: CreateBankComponentProps = {}) {
  const { workspaceActive } = useWorkspace()

  return (
    <Link
      href={`${workspaceActive?.id ? `/${workspaceActive.id}` : ""}/manage/banks/new`}
      className={cn(fullWidth && "w-full inline-block")}
    >
      <Button
        variant="default"
        className={cn("gap-2 font-semibold", fullWidth && "w-full", className)}
      >
        <Plus className="w-4 h-4 mr-1.5" />
        {label}
      </Button>
    </Link>
  )
}
