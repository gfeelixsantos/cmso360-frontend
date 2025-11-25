"use client";
import { useRouter } from "next/navigation";
import { io, Socket } from "socket.io-client";
import { IUserInfo, IUserWebsocket } from "@/lib/user/interfaces/IUser";

import { CustomEventMap, EventType, onEvent } from "@/lib/websocket/events/events";
import { PreparationRequestTypes, WebsocketType } from "@/lib/websocket/enums/websocket.enum";

import { useEntityManager } from "@/hooks/useEntityManager";
import { getCurrentUser, logout, urlBase64ToUint8Array } from "@/lib/utils";
import EmptyState from "@/components/recepcao/main/EmptyState";
import MainContent from "@/components/recepcao/main/MainContent";
import AtendimentoModal from "@/components/recepcao/main/atendimento/AtendimentoModal";
import { SidebarRecepcao } from "@/components/recepcao/Sidebar";
import React, { useState, useEffect, useCallback } from "react";
import { HeaderApp } from "@/components/shared/HeaderApp";
import { motion } from "framer-motion";

import { CadastroEmpresa } from "@/lib/soc/interfaces/CadastroEmpresa";
import { PreparationRequest, PreparationRequestModel, Ticket, TicketActionType, TicketGroups, TicketStatus } from "@/lib/ticket/ticket";
import { IndexDb } from "@/lib/indexDb/indexdb";

import { Scheduling, SchedulingChange } from "@/lib/scheduling/interface/scheduling";
import { NEST_NOTIFICATION_URL, NEST_SCHEDULINGS_TODAY, NEST_SOC_COMPANIES, NEST_TICKET_QUERY, NEST_URL } from "@/config/constants";
import { MongoOperationTypes } from "@/lib/scheduling/enum/scheduling.enum";

import { PreparationGrid } from "@/components/recepcao/main/PreparationGrid";
import { addToast, Button, Modal, ModalBody, ModalContent, ModalFooter, ModalHeader } from "@heroui/react";
import { ExclamationCircleIcon } from "@heroicons/react/24/outline";
import SenhasEstatisticas, { StatsModal } from "@/components/recepcao/main/SenhasEstatisticas";
import CmsoLoading from "@/components/shared/CmsoLoading";

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_NOTIFICATION_PUBLICKEY!;

// Componente principal
const RecepcaoPage: React.FC = () => {
  const [user, setUser] = useState<IUserInfo | null>(null);
  const [conectado, setConectado] = useState(false);
  const [socketState, setSocketState] = useState<Socket | null>(null);
  
  // Estados de filtro/seleção
  const [unidadeSelecionada, setUnidadeSelecionada] = useState("");
  const [statusSelecionado, setStatusSelecionado] = useState("");
  const [salaSelecionada, setSalaSelecionada] = useState("");
  const [exameSelecionado, setExameSelecionado] = useState("");
  
  // Dados
  const [agendamentos, setAgendamentos] = useState<Scheduling[]>([]);
  const [agendamentosAtivos, setAgendamentosAtivos] = useState<Scheduling[]>([]);
  const [empreparacao, setEmPreparacao] = useState<PreparationRequest[]>([]);
  const [preparacaoFinalizada, setPreparacaoFinalizada] = useState<PreparationRequest[]>([]);
  
  // UI / Modais
  const [modalAtendimentoAberto, setModalAtendimentoAberto] = useState(false);
  const [modalAlert, setModalAlert] = useState<boolean>(false);
  const [modalText, setModalText] = useState<React.ReactNode>("");
  const [isStatsModalOpen, setIsStatsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const [ticketSelecionado, setTicketSelecionado] = useState<Ticket | null>(null);
  const [socCompanies, setSocCompanies] = useState<CadastroEmpresa[]>([]);
  
  const router = useRouter();
  const { entities: tickets, setAll, addOrUpdate, getAll, executarAcao } = useEntityManager<Ticket>([]);
  
  const [estatisticas, setEstatisticas] = useState({
    recepcaoAguardando: 0,
    examesAguardando: 0,
    emAtendimento: 0,
    preparacao: 0,
    raiox: 0,
    finalizados: 0,
    total: 0
  });

  // Verifica usuário logado
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
  // ----------------------------------------------------------
  interface initialTicketsRequest {
    tickets: Ticket[],
    preparationRequests: PreparationRequest[]
  }

  const loadInitialTickets = useCallback(async (unidade: string) => {
    // Proteção extra contra string vazia
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
      if (Array.isArray(data.preparationRequests)) setEmPreparacao(data.preparationRequests);
      
    } catch (error) {
      console.error("Erro ao carregar tickets:", error);
    }
  }, [setAll]);

  // ---------------------------------------------------------
  // Carrega empresas do SOC
  // ----------------------------------------------------------
  const loadSocCompanies = useCallback(async () => {
    try {
      const response = await fetch(NEST_SOC_COMPANIES);

      if (!response.ok) {
        console.warn("Não foi possível carregar as empresas SOC", await response.text());
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
  // Notificação Web Push
  // ----------------------------------------------------------
  const subscribeNotification = async () => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      return;
    }
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') return;

    try {
      const registration = await navigator.serviceWorker.register('js/service-worker.js');
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      });

      await fetch(NEST_NOTIFICATION_URL, { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ unidade: unidadeSelecionada, subscription: subscription }),
      });
    } catch (err) {
      console.error('Erro ao inscrever o usuário:', err);
    }
  };

  // ---------------------------------------------------------
  // Hook DEDICADO para Carregamento de Dados (SOLUÇÃO DO PROBLEMA)
  // ----------------------------------------------------------  
  // Este useEffect roda SEMPRE que 'conectado' ou 'unidadeSelecionada' mudarem.
  // Ele garante que a busca aconteça independente do evento do socket.
  useEffect(() => {
    if (conectado && unidadeSelecionada) {
        console.log("[Frontend] Conexão ativa. Iniciando carga de dados...");
        setIsLoading(true);
        
        Promise.all([
            loadInitialTickets(unidadeSelecionada),
            loadSocCompanies(),
            // Passa explicitamente
        ]).finally(() => {
            setIsLoading(false);
        });

        if (salaSelecionada.includes("PREPARO")) {
            subscribeNotification();
        }
    }
  }, [conectado, unidadeSelecionada, salaSelecionada]); // Dependências corretas



  // ---------------------------------------------------------
  // Gerenciamento do Socket (Apenas Conexão e Eventos)
  // ----------------------------------------------------------  
  const handleConectar = () => {
    if (conectado && socketState) {
      socketState.disconnect();
      setConectado(false);
      addToast({
        title: "Desconectado",
        description: "Você se desconectou do servidor.",
        severity: "primary",
        color: "primary",
        variant: "flat",
      });
    } else {
      if (!unidadeSelecionada || !salaSelecionada) {
        setModalText(<p>Selecione uma <strong>UNIDADE</strong> e uma <strong>SALA</strong> antes de conectar.</p>);
        setModalAlert(true);
        return;
      }
      setConectado(true); 
    }
  };

  useEffect(() => {
    // Se não deve estar conectado, limpa tudo e retorna
    if (!conectado || !unidadeSelecionada || !salaSelecionada) {
        if (socketState) {
            socketState.disconnect();
            setSocketState(null);
        }
        return;
    }

    const conectionType = salaSelecionada.includes("PREPARO")
      ? WebsocketType.USER_PREPARO
      : WebsocketType.USER_RECEPCAO;

    const userSocket: IUserWebsocket = {
      nome: getCurrentUser()?.nome!,
      sala: salaSelecionada,
      type: conectionType,
      unidade: unidadeSelecionada,
    };

    const s: Socket<CustomEventMap> = io(NEST_URL, {
      auth: userSocket,
      transports: ["websocket"],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 3000,
    });

    setSocketState(s);

    // --- Handlers ---
    const handleAtendimentos = (schedules?: Scheduling[]) => {

      if(schedules){
         const schedulesFiltred = schedules.filter(
          s => !agendamentos.some(a => a._id === s._id)
        );
        
        setAgendamentos(schedulesFiltred);
      }
    }; 
    
    const handleTicketEmited = (ticket: Ticket) => addOrUpdate(ticket);
    const handleTicketUpdated = (ticket: Ticket) => addOrUpdate(ticket);
    const handleTicketError = (message: string) => console.error(JSON.parse(message));
    
    const handleUpdateSchedule = ({ operation, schedule }: SchedulingChange) => {
      setAgendamentos(prev => {
          let newList = [...prev];
          switch (operation) {
            case MongoOperationTypes.INSERT:
              newList.push(schedule);
              break;
            case MongoOperationTypes.UPDATE:
              newList = newList.map(ag => ag.SCHEDULINGCODE === schedule.SCHEDULINGCODE ? schedule : ag);
              break;
            case MongoOperationTypes.DELETE:
              newList = newList.filter(ag => ag.SCHEDULINGCODE !== schedule.SCHEDULINGCODE);
              break;
          }
          return newList.sort((a, b) => a.NOME.localeCompare(b.NOME, "pt-BR", { sensitivity: "base" }));
      });
    };

    const handlePreparationRequest = (request: PreparationRequestModel) => {
      console.log(request)
      switch (request.type) {
        case PreparationRequestTypes.SUCCESS:
          addOrUpdate(request.request.tickets!);
          setEmPreparacao(prev => [...prev, request.request]);
          break;
        case PreparationRequestTypes.FINISHED:
          executarAcao(request.request.ticketId!, TicketActionType.PREPARO_OK, unidadeSelecionada, s);
          setEmPreparacao(prev => prev.filter(req => req.ticketId !== request.request.ticketId));
          setPreparacaoFinalizada(prev => [...prev, request.request]);
          
          addToast({
            title: "ASO Finalizado",
            description: <span>{request.request.nome}</span>,
            severity: "success",
            color: "foreground",
            size: "sm"
          });
          break;
      }
    };

    // --- Registro de Eventos ---
    onEvent(s, EventType.CONNECTION_REQUEST, handleAtendimentos)
    onEvent(s, EventType.TICKET_EMITED, handleTicketEmited);
    onEvent(s, EventType.TICKET_UPDATED, handleTicketUpdated);
    onEvent(s, EventType.TICKET_ERROR, handleTicketError);
    // onEvent(s, EventType.UPDATE_SCHEDULE, handleUpdateSchedule);
    onEvent(s, EventType.PREPARATION_REQUEST, handlePreparationRequest);

   

    s.on("disconnect", (reason) => {
      // Não altera estado 'conectado' automaticamente se for desconexão temporária (transporte)
      // Mas limpa dados visuais para evitar confusão
      if (reason === "io client disconnect") {
          setConectado(false);
      }
      
      if (reason !== "io client disconnect") {
        addToast({
          title: "Conexão instável",
          severity: "danger",
          color: "foreground",
          variant: "flat",
        });
      }
    });

    s.on("connect_error", (err) => console.error("Erro ao conectar socket:", err));

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
  }, [conectado, unidadeSelecionada, salaSelecionada]); // Socket recria se mudar configs

  const handleModal = useCallback(() => {
    setAgendamentosAtivos(agendamentos);
    setModalAtendimentoAberto(!modalAtendimentoAberto);
  }, [modalAtendimentoAberto, agendamentos]);

  const calcularEstatisticas = useCallback(() => {
    const senhasFiltradas = getAll();
    setEstatisticas({
      recepcaoAguardando:
        senhasFiltradas.filter((s) => s.status === TicketStatus.AGUARDANDO && s.grupo === TicketGroups.RECEPCAO).length +
        senhasFiltradas.filter((s) => s.status === TicketStatus.PREPARO_OK).length,
      examesAguardando:
        senhasFiltradas.filter((s) => s.status === TicketStatus.AGUARDANDO && s.grupo === TicketGroups.EXAME).length,
      emAtendimento:
        senhasFiltradas.filter((s) => s.status === TicketStatus.EM_ATENDIMENTO).length +
        senhasFiltradas.filter((s) => s.status === TicketStatus.EM_CHAMADA).length,
      preparacao: senhasFiltradas.filter((s) => s.status === TicketStatus.EM_PREPARACAO).length,
      raiox: senhasFiltradas.filter((s) => s.status === TicketStatus.ENCAMINHADO_RX).length,
      finalizados: senhasFiltradas.filter((s) => s.status === TicketStatus.FINALIZADO).length,
      total: senhasFiltradas.length,
    });
  }, [getAll]);

  useEffect(() => {
    calcularEstatisticas();
  }, [tickets, calcularEstatisticas]);

  if (!user) {
    return <CmsoLoading />;
  }

  return (
    <div className="min-h-screen flex flex-col">
      <HeaderApp 
        onLogout={() => { logout(); router.push("/"); }}
      >
        { conectado && (
          <SenhasEstatisticas 
            estatisticasSenhas={estatisticas} 
            onSetStatsModalOpen={setIsStatsModalOpen}
            agendamentos={agendamentos}
            preparationRequests={empreparacao}
            tickets={tickets}
          />
        )}
      </HeaderApp>
        
      <div className="flex flex-1 overflow-hidden">
        <motion.aside
            initial={{ x: -80, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.5, ease: "easeOut", delay: 0.1 }} 
            className="w-60 bg-red shadow-sm"
        >
          <SidebarRecepcao
              unidadeSelecionada={unidadeSelecionada}
              setUnidadeSelecionada={setUnidadeSelecionada}
              statusSelecionado={statusSelecionado}
              setStatusSelecionado={setStatusSelecionado}
              salaSelecionada={salaSelecionada}
              setSalaSelecionada={setSalaSelecionada}
              conectado={conectado}
              handleConectar={handleConectar}
              agendadosFiltrados={agendamentos}
              onLoading={isLoading}
              onHandleModal={handleModal}
              setTicketSelecionado={setTicketSelecionado}
              exameSelecionado={exameSelecionado}
              onHandleExameSelecionado={handleExameSelecionado}
            />
        </motion.aside>

        <main
          className="flex-1 overflow-y-auto p-6 sm:p-8 lg:p-10 bg-gray-50"
          aria-label="Conteúdo principal da recepção"
        >
          {(conectado && socketState) && !isLoading ?
            salaSelecionada.includes("PREPARO") ? 
            (
              <PreparationGrid
                requests={empreparacao}
                socket={socketState}
              />
            ) : (
              <MainContent
                conectado={conectado}
                agendamentos={agendamentos}
                tickets={tickets.filter(t => t.grupo === TicketGroups.RECEPCAO)}
                socket={socketState}
                salaSelecionada={salaSelecionada}
                unidadeSelecionada={unidadeSelecionada}
                setTicketSelecionado={setTicketSelecionado}
                onHandleModal={handleModal}
                onPreparationRequests={empreparacao}
                preparacoesFinalizadas={preparacaoFinalizada}
              />
            )
          : (
            <EmptyState
              title="Desconectado"
              description="Conecte-se para visualizar os atendimentos"
            />
          )}
        </main>
      </div>
      
      <AtendimentoModal
        isOpen={modalAtendimentoAberto}
        onClose={handleModal}
        ticketSelecionado={ticketSelecionado}
        agendamentos={agendamentosAtivos}
        socCompanies={socCompanies}
        unidadeSelecionada={unidadeSelecionada}
        salaSelecionada={salaSelecionada}
        user={user}
        socket={socketState}
        onSetPreparacaoFinalizada={setPreparacaoFinalizada}
        onExecutarAcao={executarAcao}
      />

      {/* Modal de Estatísticas */}
      <StatsModal 
        isOpen={isStatsModalOpen} 
        onClose={() => setIsStatsModalOpen(false)}
        estatisticasSenhas={estatisticas}
        tickets={tickets}
        agendamentos={agendamentos}
        preparationRequests={empreparacao}
      />

      {/* Modal de confirmação do HeroUI */}
      <Modal 
        isOpen={modalAlert} 
        disableAnimation={true}
        isDismissable={false}
      >
        <ModalContent>
          <ModalHeader>
            <ExclamationCircleIcon className="h-6 w-6" />
            Atenção
          </ModalHeader>
          <ModalBody>
            { modalText }
          </ModalBody>
          <ModalFooter className="flex justify-end gap-2">
            <Button variant="ghost" color="primary" size="sm" onPress={() => setModalAlert(false)}>
              Confirmar
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
};

export default RecepcaoPage;