"use client";
import {
  Button,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  Spinner,
} from "@heroui/react";
import { useEffect, useState, useCallback, useMemo } from "react";
import { Socket } from "socket.io-client";

import FichaClinicaOcupacional from "../exames/FichaClinica";
import AcuidadeVisual from "../exames/AcuidadeVisual";
import Espirometria from "../exames/Espirometria";
import Dinamometria from "../exames/Dinamometria";
import Psicossocial from "../exames/Psicossocial";
import ExamePadrao from "../exames/ExamePadrao";
import AudiometriaOcupacional from "../exames/AudiometriaOcupacional";
import KitAtendimento from "../exames/KitAtendimento";
import Ultrassom from "../exames/Ultrassom";
import FichaClinicaWhirlpool from "../exames/FichaClinicaWhirlpool";

import { AtendimentoRules } from "./AtendimentoRules";

import { TicketActionType } from "@/lib/ticket/ticket";
import { NEST_SCHEDULINGS_EXAM_UPDATE } from "@/config/constants";
import { ExamStatus } from "@/lib/scheduling/enum/scheduling.enum";
import { useUser } from "@/hooks/useUser";
import {
  ExamRegister,
  Scheduling,
} from "@/lib/scheduling/interface/scheduling";
import { useSchedulingEntityManager } from "@/hooks/SchedulingEntityManager";

interface AtendimentoModalExamesProps {
  isOpen: boolean;
  onClose: () => void;
  funcionarioSelecionado: Scheduling | null;
  exame: string;
  sala: string;
  codigosAtendimento: Set<string>;
  socket: Socket;
}

// Tipos para o modal de notificação
type NotificationType = "confirm" | "success" | "error";

interface NotificationModalState {
  isOpen: boolean;
  type: NotificationType;
  title: string;
  message: string;
  onConfirm?: () => void;
  onCancel?: () => void;
  showCancel?: boolean;
  isLoading?: boolean;
}

const AtendimentoModalExames = ({
  isOpen,
  onClose,
  exame,
  sala,
  codigosAtendimento,
  funcionarioSelecionado,
  socket,
}: AtendimentoModalExamesProps) => {
  const user = useUser();
  const { executarAtendimentoAcao } = useSchedulingEntityManager([]);
  const [exameParaAtualizar, setExameParaAtualizar] = useState<ExamRegister[]>(
    [],
  );
  const [entrevistaPsico, setEntrevistaPsico] = useState<boolean>(false);
  const [psicossocial, setPsicossocial] = useState<boolean>(false);
  const [notificationModal, setNotificationModal] =
    useState<NotificationModalState>({
      isOpen: false,
      type: "confirm",
      title: "",
      message: "",
      showCancel: false,
      isLoading: false,
    });

  // Memoriza o mapeamento de formulários
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

  // Efeito para atualizar o exame a ser preenchido
  useEffect(() => {
    if (!isOpen || !funcionarioSelecionado) return;

    const exameEmAtendimento = funcionarioSelecionado.EXAMES.filter((e) =>
      codigosAtendimento.has(e.codigoExame),
    );

    if (exameEmAtendimento) setExameParaAtualizar(exameEmAtendimento);

    const hasPsico = funcionarioSelecionado.EXAMES.find(
      (e) => e.grupo === "Psicossocial" && e.status === ExamStatus.PENDENTE,
    );

    if (hasPsico) {
      setPsicossocial(true);
      setEntrevistaPsico(hasPsico.preparacao.includes("Entrevista"));
    } else {
      // Limpa os estados quando não tem Psicossocial pendente
      setPsicossocial(false);
      setEntrevistaPsico(false);
    }
  }, [codigosAtendimento, funcionarioSelecionado, isOpen]);

  // Função para fechar o modal de notificação
  const closeNotificationModal = useCallback(() => {
    setNotificationModal((prev) => ({ ...prev, isOpen: false }));
  }, []);

  // Verifica se todos os exames foram concluídos
  const verificarExamesPendentes = useCallback(
    (funcionario: Scheduling): boolean => {
      const examesPendentes = funcionario.EXAMES.filter(
        (e) =>
          e.status === ExamStatus.PENDENTE &&
          !codigosAtendimento.has(e.codigoExame),
      );

      return examesPendentes.length === 0;
    },
    [codigosAtendimento],
  );

  // Processa a atualização do exame
  const processarAtualizacaoExame = useCallback(
    async (data: any) => {
      if (!funcionarioSelecionado) return;

      setNotificationModal((prev) => ({ ...prev, isLoading: true }));

      try {
        const response = await fetch(NEST_SCHEDULINGS_EXAM_UPDATE, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            funcionarioId: funcionarioSelecionado._id,
            codigoExame: exameParaAtualizar.map((e) => e.codigoExame),
            formulario: data,
            sala: sala,
            profissional: user ?? "Desconhecido",
          }),
        });

        const result: Scheduling = await response.json();

        if (!response.ok) {
          throw new Error("Erro ao atualizar exame");
        }

        // Retorna o ticket
        executarAtendimentoAcao(
          funcionarioSelecionado._id,
          funcionarioSelecionado.TICKET.id,
          TicketActionType.RETORNAR,
          funcionarioSelecionado.UNIDADEATENDIMENTO,
          socket,
        );

        // Verifica se todos os exames foram concluídos
        const todosExamesConcluidos = verificarExamesPendentes(result);

        setNotificationModal({
          isOpen: true,
          type: "success",
          title: "Exame Concluído",
          message: todosExamesConcluidos
            ? "Concluído, pode LIBERAR o funcionário."
            : "Funcionário deve AGUARDAR demais exames.",
          showCancel: false,
          isLoading: false,
          onConfirm: () => {
            closeNotificationModal();
            onClose();
          },
        });
      } catch (error) {
        setNotificationModal({
          isOpen: true,
          type: "error",
          title: "Erro",
          message: `Não foi possível atualizar o exame. ${error instanceof Error ? error.message : "Tente novamente."}`,
          showCancel: false,
          isLoading: false,
          onConfirm: closeNotificationModal,
        });
      }
    },
    [
      funcionarioSelecionado,
      exameParaAtualizar,
      sala,
      user,
      executarAtendimentoAcao,
      socket,
      verificarExamesPendentes,
      closeNotificationModal,
      onClose,
    ],
  );

  /**
   * Função para salvar os dados do exame preenchido
   */
  const handleSaveExam = useCallback(
    async (data: any) => {
      if (!funcionarioSelecionado) return;

      const isValidExamData = (data: any) => {
        return data && typeof data === "object" && Object.keys(data).length > 0;
      };

      if (!isValidExamData(data)) {
        setNotificationModal({
          isOpen: true,
          type: "error",
          title: "✗ Dados Inválidos",
          message:
            "Os dados do exame estão incompletos ou inválidos. Verifique o preenchimento.",
          showCancel: false,
          onConfirm: closeNotificationModal,
        });

        return;
      }

      if (!exameParaAtualizar || exameParaAtualizar.length === 0) {
        setNotificationModal({
          isOpen: true,
          type: "error",
          title: "✗ Erro",
          message: "Exame não encontrado para atualização.",
          showCancel: false,
          onConfirm: closeNotificationModal,
        });

        return;
      }

      // Modal de confirmação
      setNotificationModal({
        isOpen: true,
        type: "confirm",
        title: "Confirmar Conclusão",
        message: "Deseja confirmar a conclusão deste exame?",
        showCancel: true,
        onConfirm: () => {
          closeNotificationModal();
          processarAtualizacaoExame(data);
        },
        onCancel: closeNotificationModal,
      });
    },
    [
      funcionarioSelecionado,
      exameParaAtualizar,
      closeNotificationModal,
      processarAtualizacaoExame,
    ],
  );

  const Formulario = useMemo(() => {
    if (!funcionarioSelecionado) return null;

    return AtendimentoRules.resolveFormulario({
      exame,
      funcionario: funcionarioSelecionado,
      forms: {
        EXAME_FORM_MAP,
        KitAtendimento,
        FichaClinicaWhirlpool,
      },
    });
  }, [exame, funcionarioSelecionado, EXAME_FORM_MAP]);

  // Renderiza o modal de notificação
  const renderNotificationModal = () => {
    const { type, title, message, showCancel, onConfirm, onCancel, isLoading } =
      notificationModal;

    const getModalColors = () => {
      switch (type) {
        case "confirm":
          return {
            header: "bg-blue-600",
            button: "bg-blue-600 hover:bg-blue-700",
            icon: "",
          };
        case "success":
          return {
            header: "bg-green-600",
            button: "bg-green-600 hover:bg-green-700",
            icon: "",
          };
        case "error":
          return {
            header: "bg-red-600",
            button: "bg-red-600 hover:bg-red-700",
            icon: "",
          };
      }
    };

    const colors = getModalColors();

    return (
      <Modal
        backdrop="blur"
        classNames={{
          base: "border-none shadow-2xl",
          backdrop: "bg-black/50",
        }}
        disableAnimation={true}
        hideCloseButton={!showCancel || isLoading}
        isDismissable={showCancel && !isLoading}
        isOpen={notificationModal.isOpen}
        size="md"
        onClose={showCancel ? closeNotificationModal : undefined}
      >
        <ModalContent>
          <ModalHeader
            className={`flex flex-col gap-1 ${colors.header} text-white rounded-t-lg`}
          >
            <div className="flex items-center gap-2">
              <span className="text-2xl">{colors.icon}</span>
              <span className="text-lg font-semibold">{title}</span>
            </div>
          </ModalHeader>
          <ModalBody className="py-6 px-6">
            <p className="text-base text-gray-700 leading-relaxed">{message}</p>
          </ModalBody>
          <ModalFooter className="px-6 pb-6">
            {isLoading ? (
              <div className="w-full flex justify-center">
                <Spinner color="primary" size="md" />
              </div>
            ) : (
              <div className="flex gap-2 w-full sm:w-auto">
                {showCancel && (
                  <Button
                    className="flex-1 sm:flex-initial font-medium"
                    color="default"
                    variant="flat"
                    onPress={onCancel}
                  >
                    Cancelar
                  </Button>
                )}
                <Button
                  className={`${colors.button} text-white flex-1 sm:flex-initial font-medium`}
                  onPress={onConfirm}
                >
                  {type === "confirm" ? "Confirmar" : "Entendido"}
                </Button>
              </div>
            )}
          </ModalFooter>
        </ModalContent>
      </Modal>
    );
  };

  // Protege contra mapeamento inexistente
  if (!Formulario) {
    return (
      <>
        <Modal
          backdrop="blur"
          disableAnimation={true}
          isOpen={isOpen}
          scrollBehavior="outside"
          size="5xl"
          onClose={onClose}
        >
          <ModalContent>
            <ExamePadrao
              atendimento={funcionarioSelecionado}
              exame={exame}
              formulario={""}
              onClose={onClose}
              onSave={handleSaveExam}
            />
          </ModalContent>
        </Modal>
        {renderNotificationModal()}
      </>
    );
  }

  return (
    <>
      <Modal
        backdrop="blur"
        disableAnimation={true}
        isOpen={isOpen}
        scrollBehavior="outside"
        size="5xl"
        onClose={onClose}
      >
        <ModalContent>
          <Formulario
            atendimento={funcionarioSelecionado}
            exame={exame}
            formulario={exameParaAtualizar[0]?.formulario}
            onClose={onClose}
            onSave={handleSaveExam}
          />
        </ModalContent>
      </Modal>
      {renderNotificationModal()}
    </>
  );
};

export default AtendimentoModalExames;
