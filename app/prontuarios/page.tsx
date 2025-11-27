// page.tsx
"use client";

import React, { useEffect, useMemo, useState, useCallback, use } from "react";
import { useRouter } from "next/navigation";
import { io, Socket } from "socket.io-client";
import { Eye, Zap, Loader2, Lightbulb, MessageCircleWarning } from "lucide-react";

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
import { NEST_PRONTUARIO_PARAMETROS, NEST_PRONTUARIO_REGISTROS, NEST_URL } from "@/config/constants";

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


type ParametrosResponse = {
  medicos: { name: string }[];
  empresas: { name: string }[];
  status: { name: string }[];
}

interface Pagination<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

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
  
  // Novos estados para empresas e médicos
  const [empresa, setEmpresa] = useState<string>();
  const [medicoExaminador, setMedicoExaminador] = useState<string>();
  const [selectedEmpresas, setSelectedEmpresas] = useState<string[]>([]);
  const [selectedMedicos, setSelectedMedicos] = useState<string[]>([]);

  // Estados para uso de debounced
  const ITEMS_PER_PAGE = 100;
  const RETRY_DELAY_MS = 10000; // 5 segundos
  const page = 1;
  const [retryTrigger, setRetryTrigger] = useState(0)
  const [currentPage, setCurrentPage] = useState(1);
  const [paginationData, setPaginationData] = useState({ total: 0, totalPages: 1 });
  
  
  // Estados para WebSocket
  const [socketState, setSocketState] = useState<Socket | null>(null);
  const [conectado, setConectado] = useState(false);
  const [isLoadingInitialData, setIsLoadingInitialData] = useState(false);
  const [isLoadingEmpresasMedicos, setIsLoadingEmpresasMedicos] = useState(false);

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


  const carregarEmpresasEMedicos = async () => {

    setIsLoadingEmpresasMedicos(true);
    try {

      const response = await fetch(NEST_PRONTUARIO_PARAMETROS);

      if (!response.ok) alert('Erro ao buscar parâmetros');

      const parametrosData: ParametrosResponse = await response.json();

      setSelectedEmpresas(parametrosData.empresas.map(e => e.name));
      setSelectedMedicos(parametrosData.medicos.map(m => m.name));
      
    } catch (error) {
      console.error('Erro ao carregar empresas e médicos:', error);
      addToast({
        title: "Erro ao carregar dados",
        description: "Não foi possível carregar empresas e médicos examinadores",
        color: "danger",
      });
    } finally {
      setIsLoadingEmpresasMedicos(false);
    }
  }

  // Função para carregar empresas e médicos examinadores
  useEffect(() => {
  carregarEmpresasEMedicos();

  }, []);





  // Função para buscar dados com filtros
const buscarDadosComFiltros = useCallback(async (
        status: AtendimentoStatus,
        page: number, // Argumento Page
        limit: number, // Argumento Limit
        empresasFiltro?: string,
        medicosFiltro?: string,
    ) => {
        // Ativa o loading, limpa a lista para a nova busca
        setIsLoadingInitialData(true);
        setRecords([]);
        setSelectedRecord(null);

        try {
            let url = NEST_PRONTUARIO_REGISTROS;
            const params = new URLSearchParams();

            params.append('status', status);
            params.append('page', page.toString());
            params.append('limit', limit.toString());
            
            if (empresasFiltro) params.append('empresa', empresasFiltro);
            if (medicosFiltro) params.append('medico', medicosFiltro);

            url = `${url}?${params.toString()}`;
            const response = await fetch(url);
                
            if (!response.ok) throw new Error('Erro na resposta');

            const paginationData: Pagination<Scheduling> = await response.json();
            console.log(`Dados recebidos: ${paginationData.data.length} de ${paginationData.total}`);

            const schedules = paginationData.data;
            
            // LÓGICA DE NOVA TENTATIVA (RETRY)
            if (paginationData.total === 0) {
                 console.warn(`Resultado vazio encontrado. Agendando nova tentativa em ${RETRY_DELAY_MS / 1000} segundos.`);
                 // Agenda um novo disparo do useEffect de filtro após o delay
                 setTimeout(() => {
                     setRetryTrigger(c => c + 1); 
                 }, RETRY_DELAY_MS);
            }


            const mapped = schedules.map(s => mapSchedulingToMedicalRecord(s, status));
            const mappedOrdered = mapped.sort((a, b) => a.NOME.localeCompare(b.NOME, "pt-BR", { sensitivity: "base" }));

            setAtendimentos(schedules);
            setRecords(mappedOrdered);
            setPaginationData({
                total: paginationData.total,
                totalPages: paginationData.totalPages,
            });

        } catch (err) {
            console.error("Erro ao carregar dados iniciais:", err);
            addToast({
                title: "Erro ao carregar dados",
                description: "Não foi possível carregar os prontuários",
                color: "danger",
            });
            setRecords([]);
            setPaginationData({ total: 0, totalPages: 1 });

        } finally {
            setIsLoadingInitialData(false);
        }
    }, [mapSchedulingToMedicalRecord]);



    // EFEITO 1: FILTROS + DEBOUNCE + RETRY 
    useEffect(() => {
        const currentEmpresaFiltro = empresa; 
        const currentMedicoFiltro = medicoExaminador; 

        if (!attendanceStatus) return;

        // Se o retryTrigger > 0, significa que é um re-disparo agendado, executamos imediatamente (0ms).
        // Se retryTrigger for 0 (filtro normal), aplicamos o debounce de 300ms.
        const delay = (retryTrigger > 0) ? 0 : 300;
        
        const timeoutId = setTimeout(() => {
            
            // ⚠️ Resetamos para a página 1 apenas se não for um Retry agendado
            if (retryTrigger === 0) {
               setCurrentPage(1); 
            }

            // Chamamos a busca com a página atual (1 se filtro, >1 se retry na página atual)
            buscarDadosComFiltros(
                attendanceStatus, 
                currentPage, 
                ITEMS_PER_PAGE,
                currentEmpresaFiltro, 
                currentMedicoFiltro, 
            );
            
            // ⚠️ Resetamos o retryTrigger para 0 após a busca, para que o debounce volte a funcionar normalmente
            if (retryTrigger > 0) {
                 setRetryTrigger(0);
            }

        }, delay);

        // Cleanup: Cancela o timeout se os filtros mudarem antes do debounce ou retry
        return () => clearTimeout(timeoutId);
    // Depende dos filtros (debounce) e do retryTrigger (polling)
    }, [attendanceStatus, empresa, medicoExaminador, buscarDadosComFiltros, retryTrigger]);


    // EFEITO 2: MUDANÇA DE PÁGINA 
    useEffect(() => {
        // Evita a dupla requisição na inicialização (a inicial é feita pelo effect acima)
        if (currentPage === 1 && retryTrigger === 0) {
            return; 
        }
        if (!attendanceStatus) return; 

        buscarDadosComFiltros(
            attendanceStatus,
            currentPage, 
            ITEMS_PER_PAGE,
            empresa,
            medicoExaminador,
        );
    // Escuta a mudança de página
    }, [currentPage]);



  useEffect(() => {
    if (!attendanceStatus || !getCurrentUser()) {
      return;
    }

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

  // Função para limpar filtros
const limparFiltros = () => {
  setEmpresa(undefined);
  setMedicoExaminador(undefined);
  setSearch("");
  setSelectedEmpresas([]);
  setSelectedMedicos([]);
  
};

  // LOADING STATE --- Removido 26/11/2025 devido eficiencia do carregamento inicial
  // if (!user || selectedEmpresas.length === 0 || selectedMedicos.length === 0) {
  //   return <CmsoLoading />;
  // }

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
              isDisabled={isLoadingEmpresasMedicos}
              className="w-full"
            >
              {Object.values(AtendimentoStatus)
                .filter(status => status !== AtendimentoStatus.AGENDADO)
                .map(status => (
                  <SelectItem key={status}>
                    {status.replace(/_/g, ' ')}
                  </SelectItem>
                ))
              }
            </Select>

            {/* Novo campo: Empresa */}
            {/* <Select
              size="sm"
              label="Empresas"
              placeholder="Todas"
              value={empresa || ""}
              onChange={(e) => setEmpresa(String(e.target.value))}
              isDisabled={isLoadingEmpresasMedicos}
              className="w-full"
            >
              {selectedEmpresas.map( empresa => (
                <SelectItem key={empresa}>
                  {empresa}
                </SelectItem>
              ))}
            </Select> */}

            {/* Novo campo: Médico Examinador */}
            {/* <Select
              size="sm"
              label="Médico Examinador"
              placeholder="Todos"
              value={medicoExaminador || ""}
              onChange={(e) => setMedicoExaminador(e.target.value)}
              isDisabled={isLoadingEmpresasMedicos}
              className="w-full"
            >
              {selectedMedicos.map( medico => (
                <SelectItem key={medico}>
                  {medico}
                </SelectItem>
              ))}
            </Select> */}

            <Input
              placeholder="Buscar funcionário..."
              value={search}
              onValueChange={setSearch}
              startContent={<Search className="w-4 h-4 text-default-400" />}
              isDisabled={!attendanceStatus || isLoadingInitialData}
            />

            {/* Botão para limpar filtros */}
            {(empresa || medicoExaminador || search)  && (
              <Button
                size="sm"
                variant="light"
                onPress={limparFiltros}
                className="w-full"
              >
                Limpar Filtros
              </Button>
            )}
          </div>

          <Divider className="my-4" />

          <div className="flex justify-between items-center mb-3">
            <h3 className="text-sm font-semibold text-default-700">Prontuários</h3>
            <div className="flex items-center gap-2">
              <Badge variant="solid" color="primary">
                {filtered.length}
              </Badge>
            </div>
          </div>

          {/* Container com scroll independente */}
          <div className="flex-1 overflow-y-auto max-h-80 overflow-x-hidden space-y-3 p-1">
            {isLoadingInitialData ? (
              <div className="flex flex-col items-center justify-center p-8 text-default-500">
                <Spinner color="success"  size="lg" />
                <p className="mt-2 text-sm">Carregando...</p>
              </div>
            ) : !attendanceStatus ? (
              <Card className="bg-default-100 border-default-200">
                <CardBody className="text-center p-6">
                  <MessageCircleWarning className="w-8 h-8 mx-auto mb-3 text-warning" />
                  <p className="text-sm font-medium text-default-600">
                    Selecione um status para carregar os prontuários.
                  </p>
                </CardBody>
              </Card>
            ) : filtered.length === 0 ? (
              <Card>
                <CardBody className="text-center p-6">
                  <MessageCircleWarning className="w-8 h-8 mx-auto mb-3 text-warning" />
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
                              className="mt-1"
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
          user={user!}
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