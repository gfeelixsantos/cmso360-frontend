"use client";

import React, { useEffect, useMemo, useState, useCallback, ReactNode, ChangeEvent } from "react";
// Ícones Lucide
import { Eye, ChevronLeft, ChevronRight, Search, ZoomIn, ZoomOut, Maximize, FileText, UploadCloud, CheckCircle, AlertTriangle, X, Zap, Loader2, Stethoscope, UserCheck, ClipboardList, ChevronDown, ChevronUp } from "lucide-react";
// Importação do Socket.IO (necessário para a conexão)
import { io, Socket } from "socket.io-client";
import { AtendimentoStatus, ExamStatus, MongoOperationTypes, ParecerMedico } from "@/lib/scheduling/enum/scheduling.enum";
import { CustomEventMap, EventType, onEvent } from "@/lib/websocket/events/events";
import { TicketActionType } from "@/lib/ticket/ticket";
import { WebsocketType } from "@/lib/websocket/enums/websocket.enum";
import { IUserInfo, IUserWebsocket } from "@/lib/user/interfaces/IUser";
import { ExamRegister, FileUpload, Scheduling, SchedulingChange } from "@/lib/scheduling/interface/scheduling";
import { HeaderApp } from "@/components/shared/HeaderApp";
import { getCurrentUser, logout } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { NEST_SCHEDULINGS_ALL, NEST_SCHEDULINGS_FINISH, NEST_URL, USER_PROFILE } from "@/config/constants";
import { useAppData } from "../context/AppDataContext";
import { 
  addToast,
  Button,
  Card,
  CardBody,
  CardHeader,
  Chip,
  Divider,
  Input,
  Modal as HeroModal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Select,
  SelectItem,
  Tab,
  Tabs,
  Textarea,
  Progress,
  Spinner,
  Badge,
  Avatar,
  RadioGroup,
  Radio,
  Alert,
  Accordion,
  AccordionItem
} from "@heroui/react";
import CmsoLoading from "@/components/shared/CmsoLoading";

/* ---------------------- Tipos do Prontuário ---------------------- */

// Novos tipos para laudos
enum LaudoTipo {
  PCD = "PCD",
  RESTRICAO_TEMPORARIA = "RESTRICAO_TEMPORARIA"
}

type LaudoPCDData = {
  cid: string;
  descricaoCid: string;
  limitacoes: string;
  adaptacoesNecessarias: string;
  observacoes: string;
};

type LaudoRestricaoData = {
  cid: string;
  descricaoCid: string;
  restricoes: string;
  periodoDias: number;
  dataInicio: string;
  dataFim: string;
  recomendacoes: string;
};

type MedicalOpinionData = {
  opinionType: ParecerMedico | null;
  details?: string | null;
  laudoPCD?: LaudoPCDData | null;
  laudoRestricao?: LaudoRestricaoData | null;
};

type PdfUrl = { url: string; title: string; type: "exame" | "anexo"; examName?: string; grupo?: string };

type MedicalRecord = Scheduling & {
  currentStatus: AtendimentoStatus;
  pdfUrls: PdfUrl[];
};

const mapSchedulingToMedicalRecord = (s: Scheduling, status: string): MedicalRecord => {
  const exameUrls: PdfUrl[] =
  (s.EXAMES || [])
    .filter((e: ExamRegister) => e && e.url && e.url.trim() !== "")
    .map((e) => ({ 
      url: e.url!, 
      title: `${e.grupo}`, 
      type: "exame" as const, 
      examName: e.nomeExame,
      grupo: e.grupo 
    })) ||
  [];
  
  const anexoUrls: PdfUrl[] =
    (s.ANEXOS || [])
      .filter((a: FileUpload) => a && a.StoragePath && a.StoragePath.trim() !== "")
      .map((a: any) => ({ 
        url: a.StoragePath, 
        title: a.Name || "Anexo", 
        type: "anexo" as const 
      })) ||
    [];

  const allPdfUrls = [...exameUrls, ...anexoUrls];

  if (allPdfUrls.length === 0) {
    allPdfUrls.push({
      url: "https://google.com.br",
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

const getStatusColor = (status: AtendimentoStatus) => {
  switch (status) {
    case AtendimentoStatus.AGUARDANDO_AVALIACAO_MEDICA:
      return "warning";
    case AtendimentoStatus.FINALIZADO:
      return "success";
    case AtendimentoStatus.AGUARDANDO_RESULTADOS:
      return "primary";
    default:
      return "default";
  }
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



/* ---------------------- Componente de Laudos ---------------------- */

const LaudosModal = ({ 
  isOpen, 
  onClose, 
  onSave 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  onSave: (tipo: LaudoTipo, data: any) => void;
}) => {
  const [tipoLaudo, setTipoLaudo] = useState<LaudoTipo>(LaudoTipo.RESTRICAO_TEMPORARIA);
  const [laudoPCD, setLaudoPCD] = useState<LaudoPCDData>({
    cid: "",
    descricaoCid: "",
    limitacoes: "",
    adaptacoesNecessarias: "",
    observacoes: ""
  });
  const [laudoRestricao, setLaudoRestricao] = useState<LaudoRestricaoData>({
    cid: "",
    descricaoCid: "",
    restricoes: "",
    periodoDias: 30,
    dataInicio: new Date().toISOString().split('T')[0],
    dataFim: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    recomendacoes: ""
  });

  const calcularDataFim = (inicio: string, dias: number) => {
    const data = new Date(inicio);
    data.setDate(data.getDate() + dias);
    return data.toISOString().split('T')[0];
  };

  const handleSave = () => {
    if (tipoLaudo === LaudoTipo.PCD) {
      onSave(tipoLaudo, laudoPCD);
    } else {
      onSave(tipoLaudo, laudoRestricao);
    }
    onClose();
  };

  return (
    <HeroModal 
      isOpen={isOpen}
      onClose={onClose}
      size="2xl"
      backdrop="blur"
      scrollBehavior="inside"
    >
      <ModalContent>
        <ModalHeader>
          <div className="flex items-center gap-2">
            <ClipboardList className="w-6 h-6 text-primary" />
            <h3 className="text-xl font-bold">Emitir Laudo Médico</h3>
          </div>
        </ModalHeader>
        <ModalBody>
          <div className="space-y-6">
            <RadioGroup
              label="Tipo de Laudo"
              value={tipoLaudo}
              onValueChange={(value) => setTipoLaudo(value as LaudoTipo)}
              orientation="horizontal"
            >
              <Radio value={LaudoTipo.RESTRICAO_TEMPORARIA}>Restrição Temporária</Radio>
              <Radio value={LaudoTipo.PCD}>Laudo PCD</Radio>
            </RadioGroup>

            <Divider />

            {tipoLaudo === LaudoTipo.RESTRICAO_TEMPORARIA ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="CID"
                    placeholder="Ex: M54.5"
                    value={laudoRestricao.cid}
                    onValueChange={(value) => setLaudoRestricao(prev => ({ ...prev, cid: value }))}
                  />
                  <Input
                    label="Período (dias)"
                    type="number"
                    value={laudoRestricao.periodoDias.toString()}
                    onValueChange={(value) => {
                      const dias = parseInt(value) || 30;
                      setLaudoRestricao(prev => ({
                        ...prev,
                        periodoDias: dias,
                        dataFim: calcularDataFim(prev.dataInicio, dias)
                      }));
                    }}
                  />
                </div>
                
                <Input
                  label="Descrição do CID"
                  placeholder="Descrição da condição médica"
                  value={laudoRestricao.descricaoCid}
                  onValueChange={(value) => setLaudoRestricao(prev => ({ ...prev, descricaoCid: value }))}
                />

                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="Data Início"
                    type="date"
                    value={laudoRestricao.dataInicio}
                    onValueChange={(value) => setLaudoRestricao(prev => ({
                      ...prev,
                      dataInicio: value,
                      dataFim: calcularDataFim(value, prev.periodoDias)
                    }))}
                  />
                  <Input
                    label="Data Fim"
                    type="date"
                    value={laudoRestricao.dataFim}
                    onValueChange={(value) => setLaudoRestricao(prev => ({ ...prev, dataFim: value }))}
                  />
                </div>

                <Textarea
                  label="Restrições Específicas"
                  placeholder="Descreva as restrições temporárias para o trabalho..."
                  value={laudoRestricao.restricoes}
                  onValueChange={(value) => setLaudoRestricao(prev => ({ ...prev, restricoes: value }))}
                  rows={3}
                />

                <Textarea
                  label="Recomendações"
                  placeholder="Recomendações e orientações para o período..."
                  value={laudoRestricao.recomendacoes}
                  onValueChange={(value) => setLaudoRestricao(prev => ({ ...prev, recomendacoes: value }))}
                  rows={2}
                />
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="CID"
                    placeholder="Ex: G80.9"
                    value={laudoPCD.cid}
                    onValueChange={(value) => setLaudoPCD(prev => ({ ...prev, cid: value }))}
                  />
                </div>

                <Input
                  label="Descrição do CID"
                  placeholder="Descrição da condição de deficiência"
                  value={laudoPCD.descricaoCid}
                  onValueChange={(value) => setLaudoPCD(prev => ({ ...prev, descricaoCid: value }))}
                />

                <Textarea
                  label="Limitações Funcionais"
                  placeholder="Descreva as limitações funcionais do paciente..."
                  value={laudoPCD.limitacoes}
                  onValueChange={(value) => setLaudoPCD(prev => ({ ...prev, limitacoes: value }))}
                  rows={3}
                />

                <Textarea
                  label="Adaptações Necessárias"
                  placeholder="Descreva as adaptações necessárias no ambiente de trabalho..."
                  value={laudoPCD.adaptacoesNecessarias}
                  onValueChange={(value) => setLaudoPCD(prev => ({ ...prev, adaptacoesNecessarias: value }))}
                  rows={3}
                />

                <Textarea
                  label="Observações Adicionais"
                  placeholder="Outras observações relevantes..."
                  value={laudoPCD.observacoes}
                  onValueChange={(value) => setLaudoPCD(prev => ({ ...prev, observacoes: value }))}
                  rows={2}
                />
              </div>
            )}
          </div>
        </ModalBody>
        <ModalFooter>
          <Button variant="light" onPress={onClose}>
            Cancelar
          </Button>
          <Button color="primary" onPress={handleSave}>
            Emitir Laudo
          </Button>
        </ModalFooter>
      </ModalContent>
    </HeroModal>
  );
};

/* ---------------------- Página Unificada ---------------------- */

export default function UnifiedProntuarioPage(){
  // Dados e estados
  const router = useRouter();
  const [atendimentos, setAtendimentos] = useState<Scheduling[]>([]);
  const [user, setUser] = useState<IUserInfo | null>(null);
  const [records, setRecords] = useState<MedicalRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [selectedRecord, setSelectedRecord] = useState<MedicalRecord | null>(null);
  const [search, setSearch] = useState<string>("");
  const [dateStart, setDateStart] = useState<string>(() => {
    const d = new Date();
    d.setDate(1);
    return d.toISOString().slice(0, 10);
  });
  const [dateEnd, setDateEnd] = useState<string>(() => new Date().toISOString().slice(0, 10));


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
  const [socketState, setSocketState] = useState<Socket | null>(null);
  const [conectado, setConectado] = useState(false);
  const [isLoadingInitialData, setIsLoadingInitialData] = useState(false);
  const [attendanceStatus, setAttendanceStatus] = useState<AtendimentoStatus | null>(null);

  // Novos estados para laudos
  const [laudoModalOpen, setLaudoModalOpen] = useState(false);

  // Estado para controle do accordion de exames
  const [examesAccordionOpen, setExamesAccordionOpen] = useState<string[]>([]);

  // Ref para o input file
  const fileInputRefs = React.useRef<Record<string, HTMLInputElement | null>>({});

  useEffect(() => {
    const currentUser = getCurrentUser();
    if (!currentUser) {
      router.push("/");
    } else {
      setUser(currentUser);
    }
  }, [router]);

  const loadInitialData = useCallback(async (status: AtendimentoStatus) => {
    setIsLoadingInitialData(true);
    setRecords([]);
    setSelectedRecord(null);

    try {
      const response = await fetch(NEST_SCHEDULINGS_ALL);
          
      if (!response.ok) return null;

      const schedules: Scheduling[] = await response.json();
      
      const appAtendimentosFiltered = schedules.filter(a => a.ATENDIMENTOSTATUS === status);
      const mapped = appAtendimentosFiltered.map(s => mapSchedulingToMedicalRecord(s, status));
      const mappedOrdered = mapped.sort((a, b) => a.NOME.localeCompare(b.NOME, "pt-BR", { sensitivity: "base" }));

      setAtendimentos(schedules)
      setRecords(mappedOrdered);
    } catch (err) {
      console.error("Erro ao carregar dados iniciais:", err);
      addToast({
        title: "Erro ao carregar dados",
        description: "Não foi possível carregar os prontuários",
        color: "danger",
      });
    } finally {
      setIsLoadingInitialData(false);
    }
  }, [attendanceStatus]);

  useEffect(() => {
    if (!attendanceStatus || !getCurrentUser()) {
      return;
    }

    loadInitialData(attendanceStatus);

    const conectionType = WebsocketType.USER_ATENDIMENTO;
    const user: IUserWebsocket = {
      nome: getCurrentUser()?.nome!,
      sala: "prontuario",
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
    
    const handleUpdateSchedule = ({ operation, schedule }: SchedulingChange) => {
      const newRecord = mapSchedulingToMedicalRecord(schedule, schedule.ATENDIMENTOSTATUS);

      setRecords(prev => {
        let updatedRecords = [...prev];

        switch (operation) {
          case MongoOperationTypes.INSERT:
            updatedRecords = [...prev, newRecord];
            break;
          case MongoOperationTypes.UPDATE:
            updatedRecords = prev.map(ag => 
              ag.SCHEDULINGCODE === schedule.SCHEDULINGCODE 
                ? { ...ag, ...newRecord } 
                : ag
            );
            break;
          case MongoOperationTypes.DELETE:
            updatedRecords = prev.filter(ag => ag.SCHEDULINGCODE !== schedule.SCHEDULINGCODE);
            break;
        }

        return updatedRecords.sort((a, b) =>
          a.NOME.localeCompare(b.NOME, "pt-BR", { sensitivity: "base" })
        );
      });
    };

    onEvent(s, EventType.UPDATE_SCHEDULE, handleUpdateSchedule);

    s.on("connect", async () => {
      setConectado(true);
    });

    s.on("disconnect", (reason) => {
      setConectado(false);
      if (reason !== "io client disconnect") {
        addToast({
          title: "Conexão perdida",
          description: "Tentando reconectar...",
          color: "warning",
        });
      }
    });

    s.on("connect_error", (err) => {
      console.error("Erro ao conectar:", err);
      addToast({
        title: "Erro de conexão",
        description: "Não foi possível conectar ao servidor",
        color: "danger",
      });
    });

    return () => {
      s.off("connect");
      s.off("disconnect");
      s.off("connect_error");
      s.off(EventType.UPDATE_SCHEDULE, handleUpdateSchedule);
      s.disconnect();
      setSocketState(null);
    };
  }, [attendanceStatus]);

  const filtered = useMemo(() => {
    return records.filter((r) => {
      const nameMatch = !search || r.NOME.toLowerCase().includes(search.toLowerCase());
      const statusMatch = attendanceStatus === r.currentStatus;

      const dateParts = r.DATAAGENDAMENTO.split("/");
      const dateString = `${dateParts[2]}-${dateParts[1]}-${dateParts[0]}`;
      const d = new Date(dateString);
      const start = new Date(dateStart);
      const end = new Date(dateEnd);
      end.setHours(23, 59, 59, 999);
      
      const dateMatch = d >= start && d <= end;

      return nameMatch && statusMatch && dateMatch;
    });
  }, [records, search, attendanceStatus, atendimentos, dateStart, dateEnd]);

  const selectRecord = (r: MedicalRecord) => {
    if (opinion) {
      setNextSelectedRecordIfDiscard(r);
      setUnsavedModalOpen(true);
      return;
    }
    setSelectedRecord(r);
    setCurrentPdfIndex(0);
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
  const currentPdfGrupo = selectedRecord?.pdfUrls?.[currentPdfIndex]?.grupo ?? "";
  const totalPdfs = selectedRecord?.pdfUrls?.length ?? 0;
  
  const changePdfIndex = (dir: "next" | "prev" | "go", val?: number) => {
    if (dir === "next") setCurrentPdfIndex((p) => Math.min(p + 1, totalPdfs - 1));
    if (dir === "prev") setCurrentPdfIndex((p) => Math.max(p - 1, 0));
    if (dir === "go" && typeof val === "number") setCurrentPdfIndex(Math.min(Math.max(val, 0), totalPdfs - 1));
  };

  // Função para selecionar PDF a partir do accordion
  const selectPdfFromExame = (exameGrupo: string) => {
    if (!selectedRecord) return;
    
    const pdfIndex = selectedRecord.pdfUrls.findIndex(pdf => 
      pdf.grupo === exameGrupo && pdf.type === "exame"
    );
    
    if (pdfIndex !== -1) {
      setCurrentPdfIndex(pdfIndex);
    }
  };

  const saveOpinion = async () => {
    if (!opinion || !opinion.opinionType) {
      addToast({
        title: "Parecer incompleto",
        description: "Selecione um parecer médico antes de salvar.",
        color: "warning",
      });
      return;
    }

    if(!selectedRecord) {
      addToast({
        title: "Funcionário inválido",
        description: "Selecione o funcionário para o parecer médico.",
        color: "warning",
      });
      return;
    };
    setIsSavingOpinion(true);
    
    const response = await fetch(NEST_SCHEDULINGS_FINISH, { 
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
        body: JSON.stringify({
          scheduledId: selectedRecord._id,
          user: user,
          options: opinion
      })
    });

    await new Promise((r) => setTimeout(r, 900));
    setRecords((prev) => prev.map((rec) => (rec._id === selectedRecord?._id ? { ...rec, currentStatus: AtendimentoStatus.FINALIZADO } : rec)));
    setOpinion(null);
    setIsSavingOpinion(false);
    addToast({
      title: "Parecer salvo",
      description: "Parecer médico salvo com sucesso.",
      color: "success",
    });
  };

  // Nova função para lidar com emissão de laudos
  const handleEmitirLaudo = (tipo: LaudoTipo, data: any) => {
    if (tipo === LaudoTipo.PCD) {
      setOpinion(prev => ({
        ...prev,
        opinionType: ParecerMedico.APTO_COM_ORIENTACAO,
        laudoPCD: data
      }));
      addToast({
        title: "Laudo PCD emitido",
        description: "Laudo PCD adicionado ao parecer médico",
        color: "success",
      });
    } else {
      setOpinion(prev => ({
        ...prev,
        opinionType: ParecerMedico.INAPTO_TEMPORARIAMENTE,
        laudoRestricao: data
      }));
      addToast({
        title: "Laudo de Restrição emitido",
        description: "Laudo de restrição temporária adicionado ao parecer",
        color: "success",
      });
    }
  };

  const handleFileInputClick = (codigoExame: string) => {
    fileInputRefs.current[codigoExame]?.click();
  };

  const handleFileSelected = (codigoExame: string, event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) return;

    const file = files[0]; // Pega apenas o primeiro arquivo
    
    if (file.type !== "application/pdf") {
      addToast({
        title: "Formato inválido",
        description: "Apenas PDF é permitido.",
        color: "warning",
      });
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      addToast({
        title: "Arquivo muito grande",
        description: "Tamanho máximo: 10MB.",
        color: "warning",
      });
      return;
    }

    if (!selectedRecord) return;

    setUploadStates((prev) => ({
      ...prev,
      [selectedRecord._id as string]: {
        ...(prev[selectedRecord._id as string] || {}),
        [codigoExame]: { file, progress: 0, uploading: false },
      },
    }));

    // Limpa o input para permitir selecionar o mesmo arquivo novamente
    event.target.value = '';
  };

  const startUpload = async (codigoExame: string) => {
    if (!selectedRecord) return;
    
    const state = uploadStates[selectedRecord._id as string]?.[codigoExame];
    if (!state?.file) return;
    
    setUploadStates((prev) => ({
      ...prev,
      [selectedRecord._id as string]: {
        ...(prev[selectedRecord._id as string] || {}),
        [codigoExame]: { ...state, uploading: true, progress: 0 },
      },
    }));

    try {
      const formData = new FormData()

      // Enviar para backend...
      
      const res = await simulateUploadFile(state.file, (p) => {
        setUploadStates((prev) => ({
          ...prev,
          [selectedRecord._id as string]: {
            ...(prev[selectedRecord._id as string] || {}),
            [codigoExame]: { ...(prev[selectedRecord._id as string]?.[codigoExame] || {}), file: state.file, uploading: true, progress: p },
          },
        }));
      });

      setRecords((prev) =>
        prev.map((rec) => {
          if (rec._id !== selectedRecord._id) return rec;
          
          const newExames = rec.EXAMES.map((ex) => (ex.codigoExame === codigoExame ? { ...ex, url: res.url, status: "CONCLUIDO" } : ex));
          
          const exameDetails = rec.EXAMES.find(e => e.codigoExame === codigoExame);
          const newPdf: PdfUrl = { 
            url: res.url, 
            title: `Resultado: ${exameDetails?.grupo || codigoExame}`, 
            type: "exame",
            grupo: exameDetails?.grupo 
          };
          const pdfUrlExists = rec.pdfUrls.some(p => p.url === res.url);
          const newPdfUrls = pdfUrlExists ? rec.pdfUrls : [...rec.pdfUrls, newPdf];
          
          return { ...rec, EXAMES: newExames, pdfUrls: newPdfUrls };
        })
      );
      
      setTimeout(() => {
        setUploadStates((prev) => {
          const copy = { ...prev };
          if (copy[selectedRecord._id as string] && copy[selectedRecord._id as string][codigoExame]) {
            delete copy[selectedRecord._id as string][codigoExame];
          }
          return copy;
        });
      }, 1200);
      
      addToast({
        title: "Upload realizado",
        description: "Arquivo enviado com sucesso.",
        color: "foreground",
      });
    } catch (err) {
      console.error("Upload falhou:", err);
      addToast({
        title: "Erro no upload",
        description: "Não foi possível enviar o arquivo.",
        color: "danger",
      });
      setUploadStates((prev) => ({
        ...prev,
        [selectedRecord._id as string]: {
          ...(prev[selectedRecord._id as string] || {}),
          [codigoExame]: { ...(prev[selectedRecord._id as string]?.[codigoExame] || {}), uploading: false, progress: 0 },
        },
      }));
    }
  };

  const cancelUpload = (codigoExame: string) => {
    if (!selectedRecord) return;
    
    setUploadStates((prev) => {
      const copy = { ...prev };
      if (copy[selectedRecord._id as string] && copy[selectedRecord._id as string][codigoExame]) {
        delete copy[selectedRecord._id as string][codigoExame];
      }
      return copy;
    });
  };

  // Função para verificar se um exame está sendo exibido no PDF viewer
  const isExamBeingDisplayed = (exameGrupo: string) => {
    if (!selectedRecord || !currentPdfGrupo) return false;
    return currentPdfGrupo === exameGrupo;
  };

  // Função para verificar se um exame tem PDF disponível
  const hasPdfAvailable = (exameGrupo: string) => {
    if (!selectedRecord) return false;
    return selectedRecord.pdfUrls.some(pdf => 
      pdf.grupo === exameGrupo && pdf.type === "exame"
    );
  };

  if (!user) {
    return <CmsoLoading />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-default-50 antialiased">
      <HeaderApp
        onLogout={logout}
        user={user}
        children={<h1 className="text-2xl font-bold">Prontuários</h1>}
      />

      <div className="flex flex-1 overflow-hidden">
        {/* LEFT: Lista / filtros */}
        <aside className="w-74 bg-default-50 border-r border-divider p-4 flex flex-col flex-shrink-0">
          <div className="space-y-4">
            <Select
              label="Status de Atendimento"
              placeholder="Selecione um Status"
              value={attendanceStatus || ""}
              onChange={(e) => setAttendanceStatus(e.target.value as AtendimentoStatus)}
              className="w-full"
            >
              {Object.values(AtendimentoStatus).map(status => (
                <SelectItem key={status}>
                  {status.replace(/_/g, ' ')}
                </SelectItem>
              ))}
            </Select>

            <Input
              placeholder="Buscar funcionário..."
              value={search}
              onValueChange={setSearch}
              startContent={<Search className="w-4 h-4 text-default-400" />}
              isDisabled={!attendanceStatus || isLoadingInitialData}
            />
          </div>

          <Divider className="my-4" />

          <div className="flex justify-between items-center mb-3">
            <h3 className="text-sm font-semibold text-default-700">Prontuários</h3>
            <Badge variant="solid" color="primary">
              {filtered.length}
            </Badge>
          </div>

          {/* Container com scroll independente */}
          <div className="flex-1 overflow-y-auto max-h-80 overflow-x-hidden space-y-3 p-1">
            {isLoadingInitialData ? (
              <div className="flex flex-col items-center justify-center p-8 text-default-500">
                <Spinner color="primary" />
                <p className="mt-2 text-sm">Carregando dados...</p>
              </div>
            ) : !attendanceStatus ? (
              <Card className="bg-default-100 border-default-200">
                <CardBody className="text-center p-6">
                  <Zap className="w-8 h-8 mx-auto mb-3 text-primary" />
                  <p className="text-sm font-medium text-default-600">
                    Selecione um status para carregar a lista de prontuários.
                  </p>
                </CardBody>
              </Card>
            ) : filtered.length === 0 ? (
              <Card>
                <CardBody className="text-center p-6">
                  <p className="text-default-500">Nenhum prontuário encontrado.</p>
                </CardBody>
              </Card>
            ) : (
              filtered.map((r) => (
                <Card 
                  key={r._id.toString()}
                  isPressable
                  onPress={() => selectRecord(r)}
                  className={`transition-all duration-200 w-3xs ${
                    selectedRecord?._id === r._id
                      ? "ring-2 ring-success bg-success-50"
                      : "hover:shadow-md"
                  }`}
                >
                  <CardBody className="p-4">
                    <div className="flex justify-between items-start gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <div className="min-w-0">
                            <h4 className="text-sm font-semibold text-default-800 truncate">{r.NOME}</h4>
                            <p className="text-xs text-default-500">{r.TIPOEXAMENOME} • {r.DATAAGENDAMENTO}</p>
                            <p className="text-xs text-default-500 truncate">{r.NOMEEMPRESA}</p>
                            <Chip 
                              size="sm" 
                              color={getStatusColor(r.currentStatus)}
                              variant="flat"
                            >
                              {r.currentStatus.replace(/_/g, ' ')}
                            </Chip>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardBody>
                </Card>
              ))
            )}
          </div>
        </aside>

        {/* MIDDLE: PDF Viewer */}
        <main className="flex-1 bg-default-900 relative flex flex-col">
          {selectedRecord ? (
            <>
              <div className="flex items-center justify-between px-4 py-3 bg-default-800 text-default-50 shadow-lg">
                <div className="truncate pr-4 flex-1">
                  <h3 className="font-semibold text-md truncate">{currentPdfTitle}</h3>
                  <p className="text-xs text-default-300 truncate">
                    {selectedRecord.NOME} • {selectedRecord.TIPOEXAMENOME}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    isIconOnly
                    variant="light"
                    onPress={() => changePdfIndex("prev")}
                    isDisabled={currentPdfIndex === 0}
                    className="text-default-50"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </Button>
                  
                  <span className="text-sm font-medium px-2">
                    {currentPdfIndex + 1} / {totalPdfs}
                  </span>
                  
                  <Button
                    isIconOnly
                    variant="light"
                    onPress={() => changePdfIndex("next")}
                    isDisabled={currentPdfIndex >= totalPdfs - 1}
                    className="text-default-50"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </Button>
                </div>
              </div>

              <div className="flex-1 flex items-center justify-center p-4 overflow-hidden">
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
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-default-400">
              <Card className="bg-default-800 border-default-700">
                <CardBody className="text-center p-8">
                  <Eye className="w-12 h-12 mx-auto mb-4 text-default-300" />
                  <h3 className="text-xl font-light mb-2 text-default-200">Selecione um prontuário</h3>
                  <p className="text-default-400">Clique em um item da lista para começar a avaliação.</p>
                </CardBody>
              </Card>
            </div>
          )}
        </main>

        {/* RIGHT: Painel unificado */}
        <aside className="w-96 bg-content1 border-l border-divider flex-shrink-0 flex flex-col">
          {!selectedRecord ? (
            <Card className="m-4">
              <CardBody className="text-center p-6">
                <p className="text-default-500 text-sm">
                  Selecione um prontuário para visualizar as opções.
                </p>
              </CardBody>
            </Card>
          ) : (
            <div className="flex flex-col flex-1">
              <Card shadow="none" className="rounded-none border-b border-divider">
                <CardBody className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-bold text-foreground truncate">{selectedRecord.NOME}</h3>
                      <Chip 
                        size="sm" 
                        variant="flat"
                        className="mt-1"
                      >
                        {selectedRecord.TIPOEXAMENOME}
                      </Chip>
                      <div className="space-y-1 mt-2">
                        <p className="text-xs text-default-600">Empresa: {selectedRecord.NOMEEMPRESA}</p>
                        <p className="text-xs text-default-600">Cargo: {selectedRecord.NOMECARGO}</p>
                        <p className="text-xs text-default-600">Setor: {selectedRecord.NOMESETOR} - {selectedRecord.NOMEUNIDADE}</p>
                        { selectedRecord.OBSERVACOES && (
                          <Alert 
                            title="Observações cliente"
                            className="text-[0.6rem]"
                            variant="flat"
                            color="danger"
                          >{selectedRecord.OBSERVACOES}</Alert>
                        )}
                        { selectedRecord.ANOTACOES && (
                          <Alert 
                            title="Anotações internas"
                            className="text-[0.6rem]"
                            variant="flat"
                            color="primary"
                          >{selectedRecord.ANOTACOES}</Alert>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <Accordion 
                    isCompact={true}
                    selectionMode="multiple"
                    selectedKeys={examesAccordionOpen}
                    onSelectionChange={(keys) => setExamesAccordionOpen(Array.from(keys as Set<string>))}
                  >
                    <AccordionItem
                      key="exames"
                      aria-label="Exames Realizados"
                      title={
                        <div className="flex items-center gap-2 mt-2">
                          <h4 className="font-semibold text-default-700">Exames</h4>
                          <Badge variant="flat" color="primary" size="sm">
                            {selectedRecord.EXAMES.length}
                          </Badge>
                        </div>
                      }
                    >
                      <div className="space-y-3 max-h-60 overflow-y-auto p-1">
                        {selectedRecord.EXAMES.map((exame, index) => {
                          const uploadState = selectedRecord ? uploadStates[selectedRecord._id as string]?.[exame.codigoExame] : null;
                          
                          return (
                            <Card 
                              key={exame.codigoExame} 
                              className={`border-default-200 transition-all duration-200 ${
                                isExamBeingDisplayed(exame.grupo) 
                                  ? "ring-2 ring-primary bg-primary-50 border-primary-200" 
                                  : ""
                              }`}
                            >
                              <CardBody className="p-3">
                                <div className="flex justify-between items-start mb-2">
                                  <div className="flex items-center justify-between flex-1">
                                    <div className="flex items-center gap-2">
                                      <h5 className="font-semibold text-sm text-default-800">{exame.grupo}</h5>
                                      {hasPdfAvailable(exame.grupo) && (
                                        <Button
                                          isIconOnly
                                          size="sm"
                                          variant="light"
                                          color="primary"
                                          onPress={() => selectPdfFromExame(exame.grupo)}
                                          title="Visualizar PDF"
                                        >
                                          <Eye className="w-4 h-4" />
                                        </Button>
                                      )}
                                    </div>
                                    {isExamBeingDisplayed(exame.grupo) && (
                                      <Chip size="sm" color="primary" variant="flat">
                                        Visualizando
                                      </Chip>
                                    )}
                                  </div>
                                </div>
                                <div className="grid grid-cols-4 gap-2 text-xs text-default-600 mb-3">
                                  <div>
                                    {new Date(exame.dataExame).toLocaleDateString("pt-BR") || "N/A"} 
                                  </div>
                                  <div>
                                    {exame.sala || "N/A"}
                                  </div>
                                  <div className="col-span-2">
                                    {exame.profissional?.split(" ")[0] || "N/A"}
                                  </div>
                                </div>
                                
                                {/* Área de upload simplificada */}
                                <div className="space-y-2">
                                  {exame.url && exame.status === ExamStatus.FINALIZADO ? (
                                    <div className="flex items-center justify-between bg-success-50 p-2 rounded-lg border border-success-200">
                                      <div className="flex items-center gap-2 text-success-700">
                                        <CheckCircle className="w-4 h-4" />
                                        <span className="text-xs font-medium">Resultado Recebido</span>
                                      </div>
                                      <div className="flex gap-1">
                                        <Button
                                          as="a"
                                          href={exame.url}
                                          target="_blank"
                                          rel="noreferrer"
                                          color="success"
                                          size="sm"
                                          variant="flat"
                                        >
                                          Visualizar
                                        </Button>
                                        <Button
                                          isIconOnly
                                          size="sm"
                                          variant="light"
                                          color="primary"
                                          onPress={() => selectPdfFromExame(exame.grupo)}
                                          title="Abrir no Visualizador"
                                        >
                                          <Maximize className="w-3 h-3" />
                                        </Button>
                                      </div>
                                    </div>
                                  ) : uploadState ? (
                                    <div className="space-y-2">
                                      <div className="flex items-center justify-between">
                                        <span className="text-xs font-medium truncate flex-1 mr-2">
                                          {uploadState.file.name}
                                        </span>
                                        {!uploadState.uploading ? (
                                          <div className="flex gap-1">
                                            <Button
                                              color="primary"
                                              size="sm"
                                              onPress={() => startUpload(exame.codigoExame)}
                                            >
                                              Enviar
                                            </Button>
                                            <Button
                                              size="sm"
                                              variant="light"
                                              color="danger"
                                              onPress={() => cancelUpload(exame.codigoExame)}
                                            >
                                              <X className="w-3 h-3" />
                                            </Button>
                                          </div>
                                        ) : (
                                          <span className="text-xs text-primary font-medium">
                                            {uploadState.progress}%
                                          </span>
                                        )}
                                      </div>
                                      {uploadState.uploading && (
                                        <Progress
                                          value={uploadState.progress}
                                          color="primary"
                                          className="w-full"
                                          size="sm"
                                        />
                                      )}
                                    </div>
                                  ) : exame.status === ExamStatus.AGUARDANDO_RESULTADO && (
                                    <div className="flex gap-2">
                                      <input
                                        type="file"
                                        ref={el => fileInputRefs.current[exame.codigoExame] = el}
                                        onChange={(e) => handleFileSelected(exame.codigoExame, e)}
                                        accept="application/pdf"
                                        className="hidden"
                                      />
                                      <Button
                                        color="primary"
                                        size="sm"
                                        variant="flat"
                                        onPress={() => handleFileInputClick(exame.codigoExame)}
                                        startContent={<UploadCloud className="w-3 h-3" />}
                                      >
                                        Enviar PDF
                                      </Button>
                                    </div>
                                  )}
                                </div>
                              </CardBody>
                            </Card>
                          );
                        })}
                      </div>
                    </AccordionItem>
                  </Accordion>
                </CardBody>
              </Card>

            { user.perfil === USER_PROFILE.MEDICO || user.perfil === USER_PROFILE.MASTER  && (
               <Card className="flex-1">
                    <CardBody className="space-y-4">
                      <div className="flex justify-between items-center">
                        <Select
                          label="Tipo de Parecer"
                          placeholder="Selecione o parecer"
                          value={opinion?.opinionType || ""}
                          onChange={(e) => setOpinion({ 
                            ...(opinion || {}), 
                            opinionType: e.target.value as ParecerMedico 
                          })}
                          className="flex-1"
                        >
                          <SelectItem key={ParecerMedico.APTO}>
                            {ParecerMedico.APTO}
                          </SelectItem>
                          <SelectItem key={ParecerMedico.APTO_COM_ORIENTACAO}>
                            {ParecerMedico.APTO_COM_ORIENTACAO.replace(/_/g, ' ')}
                          </SelectItem>
                          <SelectItem key={ParecerMedico.SOLICITAR_REPETICAO}>
                            {ParecerMedico.SOLICITAR_REPETICAO.replace(/_/g, ' ')}
                          </SelectItem>
                          <SelectItem key={ParecerMedico.INAPTO}>
                            {ParecerMedico.INAPTO}
                          </SelectItem>
                          <SelectItem key={ParecerMedico.INAPTO_TEMPORARIAMENTE}>
                            {ParecerMedico.INAPTO_TEMPORARIAMENTE.replace(/_/g, ' ')}
                          </SelectItem>
                        </Select>

                        <Button
                          color="secondary"
                          variant="flat"
                          onPress={() => setLaudoModalOpen(true)}
                          startContent={<ClipboardList className="w-4 h-4" />}
                          className="ml-2"
                        >
                          Emitir Laudo
                        </Button>
                      </div>

                      {/* Indicadores de Laudos Emitidos */}
                      {(opinion?.laudoPCD || opinion?.laudoRestricao) && (
                        <Card className="bg-primary-50 border-primary-200">
                          <CardBody className="p-3">
                            <div className="flex items-center gap-2 mb-2">
                              <UserCheck className="w-4 h-4 text-primary" />
                              <span className="font-semibold text-sm text-primary">Laudos Emitidos:</span>
                            </div>
                            <div className="space-y-2">
                              {opinion.laudoPCD && (
                                <Chip color="primary" variant="flat" size="sm">
                                  Laudo PCD - CID: {opinion.laudoPCD.cid}
                                </Chip>
                              )}
                              {opinion.laudoRestricao && (
                                <Chip color="warning" variant="flat" size="sm">
                                  Restrição Temporária - CID: {opinion.laudoRestricao.cid}
                                </Chip>
                              )}
                            </div>
                          </CardBody>
                        </Card>
                      )}

                      {opinion?.opinionType === ParecerMedico.APTO_COM_ORIENTACAO && (
                        <Textarea
                          label="Detalhes da orientação"
                          placeholder="Descreva as orientações..."
                          value={opinion.details?.details ?? ""}
                          onValueChange={(value) => setOpinion({ 
                            ...opinion, 
                            details: { ...(opinion.details || {}), details: value } 
                          })}
                          rows={4}
                        />
                      )}
                      
                      {opinion?.opinionType === ParecerMedico.SOLICITAR_REPETICAO && (
                        <Textarea
                          label="Motivo da repetição"
                          placeholder="Descreva o motivo detalhado para solicitação de repetição..."
                          value={opinion.details?.reason ?? ""}
                          onValueChange={(value) => setOpinion({ 
                            ...opinion, 
                            details: { ...(opinion.details || {}), reason: value } 
                          })}
                          rows={4}
                        />
                      )}
                      
                      {opinion?.opinionType === ParecerMedico.INAPTO && (
                        <Textarea
                          label="Justificativa"
                          placeholder="Justificativa detalhada da inaptidão permanente..."
                          value={opinion.details?.justification ?? ""}
                          onValueChange={(value) => setOpinion({ 
                            ...opinion, 
                            details: { ...(opinion.details || {}), justification: value } 
                          })}
                          rows={4}
                        />
                      )}
                      
                      {opinion?.opinionType === ParecerMedico.INAPTO_TEMPORARIAMENTE && (
                        <div className="space-y-3">
                          <Textarea
                            label="Justificativa"
                            placeholder="Justificativa da inaptidão temporária..."
                            value={opinion.details?.justification ?? ""}
                            onValueChange={(value) => setOpinion({ 
                              ...opinion, 
                              details: { ...(opinion.details || {}), justification: value } 
                            })}
                            rows={3}
                          />
                          <Input
                            type="date"
                            label="Inapto até"
                            value={opinion.details?.inaptUntil ?? ""}
                            onValueChange={(value) => setOpinion({ 
                              ...opinion, 
                              details: { ...(opinion.details || {}), inaptUntil: value } 
                            })}
                          />
                        </div>
                      )}

                      <div className="flex gap-2 pt-2">
                        <Button
                          color="primary"
                          onPress={saveOpinion}
                          isDisabled={(isSavingOpinion || !opinion?.opinionType) && selectedRecord.EXAMES.every(ex => ex.status === ExamStatus.FINALIZADO)}
                          isLoading={isSavingOpinion}
                          className="flex-1"
                        >
                          {isSavingOpinion ? "Salvando..." : "Salvar Parecer"}
                        </Button>
                        <Button
                          variant="bordered"
                          onPress={() => setOpinion(null)}
                          isDisabled={isSavingOpinion}
                        >
                          Limpar
                        </Button>
                      </div>
                    </CardBody>
                  </Card>
               )}
             
            </div>
          )}
        </aside>
      </div>

      {/* Modal Confirmar Descarte */}
      <HeroModal 
        isOpen={unsavedModalOpen}
        onClose={() => setUnsavedModalOpen(false)}
        backdrop="blur"
      >
        <ModalContent>
          <ModalHeader>
            <h3 className="text-lg font-bold">Alterações não salvas</h3>
          </ModalHeader>
          <ModalBody>
            <p>Existem alterações no parecer médico. Deseja descartá-las para mudar de prontuário?</p>
          </ModalBody>
          <ModalFooter>
            <Button variant="light" onPress={() => setUnsavedModalOpen(false)}>
              Cancelar
            </Button>
            <Button color="danger" onPress={confirmDiscardAndSelect}>
              Descartar e Mudar
            </Button>
          </ModalFooter>
        </ModalContent>
      </HeroModal>

      {/* Modal Emitir Laudo */}
      <LaudosModal
        isOpen={laudoModalOpen}
        onClose={() => setLaudoModalOpen(false)}
        onSave={handleEmitirLaudo}
      />
    </div>
  );
}