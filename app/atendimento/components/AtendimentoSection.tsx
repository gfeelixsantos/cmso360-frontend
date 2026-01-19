import React from "react";
import { Card } from "@heroui/react";
import { Socket } from "socket.io-client";

import AtendimentoCard from "./AtendimentoCard";

import { Scheduling } from "@/lib/scheduling/interface/scheduling";

interface SenhasSectionProps {
  title: string;
  senhas: Scheduling[];
  emptyMessage: string;
  socket: Socket;
  salaSelecionada: string;
  codigosDeAtendimento: Set<string>;
  unidadeSelecionada: string;
  onHandleModal: (state: boolean) => void;
  setFuncionarioSelecionado: (funcionario: Scheduling | null) => void;
  exameSelecionado: string;
}

// Componente para o estado vazio - CORRIGIDO
const EmptySection: React.FC<{ title: string; emptyMessage: string }> = ({
  title,
  emptyMessage,
}) => {
  const sectionId = `section-${title.toLowerCase().replace(/\s/g, "-")}`;

  return (
    <section
      aria-atomic="true"
      aria-labelledby={sectionId}
      aria-live="polite"
      role="region"
    >
      <h3
        className="text-lg font-semibold text-center mt-2 text-gray-900 mb-2"
        id={sectionId}
      >
        {title}
      </h3>
      <Card
        aria-describedby={`${sectionId}-description`}
        className="bg-white rounded-lg border border-gray-200 shadow-md p-4 text-center 
          transition-all duration-200 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        role="status"
      >
        <p className="text-sm text-gray-600" id={`${sectionId}-description`}>
          {emptyMessage}
        </p>
      </Card>
    </section>
  );
};

// Componente principal - CORRIGIDO
const AtendimentoSection: React.FC<SenhasSectionProps> = ({
  title,
  senhas,
  emptyMessage,
  socket,
  salaSelecionada,
  codigosDeAtendimento,
  unidadeSelecionada,
  onHandleModal,
  setFuncionarioSelecionado,
  exameSelecionado,
}) => {
  const sectionId = `section-${title.toLowerCase().replace(/\s/g, "-")}`;

  if (senhas.length === 0) {
    return <EmptySection emptyMessage={emptyMessage} title={title} />;
  }

  return (
    <section
      aria-atomic="true"
      aria-labelledby={sectionId}
      aria-live="polite"
      className="space-y-4"
      role="region"
    >
      <h3
        className="text-lg mt-2 text-center font-semibold text-gray-900"
        id={sectionId}
      >
        {title}
      </h3>
      <div
        aria-label={`Lista de ${title.toLowerCase()}`}
        className="space-y-4"
        role="list"
      >
        {senhas.map((atendimento, index) => {
          // Verifica se o atendimento tem _id válido
          const hasValidId = atendimento._id && atendimento._id.toString();
          const key = hasValidId
            ? atendimento._id.toString()
            : `atendimento-${index}-${atendimento.CODIGOPRONTUARIO || ""}`;

          return (
            <div
              key={key}
              aria-label={`Atendimento de ${atendimento.NOME || "Paciente"}`}
              role="listitem"
            >
              <AtendimentoCard
                key={key}
                atendimento={atendimento}
                exameSelecionado={exameSelecionado}
                salaSelecionada={salaSelecionada}
                setFuncionarioSelecionado={setFuncionarioSelecionado}
                socket={socket}
                unidadeSelecionada={unidadeSelecionada}
                onHandleModal={onHandleModal}
              />
            </div>
          );
        })}
      </div>
    </section>
  );
};

export default AtendimentoSection;
