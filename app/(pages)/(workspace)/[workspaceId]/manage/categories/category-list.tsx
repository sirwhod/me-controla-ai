"use client"

import * as React from "react"
import { Category } from "@/app/types/financial"
import { DynamicIcon, IconName } from "lucide-react/dynamic"
import { Badge } from "@/app/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/app/components/ui/dropdown-menu"
import { Button } from "@/app/components/ui/button"
import { MoreHorizontal } from "lucide-react"
import { EditCategory } from "@/app/components/edit-category"
import { DeleteCategory } from "@/app/components/delete-category"

interface CategoryListProps {
  children: React.ReactNode
  className?: string
}

export function CategoryList({ children, className }: CategoryListProps) {
  return (
    <div className={`flex flex-col space-y-2 w-full ${className || ""}`}>
      {children}
    </div>
  )
}

interface CategoryListItemProps {
  category: Category
}

export function CategoryListItem({ category }: CategoryListItemProps) {
  const icon = (category.icon as IconName) || "tag"

  const getTypeBadge = (type?: string) => {
    switch (type) {
      case "expense":
        return (
          <Badge
            variant="outline"
            className="text-[10px] px-1.5 py-0 text-rose-500 border-rose-500/30 bg-rose-500/10 shrink-0 font-medium"
          >
            Despesa
          </Badge>
        )
      case "income":
        return (
          <Badge
            variant="outline"
            className="text-[10px] px-1.5 py-0 text-emerald-500 border-emerald-500/30 bg-emerald-500/10 shrink-0 font-medium"
          >
            Receita
          </Badge>
        )
      default:
        return (
          <Badge variant="secondary" className="text-[10px] px-1.5 py-0 bg-muted/40 shrink-0">
            Geral
          </Badge>
        )
    }
  }

  return (
    <div className="flex items-center justify-between p-3 rounded-xl border border-border/60 bg-card/60 hover:bg-card/90 transition-all shadow-xs gap-3">
      {/* Ícone + Nome + Badge de Tipo */}
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0 border border-primary/20 shadow-2xs">
          <DynamicIcon name={icon} size={18} />
        </div>

        <div className="flex flex-col min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-sm sm:text-base text-foreground truncate">
              {category.name}
            </span>
            {getTypeBadge(category.type)}
          </div>
        </div>
      </div>

      {/* Menu Contextual (Touch target confortável: 40x40px) */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-10 w-10 -mr-1.5 p-0 text-muted-foreground hover:text-foreground shrink-0 rounded-lg hover:bg-accent/80"
            aria-label={`Ações da categoria ${category.name}`}
          >
            <MoreHorizontal className="h-5 w-5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuLabel className="text-xs">Opções</DropdownMenuLabel>
          <DropdownMenuItem
            onClick={() => navigator.clipboard.writeText(category.id)}
            className="text-xs cursor-pointer"
          >
            Copiar ID da categoria
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <EditCategory category={category} asDropdownItem />
          <DeleteCategory categoryId={category.id} categoryName={category.name} />
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
