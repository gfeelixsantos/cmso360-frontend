"use client";
import { Button, Modal, ModalBody, ModalContent, ModalFooter, ModalHeader, Spinner } from "@heroui/react";
import { useEffect, useState, useCallback, useMemo } from "react";
import { ExamRegister, Scheduling } from "@/lib/scheduling/interface/scheduling";
import FichaClinicaOcupacional from "../exames/FichaClinica";
import { useUser } from "@/hooks/useUser";
import { ExamStatus } from "@/lib/scheduling/enum/scheduling.enum";
import { EXAMES_LIST, NEST_SCHEDULINGS_EXAM_UPDATE } from "@/config/constants";
import { Ticket, TicketActionType } from "@/lib/ticket/ticket";
import { useEntityManager } from "@/hooks/useEntityManager";
import { Socket } from "socket.io-client";
import AcuidadeVisual from "../exames/AcuidadeVisual";
import Espirometria from "../exames/Espirometria";
import Dinamometria from "../exames/Dinamometria";
import Psicossocial from "../exames/Psicossocial";
import ExamePadrao from "../exames/ExamePadrao";
import AudiometriaOcupacional from "../exames/AudiometriaOcupacional";
import KitAtendimento from "../exames/KitAtendimento";
import Ultrassom from "../exames/Ultrassom";

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
type NotificationType = 'confirm' | 'success' | 'error';

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
  const { executarAcao } = useEntityManager<Ticket>([]);
  const [exameParaAtualizar, setExameParaAtualizar] = useState<ExamRegister[]>([]);
  const [entrevistaPsico, setEntrevistaPsico] = useState<boolean>(false);
  const [psicossocial, setPsicossocial] = useState<boolean>(false);
  const [notificationModal, setNotificationModal] = useState<NotificationModalState>({
    isOpen: false,
    type: 'confirm',
    title: '',
    message: '',
    showCancel: false,
    isLoading: false,
  });

  // Memoriza o mapeamento de formulários
  const EXAME_FORM_MAP: Record<string, React.FC<any>> = useMemo(
    () => ({
      "Acuidade Visual": AcuidadeVisual,
      "Audiometria": AudiometriaOcupacional,
      "Dinamometria": Dinamometria,
      "EEG": !entrevistaPsico && psicossocial ? Psicossocial : ExamePadrao,
      "ECG": !entrevistaPsico && psicossocial ? Psicossocial : ExamePadrao,
      "Espirometria": Espirometria,
      "Exame Clínico": FichaClinicaOcupacional,
      "Psicossocial": Psicossocial,
      "Triagem": FichaClinicaOcupacional,
      "Ultrassom": Ultrassom
    }),
    [entrevistaPsico, psicossocial]
  );

  useEffect(() => {
    if (!isOpen || !funcionarioSelecionado) return;

    const exameEmAtendimento = funcionarioSelecionado.EXAMES.filter((e) =>
      codigosAtendimento.has(e.codigoExame)
    );

    if (exameEmAtendimento) setExameParaAtualizar(exameEmAtendimento);

    const hasPsico = funcionarioSelecionado.EXAMES.find(
      (e) => e.grupo === "Psicossocial" && e.status === ExamStatus.PENDENTE
    );
    
    if (hasPsico && hasPsico.status === ExamStatus.PENDENTE) {
      setPsicossocial(true);
      setEntrevistaPsico(hasPsico.preparacao.includes("Entrevista"));
    }
  }, [codigosAtendimento, funcionarioSelecionado, isOpen]);

  // Função para fechar o modal de notificação
  const closeNotificationModal = useCallback(() => {
    setNotificationModal((prev) => ({ ...prev, isOpen: false }));
  }, []);

  // Verifica se todos os exames foram concluídos
  const verificarExamesPendentes = useCallback((funcionario: Scheduling): boolean => {
    const examesPendentes = funcionario.EXAMES.filter(
      (e) => e.status === ExamStatus.PENDENTE && !codigosAtendimento.has(e.codigoExame)
    );
    return examesPendentes.length === 0;
  }, [codigosAtendimento]);

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
        executarAcao(
          funcionarioSelecionado.TICKET.id,
          TicketActionType.RETORNAR,
          funcionarioSelecionado.UNIDADEATENDIMENTO,
          socket
        );

        // Verifica se todos os exames foram concluídos
        const todosExamesConcluidos = verificarExamesPendentes(result);

        setNotificationModal({
          isOpen: true,
          type: "success",
          title: "✓ Exame Concluído",
          message: todosExamesConcluidos
            ? "Todos os exames foram finalizados. Você pode dispensar/liberar o funcionário."
            : "Exame concluído com sucesso! Aguarde a finalização dos demais exames.",
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
          title: "✗ Erro",
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
      executarAcao,
      socket,
      verificarExamesPendentes,
      closeNotificationModal,
      onClose,
    ]
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
          message: "Os dados do exame estão incompletos ou inválidos. Verifique o preenchimento.",
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
        message: "Deseja confirmar a conclusão deste exame? Esta ação não poderá ser desfeita.",
        showCancel: true,
        onConfirm: () => {
          closeNotificationModal();
          processarAtualizacaoExame(data);
        },
        onCancel: closeNotificationModal,
      });
    },
    [funcionarioSelecionado, exameParaAtualizar, closeNotificationModal, processarAtualizacaoExame]
  );

  const empresaKit = funcionarioSelecionado?.CODIGOINTERNOEMPRESA?.toLocaleUpperCase().includes("KIT") || funcionarioSelecionado?.NOMECARGO?.toLocaleUpperCase().includes("KIT")
  let Formulario = EXAME_FORM_MAP[exame];

  if(empresaKit){
    Formulario = KitAtendimento
  } 

  
  // Renderiza o modal de notificação
  const renderNotificationModal = () => {
    const { type, title, message, showCancel, onConfirm, onCancel, isLoading } = notificationModal;

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
        isOpen={notificationModal.isOpen}
        onClose={showCancel ? closeNotificationModal : undefined}
        size="md"
        backdrop="blur"
        disableAnimation={true}
        classNames={{
          base: "border-none shadow-2xl",
          backdrop: "bg-black/50",
        }}
        isDismissable={showCancel && !isLoading}
        hideCloseButton={!showCancel || isLoading}
      >
        <ModalContent>
          <ModalHeader className={`flex flex-col gap-1 ${colors.header} text-white rounded-t-lg`}>
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
                <Spinner size="md" color="primary" />
              </div>
            ) : (
              <div className="flex gap-2 w-full sm:w-auto">
                {showCancel && (
                  <Button
                    color="default"
                    variant="flat"
                    onPress={onCancel}
                    className="flex-1 sm:flex-initial font-medium"
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
          isOpen={isOpen}
          onClose={onClose}
          disableAnimation={true}
          backdrop="blur"
          size="5xl"
          scrollBehavior="outside"
        >
          <ModalContent>
            <ExamePadrao
              atendimento={funcionarioSelecionado}
              exame={exame}
              onClose={onClose}
              onSave={handleSaveExam}
              formulario={""}
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
        isOpen={isOpen}
        onClose={onClose}
        disableAnimation={true}
        backdrop="blur"
        size="5xl"
        scrollBehavior="outside"
      >
        <ModalContent>
          <Formulario
            onSave={handleSaveExam}
            onClose={onClose}
            atendimento={funcionarioSelecionado}
            exame={exame}
            formulario={exameParaAtualizar[0]?.formulario}
          />
        </ModalContent>
      </Modal>
      {renderNotificationModal()}
    </>
  );
};

export default AtendimentoModalExames;