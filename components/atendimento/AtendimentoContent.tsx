import React, { useEffect, useMemo, useState } from "react";
import { Socket } from "socket.io-client";
import { Spinner } from "@heroui/react";

import DisconnectedState from "../recepcao/main/DisconnectedState";

import AtendimentoList from "./AtendimentoList";

import {
  PreparationRequest,
  Ticket,
  TicketGroups,
  TicketStatus,
} from "@/lib/ticket/ticket";
import { Scheduling } from "@/lib/scheduling/interface/scheduling";

interface MainContentProps {
  conectado: boolean;
  tickets: Ticket[];
  agendamentos: Scheduling[];
  socket: Socket;
  salaSelecionada: string;
  codigosDeAtendimento: Set<string>;
  unidadeSelecionada: string;
  setTicketSelecionado: (ticket: Ticket | null) => void;
  setFuncionarioSelecionado: (funcionario: Scheduling | null) => void;
  onHandleModal: (state: Boolean) => void;
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
  const [estaCarregando, setEstaCarregando] = useState(true);
  const [dadosIniciaisCarregados, setDadosIniciaisCarregados] = useState(false);

  // Efeito para controlar o estado de carregamento inicial
  useEffect(() => {
    if (conectado && agendamentos && tickets) {
      // Pequeno delay para garantir que os dados estão processados
      const timer = setTimeout(() => {
        setEstaCarregando(false);
        setDadosIniciaisCarregados(true);
      }, 200);

      return () => clearTimeout(timer);
    }
  }, [conectado, agendamentos, tickets]);

  // Efeito para mostrar loading durante atualizações via socket
  useEffect(() => {
    if (dadosIniciaisCarregados && socket) {
      const handleAtualizacao = () => {
        setEstaCarregando(true);
        // Loading rápido para atualizações
        const timer = setTimeout(() => setEstaCarregando(false), 300);

        return () => clearTimeout(timer);
      };

      // Escuta eventos de atualização do socket
      socket.on("ticketAtualizado", handleAtualizacao);
      socket.on("novoTicket", handleAtualizacao);
      socket.on("atendimentoIniciado", handleAtualizacao);

      return () => {
        socket.off("ticketAtualizado", handleAtualizacao);
        socket.off("novoTicket", handleAtualizacao);
        socket.off("atendimentoIniciado", handleAtualizacao);
      };
    }
  }, [socket, dadosIniciaisCarregados]);

  const AtendimentosOrdenados = useMemo(() => {
    if (!agendamentos) return [];

    return [...agendamentos].sort((a, b) => {
      const pendentesA =
        a.EXAMES?.filter((ex) => ex.status !== "FINALIZADO").length ?? 0;
      const pendentesB =
        b.EXAMES?.filter((ex) => ex.status !== "FINALIZADO").length ?? 0;

      const diferencaPendentes = pendentesA - pendentesB;

      if (diferencaPendentes !== 0) {
        return diferencaPendentes;
      }

      const dataA = a.TICKET?.emissao
        ? new Date(a.TICKET.emissao).getTime()
        : 0;
      const dataB = b.TICKET?.emissao
        ? new Date(b.TICKET.emissao).getTime()
        : 0;

      return dataA - dataB;
    });
  }, [agendamentos]);

  const ticketsComInfoDeOutrasSalas = useMemo(() => {
    if (!tickets) return new Map();

    return new Map(
      tickets
        .filter(
          (t) =>
            (t.status === TicketStatus.EM_ATENDIMENTO ||
              t.status === TicketStatus.EM_CHAMADA) &&
            t.sala != salaSelecionada &&
            t.sala != "" &&
            t.grupo == TicketGroups.EXAME,
        )
        .map((t) => [t.id, { status: t.status, sala: t.sala }]),
    );
  }, [tickets, salaSelecionada]);

  const atendimentoOutrasSalas = useMemo(() => {
    return AtendimentosOrdenados.filter(
      (a) => a?.TICKET && ticketsComInfoDeOutrasSalas.has(a.TICKET.id),
    ).map((a) => {
      const infoTicketOutraSala = ticketsComInfoDeOutrasSalas.get(a.TICKET.id)!;

      return {
        ...a,
        TICKET: {
          ...a.TICKET,
          status: infoTicketOutraSala.status,
          sala: infoTicketOutraSala.sala,
        },
      };
    });
  }, [AtendimentosOrdenados, ticketsComInfoDeOutrasSalas]);

  const prontuariosEmAtendimento = useMemo(
    () => new Set(atendimentoOutrasSalas.map((p) => p.CODIGOPRONTUARIO)),
    [atendimentoOutrasSalas],
  );

  const naoEstaEmOutrasSalas = useMemo(
    () => (atendimento: Scheduling) =>
      !prontuariosEmAtendimento.has(atendimento.CODIGOPRONTUARIO),
    [prontuariosEmAtendimento],
  );

  const [senhasPreferenciais, senhasComPrefixo, senhasNormais] = useMemo(() => {
    const preferenciais = AtendimentosOrdenados.filter(
      (s) => s.TICKET?.preferencial && naoEstaEmOutrasSalas(s),
    );
    const comPrefixo = AtendimentosOrdenados.filter(
      (s) =>
        s.TICKET?.prefixo && !s.TICKET?.preferencial && naoEstaEmOutrasSalas(s),
    );
    const normais = AtendimentosOrdenados.filter(
      (s) =>
        !s.TICKET?.preferencial &&
        !s.TICKET?.prefixo &&
        naoEstaEmOutrasSalas(s),
    );

    return [preferenciais, comPrefixo, normais];
  }, [AtendimentosOrdenados, naoEstaEmOutrasSalas]);

  if (!conectado) {
    return <DisconnectedState />;
  }

  // Loading elegante com HeroUI durante o carregamento
  if (estaCarregando || !agendamentos || !tickets ) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-default-50/50">
        <div className="text-center space-y-6">
          {/* Spinner do HeroUI com tamanho personalizado e cor primária */}
          <div className="flex justify-center">
            <Spinner
              classNames={{
                circle1: "border-b-green-700",
                circle2: "border-b-yellow-400",
                wrapper: "w-16 h-16",
              }}
              color="success"
              size="lg"
            />
          </div>

          {/* Conteúdo textual com animação sutil */}
          <div className="space-y-2">
            <h3 className="text-xl font-semibold text-default-700">
              Recebendo Atendimentos
            </h3>
            <p className="text-default-500 text-medium">Aguarde...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <main
      aria-label="Conteúdo principal do sistema de atendimento"
      className="min-h-screen"
    >
      <AtendimentoList
        codigosDeAtendimento={codigosDeAtendimento}
        exameSelecionado={exameSelecionado}
        preparacoesFinalizadas={preparacoesFinalizadas}
        salaSelecionada={salaSelecionada}
        senhasComPrefixo={senhasComPrefixo}
        senhasEmAtendimento={atendimentoOutrasSalas}
        senhasNormais={senhasNormais}
        senhasOrdenadas={AtendimentosOrdenados}
        senhasPreferenciais={senhasPreferenciais}
        setFuncionarioSelecionado={setFuncionarioSelecionado}
        setTicketSelecionado={setTicketSelecionado}
        socket={socket}
        unidadeSelecionada={unidadeSelecionada}
        onHandleModal={onHandleModal}
        onPreparationRequests={onPreparationRequests}
      />
    </main>
  );
};

export default AtendimentoContent;
