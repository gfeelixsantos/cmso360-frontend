// app/relatorios/LazyModalContent.tsx
import React, { useState, useCallback } from "react";
import {
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Spinner,
} from "@heroui/react";
import { Eye, Trash, RefreshCw } from "lucide-react";

import DeleteConfirmationModal from "./components/DeleteConfirmationModal";
import InformacoesGerais, {
  EditModeState,
} from "./components/InformacoesGerais";
import ExamesTable from "./components/ExamesTable";
import AnexosUpload from "./components/AnexosUpload"; // Importe o novo componente

import {
  NEST_SCHEDULINGS_UPDATE,
  NEST_SCHEDULINGS_SYNC_SOC,
  NEST_SCHEDULINGS_DELETE,
  NEST_RELATORIO_FUNCIONARIO,
  NEST_SCHEDULINGS_ANEXO_UPLOAD,
  NEST_SCHEDULINGS_ANEXO_REMOVE,
} from "@/config/constants";
import { Scheduling } from "@/lib/scheduling/interface/scheduling";

interface LazyModalContentProps {
  atendimento: Scheduling;
  onClose: () => void;
  onUpdateScheduling?: (updated: Scheduling) => void;
}

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
  const [loadingAttachments, setLoadingAttachments] = useState(false);

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

        alert("Anexos enviados com sucesso!");
      } catch (error) {
        console.error("Erro ao fazer upload:", error);
        alert("Erro ao enviar anexos");
      } finally {
        setLoadingAttachments(false);
      }
    },
    [atendimento._id, onUpdateScheduling],
  );

  const handleRemoveAttachment = useCallback(
    async (fileName: string) => {
      if (!atendimento._id) return;

      if (!confirm("Deseja realmente remover este anexo?")) return;

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

        alert("Anexo removido com sucesso!");
      } catch (error) {
        console.error("Erro ao remover anexo:", error);
        alert("Erro ao remover anexo");
      }
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
        `${NEST_RELATORIO_FUNCIONARIO}/${atendimento._id}`,
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
    </>
  );
};

LazyModalContent.displayName = "LazyModalContent";
export default LazyModalContent;
