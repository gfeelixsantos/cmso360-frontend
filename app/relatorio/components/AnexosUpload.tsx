// app/relatorios/components/AnexosUpload.tsx
import React, { useState, useRef, useCallback } from "react";
import { Button, Spinner } from "@heroui/react";
import { Paperclip, X, ExternalLink } from "lucide-react";

import { FileUpload } from "@/lib/scheduling/interface/scheduling";

interface AnexosUploadProps {
  anexos: FileUpload[];
  onUpload: (files: File[]) => Promise<void>;
  onRemove: (fileName: string) => void;
  isLoading?: boolean;
  maxFileSize?: number;
  allowedTypes?: string[];
}

const AnexosUpload: React.FC<AnexosUploadProps> = ({
  anexos = [],
  onUpload,
  onRemove,
  isLoading = false,
  maxFileSize = 10,
  allowedTypes = [".pdf", ".jpg", ".jpeg", ".png", ".doc", ".docx"],
}) => {
  const [uploading, setUploading] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const selectedFiles = event.target.files;

      if (!selectedFiles) return;

      const newFiles: File[] = [];
      const newErrors: Record<string, string> = {};

      Array.from(selectedFiles).forEach((file) => {
        if (file.size > maxFileSize * 1024 * 1024) {
          newErrors[file.name] =
            `Arquivo muito grande (máximo: ${maxFileSize}MB)`;

          return;
        }

        const fileExtension = `.${file.name.split(".").pop()?.toLowerCase()}`;

        if (!allowedTypes.includes(fileExtension)) {
          newErrors[file.name] = `Tipo não permitido`;

          return;
        }

        if (
          files.some((f) => f.name === file.name) ||
          anexos.some((a) => a.Name === file.name)
        ) {
          newErrors[file.name] = "Arquivo já adicionado";

          return;
        }

        newFiles.push(file);
      });

      setFiles((prev) => [...prev, ...newFiles]);
      setErrors(newErrors);

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    },
    [files, anexos, maxFileSize, allowedTypes],
  );

  const handleRemoveFile = useCallback(
    (fileName: string) => {
      setFiles((prev) => prev.filter((f) => f.name !== fileName));
      delete errors[fileName];
    },
    [errors],
  );

  const handleUploadFiles = useCallback(async () => {
    if (files.length === 0) return;

    setUploading(true);
    try {
      await onUpload(files);
      setFiles([]);
      setErrors({});
    } catch (error) {
      console.error("Erro ao fazer upload:", error);
    } finally {
      setUploading(false);
    }
  }, [files, onUpload]);

  const handleTriggerFileInput = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";

    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  const handleOpenAttachment = useCallback((anexo: FileUpload) => {
    if (anexo.StoragePath) {
      window.open(anexo.StoragePath, "_blank", "noopener,noreferrer");
    }
  }, []);

  return (
    <div className="mt-6 p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-bold text-gray-700">Anexos</h2>
        </div>

        <div className="flex items-center gap-2">
          <input
            ref={fileInputRef}
            multiple
            accept={allowedTypes.join(",")}
            className="hidden"
            disabled={isLoading || uploading}
            type="file"
            onChange={handleFileSelect}
          />
          <Button
            color="primary"
            disabled={isLoading || uploading}
            isLoading={uploading}
            size="sm"
            startContent={<Paperclip size={16} />}
            variant="ghost"
            onPress={handleTriggerFileInput}
          >
            Adicionar Anexos
          </Button>
        </div>
      </div>

      {/* Arquivos para upload */}
      {files.length > 0 && (
        <div className="mb-4">
          <div className="text-xs font-medium text-gray-600 mb-2">
            Arquivos para enviar ({files.length})
          </div>
          <div className="space-y-2">
            {files.map((file) => (
              <div
                key={file.name}
                className={`flex items-center justify-between p-2 rounded-lg border ${
                  errors[file.name]
                    ? "border-red-200 bg-red-50"
                    : "border-blue-200 bg-blue-50"
                }`}
              >
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <Paperclip
                    className="text-gray-500 flex-shrink-0"
                    size={14}
                  />
                  <div className="min-w-0">
                    <div className="text-sm font-medium truncate">
                      {file.name}
                    </div>
                    <div className="text-xs text-gray-500">
                      {formatFileSize(file.size)}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {errors[file.name] && (
                    <div
                      className="text-xs text-red-600"
                      title={errors[file.name]}
                    >
                      Erro
                    </div>
                  )}
                  <Button
                    isIconOnly
                    color="danger"
                    disabled={uploading}
                    size="sm"
                    variant="light"
                    onPress={() => handleRemoveFile(file.name)}
                  >
                    <X size={14} />
                  </Button>
                </div>
              </div>
            ))}

            {!uploading && (
              <div className="flex justify-end pt-2">
                <Button
                  color="primary"
                  disabled={Object.keys(errors).length > 0}
                  size="sm"
                  onPress={handleUploadFiles}
                >
                  Enviar Arquivos
                </Button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Anexos já enviados */}
      {anexos.length > 0 && (
        <div>
          <div className="space-y-2">
            {anexos.map((anexo, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-2 rounded-lg border border-gray-200 bg-white hover:bg-gray-50"
              >
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <Paperclip
                    className="text-gray-500 flex-shrink-0"
                    size={14}
                  />
                  <div className="min-w-0">
                    {/* Link quando tem StoragePath, texto normal quando não tem */}
                    {anexo.StoragePath ? (
                      <button
                        className="text-sm font-medium truncate text-blue-600 hover:text-blue-800 hover:underline text-left flex items-center gap-1"
                        title="Clique para abrir"
                        onClick={() => handleOpenAttachment(anexo)}
                      >
                        {anexo.Name}
                        <ExternalLink className="inline" size={12} />
                      </button>
                    ) : (
                      <div className="text-sm font-medium truncate text-gray-700">
                        {anexo.Name}
                      </div>
                    )}
                    <div className="text-xs text-gray-500">
                      {anexo.StoragePath
                        ? "Clique para visualizar"
                        : "Arquivo armazenado internamente"}
                    </div>
                  </div>
                </div>

                <Button
                  isIconOnly
                  color="danger"
                  disabled={true}
                  size="sm"
                  variant="light"
                  onPress={() => onRemove(anexo.Name)}
                >
                  <X size={14} />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Sem anexos */}
      {files.length === 0 && anexos.length === 0 && (
        <div className="text-left py-4 text-gray-500 text-sm">
          Nenhum anexo adicionado ainda
        </div>
      )}

      {/* Loading state */}
      {(uploading || isLoading) && (
        <div className="flex justify-center py-2">
          <Spinner size="sm" />
        </div>
      )}
    </div>
  );
};

export default React.memo(AnexosUpload);
