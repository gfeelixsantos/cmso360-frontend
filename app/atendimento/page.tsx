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
} from "@/lib/websocket/events/events";
import { WebsocketType } from "@/lib/websocket/enums/websocket.enum";
import { useEntityManager } from "@/hooks/useEntityManager";
import { getCurrentUser, logout } from "@/lib/utils";
import EmptyState from "@/app/recepcao/components/EmptyState";
import { SidebarRecepcao } from "@/components/shared/Sidebar";
import { HeaderApp } from "@/components/shared/HeaderApp";
import { CadastroEmpresa } from "@/lib/soc/interfaces/CadastroEmpresa";
import {
  PreparationRequest,
  Ticket,
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
} from "@/app/recepcao/components/SenhasEstatisticas";
import AtendimentoContent from "@/app/atendimento/components/AtendimentoContent";
import AtendimentoModalExames from "@/app/atendimento/components/AtendimentoModalExames";
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

function createSocketIfNeeded(opts: ConnectOptions): Socket {
  // ✅ Se já existe socket conectado, reutiliza
  if (SINGLETON_SOCKET?.connected) {
    console.log("♻️ Reutilizando socket existente:", SINGLETON_SOCKET.id);

    return SINGLETON_SOCKET;
  }

  // ✅ Se existe mas está desconectado, remove
  if (SINGLETON_SOCKET) {
    try {
      SINGLETON_SOCKET.removeAllListeners();
      SINGLETON_SOCKET.disconnect();
    } catch (err) {
      console.warn("Erro ao limpar socket anterior:", err);
    }
    SINGLETON_SOCKET = null;
  }

  const { auth, onConnect, onDisconnect, onConnectError } = opts;

  // Configurações socket
  const s = io(NEST_URL, {
    auth,
    transports: ["websocket"], // Apenas WebSocket, sem polling
    reconnection: true,
    reconnectionAttempts: Infinity, // Tenta reconectar indefinidamente
    reconnectionDelay: 1000, // ✅ Reduzido de 2000 para 1000ms
    reconnectionDelayMax: 5000, // ✅ Reduzido de 10000 para 5000ms
    timeout: 20000,
    // Forçar nova conexão ao reconectar
    forceNew: false, // Permite reusar conexão
    // Upgrade automático desabilitado (já usa websocket)
    upgrade: false,
    // Manter conexão ativa
    rememberUpgrade: true,
  });

  SINGLETON_SOCKET = s;

  // Registrar handlers apenas uma vez
  if (!registeredOnce) {
    let lastActivity = Date.now();

    s.on("connect", () => {
      console.log("✅ Socket conectado:", s.id);
      onConnect?.(s);
    });

    s.on("disconnect", (reason: string) => {
      console.warn("⚠️ Socket desconectado:", reason);

      // ✅ NOVO: Distinguir desconexões normais de erros
      if (reason === "io server disconnect") {
        // Servidor forçou desconexão - reconectar manualmente
        console.log("🔄 Servidor desconectou - tentando reconectar...");
        s.connect();
      } else if (reason === "transport close") {
        // Conexão caiu - reconectar automático
        console.log("🔄 Conexão perdida - reconexão automática...");
      }

      onDisconnect?.(reason);
    });

    s.on("connect_error", (err: any) => {
      console.error("❌ Erro de conexão:", err.message);
      onConnectError?.(err);
    });

    // Monitorar reconexões
    s.on("reconnect", (attemptNumber: number) => {
      console.log(`✅ Reconectado após ${attemptNumber} tentativas`);
    });

    s.on("reconnect_attempt", (attemptNumber: number) => {
      console.log(`🔄 Tentativa de reconexão #${attemptNumber}`);
    });

    s.on("reconnect_error", (err: any) => {
      console.error("❌ Erro ao reconectar:", err.message);
    });

    s.on("reconnect_failed", () => {
      console.error("❌ Falha ao reconectar após múltiplas tentativas");
    });

    // Monitorar ping/pong para detectar problemas
    s.on("ping", () => {
      console.debug("📡 Ping enviado ao servidor");
    });

    s.on("pong", (latency: number) => {
      console.debug(`📡 Pong recebido (${latency}ms)`);
    });

    registeredOnce = true;
  }

  return s;
}

function closeSocket() {
  if (SINGLETON_SOCKET) {
    try {
      console.log("🔌 Fechando socket:", SINGLETON_SOCKET.id);
      SINGLETON_SOCKET.removeAllListeners();
      SINGLETON_SOCKET.disconnect();
    } catch (err) {
      console.warn("Erro ao fechar socket:", err);
    }
  }
  SINGLETON_SOCKET = null;
  registeredOnce = false;
}

// Helper para registrar handlers de eventos
function registerHandlers(
  s: Socket,
  handlers: { [K in keyof CustomEventMap]?: (...args: any[]) => void },
) {
  Object.entries(handlers).forEach(([event, fn]) => {
    if (!fn) return;
    // Remove handler anterior se existir
    s.off(event as any);
    s.on(event as any, fn as any);
  });

  // Retorna função de cleanup
  return () => {
    Object.entries(handlers).forEach(([event, fn]) => {
      if (!fn) return;
      try {
        s.off(event as any, fn as any);
      } catch (err) {
        console.warn(`Erro ao remover handler ${event}:`, err);
      }
    });
  };
}

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_NOTIFICATION_PUBLICKEY!;

const AtendimentoPage: React.FC = () => {
  const [user, setUser] = useState<IUserInfo | null>(null);
  const [conectado, setConectado] = useState(false);
  const socketRef = useRef<Socket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();
  const [isReconnecting, setIsReconnecting] = useState(false);
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

    console.log("meus atendimentos", meusAtendimentos);
    setAgendamentos(meusAtendimentos);
  }, [agendamentosGeral, codigosDeAtendimento, exameSelecionado]);

  // ---------------------------------------------------------
  // Reconexão automática ao mudar unidade/sala/exame
  // ---------------------------------------------------------
  useEffect(() => {
    if (!unidadeSelecionada || !salaSelecionada || !exameSelecionado) return;

    // Limpa timeout anterior
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }

    // Se já estava conectado, aguarda 500ms antes de reconectar (debounce)
    if (conectado) {
      console.log("♻️ Mudança de contexto detectada - agendando reconexão...");

      reconnectTimeoutRef.current = setTimeout(() => {
        console.log("🔄 Executando reconexão...");
        closeSocket();
        setConectado(false);

        // Reconecta após 300ms
        setTimeout(() => {
          setConectado(true);
        }, 300);
      }, 500);
    }

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [unidadeSelecionada, salaSelecionada, exameSelecionado]);

  // ---------------------------------------------------------
  // Conexão com socket: conectar/desconectar controlado
  // ---------------------------------------------------------
  const handleConectar = () => {
    if (conectado) {
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
          Selecione uma <strong>UNIDADE</strong>, <strong>SALA</strong> e{" "}
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

    const s = createSocketIfNeeded({
      auth,
      onConnect: async (socket) => {
        console.log("✅ Conectado ao WebSocket:", socket.id);
        socketRef.current = socket;
        setIsReconnecting(false);

        try {
          await Promise.all([loadSocCompanies(), loadInitialTickets()]);
          emitEvent(socket, EventType.TICKET_INFO, unidadeSelecionada);

          addToast({
            title: "Conectado",
            description: `Conexão com servidor estabelecida.`,
            severity: "success",
            color: "foreground",
            variant: "flat",
          });
        } catch (err) {
          console.warn("Erro ao carregar dados iniciais:", err);
        } finally {
          setIsLoading(false);
        }
      },
      onDisconnect: (reason) => {
        console.log("⚠️ Socket desconectado, reason=", reason);

        // Só mostra alerta se não foi desconexão intencional
        if (reason !== "io client disconnect") {
          setIsReconnecting(true);

          // Mostra toast apenas se não reconectar em 2s
          setTimeout(() => {
            if (isReconnecting) {
              addToast({
                title: "Reconectando...",
                description: "Tentando restabelecer conexão",
                severity: "warning",
                color: "foreground",
                variant: "flat",
              });
            }
          }, 2000);
        } else {
          setConectado(false);
        }

        setIsLoading(false);
      },
      onConnectError: (err) => {
        console.error("❌ Erro ao conectar:", err);
        setIsLoading(false);
        setIsReconnecting(false);

        addToast({
          title: "Erro de conexão",
          description: "Não foi possível conectar ao servidor",
          severity: "danger",
          color: "foreground",
          variant: "flat",
        });
      },
    });

    // ✅ CORREÇÃO: Handlers de eventos otimizados
    const handleAtendimentos = (schedules?: Scheduling[]) => {
      if (schedules && Array.isArray(schedules)) {
        console.log(`📥 Recebidos ${schedules.length} agendamentos iniciais`);

        setAgendamentosGeral((prev) => {
          // ✅ Usa Map para merge eficiente
          const map = new Map(prev.map((s) => [s._id, s]));

          schedules.forEach((schedule) => map.set(schedule._id, schedule));

          return Array.from(map.values());
        });
      }
    };

    const handleUpdateSchedule = ({
      operation,
      schedule,
    }: SchedulingChange) => {
      console.log(`🔄 UPDATE_SCHEDULE: ${operation}`, schedule.NOME);

      switch (operation) {
        case MongoOperationTypes.INSERT:
          setAgendamentosGeral((prev) => {
            // Evita duplicatas
            if (prev.some((p) => p._id === schedule._id)) {
              console.warn("⚠️ Agendamento duplicado ignorado:", schedule._id);

              return prev;
            }

            return [...prev, schedule];
          });
          break;

        case MongoOperationTypes.UPDATE:
          setAgendamentosGeral((prev) => {
            const idx = prev.findIndex(
              (p) => p.CODIGOPRONTUARIO === schedule.CODIGOPRONTUARIO,
            );

            if (idx !== -1) {
              const updated = [...prev];

              updated[idx] = schedule;

              return updated;
            }

            console.warn(
              "⚠️ Agendamento não encontrado para UPDATE:",
              schedule.CODIGOPRONTUARIO,
            );

            return prev;
          });
          break;

        case MongoOperationTypes.DELETE:
          setAgendamentosGeral((prev) =>
            prev.filter(
              (ag) => ag.CODIGOPRONTUARIO !== schedule.CODIGOPRONTUARIO,
            ),
          );
          break;
      }
    };

    const unregister = registerHandlers(s, {
      [EventType.CONNECTION_REQUEST]: handleAtendimentos,
      [EventType.UPDATE_SCHEDULE]: handleUpdateSchedule,
    } as any);

    // ✅ Cleanup
    return () => {
      unregister();
      // NÃO fecha o socket aqui - deixa o singleton gerenciar
      // closeSocket();
      // socketRef.current = null;
    };
  }, [conectado, unidadeSelecionada, salaSelecionada, exameSelecionado]);

  // Cleanup ao desmontar componente
  useEffect(() => {
    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      // Só fecha socket se estiver saindo da página
      closeSocket();
    };
  }, []);

  // ---------------------------------------------------------
  // Estatísticas
  // ---------------------------------------------------------
  const calcularEstatisticas = () => {
    const senhasFiltradas = getAll();

    const agendamentosSala = agendamentosGeral.filter((ag) =>
      ag.EXAMES?.some((ex) => ex.grupo === exameSelecionado),
    );

    const ticketStatus = (ag: any) => ag.TICKET?.status;
    const exameStatus = (ag: any) =>
      ag.EXAMES?.find((ex: any) => ex.grupo === exameSelecionado)?.status;

    setEstatisticas({
      recepcaoAguardando: senhasFiltradas.filter(
        (s) => s.grupo === TicketGroups.RECEPCAO,
      ).length,

      examesAguardando: agendamentosSala.filter(
        (ag) => exameStatus(ag) === ExamStatus.PENDENTE,
      ).length,

      emAtendimento: agendamentosSala.filter(
        (ag) =>
          ticketStatus(ag) === TicketStatus.EM_ATENDIMENTO ||
          ticketStatus(ag) === TicketStatus.EM_CHAMADA,
      ).length,

      preparacao: senhasFiltradas.filter(
        (s) => s.status === TicketStatus.EM_PREPARACAO,
      ).length,

      raiox: senhasFiltradas.filter(
        (s) => s.status === TicketStatus.ENCAMINHADO_RX,
      ).length,

      finalizados: agendamentosSala.filter(
        (ag) => ticketStatus(ag) === TicketStatus.FINALIZADO,
      ).length,

      total: agendamentosSala.length,
    });
  };

  useEffect(() => {
    calcularEstatisticas();
  }, [tickets, agendamentosGeral]);

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
              const setList = new Set(
                EXAMES_LIST[ex].map((e) => e.codigos).flat(),
              );

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
              salaSelecionada={salaSelecionada}
              setFuncionarioSelecionado={setFuncionarioSelecionado}
              // setTicketSelecionado={setTicketSelecionado}
              socket={socketRef.current}
              // tickets={tickets}
              unidadeSelecionada={unidadeSelecionada}
              onHandleModal={() => setModalAtendimentoAberto(true)}
              // onPreparationRequests={empreparacao}
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
