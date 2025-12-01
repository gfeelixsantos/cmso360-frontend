"use client";
import { useRouter } from "next/navigation";
import { io, Socket } from "socket.io-client";
import React, { useState, useEffect, useCallback } from "react";
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

import { IUserInfo, IUserWebsocket } from "@/lib/user/interfaces/IUser";
import {
  CustomEventMap,
  emitEvent,
  EventType,
  onEvent,
} from "@/lib/websocket/events/events";
import {
  PreparationRequestTypes,
  WebsocketType,
} from "@/lib/websocket/enums/websocket.enum";
import { useEntityManager } from "@/hooks/useEntityManager";
import { getCurrentUser, logout } from "@/lib/utils";
import EmptyState from "@/components/recepcao/main/EmptyState";
import { SidebarRecepcao } from "@/components/recepcao/Sidebar";
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
  EXAMES_LIST,
  NEST_SOC_COMPANIES,
  NEST_TICKET_QUERY,
  NEST_URL,
} from "@/config/constants";
import {
  AtendimentoStatus,
  ExamStatus,
  MongoOperationTypes,
} from "@/lib/scheduling/enum/scheduling.enum";
import SenhasEstatisticas, {
  StatsModal,
} from "@/components/recepcao/main/SenhasEstatisticas";
import AtendimentoContent from "@/components/atendimento/AtendimentoContent";
import AtendimentoModalExames from "@/components/atendimento/AtendimentoModalExames";
import CmsoLoading from "@/components/shared/CmsoLoading";

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_NOTIFICATION_PUBLICKEY!;

// ============================================================
// FUNÇÃO AUXILIAR: DEDUPLICAÇÃO DE AGENDAMENTOS
// ============================================================
const deduplicateSchedulings = (schedulings: Scheduling[]): Scheduling[] => {
  const uniqueMap = new Map<string, Scheduling>();

  schedulings.forEach((scheduling) => {
    // Usa _id como chave primária, se não existir usa SCHEDULINGCODE
    const key = scheduling._id || scheduling.SCHEDULINGCODE;

    if (key && !uniqueMap.has(key)) {
      uniqueMap.set(key, scheduling);
    }
  });

  const deduplicated = Array.from(uniqueMap.values());

  // Log de duplicatas removidas (apenas em desenvolvimento)
  if (
    schedulings.length !== deduplicated.length &&
    process.env.NODE_ENV === "development"
  ) {
    console.warn(
      `⚠️ Removidas ${schedulings.length - deduplicated.length} duplicatas de agendamentos`,
    );
  }

  return deduplicated;
};

const AtendimentoPage: React.FC = () => {
  const [user, setUser] = useState<IUserInfo | null>(null);
  const [conectado, setConectado] = useState(false);
  const [socketState, setSocketState] = useState<Socket | null>(null);
  const [unidadeSelecionada, setUnidadeSelecionada] = useState("");
  const [statusSelecionado, setStatusSelecionado] = useState("");
  const [salaSelecionada, setSalaSelecionada] = useState("");
  const [exameSelecionado, setExameSelecionado] = useState("");
  const [codigosDeAtendimento, setCodigosDeAtendimento] = useState<Set<string>>(
    new Set(),
  );
  const [agendamentos, setAgendamentos] = useState<Scheduling[]>([]);
  const [agendamentosGeral, setAgendamentosGeral] = useState<Scheduling[]>([]);
  const [empreparacao, setEmPreparacao] = useState<PreparationRequest[]>([]);
  const [preparacaoFinalizada, setPreparacaoFinalizada] = useState<
    PreparationRequest[]
  >([]);
  const [modalAtendimentoAberto, setModalAtendimentoAberto] = useState(false);
  const [modalAlert, setModalAlert] = useState<boolean>(false);
  const [modalText, setModalText] = useState<React.ReactNode>("");
  const [isStatsModalOpen, setIsStatsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [ticketSelecionado, setTicketSelecionado] = useState<Ticket | null>(
    null,
  );
  const [funcionarioSelecionado, setFuncionarioSelecionado] =
    useState<Scheduling | null>(null);
  const [socCompanies, setSocCompanies] = useState<CadastroEmpresa[]>([]);
  const router = useRouter();
  const {
    entities: tickets,
    setAll,
    addOrUpdate,
    getAll,
    clear,
    executarAcao,
  } = useEntityManager<Ticket>([]);
  const [estatisticas, setEstatisticas] = useState({
    recepcaoAguardando: 0,
    examesAguardando: 0,
    emAtendimento: 0,
    preparacao: 0,
    raiox: 0,
    finalizados: 0,
    total: 0,
  });

  useEffect(() => {
    const currentUser = getCurrentUser();

    if (!currentUser) {
      router.push("/");
    } else {
      setUser(currentUser);
    }
  }, [router]);

  // ---------------------------------------------------------
  // Configura informações do exame a ser atendido
  // ----------------------------------------------------------
  const handleExameSelecionado = (exame: string) => {
    const setList = new Set(EXAMES_LIST[exame].map((e) => e.codigos).flat());

    setCodigosDeAtendimento(setList);
    setExameSelecionado(exame);
  };

  // ---------------------------------------------------------
  // Carrega tickets e solicitações de preparo ao conectar
  // ----------------------------------------------------------
  type initialTicketsRequest = {
    tickets: Ticket[];
    preparationRequests: PreparationRequest[];
  };
  const loadInitialTickets = async () => {
    try {
      const encodedUnidade = encodeURIComponent(unidadeSelecionada);
      const url = `${NEST_TICKET_QUERY}${encodedUnidade}`;
      const response = await fetch(url);

      if (!response.ok) {
        return console.info(
          `Não há tickets para a unidade ${unidadeSelecionada}`,
        );
      }
      const data: initialTicketsRequest = await response.json();

      if (Array.isArray(data.tickets)) setAll(data.tickets);
      if (Array.isArray(data.preparationRequests))
        setEmPreparacao(data.preparationRequests);
    } catch (error) {
      console.error("Erro ao carregar tickets:", error);
    }
  };

  // ---------------------------------------------------------
  // Carrega empresas do SOC
  // ----------------------------------------------------------
  const loadSocCompanies = useCallback(async () => {
    try {
      const response = await fetch(NEST_SOC_COMPANIES);

      if (!response.ok) {
        console.error("Não foi possível carregar as empresas SOC");

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
  }, [conectado]);

  // ---------------------------------------------------------
  // Recalcula agendamentos filtrados quando mudam dependências
  // ---------------------------------------------------------
  useEffect(() => {
    if (!codigosDeAtendimento || codigosDeAtendimento.size === 0) {
      setAgendamentos([]);

      return;
    }
    if (!agendamentosGeral || agendamentosGeral.length === 0) {
      setAgendamentos([]);

      return;
    }

    const emAtendimento = agendamentosGeral.filter(
      (a) => a.ATENDIMENTOSTATUS === AtendimentoStatus.EM_ATENDIMENTO,
    );

    const meusAtendimentos = emAtendimento.filter(
      (atend) =>
        Array.isArray(atend.EXAMES) &&
        atend.EXAMES.some(
          (exame) =>
            codigosDeAtendimento.has(exame.codigoExame) &&
            exame.status === ExamStatus.PENDENTE,
        ),
    );

    setAgendamentos(meusAtendimentos);
  }, [agendamentosGeral, codigosDeAtendimento, exameSelecionado]);

  // ---------------------------------------------------------
  // Faz a inscrição para recebimento de notificação web-push
  // ----------------------------------------------------------
  const subscribeNotification = async () => {
    // Seu código de notificação aqui
  };

  // ---------------------------------------------------------
  // Conexão com socket, reconexão e eventos
  // ----------------------------------------------------------
  const handleConectar = () => {
    if (conectado && socketState) {
      socketState.disconnect();
      setConectado(false);
      addToast({
        title: "Desconectado",
        description: "Você se desconectou do servidor.",
        severity: "warning",
        color: "foreground",
        variant: "flat",
      });
    } else {
      if (!unidadeSelecionada || !salaSelecionada || !exameSelecionado) {
        setModalText(
          <p>
            Selecione uma <strong>UNIDADE</strong>, <strong>SALA</strong> e{" "}
            <strong>EXAME</strong> antes de conectar.
          </p>,
        );
        setModalAlert(true);

        return;
      }
      setIsLoading(true);
      setConectado(true);
    }
  };

  useEffect(() => {
    if (
      !conectado ||
      !unidadeSelecionada ||
      !salaSelecionada ||
      !exameSelecionado
    )
      return;

    const conectionType = WebsocketType.USER_ATENDIMENTO;

    const user: IUserWebsocket = {
      nome: getCurrentUser()?.nome!,
      sala: salaSelecionada,
      type: conectionType,
      unidade: unidadeSelecionada,
    };

    const s: Socket<CustomEventMap> = io(NEST_URL, {
      auth: user,
      transports: ["websocket"],
      reconnection: true,
      reconnectionAttempts: Infinity, // reconecta sempre
      reconnectionDelay: 2000,
      reconnectionDelayMax: 10000,
      timeout: 15000,
    });

    setSocketState(s);

    // ---------------------------------------------------------
    // HANDLERS DE EVENTOS (CORRIGIDOS)
    // ---------------------------------------------------------
    const handleAtendimentos = (schedules?: Scheduling[]) => {
      if (schedules) {
        setAgendamentosGeral((prev) => {
          const merged = [...prev];

          schedules.forEach((schedule) => {
            const exists = merged.some((a) => a._id === schedule._id);

            if (!exists) merged.push(schedule);
          });

          return deduplicateSchedulings(merged);
        });
      }
    };

    const handleTicketEmited = (ticket: Ticket) => addOrUpdate(ticket);

// AtendimentoPage.tsx

const handleTicketUpdated = (ticket: Ticket) => {
  console.log(`🎫 Ticket ${ticket.id} atualizado: Status = ${ticket.status}`);

  // ✅ 1. Atualiza no gerenciador de tickets
  addOrUpdate(ticket);

  // ✅ 2. Atualiza em agendamentosGeral
  setAgendamentosGeral((prev) =>
    prev.map((agendamento) =>
      agendamento.TICKET?.id === ticket.id
        ? { ...agendamento, TICKET: ticket }
        : agendamento,
    ),
  );

  // ✅ 3. Atualiza em agendamentos (filtrado)
  setAgendamentos((prev) =>
    prev.map((agendamento) =>
      agendamento.TICKET?.id === ticket.id
        ? { ...agendamento, TICKET: ticket }
        : agendamento,
    ),
  );
};

    const handleTicketError = (message: string) =>
      console.error(JSON.parse(message));

    // HANDLER PRINCIPAL - PREVINE DUPLICAÇÃO
// AtendimentoPage.tsx

// AtendimentoPage.tsx

const handleUpdateSchedule = ({ operation, schedule }: SchedulingChange) => {
  console.log(
    `📥 [${operation}] ${schedule.NOME} | ` +
    `Ticket: ${schedule.TICKET?.status} | ` +
    `Data: ${schedule.DATAAGENDAMENTO} | ` +
    `_id: ${schedule._id}`
  );

  switch (operation) {
    case MongoOperationTypes.INSERT:
    case MongoOperationTypes.UPDATE:
      setAgendamentosGeral((prev) => {
        // Procura índice existente
        const index = prev.findIndex(
          (ag) =>
            ag._id === schedule._id ||
            ag.SCHEDULINGCODE === schedule.SCHEDULINGCODE,
        );

        let updated: Scheduling[];

        if (index !== -1) {
          // ✅ ATUALIZA existente (merge profundo para preservar dados)
          updated = [...prev];
          updated[index] = {
            ...updated[index], // Preserva campos antigos
            ...schedule,        // Sobrescreve com novos dados
            EXAMES: schedule.EXAMES || updated[index].EXAMES, // ✅ Garante EXAMES
            TICKET: schedule.TICKET || updated[index].TICKET, // ✅ Garante TICKET
          };
          console.log(`🔄 [UPDATE] ${schedule.NOME} atualizado no índice ${index}`);
        } else {
          // ✅ ADICIONA novo
          updated = [...prev, schedule];
          console.log(`➕ [INSERT] ${schedule.NOME} adicionado (total: ${updated.length})`);
        }

        // Remove duplicatas e ordena
        const deduplicated = deduplicateSchedulings(updated);
        console.log(
          `✅ agendamentosGeral atualizado: ${prev.length} → ${deduplicated.length}`
        );
        
        return deduplicated.sort((a, b) =>
          a.NOME.localeCompare(b.NOME, 'pt-BR', { sensitivity: 'base' }),
        );
      });
      break;

    case MongoOperationTypes.DELETE:
      setAgendamentosGeral((prev) => {
        const filtered = prev.filter(
          (ag) => ag.SCHEDULINGCODE !== schedule.SCHEDULINGCODE
        );
        console.log(
          `🗑️ [DELETE] ${schedule.NOME} removido (${prev.length} → ${filtered.length})`
        );
        return filtered;
      });
      break;
  }
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
            s,
          );
          setEmPreparacao((prev) =>
            prev.filter((req) => req.ticketId !== request.request.ticketId),
          );
          setPreparacaoFinalizada((prev) => [...prev, request.request]);
          break;
      }
    };

    // Registra eventos
    onEvent(s, EventType.CONNECTION_REQUEST, handleAtendimentos);
    onEvent(s, EventType.TICKET_EMITED, handleTicketEmited);
    onEvent(s, EventType.TICKET_UPDATED, handleTicketUpdated);
    onEvent(s, EventType.TICKET_ERROR, handleTicketError);
    onEvent(s, EventType.UPDATE_SCHEDULE, handleUpdateSchedule);
    onEvent(s, EventType.PREPARATION_REQUEST, handlePreparationRequest);

    // ---------------------------------------------------------
    // CONEXÃO E CARREGAMENTO INICIAL
    // ---------------------------------------------------------
    s.on("connect", async () => {
      try {
        console.log("Conectado ao WebSocket:", s.id);
        await Promise.all([loadSocCompanies(), loadInitialTickets()]);

        emitEvent(s, EventType.TICKET_INFO, unidadeSelecionada);
        if (salaSelecionada.includes("PREPARO")) subscribeNotification();
      } catch (error) {
        console.warn("Erro ao carregar dados iniciais:", error);
      } finally {
        setIsLoading(false);
      }
    });

    s.on("disconnect", (reason) => {
      setConectado(false);
      setAgendamentos([]);
      setAgendamentosGeral([]); // Limpa também o estado geral
      setModalAtendimentoAberto(false);
      if (reason !== "io client disconnect") {
        addToast({
          title: "Conexão perdida",
          severity: "danger",
          color: "foreground",
          variant: "flat",
        });
      }
    });

    s.on("connect_error", (err) => console.error("Erro ao conectar:", err));

    // Cleanup
    return () => {
      s.off("connect");
      s.off("disconnect");
      s.off("connect_error");
      s.off(EventType.TICKET_EMITED, handleTicketEmited);
      s.off(EventType.TICKET_UPDATED, handleTicketUpdated);
      s.off(EventType.TICKET_ERROR, handleTicketError);
      s.off(EventType.UPDATE_SCHEDULE, handleUpdateSchedule);
      s.off(EventType.PREPARATION_REQUEST, handlePreparationRequest);
      s.disconnect();
    };
  }, [conectado, unidadeSelecionada, salaSelecionada, exameSelecionado]);

  const handleModal = () => setModalAtendimentoAberto(!modalAtendimentoAberto);

  const calcularEstatisticas = () => {
    const senhasFiltradas = getAll();

    setEstatisticas({
      recepcaoAguardando:
        senhasFiltradas.filter(
          (s) =>
            s.status === TicketStatus.AGUARDANDO &&
            s.grupo === TicketGroups.RECEPCAO,
        ).length +
        senhasFiltradas.filter((s) => s.status === TicketStatus.PREPARO_OK)
          .length,
      examesAguardando: senhasFiltradas.filter(
        (s) =>
          s.status === TicketStatus.AGUARDANDO &&
          s.grupo === TicketGroups.EXAME,
      ).length,
      emAtendimento:
        senhasFiltradas.filter((s) => s.status === TicketStatus.EM_ATENDIMENTO)
          .length +
        senhasFiltradas.filter((s) => s.status === TicketStatus.EM_CHAMADA)
          .length,
      preparacao: senhasFiltradas.filter(
        (s) => s.status === TicketStatus.EM_PREPARACAO,
      ).length,
      raiox: senhasFiltradas.filter(
        (s) => s.status === TicketStatus.ENCAMINHADO_RX,
      ).length,
      finalizados: senhasFiltradas.filter(
        (s) => s.status === TicketStatus.FINALIZADO,
      ).length,
      total: senhasFiltradas.length,
    });
  };

  useEffect(() => {
    calcularEstatisticas();
  }, [tickets]);

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
        {conectado && socketState && (
          <SenhasEstatisticas
            agendamentos={agendamentos}
            estatisticasSenhas={estatisticas}
            preparationRequests={empreparacao}
            tickets={tickets}
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
            agendadosFiltrados={agendamentosGeral}
            conectado={conectado}
            exameSelecionado={exameSelecionado}
            handleConectar={handleConectar}
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
          aria-label="Conteúdo principal do atendimento"
          className="flex-1 overflow-y-auto sm:p-6 lg:p-8 bg-gray-50"
        >
          {conectado && socketState && !isLoading ? (
            <AtendimentoContent
              agendamentos={agendamentos}
              codigosDeAtendimento={codigosDeAtendimento}
              conectado={conectado}
              exameSelecionado={exameSelecionado}
              preparacoesFinalizadas={preparacaoFinalizada}
              salaSelecionada={salaSelecionada}
              setFuncionarioSelecionado={setFuncionarioSelecionado}
              setTicketSelecionado={setTicketSelecionado}
              socket={socketState}
              tickets={tickets}
              unidadeSelecionada={unidadeSelecionada}
              onHandleModal={handleModal}
              onPreparationRequests={empreparacao}
            />
          ) : (
            <EmptyState
              description="Conecte-se para visualizar os atendimentos"
              title="Desconectado"
            />
          )}
        </main>
      </div>

      <AtendimentoModalExames
        codigosAtendimento={codigosDeAtendimento}
        exame={exameSelecionado}
        funcionarioSelecionado={funcionarioSelecionado}
        isOpen={modalAtendimentoAberto}
        sala={salaSelecionada}
        socket={socketState!}
        onClose={handleModal}
      />

      <StatsModal
        agendamentos={agendamentos}
        estatisticasSenhas={estatisticas}
        isOpen={isStatsModalOpen}
        preparationRequests={empreparacao}
        tickets={tickets}
        onClose={() => setIsStatsModalOpen(false)}
      />

      <Modal disableAnimation={true} isDismissable={false} isOpen={modalAlert}>
        <ModalContent>
          <ModalHeader>
            <ExclamationCircleIcon className="h-6 w-6" /> Atenção
          </ModalHeader>
          <ModalBody>{modalText}</ModalBody>
          <ModalFooter className="flex justify-end gap-2">
            <Button
              color="primary"
              size="sm"
              variant="ghost"
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

export default AtendimentoPage;
