/* eslint-disable @typescript-eslint/no-explicit-any */
import { Button } from "@/app/components/ui/button"
import { Input } from "@/app/components/ui/input"
import { useImageUpload } from "@/app/hooks/use-image-upload" // Hook adaptado
import { ImagePlus, X, Upload, Trash2 } from "lucide-react"
import NextImage from "next/image" // Renomeado para evitar conflito
import { useCallback, useState, useEffect } from "react"
import { cn } from "@/app/lib/utils"
import { UseFormSetValue, FieldError } from "react-hook-form"

interface ImageUploadFieldProps {
  name: string // Nome do campo para react-hook-form
  setValue: UseFormSetValue<any> // Função setValue do form
  clearErrors?: (name?: string | string[]) => void // Função clearErrors do form
  formValue?: FileList | null // Valor atual do campo vindo do react-hook-form
  error?: FieldError
  label?: string // Label opcional para o campo
}

export function ImageUploadField({
  name,
  setValue,
  clearErrors,
  formValue,
  error,
  label
}: ImageUploadFieldProps) {
  const [isDragging, setIsDragging] = useState(false)

  const {
    previewUrl,
    fileName,
    fileInputRef,
    handleThumbnailClick,
    handleFileChange: hookHandleFileChange, // Renomeado para evitar conflito de escopo
    handleRemove: hookHandleRemove,         // Renomeado
  } = useImageUpload({
    onFileSelect: (file: File | null) => {
      if (file) {
        // react-hook-form espera um FileList para inputs de arquivo
        // Criamos um DataTransfer para simular isso
        const dataTransfer = new DataTransfer()
        dataTransfer.items.add(file)
        setValue(name, dataTransfer.files, { shouldValidate: true, shouldDirty: true })
        clearErrors?.(name) // Limpa erros se um novo arquivo for selecionado
      } else {
        setValue(name, undefined, { shouldValidate: true, shouldDirty: true }) // Ou null, dependendo da sua validação Zod
      }
    },
  })

  // Sincroniza o estado do hook com o valor do formulário (útil se o form for resetado externamente)
  useEffect(() => {
    if (!formValue || formValue.length === 0) {
      if (previewUrl) { // Se o form foi limpo mas o hook ainda tem preview
          hookHandleRemove()
      }
    } else if (formValue && formValue.length > 0) {
        // Se o form tem valor e o hook não (ex: preenchimento inicial),
        // aqui você poderia tentar gerar uma prévia se o FileList mudou.
        // No entanto, o `onFileSelect` já deve ter cuidado da prévia na seleção.
        // Esta parte pode ser mais complexa para sincronização bidirecional total e pode não ser necessária para criação.
    }
  }, [formValue, hookHandleRemove, previewUrl])


  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => { e.preventDefault(); e.stopPropagation() }
  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => { e.preventDefault(); e.stopPropagation(); setIsDragging(true) }
  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => { e.preventDefault(); e.stopPropagation(); setIsDragging(false) }

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault()
      e.stopPropagation()
      setIsDragging(false)

      const file = e.dataTransfer.files?.[0]
      if (file && file.type.startsWith("image/")) {
        const fakeEvent = {
          target: { files: e.dataTransfer.files }, // Passa o FileList
        } as unknown as React.ChangeEvent<HTMLInputElement>
        hookHandleFileChange(fakeEvent) // Chama o handler do hook
      }
    },
    [hookHandleFileChange],
  )

  return (
    <div className="w-full space-y-1">
      {label && <p className="block text-sm font-medium text-foreground mb-1">{label}</p>} {/* Adicionado label customizável */}
      <Input
        type="file"
        accept="image/png, image/jpeg, image/webp" // Ajuste conforme seu schema Zod
        className="hidden"
        ref={fileInputRef}
        onChange={hookHandleFileChange}
        name={name} // Para associação com react-hook-form, embora controlado
      />

      {!previewUrl ? (
        <div
          onClick={handleThumbnailClick}
          onDragOver={handleDragOver}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={cn(
            "flex h-48 cursor-pointer flex-col items-center justify-center gap-3 rounded-md border-2 border-dashed bg-muted/20 p-4 text-center transition-colors hover:bg-muted/50",
            isDragging && "border-primary bg-primary/10",
            error && "border-destructive bg-destructive/10", // Estilo de erro
          )}
        >
          <div className={cn("rounded-full p-2 shadow-sm border", error ? "bg-destructive/20 border-destructive" : "bg-background")}>
            <ImagePlus className={cn("h-5 w-5", error ? "text-destructive-foreground" : "text-muted-foreground")} />
          </div>
          <div>
            <p className="text-sm font-medium">Clique ou arraste a imagem</p>
            <p className="text-xs text-muted-foreground">
              PNG, JPG, WEBP (Máx. 10MB)
            </p>
          </div>
        </div>
      ) : (
        <div className="relative">
          <div className="group relative h-48 overflow-hidden rounded-md border">
            <NextImage
              src={previewUrl}
              alt={fileName || "Prévia da imagem"}
              fill
              className="object-contain" // 'object-contain' é bom para logos
              sizes="(max-width: 640px) 100vw, 640px" // Ajuste os sizes
            />
            <div className="absolute inset-0 bg-black/40 opacity-0 transition-opacity group-hover:opacity-100" />
            <div className="absolute inset-0 flex items-center justify-center gap-2 opacity-0 transition-opacity group-hover:opacity-100">
              <Button
                type="button"
                size="icon"
                variant="secondary"
                onClick={handleThumbnailClick}
                className="h-9 w-9"
                aria-label="Alterar imagem"
              >
                <Upload className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                size="icon"
                variant="destructive"
                onClick={hookHandleRemove}
                className="h-9 w-9"
                aria-label="Remover imagem"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
          {fileName && (
            <div className="mt-1.5 flex items-center gap-2 text-xs text-muted-foreground">
              <span className="truncate flex-1" title={fileName}>{fileName}</span>
              <button
                type="button"
                onClick={hookHandleRemove}
                className="ml-auto rounded-full p-0.5 hover:bg-muted flex items-center justify-center"
                aria-label="Remover imagem"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
        </div>
      )}
      {/* A FormMessage do react-hook-form irá exibir os erros de validação */}
    </div>
  )
}