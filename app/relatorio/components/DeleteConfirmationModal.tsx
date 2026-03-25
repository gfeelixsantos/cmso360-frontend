import { Input } from "@heroui/input";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
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

type DeleteStatus = "confirm" | "loading" | "success" | "error";

interface DeleteConfirmationModalProps {
  isOpenModalDelete: boolean;
  onCloseModalDelete: () => void;
  onConfirm: (password: string) => Promise<void>;
  onDeleteSuccess?: () => void;
  isLoading?: boolean;
}

const DeleteConfirmationModal: React.FC<DeleteConfirmationModalProps> = ({
  isOpenModalDelete,
  onCloseModalDelete,
  onConfirm,
  onDeleteSuccess,
}) => {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [status, setStatus] = useState<DeleteStatus>("confirm");
  const [errorMessage, setErrorMessage] = useState("");
  const [isCapsLockOn, setIsCapsLockOn] = useState(false);

  useEffect(() => {
    if (isOpenModalDelete) {
      setStatus("confirm");
      setPassword("");
      setError("");
      setErrorMessage("");
      setIsCapsLockOn(false);
    }
  }, [isOpenModalDelete]);

  useEffect(() => {
    if (status !== "success") return;

    const timeoutId = window.setTimeout(() => {
      onCloseModalDelete();
      onDeleteSuccess?.();
    }, 2200);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [status, onCloseModalDelete, onDeleteSuccess]);

  const handleCapsLockCheck = (
    event: React.KeyboardEvent<HTMLInputElement>,
  ) => {
    setIsCapsLockOn(event.getModifierState("CapsLock"));
  };

  const handleConfirm = async () => {
    if (!password.trim()) {
      setError("A senha é obrigatória");

      return;
    }

    setStatus("loading");
    setError("");

    try {
      await onConfirm(password);
      setStatus("success");
    } catch (err: any) {
      setStatus("error");
      setErrorMessage(err.message || "Erro ao excluir atendimento");
    }
  };

  const handleClose = () => {
    setStatus("confirm");
    setPassword("");
    setError("");
    setErrorMessage("");
    setIsCapsLockOn(false);
    onCloseModalDelete();
  };

  const renderContent = () => {
    switch (status) {
      case "confirm":
        return (
          <>
            <ModalHeader className="flex flex-col gap-1 bg-gradient-to-r from-red-600 to-red-500 text-white">
              <div className="flex items-center gap-2">
                <Trash size={20} />
                <span className="text-lg font-semibold">
                  Confirmar Exclusão
                </span>
              </div>
            </ModalHeader>
            <ModalBody className="py-5">
              <div className="mt-2 text-sm text-gray-700">
                <p className="flex items-center gap-2">
                  <AlertCircle className="text-red-500" size={18} />
                  <span>
                    Esta ação irá excluir <strong>permanentemente</strong> o
                    atendimento e todos os dados associados.
                  </span>
                </p>
                <p className="text-xs text-red-600 mt-3 bg-red-50 border border-red-200 p-2 rounded">
                  <strong>ATENÇÃO:</strong> Esta ação não pode ser desfeita.
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
                  value={password}
                  onBlur={() => setIsCapsLockOn(false)}
                  onChange={(e) => {
                    setPassword(e.target.value);
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
                onPress={handleConfirm}
              >
                Confirmar Exclusão
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
                  Excluindo Atendimento
                </span>
              </div>
            </ModalHeader>
            <ModalBody className="py-8">
              <div className="flex flex-col items-center gap-4">
                <Spinner color="danger" size="lg" />
                <p className="text-sm text-gray-600 text-center">
                  Processando exclusão...
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
                <span className="text-lg font-semibold">
                  Exclusao Concluida
                </span>
              </div>
            </ModalHeader>
            <ModalBody className="py-8">
              <div className="flex flex-col items-center gap-4">
                <CheckCircle className="text-green-500" size={48} />
                <p className="text-sm text-gray-700 text-center font-medium">
                  Atendimento excluido com sucesso!
                </p>
                <p className="text-xs text-gray-500 text-center">
                  Fechando automaticamente...
                </p>
              </div>
            </ModalBody>
            <ModalFooter className="border-t border-green-200" />
          </>
        );

      case "error":
        return (
          <>
            <ModalHeader className="flex flex-col gap-1 bg-gradient-to-r from-red-600 to-red-500 text-white">
              <div className="flex items-center gap-2">
                <AlertCircle size={20} />
                <span className="text-lg font-semibold">Erro na Exclusão</span>
              </div>
            </ModalHeader>
            <ModalBody className="py-8">
              <div className="flex flex-col items-center gap-4">
                <AlertCircle className="text-red-500" size={48} />
                <p className="text-sm text-gray-700 text-center font-medium">
                  Ocorreu um erro ao excluir o atendimento
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
                onPress={handleConfirm}
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
      aria-describedby="delete-confirmation-description"
      aria-labelledby="delete-confirmation-title"
      backdrop="blur"
      classNames={{
        base: "z-[1000]",
        wrapper: "z-[1000]",
        backdrop: "z-[1000] bg-black/50 backdrop-blur-sm",
      }}
      isDismissable={status === "confirm"}
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
      onClose={status === "confirm" ? handleClose : () => {}}
    >
      <ModalContent className="border border-red-300">
        {renderContent()}
      </ModalContent>
    </Modal>
  );
};

export default React.memo(DeleteConfirmationModal);
