import React, { useEffect, useMemo, useState } from "react";
import { Socket } from "socket.io-client";

import DisconnectedState from "../../recepcao/components/DisconnectedState";

import AtendimentoList from "./AtendimentoList";

import { TicketGroups, TicketStatus } from "@/lib/ticket/ticket";
import {
  ExamRegister,
  Scheduling,
} from "@/lib/scheduling/interface/scheduling";
import { ExamStatus } from "@/lib/scheduling/enum/scheduling.enum";
import ContentLoading from "@/app/atendimento/components/ContentLoading";
import { ESTIMATIVA_EXAMES } from "@/config/constants";

interface MainContentProps {
  conectado: boolean;
  agendamentos: Scheduling[];
  socket: Socket;
  salaSelecionada: string;
  codigosDeAtendimento: Set<string>;
  unidadeSelecionada: string;
  setFuncionarioSelecionado: (funcionario: Scheduling | null) => void;
  onHandleModal: (state: boolean) => void;
  exameSelecionado: string;
  pendingActions: Record<
    number,
    {
      action: string;
      startedAt: number;
      phase: "pending" | "resync";
    }
  >;
  startPendingAction: (ticketId: number, action: string) => void;
}

const AtendimentoContent: React.FC<MainContentProps> = ({
  conectado,
  agendamentos,
  socket,
  salaSelecionada,
  codigosDeAtendimento,
  unidadeSelecionada,
  onHandleModal,
  setFuncionarioSelecionado,
  exameSelecionado,
  pendingActions,
  startPendingAction,
}) => {
  const [estaCarregando, setEstaCarregando] = useState(true);
  const [dadosIniciaisCarregados, setDadosIniciaisCarregados] = useState(false);

  // Efeito para controlar o estado de carregamento inicial
  useEffect(() => {
    if (conectado && agendamentos) {
      const timer = setTimeout(() => {
        setEstaCarregando(false);
        setDadosIniciaisCarregados(true);
      }, 200);

      return () => clearTimeout(timer);
    }

    // Reset loading state when disconnected
    if (!conectado) {
      setEstaCarregando(true);
      setDadosIniciaisCarregados(false);
    }
  }, [conectado, agendamentos]);

  // Efeito para mostrar loading durante atualizações via socket
  useEffect(() => {
    if (dadosIniciaisCarregados && socket) {
      const handleAtualizacao = () => {
        setEstaCarregando(true);
        const timer = setTimeout(() => setEstaCarregando(false), 300);

        return () => clearTimeout(timer);
      };

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

  const calcularTempoEstimado = (exames: ExamRegister[] = []) => {
    return exames
      .filter((ex) => ex.status !== ExamStatus.FINALIZADO)
      .reduce((total, ex) => {
        return total + (ESTIMATIVA_EXAMES[ex.grupo] ?? 20);
      }, 0);
  };

  const AtendimentosOrdenados = useMemo(() => {
    if (!Array.isArray(agendamentos) || agendamentos.length === 0) {
      return [];
    }

    const JANELA_TOLERANCIA = 10 * 60 * 1000;

    return agendamentos
      .map((a) => {
        const ticketTime = a.TICKET?.emissao
          ? new Date(a.TICKET.emissao).getTime()
          : Number.MAX_SAFE_INTEGER;

        const examesPendentes =
          a.EXAMES?.filter((ex) => ex.status !== ExamStatus.FINALIZADO) ?? [];

        return {
          ...a,
          ticketTime,
          examesRestantes: examesPendentes.length,
          tempoEstimado: calcularTempoEstimado(examesPendentes),
        };
      })
      .sort((a, b) => {
        const deltaTicket = a.ticketTime - b.ticketTime;

        if (Math.abs(deltaTicket) > JANELA_TOLERANCIA) {
          return deltaTicket;
        }

        if (a.tempoEstimado !== b.tempoEstimado) {
          return a.tempoEstimado - b.tempoEstimado;
        }

        return deltaTicket;
      });
  }, [agendamentos]);

  const AgendamentosComInfoDeOutrasSalas = useMemo(() => {
    if (!agendamentos || agendamentos.length === 0) return new Map();

    return new Map(
      agendamentos
        .filter(
          (t) =>
            t.TICKET &&
            (t.TICKET.status === TicketStatus.EM_ATENDIMENTO ||
              t.TICKET.status === TicketStatus.EM_CHAMADA) &&
            t.TICKET.sala !== salaSelecionada &&
            t.TICKET.sala !== "" &&
            t.TICKET.grupo === TicketGroups.EXAME,
        )
        .map((t) => [
          t.TICKET.id,
          {
            status: t.TICKET.status,
            sala: t.TICKET.sala,
          },
        ]),
    );
  }, [agendamentos, salaSelecionada]);

  const atendimentoOutrasSalas = useMemo(() => {
    return AtendimentosOrdenados.filter(
      (a) => a?.TICKET && AgendamentosComInfoDeOutrasSalas.has(a.TICKET.id),
    ).map((a) => {
      const infoTicketOutraSala = AgendamentosComInfoDeOutrasSalas.get(
        a.TICKET.id,
      )!;

      return {
        ...a,
        TICKET: {
          ...a.TICKET,
          status: infoTicketOutraSala.status,
          sala: infoTicketOutraSala.sala,
        },
      };
    });
  }, [AtendimentosOrdenados, AgendamentosComInfoDeOutrasSalas]);

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
    if (!AtendimentosOrdenados || AtendimentosOrdenados.length === 0) {
      return [[], [], []];
    }

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
  if (estaCarregando || !agendamentos) {
    return <ContentLoading />;
  }

  const totalAtendimentos = AtendimentosOrdenados.length;
  const totalPreferenciais = senhasPreferenciais.length;
  const totalComPrefixo = senhasComPrefixo.length;
  const totalNormais = senhasNormais.length;
  const totalOutrasSalas = atendimentoOutrasSalas.length;

  const ariaLabelMain = `Sistema de atendimento medico - ${totalAtendimentos} pacientes aguardando: ${totalPreferenciais} preferenciais, ${totalComPrefixo} com prioridade, ${totalNormais} normais. ${totalOutrasSalas} em atendimento em outras salas.`;

  return (
    <main aria-label={ariaLabelMain} className="min-h-screen" role="main">
      <div
        aria-atomic="true"
        aria-live="polite"
        aria-relevant="additions removals"
        className="sr-only"
      >
        {totalAtendimentos > 0
          ? `Lista de atendimentos carregada com ${totalAtendimentos} pacientes.`
          : "Nenhum paciente aguardando atendimento."}
      </div>

      <AtendimentoList
        codigosDeAtendimento={codigosDeAtendimento}
        exameSelecionado={exameSelecionado}
        salaSelecionada={salaSelecionada}
        senhasComPrefixo={senhasComPrefixo}
        senhasEmAtendimento={atendimentoOutrasSalas}
        senhasNormais={senhasNormais}
        senhasOrdenadas={AtendimentosOrdenados}
        senhasPreferenciais={senhasPreferenciais}
        setFuncionarioSelecionado={setFuncionarioSelecionado}
        socket={socket}
        unidadeSelecionada={unidadeSelecionada}
        onHandleModal={onHandleModal}
        pendingActions={pendingActions}
        startPendingAction={startPendingAction}
      />
    </main>
  );
};

export default AtendimentoContent;
