"use client";
import { useRouter } from "next/navigation";
import { Socket } from "socket.io-client";
import { useSocket } from "@/lib/websocket/hooks/useSocket";
import React, { useState, useEffect, useCallback, useRef } from "react";
import { motion } from "framer-motion";
import {
  addToast,
  Button,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
} from "@heroui/react";
import { ExclamationCircleIcon } from "@heroicons/react/24/outline";

import { IUserInfo } from "@/lib/user/interfaces/IUser";
import { EventType } from "@/lib/websocket/events/events";
import {
  PreparationRequestTypes,
  WebsocketType,
} from "@/lib/websocket/enums/websocket.enum";
import { useEntityManager } from "@/hooks/useEntityManager";
import { getCurrentUser, logout } from "@/lib/utils";
import EmptyState from "@/app/recepcao/components/EmptyState";
import MainContent from "@/app/recepcao/components/MainContent";
import AtendimentoModal from "@/app/recepcao/components/AtendimentoModal";
import { SidebarRecepcao } from "@/components/shared/Sidebar";
import { HeaderApp } from "@/components/shared/HeaderApp";
import { CadastroEmpresa } from "@/lib/soc/interfaces/CadastroEmpresa";
import {
  PreparationRequest,
  PreparationRequestModel,
  Ticket,
  TicketActionType,
  TicketGroups,
  TicketStatus,
} from "@/lib/ticket/ticket";
import { IndexDb } from "@/lib/indexDb/indexdb";
import {
  Scheduling,
  SchedulingChange,
} from "@/lib/scheduling/interface/scheduling";
import {
  NEST_SOC_COMPANIES,
  NEST_TICKET_QUERY,
} from "@/config/constants";
import { MongoOperationTypes } from "@/lib/scheduling/enum/scheduling.enum";
import { PreparationGrid } from "@/app/recepcao/components/PreparationGrid";
import SenhasEstatisticas, {
  StatsModal,
} from "@/app/recepcao/components/SenhasEstatisticas";
import { useStatistics } from "@/hooks/useStatictics";
import CmsoLoading from "@/components/shared/CmsoLoading";
import CmsoCircularLoading from "@/components/shared/CmsoCircularLoading";
import { usePushNotification } from "@/hooks/usePushNotification";

// Componente principal
const RecepcaoPage: React.FC = () => {
  const [user, setUser] = useState<IUserInfo | null>(null);
  const [conectado, setConectado] = useState(false);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();
  const {
    socket,
    connected,
    isReconnecting,
    connect,
    disconnect,
    registerHandlers,
  } = useSocket();

  // Estados de filtro/seleção
  const [unidadeSelecionada, setUnidadeSelecionada] = useState("");
  const [statusSelecionado, setStatusSelecionado] = useState("");
  const [salaSelecionada, setSalaSelecionada] = useState("");
  const [exameSelecionado, setExameSelecionado] = useState("");

  // Dados
  const [agendamentos, setAgendamentos] = useState<Scheduling[]>([]);
  const [empreparacao, setEmPreparacao] = useState<PreparationRequest[]>([]);
  const [preparacaoFinalizada, setPreparacaoFinalizada] = useState<
    PreparationRequest[]
  >([]);

  // UI / Modais
  const [modalAtendimentoAberto, setModalAtendimentoAberto] = useState(false);
  const [modalAlert, setModalAlert] = useState<boolean>(false);
  const [modalText, setModalText] = useState<React.ReactNode>("");
  const [isStatsModalOpen, setIsStatsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const [ticketSelecionado, setTicketSelecionado] = useState<Ticket | null>(
    null,
  );
  const [socCompanies, setSocCompanies] = useState<CadastroEmpresa[]>([]);

  const router = useRouter();
  const {
    entities: tickets,
    setAll,
    addOrUpdate,
    getAll,
    executarAcao,
    remove,
  } = useEntityManager<Ticket>([]);

  // Hook para buscar estatísticas da API
  const { data: statisticsData, refetch: refetchStatistics } = useStatistics({
    unidade: unidadeSelecionada,
    autoRefresh: true,
    refreshInterval: 300000, // 5 minutos
  });

  const [estatisticas, setEstatisticas] = useState<Record<string, number>>({
    aguardando: 0,
    preparacao: 0,
    raiox: 0,
    finalizados: 0,
    total: 0,
    pendentes: 0,
    aguardandoRecepcao: 0,
    recepcaoAguardando: 0,
    examesAguardando: 0,
    emAtendimento: 0,
  });

  // ---------------------------------------------------------
  // Verifica usuário logado
  // ---------------------------------------------------------
  useEffect(() => {
    const currentUser = getCurrentUser();

    if (!currentUser) {
      router.push("/");
    } else {
      setUser(currentUser);
    }
  }, [router]);

  const handleExameSelecionado = () => {};

  // ---------------------------------------------------------
  // Carrega tickets
  // ---------------------------------------------------------
  interface initialTicketsRequest {
    tickets: Ticket[];
    preparationRequests: PreparationRequest[];
  }

  const loadInitialTickets = useCallback(
    async (unidade: string) => {
      if (!unidade) return;

      try {
        const encodedUnidade = encodeURIComponent(unidade);
        const url = `${NEST_TICKET_QUERY}${encodedUnidade}`;
        const response = await fetch(url);

        if (!response.ok) {
          return console.info(`Não há tickets para a unidade ${unidade}`);
        }
        const data: initialTicketsRequest = await response.json();

        if (Array.isArray(data.tickets)) setAll(data.tickets);
        if (Array.isArray(data.preparationRequests))
          setEmPreparacao(data.preparationRequests);
      } catch (error) {
        console.error("Erro ao carregar tickets:", error);
      }
    },
    [setAll],
  );

  // ---------------------------------------------------------
  // Carrega empresas do SOC
  // ---------------------------------------------------------
  const loadSocCompanies = useCallback(async () => {
    try {
      const response = await fetch(NEST_SOC_COMPANIES);

      if (!response.ok) {
        console.warn(
          "Não foi possível carregar as empresas SOC",
          await response.text(),
        );

        return await IndexDb.getCompanies();
      }

      const data: CadastroEmpresa[] = await response.json();

      if (Array.isArray(data)) {
        await IndexDb.saveCompanies(data);
        setSocCompanies(data);
        console.log("Empresas SOC carregadas da API:", data.length);
      }

      return [];
    } catch (error) {
      console.error("Erro ao carregar empresas SOC:", error);

      return await IndexDb.getCompanies();
    }
  }, []);

  // ---------------------------------------------------------
  // Push Notifications
  // ---------------------------------------------------------
  usePushNotification({
    enabled: conectado && salaSelecionada.includes("PREPARO"),
    unidade: unidadeSelecionada,
    contexto: { sala: salaSelecionada, tipo: "recepcao" },
  });

  // ---------------------------------------------------------
  // Reconexão automática ao mudar contexto (unidade/sala)
  // ---------------------------------------------------------
  useEffect(() => {
    if (!unidadeSelecionada || !salaSelecionada || !conectado) return;

    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }

    reconnectTimeoutRef.current = setTimeout(() => {
      disconnect();
      setConectado(false);

      setTimeout(() => {
        setConectado(true);

        const conectionType = salaSelecionada.includes("PREPARO")
          ? WebsocketType.USER_PREPARO
          : WebsocketType.USER_RECEPCAO;

        connect({
          nome: user?.nome!,
          sala: salaSelecionada,
          type: conectionType,
          unidade: unidadeSelecionada,
        });
      }, 300);
    }, 500);

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [unidadeSelecionada, salaSelecionada]);

  // ---------------------------------------------------------
  // Carregamento de Dados (independente do socket)
  // ---------------------------------------------------------
  useEffect(() => {
    if (conectado && unidadeSelecionada) {
      setIsLoading(true);

      Promise.all([
        loadInitialTickets(unidadeSelecionada),
        loadSocCompanies(),
      ]).finally(() => {
        setIsLoading(false);
      });
    }
  }, [conectado, unidadeSelecionada, salaSelecionada]);

  // ---------------------------------------------------------
  // Gerenciamento de Socket com Singleton
  // ---------------------------------------------------------
  const handleConectar = () => {
    if (connected) {
      disconnect();
      setConectado(false);
      addToast({
        title: "Desconectado",
        description: "Você se desconectou do servidor.",
        severity: "warning",
        color: "foreground",
        variant: "flat",
      });

      return;
    }

    if (!unidadeSelecionada || !salaSelecionada) {
      setModalText(
        <p>
          Selecione uma <strong>UNIDADE</strong> e uma <strong>SALA</strong>{" "}
          antes de conectar.
        </p>,
      );
      setModalAlert(true);

      return;
    }

    setConectado(true);

    const conectionType = salaSelecionada.includes("PREPARO")
      ? WebsocketType.USER_PREPARO
      : WebsocketType.USER_RECEPCAO;

    connect({
      nome: user?.nome!,
      sala: salaSelecionada,
      type: conectionType,
      unidade: unidadeSelecionada,
    });
  };

  // Referência do socket para uso em callbacks (evita stale closure)
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    socketRef.current = socket;
  }, [socket]);

  // Registro de handlers de eventos do socket
  useEffect(() => {
    if (!socket) return;

    const handleAtendimentos = (schedules?: Scheduling[]) => {
      if (schedules && Array.isArray(schedules)) {
        setAgendamentos(
          schedules.sort((a, b) =>
            a.NOME.localeCompare(b.NOME, "pt-BR", { sensitivity: "base" }),
          ),
        );
      }
    };

    const handleTicketEmitedOrUpdated = (ticket: Ticket) => {
      addOrUpdate(ticket);
    };

    const handleTicketError = (message: string) => {
      console.error("❌ Ticket error:", JSON.parse(message));
    };

    const handleDeleteTicket = (id: number) => {
      remove(id);
      addToast({
        title: "Ticket Removido",
        severity: "success",
        color: "foreground",
        size: "sm",
      });
    };

    const handleUpdateSchedule = ({
      operation,
      schedule,
    }: SchedulingChange) => {
      setAgendamentos((prev) => {
        let newList = [...prev];

        switch (operation) {
          case MongoOperationTypes.INSERT:
            if (
              prev.some((ag) => ag.SCHEDULINGCODE === schedule.SCHEDULINGCODE)
            ) {
              return prev;
            }
            newList.push(schedule);
            break;

          case MongoOperationTypes.UPDATE:
            newList = newList.map((ag) =>
              ag.SCHEDULINGCODE === schedule.SCHEDULINGCODE ? schedule : ag,
            );
            break;

          case MongoOperationTypes.DELETE:
            newList = newList.filter(
              (ag) => ag.SCHEDULINGCODE !== schedule.SCHEDULINGCODE,
            );
            break;
        }

        return newList.sort((a, b) =>
          a.NOME.localeCompare(b.NOME, "pt-BR", { sensitivity: "base" }),
        );
      });
    };

    const handlePreparationRequest = (request: PreparationRequestModel) => {
      switch (request.type) {
        case PreparationRequestTypes.SUCCESS:
          addOrUpdate(request.request.tickets!);
          setEmPreparacao((prev) => [...prev, request.request]);
          break;

        case PreparationRequestTypes.FINISHED:
          executarAcao(
            request.request.ticketId!,
            TicketActionType.PREPARO_OK,
            unidadeSelecionada,
            socketRef.current!,
          );
          setEmPreparacao((prev) =>
            prev.filter((req) => req.ticketId !== request.request.ticketId),
          );
          setPreparacaoFinalizada((prev) => [...prev, request.request]);

          addToast({
            title: "ASO Finalizado",
            description: <span>{request.request.nome}</span>,
            severity: "success",
            color: "foreground",
            size: "sm",
          });
          break;
      }
    };

    const unregister = registerHandlers({
      [EventType.CONNECTION_REQUEST]: handleAtendimentos,
      [EventType.TICKET_EMITED]: handleTicketEmitedOrUpdated,
      [EventType.TICKET_UPDATED]: handleTicketEmitedOrUpdated,
      [EventType.TICKET_ERROR]: handleTicketError,
      [EventType.TICKET_DELETE]: handleDeleteTicket,
      [EventType.UPDATE_SCHEDULE]: handleUpdateSchedule,
      [EventType.PREPARATION_REQUEST]: handlePreparationRequest,
    } as any);

    return () => {
      unregister();
    };
  }, [socket, unidadeSelecionada, salaSelecionada]);

  const handleModal = useCallback(() => {
    setModalAtendimentoAberto((prev) => !prev);
  }, []);

  const calcularEstatisticas = useCallback(() => {
    // Sempre usa os tickets locais (do Supabase) para as estatísticas da recepção
    const senhasFiltradas = getAll();

    const recepcao = senhasFiltradas.filter(
      (s) => s.grupo === TicketGroups.RECEPCAO,
    );

    const aguardando = recepcao.filter(
      (s) =>
        s.status !== TicketStatus.EM_PREPARACAO &&
        s.status !== TicketStatus.ENCAMINHADO_RX &&
        s.status !== TicketStatus.EM_ATENDIMENTO &&
        s.status !== TicketStatus.FINALIZADO,
    ).length;

    const preparacao = recepcao.filter(
      (s) => s.status === TicketStatus.EM_PREPARACAO,
    ).length;

    const raiox = recepcao.filter(
      (s) => s.status === TicketStatus.ENCAMINHADO_RX,
    ).length;

    const finalizados = senhasFiltradas.filter(
      (s) => s.grupo === TicketGroups.EXAME,
    ).length;

    const total = recepcao.length;

    setEstatisticas({
      aguardando,
      preparacao,
      raiox,
      finalizados,
      total,
      pendentes: 0,
      aguardandoRecepcao: 0,
      recepcaoAguardando: aguardando,
      examesAguardando: 0,
      emAtendimento: 0,
    });
  }, [getAll]);

  useEffect(() => {
    calcularEstatisticas();
  }, [tickets, empreparacao, calcularEstatisticas]);

  if (!user) {
    return <CmsoLoading />;
  }

  return (
    <div className="min-h-screen flex flex-col">
      <HeaderApp
        onLogout={() => {
          logout();
          router.push("/");
        }}
      >
        {conectado && (
          <SenhasEstatisticas
            context="recepcao"
            estatisticasSenhas={estatisticas}
            onSetStatsModalOpen={setIsStatsModalOpen}
          />
        )}
      </HeaderApp>

      <div className="flex flex-1 overflow-hidden">
        <motion.aside
          animate={{ x: 0, opacity: 1 }}
          className="w-60 bg-red shadow-sm"
          initial={{ x: -80, opacity: 0 }}
          transition={{ duration: 0.5, ease: "easeOut", delay: 0.1 }}
        >
          <SidebarRecepcao
            agendadosFiltrados={agendamentos}
            conectado={conectado}
            exameSelecionado={exameSelecionado}
            handleConectar={handleConectar}
            isReconnecting={isReconnecting}
            salaSelecionada={salaSelecionada}
            setSalaSelecionada={setSalaSelecionada}
            setStatusSelecionado={setStatusSelecionado}
            setTicketSelecionado={setTicketSelecionado}
            setUnidadeSelecionada={setUnidadeSelecionada}
            statusSelecionado={statusSelecionado}
            unidadeSelecionada={unidadeSelecionada}
            onHandleExameSelecionado={handleExameSelecionado}
            onHandleModal={handleModal}
            onLoading={isLoading}
          />
        </motion.aside>

        <main
          aria-label="Conteúdo principal da recepção"
          className="flex-1 overflow-y-auto p-6 sm:p-8 lg:p-10 bg-gray-50"
        >
          {conectado && socket ? (
            isLoading ? (
              <CmsoCircularLoading
                title="Conectando..."
                description="Estabelecendo conexão com o servidor"
              />
            ) : salaSelecionada.includes("PREPARO") ? (
              <PreparationGrid requests={empreparacao} socket={socket} />
            ) : (
              <MainContent
                agendamentos={agendamentos}
                conectado={conectado}
                preparacoesFinalizadas={preparacaoFinalizada}
                salaSelecionada={salaSelecionada}
                setTicketSelecionado={setTicketSelecionado}
                socket={socket}
                tickets={tickets.filter(
                  (t) => t.grupo === TicketGroups.RECEPCAO,
                )}
                unidadeSelecionada={unidadeSelecionada}
                onHandleModal={handleModal}
                onPreparationRequests={empreparacao}
              />
            )
          ) : (
            <EmptyState
              description="Conecte-se para visualizar os atendimentos"
              title="Desconectado"
            />
          )}
        </main>
      </div>

      <AtendimentoModal
        agendamentos={agendamentos}
        isOpen={modalAtendimentoAberto}
        salaSelecionada={salaSelecionada}
        socCompanies={socCompanies}
        socket={socket}
        ticketSelecionado={ticketSelecionado}
        unidadeSelecionada={unidadeSelecionada}
        user={user}
        onClose={handleModal}
        onExecutarAcao={executarAcao}
        onSetPreparacaoFinalizada={setPreparacaoFinalizada}
      />

      {/* Modal de Estatísticas */}
      <StatsModal
        agendamentos={agendamentos}
        estatisticasSenhas={estatisticas}
        isOpen={isStatsModalOpen}
        preparationRequests={empreparacao}
        tickets={tickets}
        onClose={() => setIsStatsModalOpen(false)}
      />

      {/* Modal de confirmação do HeroUI */}
      <Modal disableAnimation={true} isDismissable={false} isOpen={modalAlert}>
        <ModalContent className="border border-[#104e35]/20">
          <ModalHeader className="text-[#104e35]">
            <ExclamationCircleIcon className="h-6 w-6 text-[#104e35]" />
            Atenção
          </ModalHeader>
          <ModalBody>{modalText}</ModalBody>
          <ModalFooter className="flex justify-end gap-2">
            <Button
              className="bg-gradient-to-r from-[#104e35] to-[#0d3d29] text-white focus-visible:ring-2 focus-visible:ring-[#104e35]/40"
              size="sm"
              onPress={() => setModalAlert(false)}
            >
              Confirmar
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
};

export default RecepcaoPage;
