import React from "react";
import { Card } from "@heroui/react";
import { Clock } from "lucide-react";
import { Socket } from "socket.io-client";

import AtendimentoSection from "./AtendimentoSection";
import AtendimentoCardCompacto from "./AtendimentoCardCompacto";

import { Scheduling } from "@/lib/scheduling/interface/scheduling";
import { PreparationRequest, Ticket } from "@/lib/ticket/ticket";

// Interface para tipagem robusta
interface SenhasListProps {
  // /** Lista ordenada de todas as senhas */
  // senhasOrdenadas: Ticket[];
  // /** Lista de senhas preferenciais */
  // senhasPreferenciais: Ticket[];
  // /** Lista de senhas com prefixo */
  // senhasComPrefixo: Ticket[];
  // /** Lista de senhas normais */
  // senhasNormais: Ticket[];

  // senhasEmAtendimento: Ticket[]

  /** Lista ordenada de todas as senhas */
  senhasOrdenadas: Scheduling[];
  /** Lista de senhas preferenciais */
  senhasPreferenciais: Scheduling[];
  /** Lista de senhas com prefixo */
  senhasComPrefixo: Scheduling[];
  /** Lista de senhas normais */
  senhasNormais: Scheduling[];

  senhasEmAtendimento: Scheduling[];

  /** Set ticket clicado */
  // setTicketSelecionado: (ticket: Ticket | null) => void;

  setFuncionarioSelecionado: (funcionario: Scheduling | null) => void;
  /** Instância do socket */
  socket: Socket;
  /** Sala atualmente selecionada */
  salaSelecionada: string;

  codigosDeAtendimento: Set<string>;
  /** Unidade atualmente selecionada */
  unidadeSelecionada: string;

  // agendamentos: Scheduling[]

  onHandleModal: (state: Boolean) => void;

  // onPreparationRequests: PreparationRequest[];

  // preparacoesFinalizadas: PreparationRequest[];

  exameSelecionado: string;
}

// Componente para o estado vazio
const EmptyState: React.FC<{ buscaSenha?: string }> = ({ buscaSenha }) => (
  <Card
    aria-describedby="empty-senhas-description"
    className="bg-white rounded-lg border border-gray-200 shadow-md p-8 text-center 
      transition-all duration-200 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
    role="alertdialog"
  >
    <div className="text-gray-600">
      <Clock
        aria-hidden="true"
        className="h-12 w-12 mx-auto mb-4 text-gray-400"
      />
      <p className="text-lg font-semibold text-gray-900 mb-2">
        Nenhuma senha encontrada
      </p>
      <p className="text-sm">
        {buscaSenha
          ? "Tente uma busca diferente"
          : "Ajuste os filtros para ver mais resultados"}
      </p>
    </div>
  </Card>
);

// Componente principal
const AtendimentoList: React.FC<SenhasListProps> = ({
  senhasOrdenadas,
  senhasPreferenciais,
  senhasComPrefixo,
  senhasNormais,
  senhasEmAtendimento,
  // setTicketSelecionado,
  socket,
  salaSelecionada,
  codigosDeAtendimento,
  unidadeSelecionada,
  setFuncionarioSelecionado,
  onHandleModal,
  exameSelecionado,
}) => {
  if (senhasOrdenadas.length === 0) {
    return <EmptyState />;
  }

  return (
    <section
      aria-label="Lista de senhas organizadas por categoria"
      className="space-y-6 p-4 bg-gray-50 rounded-lg flex gap-4"
    >
      <div className="w-screen">
        {senhasPreferenciais.length > 0 && (
          <AtendimentoSection
            key="senhas-preferenciais"
            codigosDeAtendimento={codigosDeAtendimento}
            emptyMessage="Nenhuma"
            exameSelecionado={exameSelecionado}
            salaSelecionada={salaSelecionada}
            senhas={senhasPreferenciais}
            setFuncionarioSelecionado={setFuncionarioSelecionado}
            // setTicketSelecionado={setTicketSelecionado}
            socket={socket}
            title={`Preferencial: ${senhasPreferenciais.length}`}
            unidadeSelecionada={unidadeSelecionada}
            onHandleModal={onHandleModal}
          />
        )}
        {senhasComPrefixo.length > 0 && (
          <AtendimentoSection
            key="senhas-prioridade"
            codigosDeAtendimento={codigosDeAtendimento}
            emptyMessage="Nenhuma"
            exameSelecionado={exameSelecionado}
            salaSelecionada={salaSelecionada}
            senhas={senhasComPrefixo}
            setFuncionarioSelecionado={setFuncionarioSelecionado}
            // setTicketSelecionado={setTicketSelecionado}
            socket={socket}
            title={`Prioridade: ${senhasComPrefixo.length}`}
            unidadeSelecionada={unidadeSelecionada}
            onHandleModal={onHandleModal}
          />
        )}
        <AtendimentoSection
          key="senhas-normais"
          codigosDeAtendimento={codigosDeAtendimento}
          emptyMessage="Nenhuma"
          exameSelecionado={exameSelecionado}
          salaSelecionada={salaSelecionada}
          senhas={senhasNormais}
          setFuncionarioSelecionado={setFuncionarioSelecionado}
          // setTicketSelecionado={setTicketSelecionado}
          socket={socket}
          title={`Atendimento: ${senhasNormais.length}`}
          unidadeSelecionada={unidadeSelecionada}
          onHandleModal={onHandleModal}
        />
      </div>
      <div className="w-md mb-2">
        {senhasEmAtendimento.map((atend) => (
          <AtendimentoCardCompacto
            key={`compacto-${atend._id}`}
            atendimento={atend}
            socket={socket}
          />
        ))}
      </div>
    </section>
  );
};

export default AtendimentoList;
