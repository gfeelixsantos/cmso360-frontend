import React, { useEffect, useMemo } from 'react';
import { Socket } from "socket.io-client";
import { PreparationRequest, Ticket, TicketGroups, TicketStatus } from '@/lib/ticket/ticket';
import { Scheduling } from '@/lib/scheduling/interface/scheduling';
import DisconnectedState from '../recepcao/main/DisconnectedState';
import AtendimentoList from './AtendimentoList';

interface MainContentProps {
  conectado: boolean;
  tickets: Ticket[];
  agendamentos: Scheduling[];
  socket: Socket;
  salaSelecionada: string;
  codigosDeAtendimento: Set<string>;
  unidadeSelecionada: string;
  setTicketSelecionado: (ticket: Ticket | null) => void
  setFuncionarioSelecionado:(funcionario: Scheduling | null) => void
  onHandleModal: (state: Boolean) => void
  onPreparationRequests: PreparationRequest[];
  preparacoesFinalizadas: PreparationRequest[];
  exameSelecionado: string;
}

const AtendimentoContent: React.FC<MainContentProps> = ({
  conectado,
  tickets,
  agendamentos,
  socket,
  salaSelecionada,
  codigosDeAtendimento,
  unidadeSelecionada,
  setTicketSelecionado,
  onHandleModal,
  onPreparationRequests,
  preparacoesFinalizadas,
  setFuncionarioSelecionado,
  exameSelecionado,
}) => {

  const AtendimentosOrdenados = useMemo(() => {
    return [...(agendamentos || [])].sort((a, b) => (a.EXAMES?.length ?? 0) > (b.EXAMES?.length ?? 0) ? 1 : -1);
  }, [agendamentos]);



  const ticketsComInfoDeOutrasSalas = useMemo(() => {
    return new Map(
      (tickets || [])
        .filter(t => 
          (t.status === TicketStatus.EM_ATENDIMENTO || t.status === TicketStatus.EM_CHAMADA)
          && (t.sala != salaSelecionada && t.sala != "")
          && (t.grupo == TicketGroups.EXAME)
        )
        .map(t => [t.id, { status: t.status, sala: t.sala }])
    );
  }, [tickets, salaSelecionada, agendamentos]);

  const atendimentoOutrasSalas = AtendimentosOrdenados
    .filter((a) => a?.TICKET && ticketsComInfoDeOutrasSalas.has(a.TICKET.id))
    .map((a) => {
      const infoTicketOutraSala = ticketsComInfoDeOutrasSalas.get(a.TICKET.id)!;
      return {
        ...a,
        TICKET: {
          ...a.TICKET,
          status: infoTicketOutraSala.status,
          sala: infoTicketOutraSala.sala,
        }
      };
    });

  const prontuariosEmAtendimento = new Set(
    atendimentoOutrasSalas.map(p => p.CODIGOPRONTUARIO)
  );

  const naoEstaEmOutrasSalas = (atendimento: Scheduling) => !prontuariosEmAtendimento.has(atendimento.CODIGOPRONTUARIO);

  const senhasPreferenciais = AtendimentosOrdenados.filter((s) => s.TICKET?.preferencial && naoEstaEmOutrasSalas(s));
  const senhasComPrefixo = AtendimentosOrdenados.filter((s) => (s.TICKET?.prefixo && !s.TICKET?.preferencial) && naoEstaEmOutrasSalas(s));
  const senhasNormais = AtendimentosOrdenados.filter((s) => (!s.TICKET?.preferencial && !s.TICKET?.prefixo) && naoEstaEmOutrasSalas(s));

  if (!conectado) {
    return <DisconnectedState />;
  }

  return (
    <main className="min-h-screen" aria-label="Conteúdo principal do sistema de atendimento">
      <AtendimentoList
        senhasOrdenadas={AtendimentosOrdenados}
        senhasPreferenciais={senhasPreferenciais}
        senhasComPrefixo={senhasComPrefixo}
        senhasNormais={senhasNormais}
        senhasEmAtendimento={atendimentoOutrasSalas}
        setTicketSelecionado={setTicketSelecionado}
        socket={socket}
        salaSelecionada={salaSelecionada}
        codigosDeAtendimento={codigosDeAtendimento}
        unidadeSelecionada={unidadeSelecionada}
        setFuncionarioSelecionado={setFuncionarioSelecionado}
        onHandleModal={onHandleModal}
        onPreparationRequests={onPreparationRequests}
        preparacoesFinalizadas={preparacoesFinalizadas}
        exameSelecionado={exameSelecionado}
      />
    </main>
  );
};

export default AtendimentoContent;
