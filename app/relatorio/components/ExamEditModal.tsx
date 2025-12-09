// ============================================
// COMPONENTE: ExamEditModal
// ============================================

import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  Spinner,
  ModalFooter,
  Button,
} from "@heroui/react";
import React, { useCallback, useEffect, useMemo, useState } from "react";

import { AtendimentoRules } from "@/components/atendimento/AtendimentoRules";
import AcuidadeVisual from "@/components/exames/AcuidadeVisual";
import AudiometriaOcupacional from "@/components/exames/AudiometriaOcupacional";
import Dinamometria from "@/components/exames/Dinamometria";
import Espirometria from "@/components/exames/Espirometria";
import ExamePadrao from "@/components/exames/ExamePadrao";
import FichaClinicaOcupacional from "@/components/exames/FichaClinicaOcupacional";
import FichaClinicaWhirlpool from "@/components/exames/FichaClinicaWhirlpool";
import KitAtendimento from "@/components/exames/KitAtendimento";
import Psicossocial from "@/components/exames/Psicossocial";
import Ultrassom from "@/components/exames/Ultrassom";
import { NEST_SCHEDULINGS_EXAM_UPDATE } from "@/config/constants";
import { ExamStatus } from "@/lib/scheduling/enum/scheduling.enum";
import {
  ExamRegister,
  Scheduling,
} from "@/lib/scheduling/interface/scheduling";
import { useUser } from "@/hooks/useUser";

// ============================================
interface ExamEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  exame: ExamRegister;
  atendimento: Scheduling;
}
const ExamEditModal: React.FC<ExamEditModalProps> = ({
  isOpen,
  onClose,
  exame,
  atendimento,
}) => {
  const user = useUser();
  const [formData, setFormData] = useState<any>(null);
  const [isLoadingForm, setIsLoadingForm] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  // Estados para lógica de Psicossocial (mesma do AtendimentoModalExames)
  const [entrevistaPsico, setEntrevistaPsico] = useState<boolean>(false);
  const [psicossocial, setPsicossocial] = useState<boolean>(false);

  // Inicializar dados do formulário
  useEffect(() => {
    if (isOpen && exame?.formulario) {
      try {
        // Se o formulário for uma string JSON, parse
        if (typeof exame.formulario === "string") {
          const parsedData = JSON.parse(exame.formulario);

          setFormData(parsedData);
        } else {
          setFormData(exame.formulario);
        }
        setIsLoadingForm(false);

        // Verificar se é Psicossocial com entrevista (mesma lógica do AtendimentoModalExames)
        if (
          exame.grupo === "Psicossocial" &&
          exame.status === ExamStatus.PENDENTE
        ) {
          setPsicossocial(true);
          setEntrevistaPsico(exame.preparacao?.includes("Entrevista") || false);
        } else {
          setPsicossocial(false);
          setEntrevistaPsico(false);
        }
      } catch (error) {
        console.error("Erro ao carregar dados do formulário:", error);
        setFormData({});
        setIsLoadingForm(false);
      }
    }
  }, [isOpen, exame]);

  // Memoriza o mapeamento de formulários (MESMA LÓGICA do AtendimentoModalExames)
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

  // Determinar qual formulário renderizar (MESMA LÓGICA do AtendimentoModalExames)
  const Formulario = useMemo(() => {
    if (!exame || !atendimento) return null;

    return AtendimentoRules.resolveFormulario({
      exame: exame.grupo || exame.nomeExame || "Exame",
      funcionario: atendimento,
      forms: {
        EXAME_FORM_MAP,
        KitAtendimento,
        FichaClinicaWhirlpool,
      },
    });
  }, [exame, atendimento, EXAME_FORM_MAP]);

  // Função para validar dados (MESMA LÓGICA do AtendimentoModalExames)
  const isValidExamData = (data: any): boolean => {
    return data && typeof data === "object" && Object.keys(data).length > 0;
  };

  /**
   * Função para salvar os dados do exame preenchido
   * Versão simplificada - apenas salva e fecha
   */
  const handleSaveExam = useCallback(
    async (data: any) => {
      if (!atendimento) {
        setError("Funcionário não selecionado");

        return;
      }

      if (!isValidExamData(data)) {
        setError(
          "Os dados do exame estão incompletos ou inválidos. Verifique o preenchimento.",
        );

        return;
      }

      if (!exame || !exame.codigoExame) {
        setError("Exame não encontrado para atualização.");

        return;
      }

      setIsSaving(true);
      setError("");

      try {
        const response = await fetch(NEST_SCHEDULINGS_EXAM_UPDATE, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            funcionarioId: atendimento._id,
            codigoExame: [exame.codigoExame],
            formulario: data,
            sala: exame.sala, // Sala especial para edição
            profissional: exame.profissional || "Desconhecido",
            isEditing: true, // Flag para indicar que é edição
          }),
        });

        if (!response.ok) {
          const txt = await response.text();

          throw new Error(`Erro ao atualizar exame: ${txt}`);
        }

        const result: Scheduling = await response.json();

        if (!result) {
          alert("Erro ao atualizar exame.");

          return;
        }

        alert("Exame atualizado com sucesso!");

        // Fecha o modal - o componente pai fará o refetch
        onClose();
      } catch (error) {
        const errorMessage = `Não foi possível atualizar o exame. ${
          error instanceof Error ? error.message : "Tente novamente."
        }`;

        setError(errorMessage);
        console.error("Erro ao salvar exame:", error);

        // Não fecha o modal em caso de erro para que o usuário possa corrigir
      } finally {
        setIsSaving(false);
      }
    },
    [atendimento, exame, onClose],
  );

  // Renderizar loading
  if (isLoadingForm) {
    return (
      <Modal
        backdrop="blur"
        classNames={{
          wrapper: "z-[1000]",
          backdrop: "z-[1000]",
        }}
        disableAnimation={true}
        isOpen={isOpen}
        size="2xl"
        onClose={onClose}
      >
        <ModalContent>
          <ModalHeader className="bg-blue-600 text-white">
            Carregando formulário...
          </ModalHeader>
          <ModalBody className="py-8">
            <div className="flex justify-center items-center">
              <Spinner color="primary" size="lg" />
              <span className="ml-4">Carregando dados do exame...</span>
            </div>
          </ModalBody>
        </ModalContent>
      </Modal>
    );
  }

  // Se não encontrar formulário específico, usar ExamePadrao
  if (!Formulario) {
    return (
      <Modal
        backdrop="blur"
        classNames={{
          wrapper: "z-[1000]",
          backdrop: "z-[1000]",
        }}
        disableAnimation={true}
        isOpen={isOpen}
        scrollBehavior="outside"
        size="5xl"
        onClose={onClose}
      >
        <ModalContent>
          <ExamePadrao
            atendimento={atendimento}
            exame={exame.grupo || exame.nomeExame || "Exame"}
            formulario={formData || {}}
            onClose={onClose}
            onSave={handleSaveExam}
          />
        </ModalContent>
      </Modal>
    );
  }

  return (
    <>
      <Modal
        backdrop="blur"
        classNames={{
          wrapper: "z-[1000]",
          backdrop: "z-[1000]",
        }}
        isOpen={isOpen}
        scrollBehavior="outside"
        size="5xl"
        onClose={onClose}
      >
        <ModalContent>
          <Formulario
            atendimento={atendimento}
            exame={exame.grupo || exame.nomeExame || "Exame"}
            formulario={formData || {}}
            isEditing={true}
            onClose={onClose}
            onSave={handleSaveExam}
          />
        </ModalContent>
      </Modal>

      {/* Modal de erro simplificado */}
      {error && (
        <Modal isOpen={!!error} size="sm" onClose={() => setError("")}>
          <ModalContent>
            <ModalHeader className="bg-red-600 text-white">✗ Erro</ModalHeader>
            <ModalBody>
              <p className="text-red-700">{error}</p>
            </ModalBody>
            <ModalFooter>
              <Button onPress={() => setError("")}>Fechar</Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      )}
    </>
  );
};

export default React.memo(ExamEditModal);
