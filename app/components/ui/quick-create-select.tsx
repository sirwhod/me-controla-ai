"use client"

import * as React from "react"
import { Check, ChevronsUpDown, Plus, Loader2 } from "lucide-react"
import { cn } from "@/app/lib/utils"
import { Button } from "@/app/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/app/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/app/components/ui/popover"

export interface QuickCreateItem {
  id: string
  name: string
  icon?: React.ReactNode
}

interface QuickCreateSelectProps {
  items: QuickCreateItem[]
  value?: string | null
  onChange: (value: string) => void
  placeholder?: string
  searchPlaceholder?: string
  emptyText?: string
  createLabel?: string
  onCreateNew?: (name: string) => Promise<string | undefined | null>
  disabled?: boolean
  className?: string
}

export function QuickCreateSelect({
  items = [],
  value,
  onChange,
  placeholder = "Selecione...",
  searchPlaceholder = "Buscar ou digitar novo...",
  emptyText = "Nenhum resultado encontrado.",
  createLabel = "Criar",
  onCreateNew,
  disabled = false,
  className,
}: QuickCreateSelectProps) {
  const [open, setOpen] = React.useState(false)
  const [searchValue, setSearchValue] = React.useState("")
  const [isCreating, setIsCreating] = React.useState(false)

  const selectedItem = items.find((item) => item.id === value)

  const exactMatch = items.some(
    (item) => item.name.toLowerCase().trim() === searchValue.toLowerCase().trim()
  )

  const handleCreate = async () => {
    if (!searchValue.trim() || !onCreateNew) return
    try {
      setIsCreating(true)
      const newId = await onCreateNew(searchValue.trim())
      if (newId) {
        onChange(newId)
        setOpen(false)
        setSearchValue("")
      }
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn("w-full justify-between font-normal text-left", className)}
        >
          <div className="flex items-center gap-2 truncate">
            {selectedItem?.icon}
            <span className={cn("truncate", !selectedItem && "text-muted-foreground")}>
              {selectedItem ? selectedItem.name : placeholder}
            </span>
          </div>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
        <Command>
          <CommandInput
            placeholder={searchPlaceholder}
            value={searchValue}
            onValueChange={setSearchValue}
          />
          <CommandList className="max-h-60">
            {items.length === 0 && !searchValue && (
              <div className="py-6 text-center text-xs text-muted-foreground">
                {emptyText}
              </div>
            )}
            <CommandEmpty>
              <div className="p-2 text-center text-xs text-muted-foreground">
                {emptyText}
              </div>
            </CommandEmpty>
            <CommandGroup>
              {items.map((item) => (
                <CommandItem
                  key={item.id}
                  value={item.name}
                  onSelect={() => {
                    onChange(item.id)
                    setOpen(false)
                    setSearchValue("")
                  }}
                  className="flex items-center justify-between cursor-pointer"
                >
                  <div className="flex items-center gap-2 truncate">
                    {item.icon}
                    <span className="truncate">{item.name}</span>
                  </div>
                  <Check
                    className={cn(
                      "h-4 w-4 shrink-0",
                      value === item.id ? "opacity-100 text-primary" : "opacity-0"
                    )}
                  />
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>

          {/* Quick Create Action Button */}
          {onCreateNew && searchValue.trim().length > 0 && !exactMatch && (
            <div className="border-t border-border p-1">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="w-full justify-start gap-2 text-xs font-semibold text-primary hover:bg-primary/10"
                onClick={handleCreate}
                disabled={isCreating}
              >
                {isCreating ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Plus className="h-3.5 w-3.5" />
                )}
                {createLabel} &quot;{searchValue.trim()}&quot;
              </Button>
            </div>
          )}
        </Command>
      </PopoverContent>
    </Popover>
  )
}
