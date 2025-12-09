import { Input } from "@heroui/input";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
} from "@heroui/react";
import { AlertCircle, Key, Trash } from "lucide-react";
import React, { useState } from "react";

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

export default React.memo(DeleteConfirmationModal);
