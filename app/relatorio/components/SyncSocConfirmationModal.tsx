// ============================================
// MODAL DE CONFIRMAÇÃO SYNC SOC

import { Button } from "@heroui/button";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  Checkbox,
  ModalFooter,
} from "@heroui/react";
import React from "react";
import { useState } from "react";

// ============================================
interface SyncSocConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (manterExamesRealizados: boolean) => void;
  isLoading: boolean;
}

const SyncSocConfirmationModal: React.FC<SyncSocConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  isLoading,
}) => {
  const [manterExamesRealizados, setManterExamesRealizados] = useState(true);

  const handleConfirm = () => {
    onConfirm(manterExamesRealizados);
  };

  return (
    <Modal
      aria-describedby="delete-confirmation-description"
      aria-labelledby="sync-confirmation-title"
      backdrop="blur"
      classNames={{
        base: "z-[1000]",
        wrapper: "z-[1000]",
        backdrop: "z-[1000] bg-black/50 backdrop-blur-sm",
      }}
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
      style={{
        position: "fixed",
      }}
      onClose={onClose}
    >
      <ModalContent>
        {(onCloseModal) => (
          <>
            <ModalHeader className="flex flex-col gap-1">
              Confirmar Sincronização SOC
            </ModalHeader>
            <ModalBody>
              <div className="mt-2">
                <Checkbox
                  isSelected={manterExamesRealizados}
                  onValueChange={setManterExamesRealizados}
                >
                  Manter exames realizados
                </Checkbox>
                <p className="text-xs text-gray-500 ml-6 mt-1">
                  Quando marcado, os exames já realizados e com resultados não
                  serão substituídos durante a sincronização.
                </p>
              </div>
            </ModalBody>
            <ModalFooter>
              <Button
                color="default"
                disabled={isLoading}
                variant="light"
                onPress={onCloseModal}
              >
                Cancelar
              </Button>
              <Button
                color="primary"
                isLoading={isLoading}
                onPress={handleConfirm}
              >
                {isLoading ? "Sincronizando..." : "Confirmar Sincronização"}
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
};

export default React.memo(SyncSocConfirmationModal);
