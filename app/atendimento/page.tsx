"use client";
import { useRouter } from "next/navigation";
import { io, Socket } from "socket.io-client";
import React, { useState, useEffect, useRef, useCallback } from "react";
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

// =================================================================================
// Socket singleton & helpers
// - garante apenas 1 conexão ativa por cliente
// - registra handlers de forma idempotente
// - expõe connect/disconnect limpos
// =================================================================================

let SINGLETON_SOCKET: Socket | null = null;
let registeredOnce = false;

type ConnectOptions = {
  auth: IUserWebsocket;
  onConnect?: (socket: Socket) => void;
  onDisconnect?: (reason: string) => void;
  onConnectError?: (err: any) => void;
};

export function createSocketIfNeeded(opts: ConnectOptions): Socket {
  if (SINGLETON_SOCKET) return SINGLETON_SOCKET;

  const { auth, onConnect, onDisconnect, onConnectError } = opts;

  const s = io(NEST_URL, {
    auth,
    transports: ["websocket"],
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 2000,
    reconnectionDelayMax: 10000,
    timeout: 20000,
    // Not setting pingInterval (server controls it). Keep default client behavior.
  });

  SINGLETON_SOCKET = s;

  if (!registeredOnce) {
    s.on("connect", () => onConnect?.(s));

    s.on("disconnect", (reason: string) => {
      onDisconnect?.(reason);
    });

    s.on("connect_error", (err: any) => onConnectError?.(err));

    registeredOnce = true;
  }

  return s;
}

export function closeSocket() {
  if (SINGLETON_SOCKET) {
    try {
      SINGLETON_SOCKET.removeAllListeners();
      SINGLETON_SOCKET.disconnect();
    } catch (err) {
      // ignore
    }
  }
  SINGLETON_SOCKET = null;
  registeredOnce = false;
}

// Helper para registrar handlers de eventos (idempotente): retorna função para desregistrar
function registerHandlers(s: Socket, handlers: { [K in keyof CustomEventMap]?: (...args: any[]) => void }) {
  Object.entries(handlers).forEach(([event, fn]) => {
    if (!fn) return;
    // evita múltiplas inscrições iguais usando off antes
    s.off(event as any, fn as any);
    s.on(event as any, fn as any);
  });

  return () => {
    Object.entries(handlers).forEach(([event, fn]) => {
      if (!fn) return;
      try {
        s.off(event as any, fn as any);
      } catch (err) {
        // noop
      }
    });
  };
}

// =================================================================================
// DEDUPLICADOR (mantive sua implementação)
// =================================================================================
const deduplicateSchedulings = (schedulings: Scheduling[]): Scheduling[] => {
  const uniqueMap = new Map<string, Scheduling>();

  schedulings.forEach((scheduling) => {
    const key = scheduling._id || scheduling.SCHEDULINGCODE;

    if (key && !uniqueMap.has(key)) {
      uniqueMap.set(key, scheduling);
    }
  });

  const deduplicated = Array.from(uniqueMap.values());

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

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_NOTIFICATION_PUBLICKEY!;

const AtendimentoPage: React.FC = () => {
  const [user, setUser] = useState<IUserInfo | null>(null);
  const [conectado, setConectado] = useState(false);
  const socketRef = useRef<Socket | null>(null);
  const [unidadeSelecionada, setUnidadeSelecionada] = useState("");
  const [statusSelecionado, setStatusSelecionado] = useState("");
  const [salaSelecionada, setSalaSelecionada] = useState("");
  const [exameSelecionado, setExameSelecionado] = useState("");
  const [codigosDeAtendimento, setCodigosDeAtendimento] = useState<Set<string>>(new Set());
  const [agendamentos, setAgendamentos] = useState<Scheduling[]>([]);
  const [agendamentosGeral, setAgendamentosGeral] = useState<Scheduling[]>([]);
  const [empreparacao, setEmPreparacao] = useState<PreparationRequest[]>([]);
  const [preparacaoFinalizada, setPreparacaoFinalizada] = useState<PreparationRequest[]>([]);
  const [modalAtendimentoAberto, setModalAtendimentoAberto] = useState(false);
  const [modalAlert, setModalAlert] = useState<boolean>(false);
  const [modalText, setModalText] = useState<React.ReactNode>("");
  const [isStatsModalOpen, setIsStatsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [ticketSelecionado, setTicketSelecionado] = useState<Ticket | null>(null);
  const [funcionarioSelecionado, setFuncionarioSelecionado] = useState<Scheduling | null>(null);
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
  // Carrega tickets e solicitações de preparo ao conectar
  // ---------------------------------------------------------
  type initialTicketsRequest = {
    tickets: Ticket[];
    preparationRequests: PreparationRequest[];
  };
  const loadInitialTickets = async () => {
    try {
      if (!unidadeSelecionada) return;
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
  // ---------------------------------------------------------
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
  }, []);

  // ---------------------------------------------------------
  // Filtragem de atendimentos
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
  // Reconexão automática ao mudar unidade/sala/exame
  // ---------------------------------------------------------
  useEffect(() => {
    if (!unidadeSelecionada || !salaSelecionada || !exameSelecionado) return;

    // Se já estava conectado, força reconexão automática
    if (conectado) {
      console.log("♻️ Mudança de contexto detectada → Recriando conexão WebSocket...");
      closeSocket();
      setConectado(false);
      setTimeout(() => setConectado(true), 300);
    }
  }, [unidadeSelecionada, salaSelecionada, exameSelecionado]);

  // ---------------------------------------------------------
  // Conexão com socket: conectar/desconectar controlado
  // ---------------------------------------------------------
  const handleConectar = () => {
    if (conectado) {
      // desconecta explicitamente
      closeSocket();
      socketRef.current = null;
      setConectado(false);
      clear();
      setAgendamentos([]);
      setAgendamentosGeral([]);
      addToast({
        title: "Desconectado",
        description: "Você se desconectou do servidor.",
        severity: "warning",
        color: "foreground",
        variant: "flat",
      });
      return;
    }

    if (!unidadeSelecionada || !salaSelecionada || !exameSelecionado) {
      setModalText(
        <p>
          Selecione uma <strong>UNIDADE</strong>, <strong>SALA</strong> e{' '}
          <strong>EXAME</strong> antes de conectar.
        </p>,
      );
      setModalAlert(true);
      return;
    }

    setIsLoading(true);
    setConectado(true);
  };

  // Este effect só observa a flag `conectado` e efetua a conexão uma vez.
  useEffect(() => {
    if (!conectado) return;

    const conectionType = WebsocketType.USER_ATENDIMENTO;

    const auth: IUserWebsocket = {
      nome: getCurrentUser()?.nome!,
      sala: salaSelecionada,
      type: conectionType,
      unidade: unidadeSelecionada,
    };

    // cria ou pega o singleton
    const s = createSocketIfNeeded({
      auth,
      onConnect: async (socket) => {
        console.log("Conectado ao WebSocket:", socket.id);
        socketRef.current = socket;

        try {
          await Promise.all([loadSocCompanies(), loadInitialTickets()]);
          emitEvent(socket, EventType.TICKET_INFO, unidadeSelecionada);
          if (salaSelecionada.includes("PREPARO")) subscribeNotification();
        } catch (err) {
          console.warn("Erro ao carregar dados iniciais:", err);
        } finally {
          setIsLoading(false);
        }
      },
      onDisconnect: (reason) => {
        console.log("Socket desconectado reason=", reason);
        // Se o fechamento foi solicitado pelo cliente (closeSocket), não mostrar alerta
        if (reason !== "io client disconnect") {
          addToast({
            title: "Conexão perdida",
            severity: "danger",
            color: "foreground",
            variant: "flat",
          });
        }
        setConectado(false);
        setIsLoading(false);
      },
      onConnectError: (err) => {
        console.error("Erro ao conectar:", err);
        setIsLoading(false);
      },
    });

    // registra handlers específicos de evento (idempotente)
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

    const handleTicketUpdated = (ticket: Ticket) => {
      addOrUpdate(ticket);

      setAgendamentosGeral((prev) =>
        prev.map((agendamento) =>
          agendamento.TICKET?.id === ticket.id
            ? { ...agendamento, TICKET: ticket }
            : agendamento,
        ),
      );

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

    const handleUpdateSchedule = ({ operation, schedule }: SchedulingChange) => {
      switch (operation) {
        case MongoOperationTypes.INSERT:
        case MongoOperationTypes.UPDATE:
          setAgendamentosGeral((prev) => {
            const index = prev.findIndex(
              (ag) => ag._id === schedule._id || ag.SCHEDULINGCODE === schedule.SCHEDULINGCODE,
            );

            let updated: Scheduling[];

            if (index !== -1) {
              updated = [...prev];
              updated[index] = {
                ...updated[index],
                ...schedule,
                EXAMES: schedule.EXAMES || updated[index].EXAMES,
                TICKET: schedule.TICKET || updated[index].TICKET,
              };

              const current = prev[index];
              const prevTicket = current?.TICKET;
              const newTicket = schedule?.TICKET;

              const prevDate = prevTicket?.updatedAt ? new Date(prevTicket.updatedAt) : null;
              const newDate = newTicket?.updatedAt ? new Date(newTicket.updatedAt) : null;

              if (prevDate && newDate && newDate < prevDate) {
                console.log(`⚠️ [IGNORADO] Update descartado (mais antigo).`);
                return prev;
              }
            } else {
              updated = [...prev, schedule];
            }

            const deduplicated = deduplicateSchedulings(updated);

            return deduplicated.sort((a, b) =>
              a.NOME.localeCompare(b.NOME, "pt-BR", { sensitivity: "base" }),
            );
          });
          break;
        case MongoOperationTypes.DELETE:
          setAgendamentosGeral((prev) => prev.filter((ag) => ag.SCHEDULINGCODE !== schedule.SCHEDULINGCODE));
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
          setEmPreparacao((prev) => prev.filter((req) => req.ticketId !== request.request.ticketId));
          setPreparacaoFinalizada((prev) => [...prev, request.request]);
          break;
      }
    };

    const unregister = registerHandlers(s, {
      [EventType.CONNECTION_REQUEST]: handleAtendimentos,
      [EventType.TICKET_EMITED]: handleTicketEmited,
      [EventType.TICKET_UPDATED]: handleTicketUpdated,
      [EventType.TICKET_ERROR]: handleTicketError,
      [EventType.UPDATE_SCHEDULE]: handleUpdateSchedule,
      [EventType.PREPARATION_REQUEST]: handlePreparationRequest,
    } as any);

    // cleanup quando a flag conectado mudar para false
    return () => {
      try {
        unregister();
      } catch (err) {
        // noop
      }
      // não desconectar aqui automaticamente; deixamos o usuário disparar desconexão via handleConectar (toggle)
      // se você preferir desconectar automaticamente, chame closeSocket(); socketRef.current = null;
    };
  }, [conectado, unidadeSelecionada, salaSelecionada, exameSelecionado]);

  // ---------------------------------------------------------
  // Estatísticas
  // ---------------------------------------------------------
  const calcularEstatisticas = () => {
    const senhasFiltradas = getAll();

    setEstatisticas({
      recepcaoAguardando:
        senhasFiltradas.filter(
          (s) =>
            s.status === TicketStatus.AGUARDANDO && s.grupo === TicketGroups.RECEPCAO,
        ).length + senhasFiltradas.filter((s) => s.status === TicketStatus.PREPARO_OK).length,
      examesAguardando: senhasFiltradas.filter((s) => s.status === TicketStatus.AGUARDANDO && s.grupo === TicketGroups.EXAME).length,
      emAtendimento: senhasFiltradas.filter((s) => s.status === TicketStatus.EM_ATENDIMENTO).length + senhasFiltradas.filter((s) => s.status === TicketStatus.EM_CHAMADA).length,
      preparacao: senhasFiltradas.filter((s) => s.status === TicketStatus.EM_PREPARACAO).length,
      raiox: senhasFiltradas.filter((s) => s.status === TicketStatus.ENCAMINHADO_RX).length,
      finalizados: senhasFiltradas.filter((s) => s.status === TicketStatus.FINALIZADO).length,
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
        {conectado && socketRef.current && (
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
            onHandleExameSelecionado={(ex) => {
              const setList = new Set(EXAMES_LIST[ex].map((e) => e.codigos).flat());
              setCodigosDeAtendimento(setList);
              setExameSelecionado(ex);
            }}
            onHandleModal={() => setModalAtendimentoAberto(true)}
            onLoading={isLoading}
          />
        </motion.aside>

        <main
          aria-label="Conteúdo principal do atendimento"
          className="flex-1 overflow-y-auto sm:p-6 lg:p-8 bg-gray-50"
        >
          {conectado && socketRef.current && !isLoading ? (
            <AtendimentoContent
              agendamentos={agendamentos}
              codigosDeAtendimento={codigosDeAtendimento}
              conectado={conectado}
              exameSelecionado={exameSelecionado}
              preparacoesFinalizadas={preparacaoFinalizada}
              salaSelecionada={salaSelecionada}
              setFuncionarioSelecionado={setFuncionarioSelecionado}
              setTicketSelecionado={setTicketSelecionado}
              socket={socketRef.current}
              tickets={tickets}
              unidadeSelecionada={unidadeSelecionada}
              onHandleModal={() => setModalAtendimentoAberto(true)}
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
        socket={socketRef.current!}
        onClose={() => setModalAtendimentoAberto(false)}
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
function subscribeNotification() {
  throw new Error("Function not implemented.");
}

