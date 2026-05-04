// page.tsx
// app/relatorios/LazyModalContent.tsx
import React, { useState, useCallback } from "react";
import {
  Modal as HeroModal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Spinner,
} from "@heroui/react";
import { Eye, Trash, RefreshCw, FileText } from "lucide-react"; // ícone para relatório

import DeleteConfirmationModal from "./components/DeleteConfirmationModal";
import InformacoesGerais, {
  EditModeState,
} from "./components/InformacoesGerais";
import ExamesTable from "./components/ExamesTable";
import AnexosUpload from "./components/AnexosUpload"; // Importe o novo componente

import {
  NEST_SCHEDULINGS_UPDATE,
  NEST_SCHEDULINGS_DELETE,
  NEST_SCHEDULINGS_ANEXO_UPLOAD,
  NEST_SCHEDULINGS_ANEXO_REMOVE,
  NEST_SCHEDULINGS_PRONTUARIO,
  NEST_SOC_SINCRONIZAR_PRONTUARIO,
  NEST_RELATORIO_FUNCIONARIO,
} from "@/config/constants";
import { reportInternal } from "@/lib/scheduling/report/reportInternal"; // função de geração de relatório
import { Scheduling } from "@/lib/scheduling/interface/scheduling";
import { IUserInfo } from "@/hooks/useUser";

interface LazyModalContentProps {
  atendimento: Scheduling;
  userApp: IUserInfo | null;
  onClose: () => void;
  onUpdateScheduling?: (updated: Scheduling) => void;
}

interface SyncProntuarioPayload {
  success?: boolean;
  message?: string;
  data?: Scheduling;
  resumo?: {
    preservados?: number;
    adicionados?: number;
    removidos?: number;
  };
}

// ============================================
// COMPONENTE PRINCIPAL: LazyModalContent
// ============================================
const LazyModalContent: React.FC<LazyModalContentProps> = ({
  atendimento,
  userApp,
  onClose,
  onUpdateScheduling,
}) => {
  const [editMode, setEditMode] = useState<EditModeState>({
    isEditing: false,
    editedData: {},
  });
  const [loadingViewMedicalRecord, setLoadingViewMedicalRecord] =
    useState(false);
  const [loadingViewReport, setLoadingViewReport] = useState(false);
  const [loadingSyncSoc, setLoadingSyncSoc] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [loadingAttachments, setLoadingAttachments] = useState(false);

  // Estado para modal de alerta
  const [alertModal, setAlertModal] = useState<{
    open: boolean;
    type: "success" | "error" | "warning";
    message: string;
    onConfirm?: () => void;
  }>({ open: false, type: "warning", message: "" });

  // ============================================
  // HANDLERS PARA ANEXOS
  // ============================================

  const handleUploadAttachments = useCallback(
    async (files: File[]) => {
      if (!files.length || !atendimento._id) return;

      setLoadingAttachments(true);
      try {
        const formData = new FormData();

        formData.append("schedulingId", atendimento._id);
        files.forEach((file) => {
          formData.append("files", file);
        });

        const response = await fetch(NEST_SCHEDULINGS_ANEXO_UPLOAD, {
          method: "POST",
          body: formData,
        });

        if (!response.ok) {
          throw new Error("Erro ao fazer upload dos anexos");
        }

        const updatedAtendimento = await response.json();

        if (onUpdateScheduling) {
          onUpdateScheduling(updatedAtendimento);
        }

        setAlertModal({
          open: true,
          type: "success",
          message: "Anexos enviados com sucesso!",
        });
      } catch (error) {
        console.error("Erro ao fazer upload:", error);
        setAlertModal({
          open: true,
          type: "error",
          message: "Erro ao enviar anexos",
        });
      } finally {
        setLoadingAttachments(false);
      }
    },
    [atendimento._id, onUpdateScheduling],
  );

  const handleRemoveAttachment = useCallback(
    async (fileName: string) => {
      if (!atendimento._id) return;

      setAlertModal({
        open: true,
        type: "warning",
        message: "Deseja realmente remover este anexo?",
        onConfirm: async () => {
          try {
            const response = await fetch(NEST_SCHEDULINGS_ANEXO_REMOVE, {
              method: "DELETE",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                schedulingId: atendimento._id,
                fileName: fileName,
              }),
            });

            if (!response.ok) {
              throw new Error("Erro ao remover anexo");
            }

            const updatedAtendimento = await response.json();

            if (onUpdateScheduling) {
              onUpdateScheduling(updatedAtendimento);
            }

            setAlertModal({
              open: true,
              type: "success",
              message: "Anexo removido com sucesso!",
            });
          } catch (error) {
            console.error("Erro ao remover anexo:", error);
            setAlertModal({
              open: true,
              type: "error",
              message: "Erro ao remover anexo",
            });
          }
        },
      });
    },
    [atendimento._id, onUpdateScheduling],
  );

  // ============================================
  // HANDLERS EXISTENTES
  // ============================================

  const handleViewMedicalRecord = async () => {
    try {
      setLoadingViewMedicalRecord(true);
      const response = await fetch(
        `${NEST_SCHEDULINGS_PRONTUARIO}${atendimento._id}`,
      );

      if (!response.ok) {
        const txt = await response.text();

        throw new Error(`Erro ao buscar prontuário: ${txt}`);
      }

      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const newWin = window.open(blobUrl, "_blank", "noopener,noreferrer");

      if (!newWin) {
        URL.revokeObjectURL(blobUrl);
        setAlertModal({
          open: true,
          type: "error",
          message: "Não foi possível abrir o prontuário em nova aba",
        });
        return;
      }

      setTimeout(() => URL.revokeObjectURL(blobUrl), 60_000);
    } catch (error) {
      console.error("Erro ao visualizar prontuário:", error);
      setAlertModal({
        open: true,
        type: "error",
        message: "Não foi possível carregar o prontuário",
      });
    } finally {
      setLoadingViewMedicalRecord(false);
    }
  };

  // handler para carregar relatório do Mongo e abrir em nova aba
  const handleViewReport = async () => {
    if (!atendimento?._id) return;
    try {
      setLoadingViewReport(true);
      const response = await fetch(
        `${NEST_RELATORIO_FUNCIONARIO}${atendimento._id}`,
      );

      if (!response.ok) {
        throw new Error("Erro ao carregar relatório");
      }
      const data: Scheduling = await response.json();
      const html = reportInternal(data);
      const newWin = window.open("", "_blank");

      if (newWin) {
        newWin.document.open();
        newWin.document.write(html);
        newWin.document.close();
        newWin.onload = () => newWin.focus();
      } else {
        setAlertModal({
          open: true,
          type: "error",
          message: "Não foi possível abrir o relatório em nova aba",
        });
      }
    } catch (error) {
      console.error("Erro ao buscar relatório:", error);
      setAlertModal({
        open: true,
        type: "error",
        message: "Não foi possível carregar o relatório",
      });
    } finally {
      setLoadingViewReport(false);
    }
  };

  const handleSyncWithSOC = async () => {
    try {
      setLoadingSyncSoc(true);

      const response = await fetch(NEST_SOC_SINCRONIZAR_PRONTUARIO, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          schedulingId: atendimento._id,
          empresa: atendimento.CODIGOEMPRESA,
          funcionario: atendimento.CODIGO,
        }),
      });

      const payload: SyncProntuarioPayload = await response.json();

      if (!response.ok || !payload?.success || !payload?.data) {
        throw new Error(payload?.message || "Erro ao sincronizar com SOC");
      }

      onUpdateScheduling?.(payload.data);

      const resumo = payload.resumo;
      const resumoMessage = resumo
        ? `\n\nResumo da sincronizacao:\n- Preservados: ${resumo.preservados ?? 0}\n- Adicionados: ${resumo.adicionados ?? 0}\n- Removidos: ${resumo.removidos ?? 0}`
        : "";

      setAlertModal({
        open: true,
        type: "success",
        message: `Sincronizacao do prontuario realizada com sucesso!${resumoMessage}`,
      });
    } catch (error) {
      console.error("Erro ao sincronizar:", error);
      setAlertModal({
        open: true,
        type: "error",
        message:
          error instanceof Error
            ? error.message
            : "Erro ao sincronizar prontuario com SOC",
      });
    } finally {
      setLoadingSyncSoc(false);
    }
  };

  const handleDeleteScheduling = async (password: string) => {
    try {
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

      return Promise.resolve();
    } catch (error: any) {
      console.error("Erro ao excluir:", error);

      return Promise.reject(error);
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
        isOpenModalDelete={deleteModalOpen}
        onCloseModalDelete={() => setDeleteModalOpen(false)}
        onConfirm={handleDeleteScheduling}
        onDeleteSuccess={onClose}
      />

      <ModalHeader className="flex gap-2">
        <div className="flex items-center justify-between w-full">
          <div>
            <div className="flex items-baseline gap-4 text-sm text-gray-600 mt-1">
              <h2 className="text-xl font-bold">
                {atendimento.NOME.toUpperCase()}
              </h2>
              <span>{atendimento.TIPOEXAMENOME}</span>
              <span>{atendimento.DATAAGENDAMENTO}</span>
            </div>
            <div>
              <span className="flex gap-6 text-sm text-gray-600 mt-1">
                {atendimento.NOMEEMPRESA}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <Button
                color="default"
                disabled={loadingViewMedicalRecord || loadingViewReport}
                size="sm"
                startContent={
                  loadingViewMedicalRecord ? (
                    <Spinner color="current" size={"sm"} />
                  ) : (
                    <Eye size={16} />
                  )
                }
                variant="light"
                onPress={handleViewMedicalRecord}
              >
                {loadingViewMedicalRecord ? "Carregando" : "Ver Prontuário"}
              </Button>

              <Button
                color="default"
                disabled={loadingViewReport}
                size="sm"
                startContent={
                  loadingViewReport ? (
                    <Spinner color="current" size={"sm"} />
                  ) : (
                    <FileText size={16} />
                  )
                }
                variant="light"
                onPress={handleViewReport}
              >
                {loadingViewReport ? "Carregando" : "Relatório"}
              </Button>

              <Button
                color="default"
                disabled={
                  loadingSyncSoc ||
                  loadingViewMedicalRecord ||
                  loadingViewReport
                }
                isLoading={loadingSyncSoc}
                size="sm"
                startContent={<RefreshCw size={16} />}
                variant="light"
                onPress={() =>
                  setAlertModal({
                    open: true,
                    type: "warning",
                    message:
                      "A sincronizacao com o SOC vai atualizar os dados cadastrais desta ficha com base no cadastro retornado pelo SOC e reconciliar os exames da mesma data.\n\nExames iniciados ou finalizados serao preservados. Exames pendentes poderao ser adicionados ou removidos conforme o retorno do SOC.\n\nDeseja continuar?",
                    onConfirm: handleSyncWithSOC,
                  })
                }
              >
                Sincronizar SOC
              </Button>
              <Button
                color="danger"
                size="sm"
                startContent={<Trash size={16} />}
                variant="light"
                onPress={() => setDeleteModalOpen(true)}
              >
                Excluir
              </Button>
            </div>
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
          userApp={userApp}
          onUpdateScheduling={onUpdateScheduling}
        />
        <AnexosUpload
          allowedTypes={[".pdf", ".jpg", ".jpeg", ".png"]}
          anexos={atendimento.ANEXOS || []}
          isLoading={loadingAttachments}
          maxFileSize={10} // 10MB
          onRemove={handleRemoveAttachment}
          onUpload={handleUploadAttachments}
        />
      </ModalBody>
      <ModalFooter>
        <Button variant="light" onPress={onClose}>
          Fechar
        </Button>
      </ModalFooter>

      {/* Modal de Alerta */}
      <HeroModal
        disableAnimation
        classNames={{
          base: "z-[1100]",
          wrapper: "z-[1100]",
          backdrop: "z-[1099]",
        }}
        isDismissable={false}
        isOpen={alertModal.open}
        onClose={() => setAlertModal({ ...alertModal, open: false })}
      >
        <ModalContent className="border border-[#104e35]/20">
          <ModalHeader
            className={
              alertModal.type === "success"
                ? "text-green-600"
                : alertModal.type === "error"
                  ? "text-red-600"
                  : "text-yellow-600"
            }
          >
            {alertModal.type === "success"
              ? "Sucesso"
              : alertModal.type === "error"
                ? "Erro"
                : "Atenção"}
          </ModalHeader>
          <ModalBody>
            <p className="whitespace-pre-line">{alertModal.message}</p>
          </ModalBody>
          <ModalFooter>
            {alertModal.onConfirm ? (
              <>
                <Button
                  variant="light"
                  onPress={() => setAlertModal({ ...alertModal, open: false })}
                >
                  Cancelar
                </Button>
                <Button
                  className="bg-gradient-to-r from-[#44735e] to-[#5a8c7a] text-white"
                  onPress={() => {
                    alertModal.onConfirm?.();
                    setAlertModal({ ...alertModal, open: false });
                  }}
                >
                  Confirmar
                </Button>
              </>
            ) : (
              <Button
                className="bg-gradient-to-r from-[#44735e] to-[#5a8c7a] text-white"
                onPress={() => setAlertModal({ ...alertModal, open: false })}
              >
                OK
              </Button>
            )}
          </ModalFooter>
        </ModalContent>
      </HeroModal>
    </>
  );
};

LazyModalContent.displayName = "LazyModalContent";
export default LazyModalContent;


