"use client"

import React from "react"
import Link from "@/app/components/context-link"
import { PlusCircle } from "lucide-react"
import { Button } from "@/app/components/ui/button"
import { useWorkspace } from "../hooks/use-workspace"
import { cn } from "../lib/utils"

interface CreateCategoryComponentProps {
  className?: string
  fullWidth?: boolean
  label?: string
}

export function CreateCategory({
  className,
  fullWidth,
  label = "Nova Categoria",
}: CreateCategoryComponentProps = {}) {
  const { workspaceActive } = useWorkspace()

  return (
    <Link
      href={`${workspaceActive?.id ? `/${workspaceActive.id}` : ""}/manage/categories/new`}
      className={cn(fullWidth && "w-full inline-block")}
    >
      <Button
        variant="default"
        className={cn("gap-2 font-semibold", fullWidth && "w-full", className)}
      >
        <PlusCircle className="w-4 h-4 mr-2" />
        {label}
      </Button>
    </Link>
  )
}
