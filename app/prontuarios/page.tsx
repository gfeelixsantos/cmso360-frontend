"use client";

import React, { useEffect, useMemo, useState, useCallback, ReactNode, ChangeEvent } from "react";
// Ícones Lucide
import { Eye, ChevronLeft, ChevronRight, Search, ZoomIn, ZoomOut, Maximize, FileText, UploadCloud, CheckCircle, AlertTriangle, X, Zap, Loader2 } from "lucide-react";
// Importação do Socket.IO (necessário para a conexão)
import { io, Socket } from "socket.io-client";
import { AtendimentoStatus, MongoOperationTypes } from "@/lib/scheduling/enum/scheduling.enum";
import { EventType } from "@/lib/websocket/events/events";
import { TicketActionType } from "@/lib/ticket/ticket";
import { WebsocketType } from "@/lib/websocket/enums/websocket.enum";
import { IUserInfo, IUserWebsocket } from "@/lib/user/interfaces/IUser";
import { ExamRegister, Scheduling, SchedulingChange } from "@/lib/scheduling/interface/scheduling";
import { HeaderApp } from "@/components/shared/HeaderApp";
import { getCurrentUser, logout } from "@/lib/utils";
import { useRouter } from "next/navigation";


/* ---------------------- Tipos e Constantes de Atendimento ---------------------- */

// Simulação de tipos necessários para o WebSocket
const NEST_URL = "http://localhost:3000"; // Substitua pela sua URL real
interface CustomEventMap {
  'TICKET_EMITED': (data: any) => void;
  'TICKET_UPDATED': (data: any) => void;
  'TICKET_ERROR': (message: string) => void;
  'UPDATE_SCHEDULE': (change: SchedulingChange) => void;
  'PREPARATION_REQUEST': (request: PreparationRequestModel) => void;
  'connect': () => void;
  'disconnect': (reason: string) => void;
  'connect_error': (err: Error) => void;
}
type SocketState = Socket<CustomEventMap> | null;
type Ticket = any;
type PreparationRequestModel = any;



// MOCK de funções auxiliares (SUBSTITUA PELAS SUAS REAIS)
const onEvent = (s: SocketState, event: EventType, handler: Function) => s?.on(event, handler as any);
const addToast = (toast: any) => console.log("TOAST:", toast);
const loadInitialTickets = async (unidade: string) => { console.log("Carregando tickets iniciais..."); };
const loadSocCompanies = async () => { console.log("Carregando empresas SOC..."); };
const getSchedulings = async () => { console.log("Obtendo agendamentos..."); };
const executarAcao = (ticketId: string, action: TicketActionType, unidade: string, socket: SocketState) => console.log(`Executando ação ${action} para ${ticketId}`);
const subscribeNotification = () => console.log("Inscrito em notificações.");
const addOrUpdate = (ticket: Ticket) => console.log("Adicionar ou atualizar ticket:", ticket);

/* ---------------------- Tipos do Prontuário ---------------------- */

enum OpinionType {
  APT = "Apto para função",
  APT_WITH_ORIENTATION = "Apto para função com orientação",
  REQUEST_REPETITION = "Solicitar repetição de exame",
  INAPT = "Inapto",
  TEMP_INAPT = "Inapto temporariamente",
}

type MedicalOpinionData = {
  opinionType: OpinionType | null;
  details?: Record<string, string> | null;
};

type PdfUrl = { url: string; title: string; type: "exame" | "anexo"; examName?: string };

type MedicalRecord = Scheduling & {
  currentStatus: AtendimentoStatus;
  pdfUrls: PdfUrl[];
};



const mapSchedulingToMedicalRecord = (s: Scheduling, status: AtendimentoStatus): MedicalRecord => {
  const anexoUrls: PdfUrl[] =
    (s.ANEXOS || [])
      .filter((a: any) => a && a.url)
      .map((a: any) => ({ url: a.url, title: a.nomeDocumento || "Anexo", type: "anexo" as const })) ||
    [];

  const exameUrls: PdfUrl[] =
    (s.EXAMES || [])
      .filter((e) => e && e.url && e.url.trim() !== "")
      .map((e) => ({ url: e.url!, title: `Resultado: ${e.nomeExame}`, type: "exame" as const, examName: e.nomeExame })) ||
    [];

  const allPdfUrls = [...anexoUrls, ...exameUrls];

  if (allPdfUrls.length === 0) {
    allPdfUrls.push({
      url: "https://cmsodocuments.blob.core.windows.net/documents/funcionarios/2025/950646-6-2-19102025/19102025-Psicossocial.pdf",
      title: "Documento Exemplo (Placeholder)",
      type: "exame",
    });
  }

  const id = typeof s._id === "string" ? s._id : (s._id as any).$oid ?? JSON.stringify(s._id);
  return {
    ...s,
    _id: id,
    currentStatus: status,
    pdfUrls: allPdfUrls,
  } as MedicalRecord;
};

const getStatusClasses = (status: AtendimentoStatus) => {
  switch (status) {
    case AtendimentoStatus.AGUARDANDO_AVALIACAO_MEDICA:
      return "bg-yellow-100 text-yellow-800";
    case AtendimentoStatus.FINALIZADO:
      return "bg-green-100 text-green-800";
    case AtendimentoStatus.AGUARDANDO_RESULTADOS:
      return "bg-blue-100 text-blue-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

const mockLoadSchedulings = async (status?: AtendimentoStatus): Promise<Scheduling[]> => {
  console.log(`Simulando carregamento de agendamentos para status: ${status}`);
  await new Promise((r) => setTimeout(r, 600));
  // Retorna os dados mockados, mas você implementaria a filtragem real aqui
  return MOCK_SCHEDULINGS;
};

const simulateUploadFile = async (file: File, onProgress?: (p: number) => void) => {
  return new Promise<{ url: string }>((resolve, reject) => {
    let progress = 0;
    const i = setInterval(() => {
      progress += 10;
      onProgress?.(progress);
      if (progress >= 100) {
        clearInterval(i);
        const fakeUrl = `/uploads/${Date.now()}-${file.name}`;
        resolve({ url: fakeUrl });
      }
    }, 150);
  });
};

/* ---------------------- Componentes auxiliares (mantidos) ---------------------- */

function Tab({ label, id, defaultActive, activeTabId, setActiveTabId }: { label: string; id: string; defaultActive?: boolean; activeTabId: string; setActiveTabId: (id: string) => void }) {
  const isActive = activeTabId === id;

  const onClick = () => {
    setActiveTabId(id);
    document.querySelectorAll("[data-tab-content]").forEach((el) => (el as HTMLElement).style.display = "none");
    const target = document.querySelector(`[data-tab-content="${id}"]`) as HTMLElement | null;
    if (target) target.style.display = "block";
  };

  useEffect(() => {
    if (defaultActive) {
      setActiveTabId(id);
      document.querySelectorAll("[data-tab-content]").forEach((el) => (el as HTMLElement).style.display = "none");
      const target = document.querySelector(`[data-tab-content="${id}"]`) as HTMLElement | null;
      if (target) target.style.display = "block";
    }
  }, [defaultActive, id, setActiveTabId]);

  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 text-sm font-medium transition-all duration-200 border-b-2
        ${isActive
          ? "border-blue-600 text-blue-700 bg-blue-50"
          : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
        }
      `}
    >
      {label}
    </button>
  );
}

function UploadDrop({ onFile, onClickSelect, exam }: { onFile: (f: File) => void; onClickSelect: (f: File) => void; exam: ExamRegister }) {
  const [over, setOver] = useState(false);
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setOver(false);
    const f = e.dataTransfer.files?.[0];
    if (f) onFile(f);
  };
  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) onClickSelect(f);
  };

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setOver(true); }}
      onDragLeave={() => setOver(false)}
      onDrop={handleDrop}
      className={`p-6 border-2 border-dashed rounded-lg text-center transition-all duration-200
        ${over ? "border-blue-500 bg-blue-50/50" : "border-gray-300 bg-white hover:border-blue-400"}
      `}
    >
      <UploadCloud className={`w-8 h-8 mx-auto ${over ? "text-blue-600" : "text-gray-400"}`} />
      <div className="text-sm text-gray-700 mt-2">Arraste o resultado do **{exam.nomeExame}** em PDF ou</div>
      <label className="inline-block mt-3">
        <input type="file" onChange={handleInput} accept="application/pdf" className="hidden" />
        <span className="px-4 py-2 bg-blue-600 text-white rounded-lg shadow-md hover:bg-blue-700 cursor-pointer text-sm font-medium transition-colors">
          Selecionar PDF
        </span>
      </label>
      <div className="text-xs text-gray-500 mt-1">Máx 10MB</div>
    </div>
  );
}

const ActionButton = ({ onClick, children, disabled = false }: { onClick: () => void; children: ReactNode; disabled?: boolean }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={`p-2 rounded-full transition-colors ${disabled ? 'text-gray-500 cursor-not-allowed' : 'text-white hover:bg-gray-600'}`}
  >
    {children}
  </button>
);

const Modal = ({ isOpen, title, message, onCancel, onConfirm, confirmText, cancelText }: { isOpen: boolean; title: string; message: string; onCancel: () => void; onConfirm: () => void; confirmText: string; cancelText: string }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-sm transform transition-all">
        <div className="flex justify-between items-start">
          <h3 className="text-xl font-bold text-gray-900">{title}</h3>
          <button onClick={onCancel} className="p-1 rounded-full text-gray-400 hover:bg-gray-100">
            <X className="w-5 h-5" />
          </button>
        </div>
        <p className="text-sm text-gray-600 mt-3">{message}</p>
        <div className="mt-6 flex justify-end space-x-3">
          <button onClick={onCancel} className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">{cancelText}</button>
          <button onClick={onConfirm} className="px-4 py-2 text-sm font-medium bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors">{confirmText}</button>
        </div>
      </div>
    </div>
  );
};

/* ---------------------- Página Unificada ---------------------- */

export default function UnifiedProntuarioPage(): JSX.Element {
  // Dados e estados
  const router = useRouter();
  const [user, setUser] = useState<IUserInfo | null>(null);
  const [records, setRecords] = useState<MedicalRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(false); // Inicia como false, pois a carga só acontece após selecionar o status
  const [selectedRecord, setSelectedRecord] = useState<MedicalRecord | null>(null);
  const [statusFilter, setStatusFilter] = useState<AtendimentoStatus>();
  const [search, setSearch] = useState<string>("");
  const [dateStart, setDateStart] = useState<string>(() => {
    const d = new Date();
    d.setDate(1);
    return d.toISOString().slice(0, 10);
  });
  const [dateEnd, setDateEnd] = useState<string>(() => new Date().toISOString().slice(0, 10));

  // Estado para a aba ativa no painel direito
  const [activePanelTab, setActivePanelTab] = useState("parecer");

  // Pdf viewer
  const [currentPdfIndex, setCurrentPdfIndex] = useState<number>(0);
  const [zoom, setZoom] = useState<number>(100);

  // Parecer médico
  const [opinion, setOpinion] = useState<MedicalOpinionData | null>(null);
  const [isSavingOpinion, setIsSavingOpinion] = useState(false);
  const [unsavedModalOpen, setUnsavedModalOpen] = useState(false);
  const [nextSelectedRecordIfDiscard, setNextSelectedRecordIfDiscard] = useState<MedicalRecord | null>(null);
  const [uploadStates, setUploadStates] = useState<Record<string, Record<string, { file: File; progress: number; uploading: boolean; url?: string }>>>({});

  // WEBSOCKET STATES E SELEÇÃO DE CONTEXTO
  const [socketState, setSocketState] = useState<SocketState>(null);
  const [conectado, setConectado] = useState(false); // Inicia como false
  const [isLoadingInitialData, setIsLoadingInitialData] = useState(false); // Para mostrar loading antes de conectar/carregar
  // NOVO ESTADO: Status de Atendimento selecionado pelo usuário
  const [attendanceStatus, setAttendanceStatus] = useState<AtendimentoStatus | null>(null);


  useEffect(() => {
  const currentUser = getCurrentUser();
  if (!currentUser) {
    router.push("/");
  } else {
    setUser(currentUser);
  }
}, [router]);



  /* ---------------------- Função de carregamento de dados (Chamada após seleção de status) ---------------------- */
  const loadInitialData = useCallback(async (status: AtendimentoStatus) => {
    setIsLoadingInitialData(true);
    setRecords([]);
    setSelectedRecord(null);

    try {
      const scheds = await mockLoadSchedulings(status);
      // Mapear com status PENDING ou EVALUATED (simulação)
      const mapped = scheds.map((s, i) => mapSchedulingToMedicalRecord(s, i % 2 === 0 ? MedicalRecordStatus.PENDING : MedicalRecordStatus.EVALUATED));
      setRecords(mapped);
      setSelectedRecord(mapped[0] ?? null);
    } catch (err) {
      console.error("Erro ao carregar dados iniciais:", err);
    } finally {
      setIsLoadingInitialData(false);
    }
  }, []);

  /* ---------------------- Efeito para a conexão WebSocket ---------------------- */
  useEffect(() => {
    // SÓ CONECTA se um status de atendimento foi selecionado E o usuário  estiverem definidos
    if (!attendanceStatus || !getCurrentUser()) {
        if(socketState) {
            socketState.disconnect();
            setSocketState(null);
            setConectado(false);
        }
        return;
    }
    
    // Inicia o carregamento dos dados e a conexão
    loadInitialData(attendanceStatus);

    const conectionType = WebsocketType.MEDICAL_RECORDS

    const user: IUserWebsocket = {
      nome: getCurrentUser()?.nome!,
      sala: "",
      type: conectionType,
      unidade: "",
    };

    const s: Socket<CustomEventMap> = io(NEST_URL, {
      auth: user,
      transports: ["websocket"],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 3000,
    });

    setSocketState(s);

    
    // ATUALIZAÇÃO DE AGENDAMENTO (CRUD)
    const handleUpdateSchedule = ({ operation, schedule }: SchedulingChange) => {
      // const newRecord = mapSchedulingToMedicalRecord(schedule, MedicalRecordStatus.PENDING); 

      setRecords(prev => {
        let updatedRecords = [...prev];
        switch (operation) {
          case MongoOperationTypes.INSERT:
            // updatedRecords = [...prev, newRecord];
            break;
          case MongoOperationTypes.UPDATE:
            // updatedRecords = prev.map(ag => ag.SCHEDULINGCODE === schedule.SCHEDULINGCODE ? { ...ag, ...newRecord } : ag);
            break;
          case MongoOperationTypes.DELETE:
            updatedRecords = prev.filter(ag => ag.SCHEDULINGCODE !== schedule.SCHEDULINGCODE);
            break;
        }
        return updatedRecords.sort((a, b) => a.NOME.localeCompare(b.NOME, "pt-BR", { sensitivity: "base" }));
      });
    };


    // Registrar eventos
    onEvent(s, EventType.UPDATE_SCHEDULE, handleUpdateSchedule);

    s.on("connect", async() => {
      setConectado(true);
      // Aqui, você pode recarregar dados específicos ou apenas confirmar a conexão
      try {
        await getSchedulings()
      

      } catch (error) {
        console.warn("Erro ao carregar dados iniciais (conect):", error);
      }
      finally
      {
        setIsLoadingInitialData(false); 
      }
    });

    s.on("disconnect", (reason) => {
      setConectado(false);

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

    // Cleanup ao desmontar ou mudar de status
    return () => {
      s.off("connect");
      s.off("disconnect");
      s.off("connect_error");
      s.off(EventType.UPDATE_SCHEDULE, handleUpdateSchedule);
      s.disconnect();
      setSocketState(null);
    };
  }, [attendanceStatus, loadInitialData]);


  /* ---------------------- filtros e resto da lógica (mantidos) ---------------------- */
  const filtered = useMemo(() => {
    return records.filter((r) => {
      const nameMatch = !search || r.NOME.toLowerCase().includes(search.toLowerCase());
      const statusMatch = statusFilter === r.currentStatus;
      const dateParts = r.DATAAGENDAMENTO.split("/");
      const dateString = `${dateParts[2]}-${dateParts[1]}-${dateParts[0]}`;
      const d = new Date(dateString);
      const start = new Date(dateStart);
      const end = new Date(dateEnd);
      end.setHours(23, 59, 59, 999);
      
      const dateMatch = d >= start && d <= end;
      return nameMatch && statusMatch && dateMatch;
    });
  }, [records, search, statusFilter, dateStart, dateEnd]);

  const selectRecord = (r: MedicalRecord) => {
    if (opinion) {
      setNextSelectedRecordIfDiscard(r);
      setUnsavedModalOpen(true);
      return;
    }
    setSelectedRecord(r);
    setCurrentPdfIndex(0);
    setActivePanelTab("parecer");
  };

  const confirmDiscardAndSelect = () => {
    setOpinion(null);
    setUnsavedModalOpen(false);
    if (nextSelectedRecordIfDiscard) {
      setSelectedRecord(nextSelectedRecordIfDiscard);
      setCurrentPdfIndex(0);
    }
    setNextSelectedRecordIfDiscard(null);
  };
  
  const currentPdfUrl = selectedRecord?.pdfUrls?.[currentPdfIndex]?.url ?? "";
  const currentPdfTitle = selectedRecord?.pdfUrls?.[currentPdfIndex]?.title ?? "";
  const totalPdfs = selectedRecord?.pdfUrls?.length ?? 0;
  
  const changePdfIndex = (dir: "next" | "prev" | "go", val?: number) => {
    if (dir === "next") setCurrentPdfIndex((p) => Math.min(p + 1, totalPdfs - 1));
    if (dir === "prev") setCurrentPdfIndex((p) => Math.max(p - 1, 0));
    if (dir === "go" && typeof val === "number") setCurrentPdfIndex(Math.min(Math.max(val, 0), totalPdfs - 1));
  };
  
  const changeZoom = (type: "in" | "out" | "fit") => {
    if (type === "fit") return setZoom(100);
    if (type === "in") return setZoom((z) => Math.min(z + 10, 200));
    setZoom((z) => Math.max(z - 10, 50));
  };
  
  const saveOpinion = async () => {
    if (!opinion || !opinion.opinionType) {
      alert("Selecione um parecer médico antes de salvar.");
      return;
    }
    setIsSavingOpinion(true);
    await new Promise((r) => setTimeout(r, 900));
    setRecords((prev) => prev.map((rec) => (rec._id === selectedRecord?._id ? { ...rec, currentStatus: AtendimentoStatus.FINALIZADO } : rec)));
    setOpinion(null);
    setIsSavingOpinion(false);
    alert("Parecer salvo com sucesso.");
  };

  const handleFileSelected = (recordId: string, codigoExame: string, file?: File | null) => {
    if (!file) {
      setUploadStates((prev) => {
        const copy = { ...prev };
        if (copy[recordId] && copy[recordId][codigoExame]) {
          delete copy[recordId][codigoExame];
        }
        return copy;
      });
      return;
    }
    if (file.type !== "application/pdf") {
      alert("Apenas PDF é permitido.");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      alert("Tamanho máximo: 10MB.");
      return;
    }

    setUploadStates((prev) => ({
      ...prev,
      [recordId]: {
        ...(prev[recordId] || {}),
        [codigoExame]: { file, progress: 0, uploading: false },
      },
    }));
  };

  const startUpload = async (recordId: string, codigoExame: string) => {
    const state = uploadStates[recordId]?.[codigoExame];
    if (!state?.file) return;
    
    setUploadStates((prev) => ({
      ...prev,
      [recordId]: {
        ...(prev[recordId] || {}),
        [codigoExame]: { ...state, uploading: true, progress: 0 },
      },
    }));

    try {
      const res = await simulateUploadFile(state.file, (p) => {
        setUploadStates((prev) => ({
          ...prev,
          [recordId]: {
            ...(prev[recordId] || {}),
            [codigoExame]: { ...(prev[recordId]?.[codigoExame] || {}), file: state.file, uploading: true, progress: p },
          },
        }));
      });

      setRecords((prev) =>
        prev.map((rec) => {
          if (rec._id !== recordId) return rec;
          
          const newExames = rec.EXAMES.map((ex) => (ex.codigoExame === codigoExame ? { ...ex, url: res.url, status: "CONCLUIDO" } : ex));
          
          const exameDetails = rec.EXAMES.find(e => e.codigoExame === codigoExame);
          const newPdf: PdfUrl = { url: res.url, title: `Resultado: ${exameDetails?.nomeExame || codigoExame}`, type: "exame" };
          const pdfUrlExists = rec.pdfUrls.some(p => p.url === res.url);
          const newPdfUrls = pdfUrlExists ? rec.pdfUrls : [...rec.pdfUrls, newPdf];
          
          return { ...rec, EXAMES: newExames, pdfUrls: newPdfUrls };
        })
      );
      
      setTimeout(() => {
        setUploadStates((prev) => {
          const copy = { ...prev };
          if (copy[recordId] && copy[recordId][codigoExame]) {
            delete copy[recordId][codigoExame];
          }
          return copy;
        });
      }, 1200);
      alert("Upload realizado com sucesso.");
    } catch (err) {
      console.error("Upload falhou:", err);
      alert("Erro no upload.");
      setUploadStates((prev) => ({
        ...prev,
        [recordId]: {
          ...(prev[recordId] || {}),
          [codigoExame]: { ...(prev[recordId]?.[codigoExame] || {}), uploading: false, progress: 0 },
        },
      }));
    }
  };


  /* ---------------------- UI Render ---------------------- */
  if(!user){
    return(
      <p>Carregando usuário</p>
    )
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 antialiased">
      {/* header */}
      <HeaderApp
        onLogout={logout}
        user={user}
        children={<p>Prontuários</p>}
      />

      <div className="flex flex-1 overflow-hidden">
        {/* LEFT: Lista / filtros */}
        <aside className="w-60 lg:w-80 bg-gray-50 border-r border-gray-200 p-4 flex flex-col flex-shrink-0">
          <div className="space-y-4">
             {/* NOVO SELETOR DE STATUS DE ATENDIMENTO */}
             <div className="space-y-1">
                <label htmlFor="attendance-status" className="block text-xs font-medium text-gray-700">Status de Atendimento</label>
                <select 
                    id="attendance-status"
                    value={attendanceStatus || ""}
                    onChange={(e) => setAttendanceStatus(e.target.value as AtendimentoStatus)}
                    className="w-full px-3 py-2 border border-green-500 rounded-lg bg-white text-sm text-green-700 focus:ring-green-500 focus:border-green-500 transition-colors"
                >
                    <option value="" disabled>-- Selecione um Status --</option>
                    {Object.values(AtendimentoStatus).map(status => (
                        <option key={status} value={status}>{status.replace(/_/g, ' ')}</option>
                    ))}
                </select>
            </div>
            {/* FIM NOVO SELETOR */}

            <div className="relative">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar por nome do paciente..." className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 transition-colors" disabled={!attendanceStatus || isLoadingInitialData} />
            </div>
            
            
            <div className="flex gap-2">
              <input type="date" value={dateStart} onChange={(e) => setDateStart(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-lg bg-white text-sm flex-1 focus:ring-blue-500 focus:border-blue-500" title="Data Inicial" disabled={!attendanceStatus || isLoadingInitialData} />
              <input type="date" value={dateEnd} onChange={(e) => setDateEnd(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-lg bg-white text-sm flex-1 focus:ring-blue-500 focus:border-blue-500" title="Data Final" disabled={!attendanceStatus || isLoadingInitialData} />
            </div>
          </div>

          <div className="mt-6 mb-3 text-sm font-semibold text-gray-700">Prontuários Encontrados ({filtered.length})</div>

          <div className="mt-2 overflow-y-auto flex-1 space-y-2 pb-4">
            {isLoadingInitialData ? (
              <div className="p-4 text-center text-gray-500">
                <Loader2 className="animate-spin h-5 w-5 text-blue-500 mx-auto" />
                <p className="mt-2">Carregando dados e conectando...</p>
              </div>
            ) : !attendanceStatus ? (
                <div className="p-4 text-center text-gray-500 bg-gray-100 rounded-lg">
                    <Zap className="w-6 h-6 mx-auto mb-2 text-blue-500" />
                    <p className="text-sm font-medium">Selecione um status no campo acima para carregar a lista de prontuários.</p>
                </div>
            ) : filtered.length === 0 ? (
              <div className="p-4 text-center text-gray-500">Nenhum prontuário encontrado.</div>
            ) : (
              filtered.map((r) => (
                <div
                  key={r._id.toString()}
                  onClick={() => selectRecord(r)}
                  className={`p-4 rounded-xl shadow-sm transition-all duration-150 cursor-pointer border ${selectedRecord?._id === r._id
                    ? "border-blue-500 bg-blue-50 ring-2 ring-blue-500"
                    : "border-gray-100 bg-white hover:border-gray-300 hover:shadow-md"}`
                  }
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="text-base font-semibold text-gray-800 truncate">{r.NOME}</div>
                      <div className="text-xs text-gray-500 mt-0.5">{r.TIPOEXAMENOME} • {r.DATAAGENDAMENTO}</div>
                      <div className="text-xs text-blue-600 mt-2 flex items-center space-x-1">
                        <FileText className="w-3 h-3" />
                        <span>{r.pdfUrls?.length ?? 0} documento(s)</span>
                      </div>
                    </div>
                    <div className={`text-xs px-2 py-1 rounded-full font-medium flex-shrink-0 ${getStatusClasses(r.currentStatus)}`}>{r.currentStatus}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </aside>

        {/* MIDDLE: PDF Viewer */}
        <main className="flex-1 bg-gray-900 relative flex flex-col">
          {selectedRecord ? (
            <>
              {/* Barra de controle do PDF */}
              <div className="flex items-center justify-between px-4 py-3 bg-gray-800 text-white shadow-lg flex-shrink-0">
                <div className="truncate pr-4">
                  <div className="font-semibold text-sm">{currentPdfTitle}</div>
                  <div className="text-xs text-gray-400 mt-0.5">{selectedRecord.NOME} • {selectedRecord.TIPOEXAMENOME}</div>
                </div>

                <div className="flex items-center gap-2">
                  {/* Navegação de página */}
                  <ActionButton onClick={() => changePdfIndex("prev")} disabled={currentPdfIndex === 0}>
                    <ChevronLeft className="w-5 h-5" />
                  </ActionButton>
                  <div className="text-sm font-medium">Doc. {currentPdfIndex + 1} / {totalPdfs}</div>
                  <ActionButton onClick={() => changePdfIndex("next")} disabled={currentPdfIndex >= totalPdfs - 1}>
                    <ChevronRight className="w-5 h-5" />
                  </ActionButton>
                </div>
              </div>

              {/* Área de visualização do PDF */}
              <div className="flex-1 flex items-center justify-center p-4 overflow-hidden">
                <div className="w-full h-full flex items-center justify-center">
                  {/* iframe viewer para PDF */}
                  <iframe
                    src={currentPdfUrl}
                    title={currentPdfTitle}
                    className="bg-white shadow-2xl rounded-lg transition-all duration-300"
                    style={{
                      width: `${zoom}%`,
                      height: `${zoom}%`,
                      maxWidth: "100%",
                      maxHeight: "100%",
                      minWidth: "50%",
                      minHeight: "50%",
                      border: 0,
                    }}
                  />
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-400">
              <div className="text-center p-8 bg-gray-800 rounded-lg shadow-xl">
                <Eye className="w-12 h-12 mx-auto mb-4" />
                <div className="text-2xl font-light mb-2">Selecione um prontuário</div>
                <div className="text-sm">Clique em um item da lista à esquerda para começar a avaliação.</div>
              </div>
            </div>
          )}
        </main>

        {/* RIGHT: Painel unificado (abas: Parecer / Upload) */}
        <aside className="w-82 bg-white border-l border-gray-200 flex-shrink-0 flex flex-col overflow-hidden">
          {!selectedRecord ? (
            <div className="p-6 text-sm text-gray-500">Selecione um prontuário para visualizar as opções de parecer médico e upload de resultados.</div>
          ) : (
            <div className="flex flex-col flex-1">
              {/* Informações do Paciente */}
              <div className="p-4 border-b border-gray-100 bg-white">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xl font-bold text-gray-900">{selectedRecord.NOME}</div>
                    <div className="text-sm text-gray-500 mt-1">{selectedRecord.CODIGOPRONTUARIO}</div>
                  </div>
                  <div className={`text-xs px-3 py-1 rounded-full font-medium ${getStatusClasses(selectedRecord.currentStatus)}`}>{selectedRecord.TIPOEXAMENOME}</div>
                </div>
              </div>

              {/* Abas de Navegação */}
              <div className="flex border-b border-gray-200 px-4 bg-white sticky top-0 z-10">
                <Tab label="Parecer Médico" id="parecer" defaultActive activeTabId={activePanelTab} setActiveTabId={setActivePanelTab} />
                <Tab label="Upload Resultado" id="upload" activeTabId={activePanelTab} setActiveTabId={setActivePanelTab} />
              </div>

              {/* Conteúdo das Abas */}
              <div className="p-4 flex-1 overflow-y-auto">
                {/* PARECER */}
                <div data-tab-content="parecer">
                  <h4 className="font-semibold text-lg text-gray-800 mb-1">Decisão Médica</h4>
                  <p className="text-sm text-gray-600 mb-4">Emita o parecer final para o prontuário selecionado.</p>

                  <div className="space-y-4">
                    <label htmlFor="opinion-select" className="block text-sm font-medium text-gray-700">Tipo de Parecer</label>
                    <select
                      id="opinion-select"
                      value={opinion?.opinionType ?? ""}
                      onChange={(e: ChangeEvent<HTMLSelectElement>) => setOpinion({ ...(opinion || {}), opinionType: (e.target.value as OpinionType) })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white shadow-sm focus:ring-blue-500 focus:border-blue-500 text-base"
                    >
                      <option value="">-- Selecione o parecer --</option>
                      <option value={OpinionType.APT}>{OpinionType.APT}</option>
                      <option value={OpinionType.APT_WITH_ORIENTATION}>{OpinionType.APT_WITH_ORIENTATION}</option>
                      <option value={OpinionType.REQUEST_REPETITION}>{OpinionType.REQUEST_REPETITION}</option>
                      <option value={OpinionType.INAPT}>{OpinionType.INAPT}</option>
                      <option value={OpinionType.TEMP_INAPT}>{OpinionType.TEMP_INAPT}</option>
                    </select>

                    {/* Detalhes dinâmicos */}
                    {opinion?.opinionType === OpinionType.APT_WITH_ORIENTATION && (
                      <textarea value={opinion.details?.details ?? ""} onChange={(e) => setOpinion({ ...opinion, details: { ...(opinion.details || {}), details: e.target.value } })} placeholder="Detalhes da orientação ou restrição" rows={4} className="w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm" />
                    )}
                    {opinion?.opinionType === OpinionType.REQUEST_REPETITION && (
                      <textarea value={opinion.details?.reason ?? ""} onChange={(e) => setOpinion({ ...opinion, details: { ...(opinion.details || {}), reason: e.target.value } })} placeholder="Motivo detalhado da solicitação de repetição" rows={4} className="w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm" />
                    )}
                    {opinion?.opinionType === OpinionType.INAPT && (
                      <textarea value={opinion.details?.justification ?? ""} onChange={(e) => setOpinion({ ...opinion, details: { ...(opinion.details || {}), justification: e.target.value } })} placeholder="Justificativa de inaptidão permanente" rows={4} className="w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm" />
                    )}
                    {opinion?.opinionType === OpinionType.TEMP_INAPT && (
                      <div className="space-y-3">
                        <textarea value={opinion.details?.justification ?? ""} onChange={(e) => setOpinion({ ...opinion, details: { ...(opinion.details || {}), justification: e.target.value } })} placeholder="Justificativa da inaptidão temporária" rows={3} className="w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm" />
                        <label htmlFor="inapt-until" className="block text-sm font-medium text-gray-700">Inapto Até</label>
                        <input id="inapt-until" type="date" value={opinion.details?.inaptUntil ?? ""} onChange={(e) => setOpinion({ ...opinion, details: { ...(opinion.details || {}), inaptUntil: e.target.value } })} className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white shadow-sm focus:ring-blue-500 focus:border-blue-500 text-base" />
                      </div>
                    )}

                    <div className="flex gap-3 pt-2">
                      <button onClick={saveOpinion} disabled={isSavingOpinion || !opinion?.opinionType} className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg shadow-md hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed transition-colors font-medium">
                        {isSavingOpinion ? "Salvando..." : "Salvar Parecer"}
                      </button>
                      <button onClick={() => setOpinion(null)} disabled={isSavingOpinion} className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors font-medium">Limpar</button>
                    </div>
                  </div>
                </div>

                {/* UPLOAD */}
                <div data-tab-content="upload" className="hidden">
                  <h4 className="font-semibold text-lg text-gray-800 mb-1">Upload de Resultados</h4>
                  <div className="text-sm text-gray-600 mb-4">Gerencie e envie PDFs dos resultados dos exames pendentes.</div>

                  <div className="space-y-4">
                    {selectedRecord.EXAMES.map((ex) => {
                      const state = uploadStates[selectedRecord._id as string]?.[ex.codigoExame];
                      const hasUrl = !!ex.url;

                      return (
                        <div key={ex.codigoExame} className="border border-gray-200 rounded-xl p-4 bg-white shadow-sm">
                          <div className="flex justify-between items-center">
                            <div>
                              <div className="font-bold text-base text-gray-800">{ex.nomeExame}</div>
                            </div>
                            <div className={`text-xs px-2 py-1 rounded-full font-medium ${hasUrl ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"}`}>
                              {hasUrl ? "Concluído" : "Pendente"}
                            </div>
                          </div>

                          <div className="mt-4 pt-4 border-t border-gray-100">
                            {hasUrl ? (
                              <div className="flex items-center justify-between bg-green-50 p-3 rounded-lg border border-green-200">
                                <div className="text-sm text-green-700 flex items-center gap-2 font-medium">
                                  <CheckCircle className="w-4 h-4" /> Resultado Enviado
                                </div>
                                <a href={ex.url} target="_blank" rel="noreferrer" className="px-3 py-1 bg-green-600 text-white rounded-lg text-xs hover:bg-green-700 transition-colors">Visualizar</a>
                              </div>
                            ) : !state ? (
                              <UploadDrop
                                onFile={(f) => handleFileSelected(selectedRecord._id as string, ex.codigoExame, f)}
                                onClickSelect={(f) => handleFileSelected(selectedRecord._id as string, ex.codigoExame, f)}
                                exam={ex}
                              />
                            ) : (
                              <div className="p-3 border border-blue-300 rounded-lg bg-blue-50 space-y-3">
                                <div className="flex items-center justify-between">
                                  <div>
                                    <div className="font-medium text-sm text-gray-900 truncate max-w-[200px]">{state.file.name}</div>
                                    <div className="text-xs text-gray-500 mt-0.5">{(state.file.size / 1024 / 1024).toFixed(2)} MB</div>
                                  </div>
                                  <div>
                                    {!state.uploading ? (
                                      <button onClick={() => startUpload(selectedRecord._id as string, ex.codigoExame)} className="px-3 py-1 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition-colors">Enviar Agora</button>
                                    ) : (
                                      <div className="text-sm text-blue-600 font-medium">Enviando... {state.progress}%</div>
                                    )}
                                  </div>
                                </div>
                                <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                                  <div style={{ width: `${state.progress}%` }} className="h-full bg-blue-600 transition-all duration-300" />
                                </div>
                                <div className="flex justify-end">
                                  <button onClick={() => handleFileSelected(selectedRecord._id as string, ex.codigoExame, null)} className="text-xs text-red-600 hover:text-red-700">Remover</button>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Footer do Painel */}
              <div className="p-4 border-t border-gray-200 bg-gray-50 flex-shrink-0">
                <div className="text-sm font-medium text-gray-700">Documentos Totais: {selectedRecord.pdfUrls.length}</div>
                <div className="text-xs text-gray-500 mt-1">Anexos e resultados disponíveis para visualização no painel central.</div>
              </div>

            </div>
          )}
        </aside>
      </div>

      {/* Modal Confirmar Descarte (usando o novo componente) */}
      <Modal 
        isOpen={unsavedModalOpen}
        title="Alterações não salvas"
        message="Existem alterações no parecer médico. Deseja descartá-las para mudar de prontuário?"
        onCancel={() => setUnsavedModalOpen(false)}
        onConfirm={confirmDiscardAndSelect}
        confirmText="Descartar e Mudar"
        cancelText="Cancelar"
      />
    </div>
  );
}