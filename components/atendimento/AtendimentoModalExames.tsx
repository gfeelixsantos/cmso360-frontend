"use client";
import { Button, Modal, ModalBody, ModalContent, ModalFooter, ModalHeader, Spinner } from "@heroui/react";
import { useEffect, useState } from "react";
import { ExamRegister, Scheduling } from "@/lib/scheduling/interface/scheduling";
import FichaClinicaOcupacional from "../exames/FichaClinica";
import { useUser } from "@/hooks/useUser";
import { ExamStatus } from "@/lib/scheduling/enum/scheduling.enum";
import { NEST_SCHEDULINGS_EXAM_UPDATE } from "@/config/constants";
import { Ticket, TicketActionType } from "@/lib/ticket/ticket";
import { useEntityManager } from "@/hooks/useEntityManager";
import { Socket } from "socket.io-client";
import AudiometriaOcupacional from "../exames/Audiometria";
import AcuidadeVisual from "../exames/AcuidadeVisual";
import Espirometria from "../exames/Espirometria";
import Dinamometria from "../exames/Dinamometria";
import Psicossocial from "../exames/Psicossocial";
import ExamePadrao from "../exames/ExamePadrao";


interface AtendimentoModalExamesProps {
  isOpen: boolean;
  onClose: () => void;
  funcionarioSelecionado: Scheduling | null;
  exame: string;
  sala: string;
  codigosAtendimento: Set<string>
  socket: Socket
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

  const  user  = useUser();
  const { executarAcao } = useEntityManager<Ticket>([]);
  const [exameParaAtualizar, setExameParaAtualizar] = useState<ExamRegister>()

  useEffect(() => {
    console.log(codigosAtendimento)
    // Encontra o código do exame que precisa ser atualizado
    const exameEmAtendimento = funcionarioSelecionado?.EXAMES.find(e =>
      codigosAtendimento.has(e.codigoExame)
    );

    if(exameEmAtendimento) setExameParaAtualizar(exameEmAtendimento)

  }, [codigosAtendimento, funcionarioSelecionado])



  /**
   * Função para salvar os dados do exame preenchido
   * 
   * @param data formulario do exame preenchido
   * @returns 
   */
  const handleSaveExam = async (data: any) => {
  if (!funcionarioSelecionado) return;

  const isValidExamData = (data: any) => {
    return data && typeof data === "object" && Object.keys(data).length > 0;
  };

  if (!isValidExamData(data)) {
    console.error("Dados do exame inválidos:", data);
    return;
  }

  if (!exameParaAtualizar) {
    console.error("Exame não encontrado para atualização");
    return;
  }

  const confirmResponse = confirm("Confirma a conclusão do exame ?")

  if(confirmResponse){
     try {
      const response = await fetch(NEST_SCHEDULINGS_EXAM_UPDATE, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          funcionarioId: funcionarioSelecionado._id,
          codigoExame: exameParaAtualizar.codigoExame,
          formulario: data,
          sala: sala, // pode ser variável do estado
          profissional: user ?? "Desconhecido"
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        alert("Erro ao atualizar exame")
        console.error("Erro ao atualizar exame:", result.message);
        return;
      }

      executarAcao(
        funcionarioSelecionado.TICKET.id, 
        TicketActionType.RETORNAR, 
        funcionarioSelecionado.UNIDADEATENDIMENTO, 
        socket
      ) 
      alert("Exame atualizado com sucesso:");
      onClose()
      
    } catch (error) {
      alert("Erro ao chamar a API");
      console.error("Erro ao chamar API:", error);
    } 
  }
};


  // ✅ Mapeamento dos tipos de exame para componentes de formulário
  const entrevistaPsico = funcionarioSelecionado?.EXAMES.some(e => e.grupo === "Psicossocial" && e.preparacao.includes("entrevista"))

  const EXAME_FORM_MAP: Record<string, React.FC<any>> = {
    "Acuidade Visual": AcuidadeVisual,
    "Audiometria": AudiometriaOcupacional,
    "Dinamometria": Dinamometria,
    "EEG": !entrevistaPsico ? Psicossocial : ExamePadrao,
    "Espirometria": Espirometria,
    "Exame Clínico": FichaClinicaOcupacional,
    "Psicossocial": Psicossocial,
    "Triagem": FichaClinicaOcupacional,
    
    // etc...
  };

  const Formulario = EXAME_FORM_MAP[exame];

  // Protege contra mapeamento inexistente
  if (!Formulario) {
    return (
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
    );
  }

  return (
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
          formulario={exameParaAtualizar?.formulario}
        />
      </ModalContent>
    </Modal>
  );
};

export default AtendimentoModalExames;
