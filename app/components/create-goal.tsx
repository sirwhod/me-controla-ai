"use client"

import React from "react"
import Link from "next/link"
import { Plus } from "lucide-react"
import { Button } from "@/app/components/ui/button"
import { useWorkspace } from "../hooks/use-workspace"
import { cn } from "../lib/utils"

interface CreateGoalComponentProps {
  className?: string
  fullWidth?: boolean
  label?: string
}

export function CreateGoal({
  className,
  fullWidth,
  label = "Nova Meta",
}: CreateGoalComponentProps = {}) {
  const { workspaceActive } = useWorkspace()

  return (
    <Link
      href={`${workspaceActive?.id ? `/${workspaceActive.id}` : ""}/manage/goals/new`}
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
