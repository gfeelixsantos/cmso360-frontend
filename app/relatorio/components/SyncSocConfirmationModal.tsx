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
  onConfirm: () => void;
  isLoading: boolean;
}

const SyncSocConfirmationModal: React.FC<SyncSocConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  isLoading,
}) => {
  const handleConfirm = () => {
    onConfirm();
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
              <div className="mt-2 text-sm text-gray-700">
                <p>
                  A sincronização inteligente atualizará <strong>seus dados cadastrais</strong> e executará um Merge dinâmico nos seus Exames em relação ao cruzamento de base com o SOC.
                </p>
                <p className="text-xs text-black mt-2 bg-yellow-100 p-2 rounded">
                  <strong>IMPORTANTE: </strong> Seu histórico clínico atual não será afetado. Exames Finalizados serão sempre mantidos e exames repetentes serão adicionados.
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
