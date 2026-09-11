"use client"

import { useEffect } from "react"

const CONFIRMATION_MESSAGE = "Você tem alterações não salvas. Deseja sair mesmo assim?"

export function useUnsavedChangesGuard(isDirty: boolean, isSubmitting = false) {
  useEffect(() => {
    if (!isDirty || isSubmitting) return

    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault()
      event.returnValue = ""
    }

    const handleDocumentClick = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
        return
      }

      const target = event.target
      if (!(target instanceof Element)) return

      const link = target.closest("a")
      if (!link || link.target === "_blank" || link.hasAttribute("download")) return

      const href = link.getAttribute("href")
      if (!href || href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:")) return

      if (!window.confirm(CONFIRMATION_MESSAGE)) {
        event.preventDefault()
        event.stopPropagation()
      }
    }

    window.addEventListener("beforeunload", handleBeforeUnload)
    document.addEventListener("click", handleDocumentClick, true)

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload)
      document.removeEventListener("click", handleDocumentClick, true)
    }
  }, [isDirty, isSubmitting])
}
