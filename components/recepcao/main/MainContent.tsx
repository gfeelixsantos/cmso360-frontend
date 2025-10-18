import React, { useCallback, useEffect, useMemo } from 'react';
import { Building2, CheckCircle, Clock, FilePlus, Plus, User } from "lucide-react";

import { Socket } from "socket.io-client";
import { Button } from "@heroui/react";
import SenhasList from "./SenhaList";
import DisconnectedState from "./DisconnectedState";
import { PreparationRequest, Ticket, TicketStatus } from '@/lib/ticket/ticket';
import { Scheduling } from '@/lib/scheduling/interface/scheduling';
import { PreparationGrid } from './PreparationGrid';

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

  setTicketSelecionado: (ticket: Ticket | null) => void

  onHandleModal: (state: Boolean) => void

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
  const senhasOrdenadas = useMemo(() => {
    return [...tickets].sort((a, b) => (a.id ?? 0) - (b.id ?? 0));
  }, [tickets]);

  const senhasPrepracao = tickets.filter((t) => t.status === TicketStatus.EM_PREPARACAO || t.status === TicketStatus.ENCAMINHADO_RX)

  const senhasPreferenciais = senhasOrdenadas.filter((s) => s.preferencial  && senhasPrepracao.every(p => p.id != s.id));
  const senhasComPrefixo = senhasOrdenadas.filter((s) => (s.prefixo && !s.preferencial) && senhasPrepracao.every(p => p.id != s.id));
  const senhasNormais = senhasOrdenadas.filter((s) => (!s.preferencial && !s.prefixo) && senhasPrepracao.every(p => p.id != s.id));
  

  if (!conectado) {
    return <DisconnectedState />;
  }


  return (
    <main
      className="min-h-screen"
      aria-label="Conteúdo principal do sistema de atendimento"
    >
            {/* Senhas List Section  */}
      <SenhasList
        senhasOrdenadas={senhasOrdenadas}
        senhasPreferenciais={senhasPreferenciais}
        senhasComPrefixo={senhasComPrefixo}
        senhasNormais={senhasNormais}
        senhasPrepracao={senhasPrepracao}
        setTicketSelecionado={setTicketSelecionado}
        socket={socket}
        salaSelecionada={salaSelecionada}
        unidadeSelecionada={unidadeSelecionada}
        agendamentos={agendamentos}
        onHandleModal={onHandleModal}
        onPreparationRequests={onPreparationRequests}
        preparacoesFinalizadas={preparacoesFinalizadas}
      />
    </main>
  );
};

export default MainContent;