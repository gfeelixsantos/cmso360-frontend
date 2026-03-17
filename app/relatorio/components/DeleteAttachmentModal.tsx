import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Input,
} from "@heroui/react";
import { AlertCircle, Key, Trash } from "lucide-react";
import React, { useState } from "react";

import { Scheduling } from "@/lib/scheduling/interface/scheduling";
import { NEST_SCHEDULINGS_DELETE_ATTACHMENT } from "@/config/constants";

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
  const [removePassword, setRemovePassword] = useState("");

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
          password: removePassword,
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
      backdrop="blur"
      classNames={{
        wrapper: "z-[1001]",
        backdrop: "z-[1000]",
      }}
      disableAnimation={true}
      isOpen={isOpen}
      shouldBlockScroll={false} // Tente desativar o block scroll
      size="md"
      onClose={onClose}
    >
      <ModalContent className="border border-[#44735e]/20">
        <ModalHeader className="flex flex-col gap-1 border-b border-[#44735e]/15">
          <div className="flex items-center gap-2 text-red-600">
            <AlertCircle size={24} />
            <span>Remover Resultado</span>
          </div>
        </ModalHeader>
        <ModalBody className="py-5">
          <p className="text-gray-700">
            Tem certeza que deseja remover o resultado do exame{" "}
            <strong>{examName}</strong>?
          </p>
          <p className="text-sm text-gray-500">
            Esta ação removerá o PDF e reverterá o status do exame para
            "Aguardando Resultado".
          </p>
          <Input
            endContent={<Key className="text-gray-400" size={20} />}
            errorMessage={error}
            isInvalid={!!error}
            placeholder="Senha de exclusão"
            type="password"
            value={removePassword}
            onChange={(e) => {
              setRemovePassword(e.target.value);
              setError("");
            }}
          />
          {error && (
            <div className="p-2 bg-red-50 border border-red-200 rounded">
              <div className="flex items-center gap-2 text-red-600 text-sm">
                <AlertCircle size={14} />
                <span>{error}</span>
              </div>
            </div>
          )}
        </ModalBody>
        <ModalFooter className="border-t border-[#44735e]/15">
          <Button
            className="text-[#2a4a3a] hover:bg-[#e8f4e3]"
            disabled={isDeleting}
            variant="light"
            onPress={onClose}
          >
            Cancelar
          </Button>
          <Button
            className="focus-visible:ring-2 focus-visible:ring-red-300"
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

export default React.memo(DeleteAttachmentModal);
