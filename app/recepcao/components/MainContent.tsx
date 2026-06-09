import React, { useMemo } from "react";
import { Socket } from "socket.io-client";

import SenhasList from "./SenhaList";
import DisconnectedState from "./DisconnectedState";

import { PreparationRequest, Ticket, TicketGroups, TicketStatus } from "@/lib/ticket/ticket";
import { Scheduling } from "@/lib/scheduling/interface/scheduling";

// Interface para tipagem robusta
interface MainContentProps {
  /** Estado da conexão */
  conectado: boolean;
  /** Lista de tickets (senhas) */
  tickets: Ticket[];
  /** Lista de agendamentos */
  agendamentos: Scheduling[];
  /** Instância do socket */
  socket: Socket;
  /** Sala atualmente selecionada */
  salaSelecionada: string;
  /** Unidade atualmente selecionada */
  unidadeSelecionada: string;

  setTicketSelecionado: (ticket: Ticket | null) => void;

  onHandleModal: (state: Boolean) => void;

  onPreparationRequests: PreparationRequest[];

  preparacoesFinalizadas: PreparationRequest[];
}

// Componente principal
const MainContent: React.FC<MainContentProps> = ({
  conectado,
  tickets,
  agendamentos,
  socket,
  salaSelecionada,
  unidadeSelecionada,
  setTicketSelecionado,
  onHandleModal,
  onPreparationRequests,
  preparacoesFinalizadas,
}) => {
  // Filtragem/organização tickets
  // Remove cards já enviados para atendimento ou finalizados
  const senhasRecepcao = useMemo(() => {
    return tickets.filter((t) => {
      // Manter apenas tickets que ainda estão na fila de recepção
      if (t.status === TicketStatus.FINALIZADO) return false;
      if (t.status === TicketStatus.EM_ATENDIMENTO) return false;
      // Tickets AGUARDANDO com grupo EXAME já foram para atendimento
      if (t.status === TicketStatus.AGUARDANDO && t.grupo === TicketGroups.EXAME) return false;
      return true;
    });
  }, [tickets]);

  const senhasOrdenadas = useMemo(() => {
    return [...senhasRecepcao].sort((a, b) => (a.id ?? 0) - (b.id ?? 0));
  }, [senhasRecepcao]);

  const senhasPrepracao = tickets.filter(
    (t) =>
      t.status === TicketStatus.EM_PREPARACAO ||
      t.status === TicketStatus.ENCAMINHADO_RX,
  );

  const senhasPreferenciais = senhasOrdenadas.filter(
    (s) => s.preferencial && senhasPrepracao.every((p) => p.id != s.id),
  );
  const senhasComPrefixo = senhasOrdenadas.filter(
    (s) =>
      s.prefixo &&
      !s.preferencial &&
      senhasPrepracao.every((p) => p.id != s.id),
  );
  const senhasNormais = senhasOrdenadas.filter(
    (s) =>
      !s.preferencial &&
      !s.prefixo &&
      senhasPrepracao.every((p) => p.id != s.id),
  );

  if (!conectado) {
    return <DisconnectedState />;
  }

  return (
    <main
      aria-label="Conteúdo principal do sistema de atendimento"
      className="min-h-screen"
    >
      {/* Senhas List Section  */}
      <SenhasList
        agendamentos={agendamentos}
        preparacoesFinalizadas={preparacoesFinalizadas}
        salaSelecionada={salaSelecionada}
        senhasComPrefixo={senhasComPrefixo}
        senhasNormais={senhasNormais}
        senhasOrdenadas={senhasOrdenadas}
        senhasPreferenciais={senhasPreferenciais}
        senhasPrepracao={senhasPrepracao}
        setTicketSelecionado={setTicketSelecionado}
        socket={socket}
        unidadeSelecionada={unidadeSelecionada}
        onHandleModal={onHandleModal}
        onPreparationRequests={onPreparationRequests}
      />
    </main>
  );
};

export default MainContent;
