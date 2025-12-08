import React, { useEffect, useMemo, useState } from "react";
import { Socket } from "socket.io-client";
import { Spinner } from "@heroui/react";

import DisconnectedState from "../recepcao/main/DisconnectedState";

import AtendimentoList from "./AtendimentoList";

import { TicketGroups, TicketStatus } from "@/lib/ticket/ticket";
import { Scheduling } from "@/lib/scheduling/interface/scheduling";

interface MainContentProps {
  conectado: boolean;
  agendamentos: Scheduling[];
  socket: Socket;
  salaSelecionada: string;
  codigosDeAtendimento: Set<string>;
  unidadeSelecionada: string;
  setFuncionarioSelecionado: (funcionario: Scheduling | null) => void;
  onHandleModal: (state: boolean) => void; // Corrigido: boolean em vez de Boolean
  exameSelecionado: string;
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
    if (!agendamentos || agendamentos.length === 0) return [];

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
    return (
      <div
        aria-label="Carregando atendimentos"
        aria-live="polite"
        className="min-h-screen flex items-center justify-center bg-default-50/50"
        role="status"
      >
        <div className="text-center space-y-6">
          {/* Spinner do HeroUI com tamanho personalizado e cor primária */}
          <div className="flex justify-center">
            <Spinner
              aria-label="Carregando"
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
            <p
              className="text-default-500 text-medium"
              id="loading-description"
            >
              Aguarde...
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Calcular estatísticas para aria-label
  const totalAtendimentos = AtendimentosOrdenados.length;
  const totalPreferenciais = senhasPreferenciais.length;
  const totalComPrefixo = senhasComPrefixo.length;
  const totalNormais = senhasNormais.length;
  const totalOutrasSalas = atendimentoOutrasSalas.length;

  const ariaLabelMain = `Sistema de atendimento médico - ${totalAtendimentos} pacientes aguardando: ${totalPreferenciais} preferenciais, ${totalComPrefixo} com prioridade, ${totalNormais} normais. ${totalOutrasSalas} em atendimento em outras salas.`;

  return (
    <main aria-label={ariaLabelMain} className="min-h-screen" role="main">
      {/* Anúncio de atualizações para leitores de tela */}
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
      />
    </main>
  );
};

export default AtendimentoContent;
