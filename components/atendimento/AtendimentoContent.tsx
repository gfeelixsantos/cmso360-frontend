import React, { useMemo } from 'react';

import { Socket } from "socket.io-client";
import { PreparationRequest, Ticket, TicketGroups, TicketStatus } from '@/lib/ticket/ticket';
import { Scheduling } from '@/lib/scheduling/interface/scheduling';
import DisconnectedState from '../recepcao/main/DisconnectedState';
import AtendimentoList from './AtendimentoList';


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

  codigosDeAtendimento: Set<string>;

  /** Unidade atualmente selecionada */
  unidadeSelecionada: string;

  setTicketSelecionado: (ticket: Ticket | null) => void

  setFuncionarioSelecionado:(funcionario: Scheduling | null) => void

  onHandleModal: (state: Boolean) => void

  onPreparationRequests: PreparationRequest[];

  preparacoesFinalizadas: PreparationRequest[];

}



// Componente principal
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
}) => {

  // Filtragem/organização tickets
  // const senhasOrdenadas = useMemo(() => {
  //   return [...tickets].sort((a, b) => (a.id ?? 0) - (b.id ?? 0));
  // }, [tickets]);

// 1. Definição e ordenação (mantida)
const AtendimentosOrdenados = useMemo(() => {
    return [...agendamentos].sort((a, b) => a.EXAMES.length > b.EXAMES.length ? 1 : -1);
}, [agendamentos]);


const ticketsComInfoDeOutrasSalas = useMemo(() => {
  return new Map(
    tickets
        .filter(t => 
            (t.status === TicketStatus.EM_ATENDIMENTO || t.status === TicketStatus.EM_CHAMADA)
            && (t.sala != salaSelecionada && t.sala != "")
            && (t.grupo == TicketGroups.EXAME)
        )
        .map(t => [t.id, { status: t.status, sala: t.sala }])
  );
}, [tickets, agendamentos])


const atendimentoOutrasSalas = AtendimentosOrdenados
    .filter((a) => ticketsComInfoDeOutrasSalas.has(a.TICKET.id)) // 1. FILTRA: Pega APENAS os agendamentos que têm tickets no Map
    .map((a) => {
        // O .filter acima garante que a informação exista.
        const infoTicketOutraSala = ticketsComInfoDeOutrasSalas.get(a.TICKET.id)!; 

        // 2. MAPEIA: Cria e retorna o NOVO OBJETO SEM CONDICIONAL
        return {
            ...a, // Copia todas as propriedades do agendamento
            TICKET: {
                ...a.TICKET, // Copia as propriedades do ticket existente
                status: infoTicketOutraSala.status, // Sobrescreve o status com o da outra sala
                sala: infoTicketOutraSala.sala,     // Adiciona/Sobrescreve a sala com a da outra sala
            }
        };
    });

// Se o 'atendimentoOutrasSalas' estiver ok (sem 'undefined'), este passo funcionará:
const prontuariosEmAtendimento = new Set(
    atendimentoOutrasSalas.map(p => p.CODIGOPRONTUARIO)
);

// Função auxiliar para simplificar a remoção de atendimentos em outras salas
const naoEstaEmOutrasSalas = (atendimento: Scheduling) => 
    !prontuariosEmAtendimento.has(atendimento.CODIGOPRONTUARIO);


const senhasPreferenciais = AtendimentosOrdenados.filter((s) => 
    s.TICKET.preferencial 
    && naoEstaEmOutrasSalas(s)
);

const senhasComPrefixo = AtendimentosOrdenados.filter((s) => 
    (s.TICKET.prefixo && !s.TICKET.preferencial) 
    && naoEstaEmOutrasSalas(s)
);

const senhasNormais = AtendimentosOrdenados.filter((s) => 
    (!s.TICKET.preferencial && !s.TICKET.prefixo) 
    && naoEstaEmOutrasSalas(s)
);



  if (!conectado) {
    return <DisconnectedState />;
  }


  return (
    <main
      className="min-h-screen"
      aria-label="Conteúdo principal do sistema de atendimento"
    >
      {/* Senhas List Section  */}
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
      />
    </main>
  );
};

export default AtendimentoContent;