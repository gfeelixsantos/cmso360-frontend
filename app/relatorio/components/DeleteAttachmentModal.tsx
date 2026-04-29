import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Input,
  Spinner,
} from "@heroui/react";
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle,
  Key,
  Trash,
} from "lucide-react";
import React, { useState, useEffect } from "react";

import { Scheduling } from "@/lib/scheduling/interface/scheduling";
import { NEST_SCHEDULINGS_DELETE_ATTACHMENT } from "@/config/constants";

type DeleteAttachmentStatus = "confirm" | "loading" | "success" | "error";

interface DeleteAttachmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  examId: string;
  examName: string;
  examGrupo: string;
  atendimentoId: string;
  onSuccess: (updatedScheduling?: Scheduling) => void;
}

const fixMojibake = (text: string): string => {
  if (!text || !/[ÃÂ]/.test(text)) return text;

  try {
    const bytes = Uint8Array.from(text, (char) => char.charCodeAt(0));

    return new TextDecoder("utf-8").decode(bytes);
  } catch {
    return text;
  }
};

const DeleteAttachmentModal: React.FC<DeleteAttachmentModalProps> = ({
  isOpen,
  onClose,
  examId,
  examName,
  examGrupo,
  atendimentoId,
  onSuccess,
}) => {
  const [removePassword, setRemovePassword] = useState("");
  const [error, setError] = useState("");
  const [status, setStatus] = useState<DeleteAttachmentStatus>("confirm");
  const [errorMessage, setErrorMessage] = useState("");
  const [isCapsLockOn, setIsCapsLockOn] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setStatus("confirm");
      setRemovePassword("");
      setError("");
      setErrorMessage("");
      setIsCapsLockOn(false);
    }
  }, [isOpen]);

  const handleCapsLockCheck = (
    event: React.KeyboardEvent<HTMLInputElement>,
  ) => {
    setIsCapsLockOn(event.getModifierState("CapsLock"));
  };

  const handleDelete = async () => {
    setStatus("loading");
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

        throw new Error(
          fixMojibake(errorData.message || "Erro ao excluir resultado"),
        );
      }

      const result = await response.json();

      if (result.success && result.scheduling) {
        setStatus("success");
        onSuccess(result.scheduling);
      } else if (result.success) {
        setStatus("success");
      } else {
        throw new Error(result.message || "Erro ao excluir resultado");
      }
    } catch (err: any) {
      console.error("Erro ao excluir anexo:", err);
      setStatus("error");
      setErrorMessage(fixMojibake(err.message || "Erro ao excluir resultado"));
    }
  };

  const handleClose = () => {
    setStatus("confirm");
    setRemovePassword("");
    setError("");
    setErrorMessage("");
    setIsCapsLockOn(false);
    onClose();
  };

  const renderContent = () => {
    switch (status) {
      case "confirm":
        return (
          <>
            <ModalHeader className="flex flex-col gap-1 bg-gradient-to-r from-red-600 to-red-500 text-white">
              <div className="flex items-center gap-2">
                <Trash size={20} />
                <span className="text-lg font-semibold">Remover Resultado</span>
              </div>
            </ModalHeader>
            <ModalBody className="py-5">
              <div className="mt-2 text-sm text-gray-700">
                <p className="flex items-center gap-2">
                  <AlertCircle className="text-red-500" size={18} />
                  <span>
                    Tem certeza que deseja remover o resultado do exame{" "}
                    <strong>{examName}</strong>?
                  </span>
                </p>
                <p className="text-xs text-gray-600 mt-3 bg-gray-50 border border-gray-200 p-2 rounded">
                  Esta ação removerá o PDF e reverterá o status do exame para
                  "Aguardando Resultado".
                </p>
              </div>
              <div className="mt-4">
                <label className="text-sm font-medium text-gray-700 mb-1 block">
                  Digite a senha de exclusão:
                </label>
                <Input
                  endContent={<Key className="text-gray-400" size={20} />}
                  errorMessage={error}
                  isInvalid={!!error}
                  placeholder="Senha de exclusão"
                  type="password"
                  value={removePassword}
                  onBlur={() => setIsCapsLockOn(false)}
                  onChange={(e) => {
                    setRemovePassword(e.target.value);
                    setError("");
                  }}
                  onKeyDown={handleCapsLockCheck}
                  onKeyUp={handleCapsLockCheck}
                />
                {isCapsLockOn ? (
                  <div className="mt-2 flex items-center gap-2 rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                    <AlertTriangle size={14} />
                    <span>Caps Lock ativo</span>
                  </div>
                ) : null}
              </div>
            </ModalBody>
            <ModalFooter className="border-t border-red-200">
              <Button
                className="text-red-600 hover:bg-red-50"
                color="default"
                variant="light"
                onPress={handleClose}
              >
                Cancelar
              </Button>
              <Button
                className="bg-gradient-to-r from-red-600 to-red-500 text-white"
                startContent={<Trash size={16} />}
                variant="solid"
                onPress={handleDelete}
              >
                Remover Resultado
              </Button>
            </ModalFooter>
          </>
        );

      case "loading":
        return (
          <>
            <ModalHeader className="flex flex-col gap-1 bg-gradient-to-r from-red-600 to-red-500 text-white">
              <div className="flex items-center gap-2">
                <Trash size={20} />
                <span className="text-lg font-semibold">
                  Removendo Resultado
                </span>
              </div>
            </ModalHeader>
            <ModalBody className="py-8">
              <div className="flex flex-col items-center gap-4">
                <Spinner color="danger" size="lg" />
                <p className="text-sm text-gray-600 text-center">
                  Processando remoção...
                </p>
              </div>
            </ModalBody>
            <ModalFooter />
          </>
        );

      case "success":
        return (
          <>
            <ModalHeader className="flex flex-col gap-1 bg-gradient-to-r from-green-600 to-green-500 text-white">
              <div className="flex items-center gap-2">
                <CheckCircle size={20} />
                <span className="text-lg font-semibold">Remoção Concluída</span>
              </div>
            </ModalHeader>
            <ModalBody className="py-8">
              <div className="flex flex-col items-center gap-4">
                <CheckCircle className="text-green-500" size={48} />
                <p className="text-sm text-gray-700 text-center font-medium">
                  Resultado removido com sucesso!
                </p>
                <p className="text-xs text-gray-500 text-center">
                  Os dados do atendimento serão atualizados automaticamente.
                </p>
              </div>
            </ModalBody>
            <ModalFooter className="border-t border-[#104e35]/20 justify-center">
              <Button
                className="bg-gradient-to-r from-[#104e35] to-[#0d3d29] text-white"
                variant="solid"
                onPress={handleClose}
              >
                OK
              </Button>
            </ModalFooter>
          </>
        );

      case "error":
        return (
          <>
            <ModalHeader className="flex flex-col gap-1 bg-gradient-to-r from-red-600 to-red-500 text-white">
              <div className="flex items-center gap-2">
                <AlertCircle size={20} />
                <span className="text-lg font-semibold">Erro na Remoção</span>
              </div>
            </ModalHeader>
            <ModalBody className="py-8">
              <div className="flex flex-col items-center gap-4">
                <AlertCircle className="text-red-500" size={48} />
                <p className="text-sm text-gray-700 text-center font-medium">
                  Ocorreu um erro ao remover o resultado
                </p>
                <p className="text-xs text-red-500 text-center max-w-full break-words px-4">
                  {errorMessage || "Tente novamente mais tarde."}
                </p>
              </div>
            </ModalBody>
            <ModalFooter className="border-t border-red-200 justify-center gap-2">
              <Button
                className="text-red-600 hover:bg-red-50"
                color="default"
                variant="light"
                onPress={handleClose}
              >
                Fechar
              </Button>
              <Button
                className="bg-gradient-to-r from-red-600 to-red-500 text-white"
                startContent={<Trash size={16} />}
                variant="solid"
                onPress={handleDelete}
              >
                Tentar Novamente
              </Button>
            </ModalFooter>
          </>
        );
    }
  };

  return (
    <Modal
      aria-describedby="delete-attachment-description"
      aria-labelledby="delete-attachment-title"
      backdrop="blur"
      classNames={{
        base: "z-[1000]",
        wrapper: "z-[1000]",
        backdrop: "z-[1000] bg-black/50 backdrop-blur-sm",
      }}
      isDismissable={status === "confirm"}
      isOpen={isOpen}
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
      onClose={status === "confirm" ? handleClose : () => {}}
    >
      <ModalContent className="border border-red-300">
        {renderContent()}
      </ModalContent>
    </Modal>
  );
};

export default React.memo(DeleteAttachmentModal);
