"use client";
import { useRouter } from "next/navigation";
import { io, Socket } from "socket.io-client";
import { IUserInfo, IUserWebsocket } from "@/lib/user/interfaces/IUser";

import { CustomEventMap, emitEvent, EventType, onEvent } from "@/lib/websocket/events/events";
import { PreparationRequestTypes, WebsocketType } from "@/lib/websocket/enums/websocket.enum";


import { useEntityManager } from "@/hooks/useEntityManager";
import { getCurrentUser, logout, urlBase64ToUint8Array } from "@/lib/utils";
import EmptyState from "@/components/recepcao/main/EmptyState";
import MainContent from "@/components/recepcao/main/MainContent";
import AtendimentoModal from "@/components/recepcao/main/atendimento/AtendimentoModal";
import { SidebarRecepcao } from "@/components/recepcao/Sidebar";
import React, { useState, useEffect, useCallback, useMemo } from "react";
import { HeaderApp } from "@/components/shared/HeaderApp";
import { color, motion } from "framer-motion";

import { CadastroEmpresa } from "@/lib/soc/interfaces/CadastroEmpresa";
import { PreparationRequest, PreparationRequestModel, Ticket, TicketActionType, TicketGroups, TicketStatus } from "@/lib/ticket/ticket";
import { IndexDb } from "@/lib/indexDb/indexdb";

import { Scheduling, SchedulingChange } from "@/lib/scheduling/interface/scheduling";
import { EXAMES_LIST, NEST_NOTIFICATION_URL, NEST_SCHEDULINGS_TODAY, NEST_SOC_COMPANIES, NEST_TICKET_QUERY, NEST_URL } from "@/config/constants";
import { AtendimentoStatus, ExamStatus, MongoOperationTypes } from "@/lib/scheduling/enum/scheduling.enum";

import { addToast, Button, Modal, ModalBody, ModalContent, ModalFooter, ModalHeader } from "@heroui/react";
import { ExclamationCircleIcon } from "@heroicons/react/24/outline";
import SenhasEstatisticas, { StatsModal } from "@/components/recepcao/main/SenhasEstatisticas";
import AtendimentoContent from "@/components/atendimento/AtendimentoContent";
import AtendimentoModalExames from "@/components/atendimento/AtendimentoModalExames";
import CmsoLoading from "@/components/shared/CmsoLoading";

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_NOTIFICATION_PUBLICKEY!; 

const AtendimentoPage: React.FC = () => {
  const [user, setUser] = useState<IUserInfo | null>(null);
  const [conectado, setConectado] = useState(false);
  const [socketState, setSocketState] = useState<Socket | null>(null);
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
  const { entities: tickets, setAll, addOrUpdate, getAll, clear, executarAcao } = useEntityManager<Ticket>([]);
  const [estatisticas, setEstatisticas] = useState({
    recepcaoAguardando: 0,
    examesAguardando: 0,
    emAtendimento: 0,
    preparacao: 0,
    raiox: 0,
    finalizados: 0,
    total: 0
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
    const setList = new Set(EXAMES_LIST[exame].map(e => e.codigos).flat());
    setCodigosDeAtendimento(setList);
    setExameSelecionado(exame);
  }

  // ---------------------------------------------------------
  // Carrega tickets e solicitações de preparo ao conectar
  // ----------------------------------------------------------
  type initialTicketsRequest = {
    tickets: Ticket[],
    preparationRequests: PreparationRequest[]
  }
  const loadInitialTickets = async () => {
    try {
      const encodedUnidade = encodeURIComponent(unidadeSelecionada);
      const url = `${NEST_TICKET_QUERY}${encodedUnidade}`;
      const response = await fetch(url);
      
      if (!response.ok) {
        return console.info(`Não há tickets para a unidade ${unidadeSelecionada}`);
      }
      const data:initialTicketsRequest = await response.json();
      
      if (Array.isArray(data.tickets)) setAll(data.tickets);
      if (Array.isArray(data.preparationRequests)) setEmPreparacao(data.preparationRequests);
      
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
        setSocCompanies(data)
        console.log("Empresas SOC carregadas da API:", data.length);
      }

      return [];
    } catch (error) {
      console.error("Erro ao carregar empresas SOC:", error);
      return await IndexDb.getCompanies();
    }
  }, [conectado])

  // ---------------------------------------------------------
  // Carrega agendamentos
  // ----------------------------------------------------------
  const getSchedulings = async () => {
    try {
      const response = await fetch(NEST_SCHEDULINGS_TODAY);
      if (!response.ok) return null;
      const schedules: Scheduling[] = await response.json();
      const schedulesToUnit = schedules.filter((s) => s.UNIDADEATENDIMENTO == unidadeSelecionada || s.UNIDADEATENDIMENTO == "");

      // Evita duplicatas comparando com agendamentosGeral (não com agendamentos filtrados)
      const schedulesFiltered = schedulesToUnit.filter(s => !agendamentosGeral.some(a => a._id === s._id));

      setAgendamentosGeral(prev => {
        // junta antigos + novos e ordena
        const merged = [...prev, ...schedulesFiltered];
        return merged.sort( (a, b) => a.NOME.localeCompare(b.NOME, "pt-BR", { sensitivity: "base" }) );
      });

    } catch (err) {
      console.error("Erro ao buscar agendamentos:", err);
      return null;
    }
  };

  // Recalcula `agendamentos` a partir de `agendamentosGeral` e `codigosDeAtendimento`
  useEffect(() => {
    if (!codigosDeAtendimento || codigosDeAtendimento.size === 0) {
      setAgendamentos([]); // limpa caso não haja exame selecionado
      return;
    }
    if (!agendamentosGeral || agendamentosGeral.length === 0) {
      setAgendamentos([]);
      return;
    }

    const emAtendimento = agendamentosGeral.filter(a => a.ATENDIMENTOSTATUS === AtendimentoStatus.EM_ATENDIMENTO);
    const meusAtendimentos = emAtendimento.filter(atend =>
      Array.isArray(atend.EXAMES) &&
      atend.EXAMES.some(exame =>
        codigosDeAtendimento.has(exame.codigoExame) &&
        exame.status === ExamStatus.PENDENTE
      )
    );
    
    setAgendamentos(meusAtendimentos);
  }, [agendamentosGeral, codigosDeAtendimento, exameSelecionado]);

  // ---------------------------------------------------------
  // Faz a inscrição para recebimento de notificação web-push
  // ----------------------------------------------------------
  const subscribeNotification = async() => { /* ... seu código comentado ... */ }

  // ---------------------------------------------------------
  // Conexão com socket, reconexão e eventos
  // ----------------------------------------------------------
  const handleConectar = () => {
    if (conectado && socketState) {
      socketState.disconnect();
      setConectado(false);
      addToast({ title: "Desconectado", description: "Você se desconectou do servidor.", severity: "warning", color: "foreground", variant: "flat" });
    } else {
      if (!unidadeSelecionada || !salaSelecionada || !exameSelecionado) {
        setModalText(<p>Selecione uma <strong>UNIDADE</strong>, <strong>SALA</strong> e <strong>EXAME</strong> antes de conectar.</p>);
        setModalAlert(true)
        return;
      }
      setIsLoading(true)
      setConectado(true);
    }
  };

  useEffect(() => {
    if (!conectado || !unidadeSelecionada || !salaSelecionada || !exameSelecionado) return;

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
      reconnectionAttempts: 5,
      reconnectionDelay: 3000,
    });

    setSocketState(s);

    const handleTicketEmited = (ticket: Ticket) => addOrUpdate(ticket);
    const handleTicketUpdated = (ticket: Ticket) => {
      addOrUpdate(ticket);
      setAgendamentos(prev => {
        return prev.map(agendamento => {
          if (agendamento.TICKET?.id === ticket.id) {
            return { ...agendamento, TICKET: ticket };
          } 
          return agendamento;
        });
      });
    };
    const handleTicketError = (message: string) => console.error(JSON.parse(message));
    const handleUpdateSchedule = ({ operation, schedule }: SchedulingChange) => {
      switch (operation) {
        case MongoOperationTypes.INSERT:
          setAgendamentosGeral(prev => [...prev, schedule].sort( (a, b) => a.NOME.localeCompare(b.NOME, "pt-BR", { sensitivity: "base" })));
          break;
        case MongoOperationTypes.UPDATE:
          setAgendamentosGeral(prev =>
            prev
              .map(ag => ag.SCHEDULINGCODE === schedule.SCHEDULINGCODE ? schedule : ag)
              .sort((a, b) => a.NOME.localeCompare(b.NOME, "pt-BR", { sensitivity: "base" }))
          );
          break;
        case MongoOperationTypes.DELETE:
          setAgendamentosGeral(prev => prev.filter(ag => ag.SCHEDULINGCODE !== schedule.SCHEDULINGCODE));
          break;
      }
    };

    const handlePreparationRequest = (request: PreparationRequestModel) => {
      switch (request.type) {
        case PreparationRequestTypes.SUCCESS:
          addOrUpdate(request.request.ticket!);
          setEmPreparacao(prev => [...prev, request.request]);
          break;
        case PreparationRequestTypes.FINISHED:
          executarAcao(request.request.ticketId!, TicketActionType.PREPARO_OK, unidadeSelecionada, s);
          setEmPreparacao(prev => prev.filter(req => req.ticketId !== request.request.ticketId));
          setPreparacaoFinalizada(prev => [...prev, request.request]);
          addToast({ title: "ASO Finalizado", description: <span>{request.request.nome}</span>, severity: "success", color: "foreground", size: "sm" });
          break;
      }
    };

    onEvent(s, EventType.TICKET_EMITED, handleTicketEmited);
    onEvent(s, EventType.TICKET_UPDATED, handleTicketUpdated);
    onEvent(s, EventType.TICKET_ERROR, handleTicketError);
    onEvent(s, EventType.UPDATE_SCHEDULE, handleUpdateSchedule);
    onEvent(s, EventType.PREPARATION_REQUEST, handlePreparationRequest);

    s.on("connect", async() => {
      try {
        await Promise.all([ loadSocCompanies(), getSchedulings(), loadInitialTickets() ]);
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
      setModalAtendimentoAberto(false);
      if (reason !== "io client disconnect") {
        addToast({ title: "Conexão perdida", severity: "danger", color: "foreground", variant: "flat" });
      }
    });

    s.on("connect_error", (err) => console.error("Erro ao conectar:", err));

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
    })
  }

  useEffect(() => { calcularEstatisticas() }, [tickets]);

  if (!user) {
    return <CmsoLoading />;
  }

  return (
    <div className="min-h-screen flex flex-col">
      <HeaderApp onLogout={() => { logout(); router.push("/"); }}>
        {(conectado && socketState) && (
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
        <motion.aside initial={{ x: -80, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ duration: 0.5, ease: "easeOut", delay: 0.1 }} className="w-60 bg-red shadow-sm">
          <SidebarRecepcao
            unidadeSelecionada={unidadeSelecionada}
            setUnidadeSelecionada={setUnidadeSelecionada}
            statusSelecionado={statusSelecionado}
            setStatusSelecionado={setStatusSelecionado}
            salaSelecionada={salaSelecionada}
            setSalaSelecionada={setSalaSelecionada}
            conectado={conectado}
            handleConectar={handleConectar}
            agendadosFiltrados={agendamentosGeral}
            onLoading={isLoading}
            onHandleModal={handleModal}
            setTicketSelecionado={setTicketSelecionado}
            exameSelecionado={exameSelecionado}
            onHandleExameSelecionado={handleExameSelecionado}
          />
        </motion.aside>

        <main className="flex-1 overflow-y-auto sm:p-6 lg:p-8  bg-gray-50" aria-label="Conteúdo principal do atendimento">
          {(conectado && socketState) && !isLoading ? (
            <AtendimentoContent
              conectado={conectado}
              tickets={tickets}
              agendamentos={agendamentos}
              socket={socketState}
              salaSelecionada={salaSelecionada}
              codigosDeAtendimento={codigosDeAtendimento}
              unidadeSelecionada={unidadeSelecionada}
              setTicketSelecionado={setTicketSelecionado}
              onHandleModal={handleModal}
              onPreparationRequests={empreparacao}
              preparacoesFinalizadas={preparacaoFinalizada}
              setFuncionarioSelecionado={setFuncionarioSelecionado}
              exameSelecionado={exameSelecionado}
            />
          ) : (
            <EmptyState title="Desconectado" description="Conecte-se para visualizar os atendimentos" />
          )}
        </main>
      </div>

      <AtendimentoModalExames isOpen={modalAtendimentoAberto} onClose={handleModal} funcionarioSelecionado={funcionarioSelecionado} exame={exameSelecionado} sala={salaSelecionada} codigosAtendimento={codigosDeAtendimento} socket={socketState!} />

      <StatsModal isOpen={isStatsModalOpen} onClose={() => setIsStatsModalOpen(false)} estatisticasSenhas={estatisticas} tickets={tickets} agendamentos={agendamentos} preparationRequests={empreparacao} />

      <Modal isOpen={modalAlert} disableAnimation={true} isDismissable={false}>
        <ModalContent>
          <ModalHeader><ExclamationCircleIcon className="h-6 w-6" /> Atenção</ModalHeader>
          <ModalBody>{ modalText }</ModalBody>
          <ModalFooter className="flex justify-end gap-2">
            <Button variant="ghost" color="primary" size="sm" onPress={() => setModalAlert(false)}>Confirmar</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
};

export default AtendimentoPage;
