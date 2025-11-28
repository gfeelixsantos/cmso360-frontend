import React from "react";
import { Card } from "@heroui/react";
import { Socket } from "socket.io-client";

import AtendimentoCard from "./AtendimentoCard";

import { Ticket } from "@/lib/ticket/ticket";
import { Scheduling } from "@/lib/scheduling/interface/scheduling";

// Interface para tipagem robusta
interface SenhasSectionProps {
  /** Título da seção (ex: "Senhas Preferenciais") */
  title: string;
  // /** Lista de tickets (senhas) a serem exibidos */
  // senhas: Ticket[];

  /** Lista de tickets (senhas) a serem exibidos */
  senhas: Scheduling[];

  /** Mensagem exibida quando a lista está vazia */
  emptyMessage: string;
  // /** ID do dropdown aberto (se houver) */
  // dropdownAguardarAberto: string | null;
  // /** Callback para definir o dropdown aberto */
  // setDropdownAguardarAberto: (value: string | null) => void;
  /** Instância do socket */
  socket: Socket;
  /** Sala atualmente selecionada */
  salaSelecionada: string;

  codigosDeAtendimento: Set<string>;

  /** Unidade atualmente selecionada */
  unidadeSelecionada: string;

  // agendamentos: Scheduling[]
  onHandleModal: (state: Boolean) => void;
  setTicketSelecionado: (ticket: Ticket | null) => void;
  setFuncionarioSelecionado: (funcionario: Scheduling | null) => void;

  exameSelecionado: string;
}

// Componente para o estado vazio
const EmptySection: React.FC<{ title: string; emptyMessage: string }> = ({
  title,
  emptyMessage,
}) => (
  <section
    aria-labelledby={`section-${title.toLowerCase().replace(/\s/g, "-")}`}
  >
    <h3
      className="text-lg font-semibold text-center mt-2 text-gray-900 mb-2"
      id={`section-${title.toLowerCase().replace(/\s/g, "-")}`}
    >
      {title}
    </h3>
    <Card
      aria-describedby="empty-section-description"
      className="bg-white rounded-lg border border-gray-200 shadow-md p-4 text-center 
        transition-all duration-200 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
      role="alert"
    >
      <p className="text-sm text-gray-600">{emptyMessage}</p>
    </Card>
  </section>
);

// Componente principal
const AtendimentoSection: React.FC<SenhasSectionProps> = ({
  title,
  senhas,
  emptyMessage,
  socket,
  salaSelecionada,
  codigosDeAtendimento,
  unidadeSelecionada,
  //agendamentos,
  onHandleModal,
  setTicketSelecionado,
  setFuncionarioSelecionado,
  exameSelecionado,
}) => {
  if (senhas.length === 0) {
    return <EmptySection emptyMessage={emptyMessage} title={title} />;
  }

  return (
    <section
      aria-labelledby={`section-${title.toLowerCase().replace(/\s/g, "-")}`}
      className="space-y-4"
    >
      <h3
        className="text-lg mt-2 text-center font-semibold text-gray-900"
        id={`section-${title.toLowerCase().replace(/\s/g, "-")}`}
      >
        {title}
      </h3>
      <div className="space-y-4">
        {senhas.map((atendimento) => (
          <AtendimentoCard
            key={atendimento._id?.toString()}
            atendimento={atendimento}
            exameSelecionado={exameSelecionado}
            salaSelecionada={salaSelecionada}
            setFuncionarioSelecionado={setFuncionarioSelecionado}
            setTicketSelecionado={setTicketSelecionado}
            socket={socket}
            unidadeSelecionada={unidadeSelecionada}
            onHandleModal={onHandleModal}
          />
        ))}
      </div>
    </section>
  );
};

export default AtendimentoSection;
