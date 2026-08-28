"use client"

import * as React from "react"
import { Loader2 } from "lucide-react"
import { Button } from "@/app/components/ui/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/app/components/ui/dialog"

interface ConfirmationDialogProps {
  open?: boolean
  onOpenChange?: (open: boolean) => void
  title: string
  description: string
  confirmText?: string
  cancelText?: string
  variant?: "destructive" | "default"
  isPending?: boolean
  onConfirm: () => Promise<void> | void
  trigger?: React.ReactNode
}

export function ConfirmationDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmText = "Confirmar",
  cancelText = "Cancelar",
  variant = "destructive",
  isPending = false,
  onConfirm,
  trigger,
}: ConfirmationDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent className="w-[95vw] max-w-[95vw] sm:max-w-md max-h-[90vh] overflow-y-auto p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription className="text-muted-foreground text-sm mt-1.5">
            {description}
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="flex flex-col-reverse sm:flex-row gap-2 pt-3 justify-end">
          <DialogClose asChild>
            <Button type="button" variant="outline" disabled={isPending}>
              {cancelText}
            </Button>
          </DialogClose>
          <Button
            type="button"
            variant={variant}
            onClick={onConfirm}
            disabled={isPending}
          >
            {isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {confirmText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
