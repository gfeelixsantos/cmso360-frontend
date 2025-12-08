// app/relatorios/LazyModalContent.tsx
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Chip,
  Tooltip,
  Divider,
  Spinner,
  Input,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  Modal,
  ModalContent,
  Progress,
} from "@heroui/react";
import {
  FileText,
  Upload,
  CheckCircle,
  Eye,
  Clock,
  AlertCircle,
  User,
  Building,
  Calendar,
  UserCheck,
  Trash,
  Pen,
  MoreVertical,
  File,
  RefreshCw,
  Stethoscope,
  FileCheck,
  Key,
  Save,
  X,
  XCircle,
  Paperclip,
} from "lucide-react";

import {
  ExamRegister,
  Scheduling,
} from "@/lib/scheduling/interface/scheduling";
import {
  NEST_SCHEDULINGS_UPDATE,
  NEST_SCHEDULINGS_EXAM_UPDATE,
  NEST_RELATORIO_FUNCIONARIO,
  NEST_SCHEDULINGS_UPDATE_EXAM_RESULT,
  NEST_SCHEDULINGS_PRONTUARIO,
  NEST_SCHEDULINGS_SYNC_SOC,
  NEST_SCHEDULINGS_DELETE,
  NEST_SCHEDULINGS_DELETE_ATTACHMENT,
} from "@/config/constants";
import { formatCPF, getStatusColor, adjustForBrazilTime } from "@/lib/utils";
import { ExamStatus } from "@/lib/scheduling/enum/scheduling.enum";
import AcuidadeVisual from "@/components/exames/AcuidadeVisual";
import AudiometriaOcupacional from "@/components/exames/AudiometriaOcupacional";
import Dinamometria from "@/components/exames/Dinamometria";
import Espirometria from "@/components/exames/Espirometria";
import ExamePadrao from "@/components/exames/ExamePadrao";
import FichaClinicaOcupacional from "@/components/exames/FichaClinica";
import Psicossocial from "@/components/exames/Psicossocial";
import Ultrassom from "@/components/exames/Ultrassom";
import { AtendimentoRules } from "@/components/atendimento/AtendimentoRules";
import KitAtendimento from "@/components/exames/KitAtendimento";
import FichaClinicaWhirlpool from "@/components/exames/FichaClinicaWhirlpool";
import { useUser } from "@/hooks/useUser";

interface LazyModalContentProps {
  atendimento: Scheduling;
  onClose: () => void;
  onUpdateScheduling?: (updated: Scheduling) => void;
}

interface EditModeState {
  isEditing: boolean;
  editedData: Partial<Scheduling>;
}

// Interfaces para upload de arquivos
interface SelectedFile {
  id: string;
  file: File;
  progress: number;
  error?: string;
  uploaded: boolean;
}

interface UploadExamModalState {
  isOpen: boolean;
  exame: ExamRegister | null;
  selectedFiles: SelectedFile[];
  isUploading: boolean;
  error: string;
  success: boolean;
}

// ============================================
// COMPONENTE: SelectedFilesList
// ============================================
const SelectedFilesList: React.FC<{
  files: SelectedFile[];
  onRemove: (fileId: string) => void;
  isUploading: boolean;
}> = ({ files, onRemove, isUploading }) => {
  if (files.length === 0) return null;

  return (
    <div className="mt-3 space-y-2">
      <div className="text-sm font-medium text-gray-700">
        Arquivos selecionados:
      </div>
      <div className="space-y-2">
        {files.map((selectedFile) => (
          <div
            key={selectedFile.id}
            className={`flex items-center justify-between p-2 rounded-lg border ${
              selectedFile.error
                ? "border-red-200 bg-red-50"
                : selectedFile.uploaded
                  ? "border-green-200 bg-green-50"
                  : "border-gray-200 bg-gray-50"
            }`}
          >
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <File className="flex-shrink-0 text-gray-500" size={14} />
              <span className="text-sm text-gray-900 truncate">
                {selectedFile.file.name}
              </span>
              <span className="text-xs text-gray-500">
                ({(selectedFile.file.size / 1024).toFixed(1)} KB)
              </span>
            </div>

            <div className="flex items-center gap-2">
              {selectedFile.error && (
                <Tooltip content={selectedFile.error}>
                  <AlertCircle className="text-red-500" size={14} />
                </Tooltip>
              )}
              {selectedFile.uploaded && (
                <CheckCircle className="text-green-500" size={14} />
              )}
              {isUploading &&
                selectedFile.progress > 0 &&
                selectedFile.progress < 100 && (
                  <Progress
                    aria-label={`Upload de ${selectedFile.file.name}`}
                    className="w-20"
                    color="primary"
                    size="sm"
                    value={selectedFile.progress}
                  />
                )}
              <Button
                isIconOnly
                color="danger"
                disabled={isUploading}
                size="sm"
                variant="light"
                onPress={() => onRemove(selectedFile.id)}
              >
                <XCircle size={14} />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// ============================================
// COMPONENTE: DeleteConfirmationModal
// ============================================
const DeleteConfirmationModal: React.FC<{
  isOpenModalDelete: boolean;
  onCloseModalDelete: () => void;
  onConfirm: (password: string) => void;
  isLoading: boolean;
}> = ({ isOpenModalDelete, onCloseModalDelete, onConfirm, isLoading }) => {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleConfirm = () => {
    if (!password.trim()) {
      setError("A senha é obrigatória");

      return;
    }
    onConfirm(password);
  };

  return (
    <Modal
      aria-describedby="delete-confirmation-description"
      aria-labelledby="delete-confirmation-title"
      backdrop="blur"
      classNames={{
        base: "z-[1000]",
        wrapper: "z-[1000]",
        backdrop: "z-[1000] bg-black/50 backdrop-blur-sm",
      }}
      isOpen={isOpenModalDelete}
      motionProps={{
        variants: {
          enter: {
            y: 0,
            opacity: 1,
            transition: {
              duration: 0.3,
              ease: "easeOut",
            },
          },
          exit: {
            y: -20,
            opacity: 0,
            transition: {
              duration: 0.2,
              ease: "easeIn",
            },
          },
        },
      }}
      shouldBlockScroll={false}
      size="md"
      style={{
        position: "fixed",
      }}
      onClose={onCloseModalDelete}
    >
      <ModalContent className="z-[1001] shadow-2xl" style={{ zIndex: 1001 }}>
        <ModalHeader className="flex flex-col gap-1">
          <div className="flex items-center gap-2 text-red-600">
            <AlertCircle size={24} />
            <span className="text-lg font-semibold">Confirmar Exclusão</span>
          </div>
        </ModalHeader>
        <ModalBody>
          <p className="text-gray-700">
            Esta ação irá excluir <strong>permanentemente</strong> o atendimento
            e todos os dados associados.
          </p>
          <p>Para confirmar, digite a senha de exclusão:</p>
          <Input
            endContent={<Key className="text-gray-400" size={20} />}
            errorMessage={error}
            isInvalid={!!error}
            placeholder="Senha de exclusão"
            type="password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              setError("");
            }}
          />
        </ModalBody>
        <ModalFooter>
          <Button
            disabled={isLoading}
            variant="light"
            onPress={onCloseModalDelete}
          >
            Cancelar
          </Button>
          <Button
            color="danger"
            isLoading={isLoading}
            startContent={isLoading ? null : <Trash size={16} />}
            onPress={handleConfirm}
          >
            Confirmar Exclusão
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

// ============================================
// COMPONENTE: ExamEditModal
// ============================================
interface ExamEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  exame: ExamRegister;
  atendimento: Scheduling;
  onSave?: (data: any) => Promise<void>; // Alterado para receber os dados do formulário
}
const ExamEditModal: React.FC<ExamEditModalProps> = ({
  isOpen,
  onClose,
  exame,
  atendimento,
  onSave,
}) => {
  const user = useUser();
  const [formData, setFormData] = useState<any>(null);
  const [isLoadingForm, setIsLoadingForm] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  // Estados para lógica de Psicossocial (mesma do AtendimentoModalExames)
  const [entrevistaPsico, setEntrevistaPsico] = useState<boolean>(false);
  const [psicossocial, setPsicossocial] = useState<boolean>(false);

  // Inicializar dados do formulário
  useEffect(() => {
    if (isOpen && exame?.formulario) {
      try {
        // Se o formulário for uma string JSON, parse
        if (typeof exame.formulario === "string") {
          const parsedData = JSON.parse(exame.formulario);

          setFormData(parsedData);
        } else {
          setFormData(exame.formulario);
        }
        setIsLoadingForm(false);

        // Verificar se é Psicossocial com entrevista (mesma lógica do AtendimentoModalExames)
        if (
          exame.grupo === "Psicossocial" &&
          exame.status === ExamStatus.PENDENTE
        ) {
          setPsicossocial(true);
          setEntrevistaPsico(exame.preparacao?.includes("Entrevista") || false);
        } else {
          setPsicossocial(false);
          setEntrevistaPsico(false);
        }
      } catch (error) {
        console.error("Erro ao carregar dados do formulário:", error);
        setFormData({});
        setIsLoadingForm(false);
      }
    }
  }, [isOpen, exame]);

  // Memoriza o mapeamento de formulários (MESMA LÓGICA do AtendimentoModalExames)
  const EXAME_FORM_MAP: Record<string, React.FC<any>> = useMemo(
    () => ({
      "Acuidade Visual": AcuidadeVisual,
      Audiometria: AudiometriaOcupacional,
      Dinamometria: Dinamometria,
      EEG: psicossocial
        ? !entrevistaPsico
          ? Psicossocial
          : ExamePadrao
        : ExamePadrao,

      ECG: psicossocial
        ? !entrevistaPsico
          ? Psicossocial
          : ExamePadrao
        : ExamePadrao,

      Espirometria: Espirometria,
      "Exame Clínico": FichaClinicaOcupacional,
      Psicossocial: Psicossocial,
      Triagem: FichaClinicaOcupacional,
      Ultrassom: Ultrassom,
    }),
    [entrevistaPsico, psicossocial],
  );

  // Determinar qual formulário renderizar (MESMA LÓGICA do AtendimentoModalExames)
  const Formulario = useMemo(() => {
    if (!exame || !atendimento) return null;

    return AtendimentoRules.resolveFormulario({
      exame: exame.grupo || exame.nomeExame || "Exame",
      funcionario: atendimento,
      forms: {
        EXAME_FORM_MAP,
        KitAtendimento,
        FichaClinicaWhirlpool,
      },
    });
  }, [exame, atendimento, EXAME_FORM_MAP]);

  // Função para validar dados (MESMA LÓGICA do AtendimentoModalExames)
  const isValidExamData = (data: any): boolean => {
    return data && typeof data === "object" && Object.keys(data).length > 0;
  };

  // Processa a atualização do exame (MESMA LÓGICA do AtendimentoModalExames)
  const processarAtualizacaoExame = useCallback(
    async (data: any) => {
      if (!atendimento) return;

      setIsSaving(true);
      setError("");

      try {
        const response = await fetch(NEST_SCHEDULINGS_EXAM_UPDATE, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            funcionarioId: atendimento._id,
            codigoExame: exame.codigoExame,
            formulario: data,
            sala: "EDICAO", // Sala especial para edição
            profissional: user ?? "Desconhecido",
            isEditing: true, // Flag para indicar que é edição
          }),
        });

        if (!response.ok) {
          throw new Error("Erro ao atualizar exame");
        }

        const result: Scheduling = await response.json();

        // Se fornecida uma função onSave personalizada, chama-la
        if (onSave) {
          await onSave(data);
        }

        // Fecha o modal após sucesso
        onClose();

        return result;
      } catch (error) {
        const errorMessage = `Não foi possível atualizar o exame. ${error instanceof Error ? error.message : "Tente novamente."}`;

        setError(errorMessage);
        throw error;
      } finally {
        setIsSaving(false);
      }
    },
    [atendimento, exame.codigoExame, user, onSave, onClose],
  );

  /**
   * Função para salvar os dados do exame preenchido
   * MESMA LÓGICA do AtendimentoModalExames (sem modais de confirmação)
   */
  const handleSaveExam = useCallback(
    async (data: any) => {
      if (!atendimento) {
        setError("Funcionário não selecionado");

        return;
      }

      if (!isValidExamData(data)) {
        setError(
          "Os dados do exame estão incompletos ou inválidos. Verifique o preenchimento.",
        );

        return;
      }

      if (!exame || !exame.codigoExame) {
        setError("Exame não encontrado para atualização.");

        return;
      }

      // Salva diretamente (sem modais de confirmação)
      try {
        await processarAtualizacaoExame(data);
      } catch (error) {
        // Erro já tratado em processarAtualizacaoExame
      }
    },
    [atendimento, exame, processarAtualizacaoExame],
  );

  // Atualizar dados do formulário quando o componente filho enviar
  const handleFormChange = useCallback((data: any) => {
    setFormData(data);
  }, []);

  // Renderizar loading
  if (isLoadingForm) {
    return (
      <Modal
        backdrop="blur"
        classNames={{
          wrapper: "z-[1000]",
          backdrop: "z-[1000]",
        }}
        isOpen={isOpen}
        size="2xl"
        onClose={onClose}
      >
        <ModalContent>
          <ModalHeader className="bg-blue-600 text-white">
            Carregando formulário...
          </ModalHeader>
          <ModalBody className="py-8">
            <div className="flex justify-center items-center">
              <Spinner color="primary" size="lg" />
              <span className="ml-4">Carregando dados do exame...</span>
            </div>
          </ModalBody>
        </ModalContent>
      </Modal>
    );
  }

  // Se não encontrar formulário específico, usar ExamePadrao
  if (!Formulario) {
    return (
      <Modal
        backdrop="blur"
        classNames={{
          wrapper: "z-[1000]",
          backdrop: "z-[1000]",
        }}
        isOpen={isOpen}
        scrollBehavior="outside"
        size="5xl"
        onClose={onClose}
      >
        <ModalContent>
          <ExamePadrao
            atendimento={atendimento}
            exame={exame.grupo || exame.nomeExame || "Exame"}
            formulario={formData || {}}
            onClose={onClose}
            onSave={handleSaveExam}
          />
        </ModalContent>
      </Modal>
    );
  }

  return (
    <>
      <Modal
        backdrop="blur"
        classNames={{
          wrapper: "z-[1000]",
          backdrop: "z-[1000]",
        }}
        isOpen={isOpen}
        scrollBehavior="outside"
        size="5xl"
        onClose={onClose}
      >
        <ModalContent>
          <Formulario
            atendimento={atendimento}
            exame={exame.grupo || exame.nomeExame || "Exame"}
            formulario={formData || {}}
            isEditing={true}
            onClose={onClose}
            onSave={handleSaveExam}
          />
        </ModalContent>
      </Modal>

      {/* Modal de erro simplificado */}
      {error && (
        <Modal isOpen={!!error} size="sm" onClose={() => setError("")}>
          <ModalContent>
            <ModalHeader className="bg-red-600 text-white">✗ Erro</ModalHeader>
            <ModalBody>
              <p className="text-red-700">{error}</p>
            </ModalBody>
            <ModalFooter>
              <Button onPress={() => setError("")}>Fechar</Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      )}
    </>
  );
};

// ============================================
// COMPONENTE: DeleteAttachmentModal
// ============================================
const DeleteAttachmentModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  examId: string;
  examName: string;
  examGrupo: string;
  atendimentoId: string;
  onSuccess: (updatedScheduling?: Scheduling) => void;
}> = ({
  isOpen,
  onClose,
  examId,
  examName,
  examGrupo,
  atendimentoId,
  onSuccess,
}) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState("");

  const handleDelete = async () => {
    setIsDeleting(true);
    setError("");

    try {
      const response = await fetch(NEST_SCHEDULINGS_DELETE_ATTACHMENT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          schedulingId: atendimentoId,
          codigoExame: examId,
          grupo: examGrupo,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();

        throw new Error(errorData.message || "Erro ao excluir resultado");
      }

      const result = await response.json();

      if (result.success) {
        // Chama onSuccess passando o scheduling atualizado
        onSuccess(result.scheduling);
      } else {
        throw new Error(result.message || "Erro ao excluir resultado");
      }
    } catch (err: any) {
      console.error("Erro ao excluir anexo:", err);
      setError(err.message || "Erro ao excluir resultado");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Modal
      aria-describedby="delete-attachment-description"
      aria-labelledby="delete-attachment-title"
      classNames={{
        wrapper: "z-[800]",
        backdrop: "z-[700]",
      }}
      disableAnimation={true} // Tente desativar animações se persistir
      isOpen={isOpen}
      shouldBlockScroll={false} // Tente desativar o block scroll
      size="md"
      onClose={onClose}
    >
      <ModalContent>
        <ModalHeader className="flex flex-col gap-1">
          <div className="flex items-center gap-2 text-red-600">
            <AlertCircle size={24} />
            <span>Remover Resultado</span>
          </div>
        </ModalHeader>
        <ModalBody>
          <p className="text-gray-700">
            Tem certeza que deseja remover o resultado do exame{" "}
            <strong>{examName}</strong>?
          </p>
          <p className="text-sm text-gray-500">
            Esta ação removerá o PDF e reverterá o status do exame para
            "Aguardando Resultado".
          </p>
          {error && (
            <div className="p-2 bg-red-50 border border-red-200 rounded">
              <div className="flex items-center gap-2 text-red-600 text-sm">
                <AlertCircle size={14} />
                <span>{error}</span>
              </div>
            </div>
          )}
        </ModalBody>
        <ModalFooter>
          <Button disabled={isDeleting} variant="light" onPress={onClose}>
            Cancelar
          </Button>
          <Button
            color="danger"
            isLoading={isDeleting}
            startContent={isDeleting ? "" : <Trash size={16} />}
            onPress={handleDelete}
          >
            Remover Resultado
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

// ============================================
// COMPONENTE: ExamUploadModal
// ============================================
const ExamUploadModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  exame: ExamRegister;
  atendimento: Scheduling;
  onUploadSuccess: (updatedScheduling: Scheduling) => void;
}> = ({ isOpen, onClose, exame, atendimento, onUploadSuccess }) => {
  const [selectedFiles, setSelectedFiles] = useState<SelectedFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string>("");
  const [uploadSuccess, setUploadSuccess] = useState(false);

  const generateFileId = () =>
    `file_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;

    if (!files) return;

    const newFiles: SelectedFile[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      if (file.type !== "application/pdf") {
        setUploadError(
          `Arquivo inválido: ${file.name}. Apenas PDFs são permitidos.`,
        );
        continue;
      }

      if (file.size > 10 * 1024 * 1024) {
        setUploadError(
          `Arquivo muito grande: ${file.name}. Tamanho máximo: 10MB.`,
        );
        continue;
      }

      const isDuplicate = selectedFiles.some(
        (f) => f.file.name === file.name && f.file.size === file.size,
      );

      if (!isDuplicate) {
        newFiles.push({
          id: generateFileId(),
          file,
          progress: 0,
          uploaded: false,
        });
      }
    }

    if (newFiles.length > 0) {
      setSelectedFiles((prev) => [...prev, ...newFiles]);
      setUploadError("");
    }

    event.target.value = "";
  };

  const handleRemoveFile = (fileId: string) => {
    setSelectedFiles((prev) => prev.filter((f) => f.id !== fileId));
    setUploadError("");
  };

  const updateFileProgress = (fileId: string, progress: number) => {
    setSelectedFiles((prev) =>
      prev.map((f) => (f.id === fileId ? { ...f, progress } : f)),
    );
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) {
      setUploadError("Selecione pelo menos um arquivo PDF.");

      return;
    }

    setIsUploading(true);
    setUploadError("");
    setUploadSuccess(false);

    try {
      const formData = new FormData();

      formData.append("schedulingid", atendimento._id);
      formData.append("grupo", exame.grupo || "");
      formData.append("codigoExame", exame.codigoExame);

      selectedFiles.forEach((file) => {
        formData.append("files", file.file);
      });

      selectedFiles.forEach((file) => {
        updateFileProgress(file.id, 30);
      });

      const response = await fetch(NEST_SCHEDULINGS_UPDATE_EXAM_RESULT, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();

        throw new Error(errorText || "Erro no upload");
      }

      const updatedScheduling: Scheduling = await response.json();

      selectedFiles.forEach((file) => {
        updateFileProgress(file.id, 100);
      });

      setSelectedFiles((prev) => prev.map((f) => ({ ...f, uploaded: true })));

      setUploadSuccess(true);
      onUploadSuccess(updatedScheduling);

      setTimeout(() => {
        onClose();
        setSelectedFiles([]);
        setUploadSuccess(false);
      }, 2000);
    } catch (error: any) {
      console.error("Erro no upload:", error);
      setUploadError(error.message || "Falha no upload. Tente novamente.");

      setSelectedFiles((prev) =>
        prev.map((f) => ({ ...f, progress: 0, error: error.message })),
      );
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Modal
      backdrop="blur"
      classNames={{
        wrapper: "z-[1000]",
        backdrop: "z-[1000]",
      }}
      isOpen={isOpen}
      size="xl"
      onClose={onClose}
    >
      <ModalContent>
        <ModalHeader className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <Upload size={20} />
            <span>Upload de Resultado - {exame.nomeExame}</span>
          </div>
        </ModalHeader>
        <ModalBody>
          <div className="space-y-4">
            <div className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Paperclip className="text-gray-500" size={16} />
                  <span className="text-sm font-medium text-gray-700">
                    Selecionar Arquivos PDF
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    multiple
                    accept="application/pdf"
                    className="hidden"
                    disabled={isUploading}
                    id="file-input-modal"
                    type="file"
                    onChange={handleFileSelect}
                  />
                  <label
                    className={`cursor-pointer flex items-center gap-2 px-3 py-1.5 text-sm rounded-lg border ${
                      isUploading
                        ? "bg-gray-100 text-gray-400 cursor-not-allowed border-gray-200"
                        : "bg-blue-50 text-blue-600 hover:bg-blue-100 border-blue-200"
                    }`}
                    htmlFor="file-input-modal"
                  >
                    <Upload size={14} />
                    Selecionar Arquivos
                  </label>
                </div>
              </div>

              <SelectedFilesList
                files={selectedFiles}
                isUploading={isUploading}
                onRemove={handleRemoveFile}
              />

              {uploadError && (
                <div className="p-2 bg-red-50 border border-red-200 rounded-lg mt-3">
                  <div className="flex items-center gap-2 text-red-600 text-sm">
                    <AlertCircle size={14} />
                    <span>{uploadError}</span>
                  </div>
                </div>
              )}

              {uploadSuccess && (
                <div className="p-2 bg-green-50 border border-green-200 rounded-lg mt-3">
                  <div className="flex items-center gap-2 text-green-600 text-sm">
                    <CheckCircle size={14} />
                    <span>
                      Upload realizado com sucesso! O modal fechará em breve...
                    </span>
                  </div>
                </div>
              )}

              <div className="text-xs text-gray-500 mt-3">
                <p>• Selecione um ou mais arquivos PDF (múltipla seleção)</p>
                <p>• Tamanho máximo por arquivo: 10MB</p>
                <p>• Os arquivos serão mesclados em um único PDF</p>
                <p>• Você pode remover arquivos antes de enviar</p>
              </div>
            </div>
          </div>
        </ModalBody>
        <ModalFooter>
          <Button disabled={isUploading} variant="light" onPress={onClose}>
            Cancelar
          </Button>
          <Button
            color="primary"
            disabled={selectedFiles.length === 0 || isUploading}
            isLoading={isUploading}
            startContent={<Upload size={16} />}
            onPress={handleUpload}
          >
            Enviar ({selectedFiles.length})
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

// ============================================
// COMPONENTE: InformacoesGerais
// ============================================
const InformacoesGerais: React.FC<{
  atendimento: Scheduling;
  editMode: EditModeState;
  onEditModeChange: (mode: EditModeState) => void;
  onSave: (data: Partial<Scheduling>) => Promise<void>;
}> = ({ atendimento, editMode, onEditModeChange, onSave }) => {
  const [isSaving, setIsSaving] = useState(false);

  const handleFieldChange = (field: keyof Scheduling, value: string) => {
    onEditModeChange({
      ...editMode,
      editedData: {
        ...editMode.editedData,
        [field]: value,
      },
    });
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      await onSave(editMode.editedData);
      onEditModeChange({ isEditing: false, editedData: {} });
    } catch (error) {
      console.error("Erro ao salvar:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    onEditModeChange({ isEditing: false, editedData: {} });
  };

  const renderField = (
    field: keyof Scheduling,
    label: string,
    value: string,
  ) => {
    if (
      editMode.isEditing &&
      [
        "NOME",
        "CPFFUNCIONARIO",
        "DATANASCIMENTO",
        "MATRICULAFUNCIONARIO",
      ].includes(field)
    ) {
      return (
        <Input
          className="max-w-xs text-sm"
          placeholder={label}
          size="sm"
          value={(editMode.editedData[field] as string) || value}
          onChange={(e) => handleFieldChange(field, e.target.value)}
        />
      );
    }

    return <span className="text-gray-900">{value || "Não informado"}</span>;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-end mb-2">
        {editMode.isEditing ? (
          <div className="flex gap-2">
            <Button
              color="danger"
              size="sm"
              startContent={<X size={16} />}
              variant="light"
              onPress={handleCancel}
            >
              Cancelar
            </Button>
            <Button
              color="primary"
              isLoading={isSaving}
              size="sm"
              startContent={<Save size={16} />}
              onPress={handleSave}
            >
              Salvar
            </Button>
          </div>
        ) : (
          <Button
            size="sm"
            startContent={<Pen size={16} />}
            variant="light"
            onPress={() =>
              onEditModeChange({ isEditing: true, editedData: {} })
            }
          >
            Editar Dados
          </Button>
        )}
      </div>

      <div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-3">
            <h4 className="font-medium text-sm text-gray-600 mb-2 flex items-center gap-2">
              <User size={16} />
              Dados do Paciente
            </h4>
            <div className="space-y-2 text-sm">
              <div>
                <label className="text-sm font-medium text-gray-500 block mb-1">
                  Nome
                </label>
                {renderField("NOME", "Nome", atendimento.NOME)}
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500 block mb-1">
                  CPF
                </label>
                {renderField(
                  "CPFFUNCIONARIO",
                  "CPF",
                  formatCPF(atendimento.CPFFUNCIONARIO),
                )}
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500 block mb-1">
                  Data Nascimento
                </label>
                {renderField(
                  "DATANASCIMENTO",
                  "Data Nascimento",
                  atendimento?.DATANASCIMENTO ?? "",
                )}
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500 block mb-1">
                  Matrícula
                </label>
                {renderField(
                  "MATRICULAFUNCIONARIO",
                  "Registro eSocial",
                  atendimento?.MATRICULAFUNCIONARIO ?? "",
                )}
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="font-medium text-sm text-gray-600 mb-2 flex items-center gap-2">
              <Building size={16} />
              Dados da Empresa
            </h4>
            <div className="space-y-2 text-sm">
              <div>
                <label className="text-sm font-medium text-gray-500 block mb-1">
                  Empresa
                </label>
                <span className="text-gray-900">
                  {atendimento.NOMEEMPRESA || "Não informado"}
                </span>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500 block mb-1">
                  CNPJ/CPF
                </label>
                <span className="text-gray-900">
                  {atendimento.CNPJEMPRESA ||
                    atendimento.CPFEMPRESA ||
                    "Não informado"}
                </span>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500 block mb-1">
                  Cargo
                </label>
                <span className="text-gray-900">
                  {atendimento.NOMECARGO || "Não informado"}
                </span>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500 block mb-1">
                  Setor
                </label>
                <span className="text-gray-900">
                  {atendimento.NOMESETOR || "Não informado"}
                </span>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500 block mb-1">
                  Unidade
                </label>
                <span className="text-gray-900">
                  {atendimento.NOMEUNIDADE || "Não informado"}
                </span>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="font-medium text-sm text-gray-600 mb-2 flex items-center gap-2">
              <Calendar size={16} />
              Agendamento
            </h4>
            <div className="space-y-2 text-sm">
              <div>
                <label className="text-sm font-medium text-gray-500 block mb-1">
                  Data e Hora
                </label>
                <span className="text-gray-900">
                  {atendimento.TICKET
                    ? new Date(atendimento.TICKET?.emissao).toLocaleString(
                        "pt-BR",
                      )
                    : `${atendimento.DATAAGENDAMENTO}, ${atendimento.HORARIO}`}
                </span>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500 block mb-1">
                  Tipo Exame
                </label>
                <span className="text-gray-900">
                  {atendimento.TIPOEXAMENOME || "Não informado"}
                </span>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500 block mb-1">
                  Unidade de Atendimento
                </label>
                <span className="text-gray-900">
                  {atendimento.UNIDADEATENDIMENTO || "Não informado"}
                </span>
              </div>
              {atendimento.TICKET?.prefixo && (
                <div>
                  <label className="text-sm font-medium text-gray-500 block mb-1">
                    Senha
                  </label>
                  <span className="text-gray-900">
                    {`${atendimento.TICKET?.prefixo}${atendimento.TICKET?.numero}` ||
                      "Não informado"}
                  </span>
                </div>
              )}
              {atendimento.TICKET?.atendente && (
                <div>
                  <label className="text-sm font-medium text-gray-500 block mb-1">
                    Atendente
                  </label>
                  <span className="text-gray-900">
                    {atendimento.TICKET?.atendente || "Não informado"}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        <Divider className="mt-4" />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
          <div className="space-y-3">
            <h4 className="font-medium text-sm text-gray-600 mb-2 flex items-center gap-2">
              <UserCheck size={16} />
              Status do Atendimento
            </h4>
            <Chip
              className="text-white"
              color={getStatusColor(atendimento.ATENDIMENTOSTATUS)}
              size="lg"
            >
              {atendimento.ATENDIMENTOSTATUS.replace(/_/g, " ")
                .toLowerCase()
                .replace(/\b\w/g, (l: string) => l.toUpperCase())}
            </Chip>
          </div>

          {atendimento.MEDICO && (
            <div className="space-y-3">
              <h4 className="font-medium text-sm text-gray-600 mb-2 flex items-center gap-2">
                <FileCheck size={16} />
                Parecer ASO
              </h4>
              <span className="text-sm text-gray-900">
                {atendimento.PARECERMEDICO?.replace(/_/g, " ") ||
                  "Não informado"}
              </span>
            </div>
          )}

          {atendimento.MEDICO && (
            <div className="space-y-3">
              <h4 className="font-medium text-sm text-gray-600 mb-2 flex items-center gap-2">
                <Stethoscope size={16} />
                Liberado por
              </h4>
              <span className="text-sm text-gray-900">
                {atendimento.MEDICO || "Não informado"}
              </span>
            </div>
          )}
        </div>

        {(atendimento.OBSERVACOES ||
          atendimento.ANOTACOES ||
          atendimento.RECOMENDACAOMEDICA) && (
          <>
            <Divider className="my-6" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {atendimento.OBSERVACOES && (
                <div className="space-y-3">
                  <h4 className="font-medium text-sm text-gray-600 mb-2">
                    Observações do Atendimento
                  </h4>
                  <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                    <p className="text-sm text-gray-900 whitespace-pre-wrap">
                      {atendimento.OBSERVACOES}
                    </p>
                  </div>
                </div>
              )}

              {atendimento.ANOTACOES && (
                <div className="space-y-3">
                  <h4 className="font-medium text-sm text-gray-600 mb-2">
                    Anotações da Equipe
                  </h4>
                  <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                    <p className="text-sm text-gray-900 whitespace-pre-wrap">
                      {atendimento.ANOTACOES}
                    </p>
                  </div>
                </div>
              )}

              {atendimento.RECOMENDACAOMEDICA && (
                <div className="md:col-span-2 space-y-3">
                  <h4 className="font-medium text-sm text-gray-600 mb-2">
                    Recomendação Médica
                  </h4>
                  <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                    <p className="text-sm text-gray-900 whitespace-pre-wrap">
                      {atendimento.RECOMENDACAOMEDICA}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>
      <Divider />
    </div>
  );
};

InformacoesGerais.displayName = "InformacoesGerais";

// ============================================
// COMPONENTE: ExamesTable
// ============================================
const ExamesTable: React.FC<{
  exames: ExamRegister[];
  atendimento: Scheduling;
  onUpdateScheduling?: (updated: Scheduling) => void;
}> = ({ exames, atendimento, onUpdateScheduling }) => {
  const [localExames, setLocalExames] = useState<ExamRegister[]>(exames || []);
  const [searchTerm, setSearchTerm] = useState("");
  const [uploadExamModal, setUploadExamModal] = useState<UploadExamModalState>({
    isOpen: false,
    exame: null,
    selectedFiles: [],
    isUploading: false,
    error: "",
    success: false,
  });
  const [deleteAttachmentModal, setDeleteAttachmentModal] = useState<{
    isOpen: boolean;
    examId: string;
    examName: string;
    examGrupo: string;
  }>({ isOpen: false, examId: "", examName: "", examGrupo: "" });
  const [editExamModal, setEditExamModal] = useState<{
    isOpen: boolean;
    exam: ExamRegister | null;
  }>({ isOpen: false, exam: null });
  const [reemitindoExams, setReemitindoExams] = useState<
    Record<string, boolean>
  >({});

  useEffect(() => {
    setLocalExames(exames || []);
  }, [exames]);

  const handleUploadSuccess = (updatedScheduling: Scheduling) => {
    setLocalExames(updatedScheduling.EXAMES || []);
    if (onUpdateScheduling) {
      onUpdateScheduling(updatedScheduling);
    }
  };

  const handleDeleteSuccess = (updatedScheduling?: Scheduling) => {
    // Fecha o modal de confirmação
    setDeleteAttachmentModal({
      isOpen: false,
      examId: "",
      examName: "",
      examGrupo: "",
    });

    if (updatedScheduling) {
      // Atualiza o estado local com os dados recebidos do backend
      setLocalExames(updatedScheduling.EXAMES || []);

      // Atualiza o componente pai se necessário
      if (onUpdateScheduling) {
        onUpdateScheduling(updatedScheduling);
      }
    } else {
      // Se não recebeu os dados atualizados, faz uma nova requisição para buscar
      fetchUpdatedExames();
    }
  };

  const fetchUpdatedExames = async () => {
    try {
      const response = await fetch(
        `${NEST_RELATORIO_FUNCIONARIO}/${atendimento._id}`,
      );

      if (response.ok) {
        const updatedAtendimento = await response.json();

        setLocalExames(updatedAtendimento.EXAMES || []);
        if (onUpdateScheduling) {
          onUpdateScheduling(updatedAtendimento);
        }
      }
    } catch (error) {
      console.error("Erro ao buscar exames atualizados:", error);
    }
  };

  const handleEditExam = async (editedExam: ExamRegister) => {
    try {
      const response = await fetch(NEST_SCHEDULINGS_EXAM_UPDATE, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          funcionarioId: atendimento._id,
          codigoExame: [editedExam.codigoExame],
          formulario: editedExam.formulario,
          updates: {
            sala: editedExam.sala,
            profissional: editedExam.profissional,
          },
        }),
      });

      if (response.ok) {
        const updatedScheduling = await response.json();

        setLocalExames(updatedScheduling.EXAMES || []);
        if (onUpdateScheduling) {
          onUpdateScheduling(updatedScheduling);
        }
        setEditExamModal({ isOpen: false, exam: null });
      }
    } catch (error) {
      console.error("Erro ao editar exame:", error);
    }
  };

  const filteredExames = useMemo(() => {
    if (!searchTerm) return localExames;

    return localExames.filter(
      (exame) =>
        exame.nomeExame.toLowerCase().includes(searchTerm.toLowerCase()) ||
        exame.codigoExame.toLowerCase().includes(searchTerm.toLowerCase()) ||
        exame.grupo?.toLowerCase().includes(searchTerm.toLowerCase()),
    );
  }, [localExames, searchTerm]);

  const getExamStatusColor = (status: string) => {
    switch (status) {
      case ExamStatus.FINALIZADO:
        return "success";
      case ExamStatus.PENDENTE:
        return "warning";
      case ExamStatus.AGUARDANDO_RESULTADO:
        return "secondary";
      default:
        return "default";
    }
  };

  const getExamStatusIcon = (status: string) => {
    switch (status) {
      case ExamStatus.FINALIZADO:
        return <CheckCircle size={14} />;
      case ExamStatus.PENDENTE:
        return <Clock size={14} />;
      case ExamStatus.AGUARDANDO_RESULTADO:
        return <AlertCircle size={14} />;
      default:
        return <Clock size={14} />;
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "-";

    return new Date(dateString).toLocaleString("pt-BR");
  };

  const calculateWaitTime = (
    ticketTime: Date | null | undefined,
    exame: ExamRegister,
  ) => {
    if (!ticketTime || !exame) return null;

    try {
      const ticketDate = adjustForBrazilTime(new Date(ticketTime));
      const exameDate = adjustForBrazilTime(new Date(exame.dataExame));

      const diffMs = exameDate.getTime() - ticketDate.getTime();
      const diffMinutes = Math.floor(diffMs / (1000 * 60));

      if (diffMinutes <= 0) {
        return "0 min";
      }

      if (diffMinutes < 60) {
        return `${diffMinutes} min`;
      } else {
        const hours = Math.floor(diffMinutes / 60);
        const minutes = diffMinutes % 60;

        return `${hours}h ${minutes}min`;
      }
    } catch {
      return null;
    }
  };

  if (!localExames.length) {
    return (
      <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
        <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Nenhum exame encontrado
        </h3>
        <p className="text-gray-500">
          Não há exames cadastrados para este atendimento.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Modal para exclusão de anexo - ATUALIZADO */}
      <DeleteAttachmentModal
        atendimentoId={atendimento._id}
        examGrupo={deleteAttachmentModal.examGrupo}
        examId={deleteAttachmentModal.examId}
        examName={deleteAttachmentModal.examName}
        isOpen={deleteAttachmentModal.isOpen}
        onClose={() =>
          setDeleteAttachmentModal({
            isOpen: false,
            examId: "",
            examName: "",
            examGrupo: "",
          })
        }
        onSuccess={handleDeleteSuccess}
      />

      {editExamModal.isOpen && editExamModal.exam && (
        <ExamEditModal
          atendimento={atendimento}
          exame={editExamModal.exam}
          isOpen={editExamModal.isOpen}
          onClose={() => setEditExamModal({ isOpen: false, exam: null })}
          onSave={handleEditExam}
        />
      )}

      {uploadExamModal.isOpen && uploadExamModal.exame && (
        <ExamUploadModal
          atendimento={atendimento}
          exame={uploadExamModal.exame}
          isOpen={uploadExamModal.isOpen}
          onClose={() =>
            setUploadExamModal({
              isOpen: false,
              exame: null,
              selectedFiles: [],
              isUploading: false,
              error: "",
              success: false,
            })
          }
          onUploadSuccess={handleUploadSuccess}
        />
      )}

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-4">
          <h3 className="text-lg font-semibold text-gray-900">
            Exames Realizados
          </h3>
          <div className="flex items-center gap-4 text-sm text-gray-600">
            <span className="flex items-center gap-1">
              <div className="w-2 h-2 bg-green-500 rounded-full" />
              {localExames.filter((e) => e.status === "FINALIZADO").length}{" "}
              Finalizados
            </span>
            <span className="flex items-center gap-1">
              <div className="w-2 h-2 bg-yellow-500 rounded-full" />
              {localExames.filter((e) => e.status === "PENDENTE").length}{" "}
              Pendentes
            </span>
            <span className="flex items-center gap-1">
              <div className="w-2 h-2 bg-blue-500 rounded-full" />
              {localExames.filter((e) => e.url).length} Com resultado
            </span>
          </div>
        </div>
        <Input
          className="w-full sm:w-64"
          placeholder="Buscar exames..."
          size="sm"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="border border-gray-200 rounded-lg overflow-hidden">
        <Table
          removeWrapper
          aria-label="Tabela de exames"
          classNames={{
            base: "min-w-full",
            th: "bg-gray-50 text-gray-700 font-semibold text-xs px-3 py-2",
            td: "px-3 py-2",
          }}
        >
          <TableHeader>
            <TableColumn>EXAME</TableColumn>
            <TableColumn className="w-4/24">STATUS</TableColumn>
            <TableColumn>RESULTADO</TableColumn>
            <TableColumn className="text-center">AÇÕES</TableColumn>
          </TableHeader>
          <TableBody>
            {filteredExames.map((exame, index) => {
              const examKey = exame.codigoExame || index.toString();
              const waitTime = calculateWaitTime(
                atendimento.TICKET?.emissao,
                exame,
              );

              return (
                <TableRow key={examKey}>
                  <TableCell>
                    <div className="flex flex-col">
                      <div className="font-medium text-gray-900 text-sm">
                        {exame.nomeExame}
                      </div>
                      <div className="flex gap-4 text-xs text-gray-500">
                        <span>{formatDate(exame.dataExame)}</span>
                        <span>{exame.sala}</span>
                        <span>{exame.profissional}</span>
                      </div>
                      {waitTime && (
                        <div className="flex items-center gap-1 mt-1 text-xs text-gray-500">
                          <span>Espera: {waitTime}</span>
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Chip
                      classNames={{ content: "text-xs" }}
                      color={getExamStatusColor(exame.status)}
                      size="sm"
                      startContent={getExamStatusIcon(exame.status)}
                      variant="flat"
                    >
                      {exame.status}
                    </Chip>
                  </TableCell>
                  <TableCell>
                    {exame.url && (
                      <div className="flex flex-col gap-1">
                        <Button
                          className="w-full"
                          color="primary"
                          size="sm"
                          startContent={<Eye size={14} />}
                          variant="light"
                          onPress={() => window.open(exame.url, "_blank")}
                        >
                          Visualizar Resultado
                        </Button>
                      </div>
                    )}
                    <div className="flex flex-col gap-1">
                      <Button
                        color="primary"
                        size="sm"
                        startContent={<Upload size={14} />}
                        variant="flat"
                        onPress={() =>
                          setUploadExamModal({
                            isOpen: true,
                            exame,
                            selectedFiles: [],
                            isUploading: false,
                            error: "",
                            success: false,
                          })
                        }
                      >
                        Enviar Resultado
                      </Button>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-center gap-1">
                      <Dropdown>
                        <DropdownTrigger>
                          <Button
                            isIconOnly
                            className="min-w-8"
                            size="sm"
                            variant="light"
                          >
                            <MoreVertical size={14} />
                          </Button>
                        </DropdownTrigger>
                        <DropdownMenu aria-label="Ações do exame">
                          {/* <DropdownItem
                          key="edit"
                          textValue="Editar Exame" 
                          startContent={<Pen size={14} />}
                          onPress={() => setEditExamModal({ isOpen: true, exam: exame })}
                        >
                          Editar Exame
                        </DropdownItem> */}

                          {exame.url ? (
                            <DropdownItem
                              key="delete-result"
                              className="text-danger"
                              color="danger"
                              startContent={<Trash size={14} />}
                              textValue="Remover Resultado"
                              onPress={() =>
                                setDeleteAttachmentModal({
                                  isOpen: true,
                                  examId: exame.codigoExame,
                                  examName: exame.nomeExame,
                                  examGrupo: exame.grupo || "",
                                })
                              }
                            >
                              Remover Resultado
                            </DropdownItem>
                          ) : null}
                        </DropdownMenu>
                      </Dropdown>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

ExamesTable.displayName = "ExamesTable";

// ============================================
// COMPONENTE PRINCIPAL: LazyModalContent
// ============================================
const LazyModalContent: React.FC<LazyModalContentProps> = ({
  atendimento,
  onClose,
  onUpdateScheduling,
}) => {
  const [editMode, setEditMode] = useState<EditModeState>({
    isEditing: false,
    editedData: {},
  });
  const [loadingViewMedicalRecord, setLoadingViewMedicalRecord] =
    useState(false);
  const [loadingSyncSoc, setLoadingSyncSoc] = useState(false);
  const [loadingDeleteScheduling, setLoadingDeleteScheduling] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);

  const handleViewMedicalRecord = async () => {
    try {
      setLoadingViewMedicalRecord(true);

      const response = await fetch(
        `${NEST_SCHEDULINGS_PRONTUARIO}/${atendimento._id}`,
      );

      if (!response.ok) {
        throw new Error("Erro ao buscar prontuário");
      }

      const data = await response.json();

      if (data.sas_url) {
        window.open(data.sas_url, "_blank", "noopener,noreferrer");
      } else {
        alert("Prontuário não disponível");
      }
    } catch (error) {
      console.error("Erro ao visualizar prontuário:", error);
      alert("Não foi possível carregar o prontuário");
    } finally {
      setLoadingViewMedicalRecord(false);
    }
  };

  const handleSyncWithSOC = async () => {
    try {
      setLoadingSyncSoc(true);
      const response = await fetch(NEST_SCHEDULINGS_SYNC_SOC, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          schedulingId: atendimento._id,
          cpf: atendimento.CPFFUNCIONARIO,
        }),
      });

      if (!response.ok) {
        throw new Error("Erro ao sincronizar com SOC");
      }

      const updatedScheduling = await response.json();

      if (onUpdateScheduling) {
        onUpdateScheduling(updatedScheduling);
      }

      alert("Sincronização realizada com sucesso!");
    } catch (error) {
      console.error("Erro ao sincronizar:", error);
      alert("Erro ao sincronizar com SOC");
    } finally {
      setLoadingSyncSoc(false);
    }
  };

  const handleDeleteScheduling = async (password: string) => {
    try {
      setLoadingDeleteScheduling(true);
      const response = await fetch(NEST_SCHEDULINGS_DELETE, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          schedulingId: atendimento._id,
          password: password,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();

        throw new Error(errorData.message || "Erro ao excluir atendimento");
      }

      alert("Atendimento excluído com sucesso!");
      setDeleteModalOpen(false);
      onClose();
    } catch (error: any) {
      console.error("Erro ao excluir:", error);
      alert(error.message || "Erro ao excluir atendimento");
    } finally {
      setLoadingDeleteScheduling(false);
    }
  };

  const handleSaveEmployeeData = async (data: Partial<Scheduling>) => {
    try {
      const response = await fetch(NEST_SCHEDULINGS_UPDATE, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          schedulingId: atendimento._id,
          updates: data,
        }),
      });

      if (!response.ok) {
        throw new Error("Erro ao atualizar dados do funcionário");
      }

      const updatedAtendimento = await response.json();

      if (onUpdateScheduling) {
        onUpdateScheduling(updatedAtendimento);
      }

      return updatedAtendimento;
    } catch (error) {
      console.error("Erro ao salvar dados do funcionário:", error);
      throw error;
    }
  };

  return (
    <>
      <DeleteConfirmationModal
        isLoading={loadingDeleteScheduling}
        isOpenModalDelete={deleteModalOpen}
        onCloseModalDelete={() => setDeleteModalOpen(false)}
        onConfirm={handleDeleteScheduling}
      />

      <ModalHeader className="flex gap-2">
        <div className="flex items-center justify-between w-full">
          <div>
            <h2 className="text-xl font-bold">{atendimento.NOME}</h2>
            <div className="flex gap-4 text-sm text-gray-600 mt-1">
              <span>{atendimento.TIPOEXAMENOME}</span>
              <span>{atendimento.DATAAGENDAMENTO}</span>
            </div>
            <span className="flex gap-6 text-sm text-gray-600 mt-1">
              {atendimento.NOMEEMPRESA}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <Button
              color="default"
              disabled={loadingViewMedicalRecord}
              size="sm"
              startContent={
                loadingViewMedicalRecord ? (
                  <Spinner size={"sm"} />
                ) : (
                  <Eye size={16} />
                )
              }
              variant="light"
              onPress={handleViewMedicalRecord}
            >
              Ver Prontuário
            </Button>
            <Button
              color="default"
              disabled={loadingSyncSoc}
              size="sm"
              startContent={
                loadingSyncSoc ? (
                  <Spinner size={"sm"} />
                ) : (
                  <RefreshCw size={16} />
                )
              }
              variant="light"
              onPress={handleSyncWithSOC}
            >
              Sincronizar SOC
            </Button>
            <Button
              color="danger"
              disabled={loadingDeleteScheduling}
              size="sm"
              startContent={<Trash size={16} />}
              variant="light"
              onPress={() => setDeleteModalOpen(true)}
            >
              Excluir
            </Button>
          </div>
        </div>
      </ModalHeader>
      <ModalBody>
        <InformacoesGerais
          atendimento={atendimento}
          editMode={editMode}
          onEditModeChange={setEditMode}
          onSave={handleSaveEmployeeData}
        />
        <ExamesTable
          atendimento={atendimento}
          exames={atendimento.EXAMES}
          onUpdateScheduling={onUpdateScheduling}
        />
      </ModalBody>
      <ModalFooter>
        <Button variant="light" onPress={onClose}>
          Fechar
        </Button>
      </ModalFooter>
    </>
  );
};

LazyModalContent.displayName = "LazyModalContent";
export default LazyModalContent;
