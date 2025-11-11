// page.tsx
"use client";

import React, { useEffect, useMemo, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { io, Socket } from "socket.io-client";
import { Eye, Zap, Loader2 } from "lucide-react";

// Enums e interfaces
import { AtendimentoStatus, ExamStatus, MongoOperationTypes, ParecerMedico } from "@/lib/scheduling/enum/scheduling.enum";
import { CustomEventMap, EventType, onEvent } from "@/lib/websocket/events/events";
import { WebsocketType } from "@/lib/websocket/enums/websocket.enum";
import { IUserInfo, IUserWebsocket } from "@/lib/user/interfaces/IUser";
import { ExamRegister, FileUpload, Scheduling, SchedulingChange } from "@/lib/scheduling/interface/scheduling";

// Componentes
import { HeaderApp } from "@/components/shared/HeaderApp";
import CmsoLoading from "@/components/shared/CmsoLoading";


// Utils e config
import { getCurrentUser, logout } from "@/lib/utils";
import { NEST_SCHEDULINGS_ALL, NEST_SCHEDULINGS_FINISH, NEST_URL, USER_PROFILE } from "@/config/constants";

// UI Components
import { 
  addToast,
  Button,
  Card,
  CardBody,
  Badge,
  Divider,
  Input,
  Select,
  SelectItem,
  Spinner,
  Chip,
  Modal as HeroModal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter
} from "@heroui/react";
import { Search } from "lucide-react";
import PdfViewer from "./components/PdfView";
import PainelDireita from "./components/PainelDireita";

/* ---------------------- Tipos ---------------------- */

type PdfUrl = { 
  url: string; 
  title: string; 
  type: "exame" | "anexo"; 
  examName?: string; 
  grupo?: string 
};

export type MedicalRecord = Scheduling & {
  currentStatus: AtendimentoStatus;
  pdfUrls: PdfUrl[];
};

/* ---------------------- Utils ---------------------- */

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
      })) || [];

  const anexoUrls: PdfUrl[] =
    (s.ANEXOS || [])
      .filter((a: FileUpload) => a && a.StoragePath && a.StoragePath.trim() !== "")
      .map((a: any) => ({ 
        url: a.StoragePath, 
        title: a.Name || "Anexo", 
        type: "anexo" as const 
      })) || [];

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
    currentStatus: status as AtendimentoStatus,
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

/* ---------------------- Página Principal ---------------------- */

export default function UnifiedProntuarioPage() {
  const router = useRouter();
  const [atendimentos, setAtendimentos] = useState<Scheduling[]>([]);
  const [user, setUser] = useState<IUserInfo | null>(null);
  const [records, setRecords] = useState<MedicalRecord[]>([]);
  const [selectedRecord, setSelectedRecord] = useState<MedicalRecord | null>(null);
  const [search, setSearch] = useState<string>("");
  const [attendanceStatus, setAttendanceStatus] = useState<AtendimentoStatus | null>(null);
  
  // Estados para WebSocket
  const [socketState, setSocketState] = useState<Socket | null>(null);
  const [conectado, setConectado] = useState(false);
  const [isLoadingInitialData, setIsLoadingInitialData] = useState(false);

  // Estados para controle de mudanças não salvas
  const [unsavedModalOpen, setUnsavedModalOpen] = useState(false);
  const [nextSelectedRecordIfDiscard, setNextSelectedRecordIfDiscard] = useState<MedicalRecord | null>(null);

  // Estados para PDF
  const [currentPdfIndex, setCurrentPdfIndex] = useState<number>(0);

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
  }, []);

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

      return nameMatch && statusMatch;
    });
  }, [records, search, attendanceStatus]);

  const selectRecord = (r: MedicalRecord) => {
    // Verifica se há mudanças não salvas no painel direito
    const hasUnsavedChanges = false; // Esta lógica será implementada no componente RightPanel
    
    if (hasUnsavedChanges) {
      setNextSelectedRecordIfDiscard(r);
      setUnsavedModalOpen(true);
      return;
    }
    setSelectedRecord(r);
    setCurrentPdfIndex(0);
  };

  const confirmDiscardAndSelect = () => {
    setUnsavedModalOpen(false);
    if (nextSelectedRecordIfDiscard) {
      setSelectedRecord(nextSelectedRecordIfDiscard);
      setCurrentPdfIndex(0);
    }
    setNextSelectedRecordIfDiscard(null);
  };

  const handlePdfIndexChange = (index: number) => {
    setCurrentPdfIndex(index);
  };

  if (!user) {
    return <CmsoLoading />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-default-50 antialiased">
      <HeaderApp
        onLogout={logout}
        children={<h1 className="text-lg">Gestão de Prontuários</h1>}
      />

      <div className="flex flex-1 overflow-hidden">
        {/* LEFT: Lista / filtros */}
        <aside className="w-80 bg-default-50 border-r border-divider p-4 flex flex-col flex-shrink-0">
          <div className="space-y-4">
            <Select
              size="sm"
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
                <Spinner color="success" variant="simple" size="lg" />
                <p className="mt-2 text-sm">Carregando dados...</p>
              </div>
            ) : !attendanceStatus ? (
              <Card className="bg-default-100 border-default-200">
                <CardBody className="text-center p-6">
                  <Zap className="w-8 h-8 mx-auto mb-3 text-primary" />
                  <p className="text-sm font-medium text-default-600">
                    Selecione um status para carregar os prontuários.
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
                      ? "ring-2 ring-warning bg-warning-50"
                      : "hover:shadow-md"
                  }`}
                >
                  <CardBody className="p-4">
                    <div className="flex justify-between items-start gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <div className="min-w-0">
                            <h4 className="text-sm font-semibold text-default-800 truncate">{r.NOME}</h4>
                            <p className="text-xs text-default-500">{r.DATAAGENDAMENTO} - {r.TIPOEXAMENOME}</p>
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

        {/* MIDDLE: PDF Viewer Componentizado */}
        <PdfViewer
          selectedRecord={selectedRecord}
          currentPdfIndex={currentPdfIndex}
          onPdfIndexChange={handlePdfIndexChange}
        />

        {/* RIGHT: Painel Lateral Componentizado */}
        <PainelDireita
          selectedRecord={selectedRecord}
          setSelectedRecord={setSelectedRecord}
          currentPdfIndex={currentPdfIndex}
          onPdfIndexChange={handlePdfIndexChange}
          user={user}
          onRecordUpdate={(updatedRecord) => {
            setRecords(prev => 
              prev.map(rec => 
                rec._id === updatedRecord._id ? updatedRecord : rec
              )
            );
            if (selectedRecord && selectedRecord._id === updatedRecord._id) {
              setSelectedRecord(updatedRecord);
            }
          }}
        />
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
            <p>Existem alterações não salvas. Deseja descartá-las para mudar de prontuário?</p>
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
    </div>
  );
}