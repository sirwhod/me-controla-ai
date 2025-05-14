// @/components/hooks/use-image-upload.ts (Adaptado)
import { useCallback, useEffect, useRef, useState } from "react";

interface UseImageUploadProps {
  onFileSelect?: (file: File | null) => void; // Callback para o arquivo real
  // onUpload original (que passava a blob URL) pode ser removido ou renomeado se não for usado para outros fins.
  // initialPreviewUrl?: string; // Se você precisar carregar uma URL de prévia existente (para edição)
  // initialFileName?: string;
}

export function useImageUpload({ onFileSelect }: UseImageUploadProps = {}) {
  const previewStateRef = useRef<string | null>(null); // Para garantir a limpeza da URL de objeto correta
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);

  const handleThumbnailClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];

      // Limpa a URL de objeto anterior antes de criar uma nova
      if (previewStateRef.current) {
        URL.revokeObjectURL(previewStateRef.current);
        previewStateRef.current = null;
      }
      setPreviewUrl(null); // Limpa a prévia antiga imediatamente

      if (file) {
        setFileName(file.name);
        const newPreviewUrl = URL.createObjectURL(file);
        setPreviewUrl(newPreviewUrl);
        previewStateRef.current = newPreviewUrl; // Armazena para limpeza futura
        onFileSelect?.(file); // Notifica sobre o arquivo selecionado
      } else {
        // Se nenhum arquivo for selecionado (ex: usuário cancelou)
        setFileName(null);
        onFileSelect?.(null); // Notifica que nenhum arquivo está selecionado
      }
    },
    [onFileSelect],
  );

  const handleRemove = useCallback(() => {
    if (previewStateRef.current) {
      URL.revokeObjectURL(previewStateRef.current);
      previewStateRef.current = null;
    }
    setPreviewUrl(null);
    setFileName(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = ""; // Reseta o valor do input
    }
    onFileSelect?.(null); // Notifica que o arquivo foi removido
  }, [onFileSelect]);

  // Limpeza ao desmontar o componente
  useEffect(() => {
    const currentPreview = previewStateRef.current; // Captura o valor atual da ref
    return () => {
      if (currentPreview) {
        URL.revokeObjectURL(currentPreview);
      }
    };
  }, []); // Executa apenas na montagem e desmontagem

  return {
    previewUrl,
    fileName,
    fileInputRef,
    handleThumbnailClick,
    handleFileChange,
    handleRemove,
  };
}