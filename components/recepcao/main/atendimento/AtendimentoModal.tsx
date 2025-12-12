// AtendimentoModalComplete.tsx
"use client";

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Calendar,
  Search as IconSearch,
  Clock,
  Building2,
  X,
  Filter,
  Send,
  FilePlus,
  Info,
  UserRoundSearch,
  Copy,
  FileInput,
  PrinterCheck,
} from "lucide-react";
import {
  Input,
  Button,
  Chip,
  Textarea,
  Autocomplete,
  AutocompleteItem,
  Tooltip,
  Select,
  SelectItem,
  Switch,
  Checkbox,
  Spinner,
} from "@heroui/react";
import { FixedSizeList as List, ListChildComponentProps } from "react-window";
import { InformationCircleIcon } from "@heroicons/react/24/outline";
import { Socket } from "socket.io-client";

import EmPreparacaoModal from "./PreparoModal";

import {
  PreparationRequest,
  Ticket,
  TicketActionType,
  TicketEmitedDto,
  TicketGroups,
  TicketStatus,
} from "@/lib/ticket/ticket";
import { CadastroEmpresa } from "@/lib/soc/interfaces/CadastroEmpresa";
import {
  EXAMES_LIST,
  NEST_SCHEDULINGS_RECORDS,
  NEST_SCHEDULINGS_UPDATE,
  NEST_SOC_PEDIDOEXAME,
  NEST_SOC_PEDIDOEXAME_CREDENCIADAS,
  NEST_TICKETS_URL,
  PREFERENCIAL_OPTIONS,
  TIPOS_EXAME,
} from "@/config/constants";
import {
  AsoStatus,
  AtendimentoStatus,
} from "@/lib/scheduling/enum/scheduling.enum";
import { FileUpload, Scheduling } from "@/lib/scheduling/interface/scheduling";
import {
  convertRespAso,
  convertTipoAsoNome,
  copyToClipboard,
  formatBrithdayDate,
  formatCPF,
  formatPhone,
  getStatusColor,
} from "@/lib/utils";
import { WebsocketType } from "@/lib/websocket/enums/websocket.enum";
import { IUserInfo } from "@/lib/user/interfaces/IUser";
import { AsoFuncionarioDto } from "@/lib/soc/interfaces/AsoFuncionario";
import { reportInternal } from "@/lib/scheduling/report/reportInternal";

interface AtendimentoModalProps {
  isOpen: boolean;
  onClose: () => void;
  agendamentos: Scheduling[];
  ticketSelecionado: Ticket | null;
  socCompanies: CadastroEmpresa[];
  unidadeSelecionada: string;
  salaSelecionada: string;
  user: IUserInfo;
  socket: Socket | null;
  onSetPreparacaoFinalizada: React.Dispatch<
    React.SetStateAction<PreparationRequest[]>
  >;
  onExecutarAcao: (
    ticketId: number,
    action: TicketActionType,
    unidade: string,
    socket: Socket,
    sala?: string,
    user?: string,
    mongoId?: string,
  ) => void;
}

const AtendimentoModal: React.FC<AtendimentoModalProps> = ({
  isOpen,
  onClose,
  agendamentos,
  ticketSelecionado,
  socCompanies,
  unidadeSelecionada,
  salaSelecionada,
  user,
  socket,
  onSetPreparacaoFinalizada,
  onExecutarAcao,
}: AtendimentoModalProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [codigoFuncionario, setCodigoFuncionario] = useState<string>("");
  const [empresa, setEmpresa] = useState<string>("");
  const [nome, setNome] = useState<string>("");
  const [dataNascimento, setDataNascimento] = useState<string>("");
  const [cpf, setCpf] = useState<string>("");
  const [telefone, setTelefone] = useState<string>("");
  const [tipoExame, setTipoExame] = useState<string>(""); // ToggleGroup value
  const [codigoExames, setCodigoExames] = useState<string[]>([]);
  const [psicoPresencial, setPsicoPresencial] = useState<boolean>(false);
  const [laboratorialExames, setLaboratorioExames] = useState<string[]>();
  const [examesImagem, setExamesImagem] = useState<string[]>();
  const [preferencialTipo, setPreferencialTipo] = useState<string>(""); // '' | 'gestante' | 'idoso' | 'pcd'
  const [observacoes, setObservacoes] = useState<string>("");
  const [anotacoes, setAnotacoes] = useState<string>("");
  const [anexos, setAnexos] = useState<FileUpload[]>([]);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isBindServiceSelected, setIsBindServiceSelected] =
    useState<boolean>(false);
  const [filesUpload, setFilesUpload] = useState<File[]>([]);
  const [funcionarioSelecionado, setFuncionarioSelecionado] =
    useState<Scheduling | null>(null);
  const [records, setRecords] = useState<AsoFuncionarioDto[]>();
  const [recordsCodes, setRecordsCodes] = useState<Set<string>>(new Set());
  const [isOpenPreparationModal, setIsOpenPreparationModal] = useState(false);
  const [somentePa, setSomentePa] = useState<boolean>(false);

  // referencia para o sidebar dos cards
  const listRef = useRef<any>(null);

  // Controls when error labels are shown
  const [showErrors, setShowErrors] = useState<boolean>(false);

  // Controle de agendamento selecionado
  const [selectedSchedulingId, setSelectedSchedulingId] = useState<
    string | null
  >(null);

  // Ref for containing element (for focus management if needed)
  const containerRef = useRef<HTMLDivElement | null>(null);

  // ---------------------------------------------------------
  // Validation rules
  // ---------------------------------------------------------
  const validation = useMemo(() => {
    return {
      empresa: empresa.trim().length > 0,
      codigo: codigoFuncionario.trim().length > 0,
      nome: nome.trim().length > 0,
      tipoExame: tipoExame.trim().length > 0,
      exames: codigoExames.length > 0,
      preferencial: ticketSelecionado?.preferencial
        ? preferencialTipo.length > 0
        : null,
      all:
        empresa.trim().length > 0 &&
        codigoFuncionario.trim().length > 0 &&
        nome.trim().length > 0 &&
        tipoExame.trim().length > 0 &&
        codigoExames.length > 0 &&
        (ticketSelecionado?.preferencial
          ? preferencialTipo.length > 0
          : true) &&
        funcionarioSelecionado?.ATENDIMENTOSTATUS ===
          AtendimentoStatus.AGENDADO,
    };
  }, [
    empresa,
    codigoFuncionario,
    nome,
    tipoExame,
    codigoExames,
    preferencialTipo,
  ]);

  // ---------------------------------------------------------
  // Keyboard shortcuts: ESC close, Enter submit (if valid)
  // ---------------------------------------------------------
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!isOpen) return; // Previne execução quando fechado

      if (e.key === "Escape") {
        onClose();
      } else if (e.key === "Enter") {
        const active = document.activeElement;
        const isTextarea =
          active &&
          (active.tagName === "TEXTAREA" ||
            (active as HTMLElement).getAttribute("role") === "textbox");

        if (!isTextarea && validation.all && !isSubmitting) {
          handleSubmit();
        }
      }
    },
    [isOpen, onClose, validation.all, isSubmitting],
  );

  useEffect(() => {
    if (!isOpen) return;
    window.addEventListener("keydown", handleKeyDown);

    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, handleKeyDown]);

  // ---------------------------------------------------------
  // filtros de agendamentos: search + status (manhã/tarde/all)
  // ---------------------------------------------------------
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const filteredAgendamentos = useMemo(() => {
    if (!agendamentos) return [];
    const term = searchTerm.trim().toLowerCase();

    return agendamentos.filter((p) => {
      const matchesSearch =
        term === "" ||
        p.NOME.toLowerCase().includes(term) ||
        p.NOMEEMPRESA.toLowerCase().includes(term) ||
        p.CPFFUNCIONARIO?.toLowerCase().includes(term);

      // 1. Caso "all" (todos)
      if (statusFilter === "all") {
        return matchesSearch;
      }

      // 2. Trata o horário em branco ("") - Inclui em MANHÃ e TARDE
      if (p.HORARIO === "") {
        return matchesSearch; // Se não tem horário, é incluído
      }

      const hora = parseInt(p.HORARIO.substring(0, 2), 10);

      if (statusFilter === "MANHA") {
        const isManha = hora < 12;

        return matchesSearch && isManha;
      }

      if (statusFilter === "TARDE") {
        const isTarde = hora >= 12;

        return matchesSearch && isTarde;
      }

      // Se houver outros status (caso inesperado)
      return matchesSearch;
    });
  }, [agendamentos, searchTerm, statusFilter]);

  // ---------------------------------------------------------
  // Actions: buscar funcionario por código (somente números)
  // ---------------------------------------------------------
  const handleBuscarFuncionario = useCallback(async () => {
    if (!empresa || !codigoFuncionario)
      return alert("Informe empresa e código do funcionário");
    if (!unidadeSelecionada) return alert("Selecione uma unidade");

    try {
      setIsLoading(true);
      // Se for KIT e sem exames -> chama a função de busca
      if (
        funcionarioSelecionado &&
        funcionarioSelecionado.CODIGOINTERNOEMPRESA?.includes("KIT") &&
        funcionarioSelecionado.EXAMES.length === 0
      ) {
        await handleAtendimentoCredenciada(funcionarioSelecionado);
        setIsLoading(false);

        return;
      } else {
        const response = await fetch(
          `${NEST_SOC_PEDIDOEXAME}codempresa=${empresa}&codfuncionario=${codigoFuncionario}`,
        );
        const prontuario: Scheduling = await response.json();

        if (response.ok && prontuario?.CODIGOPRONTUARIO) {
          // Seleciona o paciente normalmente
          // handleDeselecionarAgendamento()
          await handleSelecionarPacienteAgendamento(prontuario);

          // Localiza o índice na lista
          const index = filteredAgendamentos.findIndex(
            (a) => a.CODIGOPRONTUARIO === prontuario.CODIGOPRONTUARIO,
          );

          // Faz o scroll até o funcionário encontrado
          if (index !== -1 && listRef.current) {
            listRef.current.scrollToItem(index, "center"); // pode ser "auto", "center" ou "smart"
          }

          return;
        } else {
          const { message } = prontuario as any;

          alert(message);
          handleDeselecionarAgendamento();
        }
      }
    } catch (err) {
      alert(`Erro ao buscar funcionário: ${err}`);
    } finally {
      setIsLoading(false);
    }
  }, [empresa, codigoFuncionario, unidadeSelecionada, filteredAgendamentos]);

  const handleAtendimentoCredenciada = useCallback(
    async (paciente: Scheduling) => {
      if (
        paciente.CODIGOINTERNOEMPRESA?.includes("KIT") &&
        paciente.EXAMES.length === 0
      ) {
        setIsLoading(true);

        try {
          const response = await fetch(
            `${NEST_SOC_PEDIDOEXAME_CREDENCIADAS}cpf=${paciente.CPFFUNCIONARIO}`,
          );

          if (response.ok) {
            const examesJson = await response.json();

            // ✅ Cria nova cópia de paciente (imutável)
            const pacienteAtualizado = {
              ...paciente,
              EXAMES: [...paciente.EXAMES, ...examesJson],
            };

            // ✅ Atualiza o estado reativo — isso re-renderiza a UI
            setFuncionarioSelecionado(pacienteAtualizado);

            // Se quiser que o restante da lógica de seleção rode também:
            await handleSelecionarPacienteAgendamento(pacienteAtualizado);
          } else {
            alert(await response.text());
          }
        } catch (error) {
          console.error(error);
          alert("Erro ao buscar exames credenciada");
        } finally {
          setIsLoading(false);
        }
      }
    },
    [],
  );

  // ---------------------------------------------------------
  // Quando seleciona um paciente no sidebar
  // caso estiver com ASO OK, preenche formulário
  // do contrário realiza fetch ASO no SOC para preenchimento
  // ---------------------------------------------------------
  const handleSelecionarPacienteAgendamento = useCallback(
    async (paciente: Scheduling) => {
      setIsLoading(true);

      document.getElementById("empresa-autocomplete")?.scrollIntoView({
        behavior: "smooth",
        block: "start",
        inline: "nearest",
      });

      handleDeselecionarAgendamento();
      setFuncionarioSelecionado(paciente);

      if (
        (paciente.ASOSTATUS === AsoStatus.GERADO ||
          paciente.ASOSTATUS === AsoStatus.KIT_CREDENCIADA) &&
        paciente.EXAMES.length > 0
      ) {
        const pedidos = paciente.EXAMES;

        // 1. Cria mapas de referência
        const { codigoToGrupo, codigoToNome } = Object.entries(
          EXAMES_LIST,
        ).reduce(
          (acc, [grupo, examList]) => {
            examList.forEach((ex) => {
              ex.codigos.forEach((codigo) => {
                acc.codigoToGrupo[codigo] = grupo;
                acc.codigoToNome[codigo] = ex.nome;
              });
            });

            return acc;
          },
          {
            codigoToGrupo: {} as Record<string, string>,
            codigoToNome: {} as Record<string, string>,
          },
        );

        // 2. Processa os exames
        const examesToSet = pedidos.map((e) => e.codigoExame) || [];

        const examesSelecionados = examesToSet
          .map((cod) => codigoToGrupo[cod])
          .filter(Boolean);

        setCodigoExames(examesSelecionados);

        const examesLaboratorio = examesToSet
          .filter((cod) => codigoToGrupo[cod] === "Laboratório")
          .map((cod) => codigoToNome[cod]);

        setLaboratorioExames(examesLaboratorio);

        const examesImagem = examesToSet
          .filter((cod) => codigoToGrupo[cod] === "Raio-X")
          .map((cod) => codigoToNome[cod]);

        setExamesImagem(examesImagem);
      }

      // Atualiza demais campos do formulário
      setEmpresa(String(paciente.CODIGOEMPRESA) || "");
      setCodigoFuncionario(paciente.CODIGO || "");
      setNome(paciente.NOME || "");
      setDataNascimento(paciente.DATANASCIMENTO || "");
      setCpf(formatCPF(paciente.CPFFUNCIONARIO || ""));
      setTelefone(formatPhone(paciente.TELEFONE || ""));
      setTipoExame(TIPOS_EXAME[paciente.TIPOEXAMENOME] || "");
      setSelectedSchedulingId(paciente.CODIGOPRONTUARIO || "");
      setObservacoes(paciente.OBSERVACOES || "");
      setAnotacoes("");
      setPreferencialTipo("");
      setAnexos(paciente.ANEXOS?.map((a) => a) || []);
      setIsBindServiceSelected(false);
      setSomentePa(false);
      setIsLoading(false);
    },
    [handleAtendimentoCredenciada, funcionarioSelecionado],
  );

  // ---------------------------------------------------------
  // Reset form when modal opens/closes
  // ---------------------------------------------------------
  useEffect(() => {
    handleDeselecionarAgendamento();
    setSearchTerm("");
  }, [isOpen, onClose]);

  // ---------------------------------------------------------
  // Função para "desclicar" um agendamento selecionado
  // ---------------------------------------------------------
  const handleDeselecionarAgendamento = useCallback(() => {
    // Reset form after successful submission
    setCodigoFuncionario("");
    setEmpresa(String(""));
    setNome("");
    setDataNascimento("");
    setCpf("");
    setTelefone("");
    setTipoExame("");
    setCodigoExames([]);
    setPsicoPresencial(false);
    setObservacoes("");
    setPreferencialTipo("");
    setAnotacoes("");
    setShowErrors(false);
    setSelectedSchedulingId(null);
    setAnexos([]);
    setFilesUpload([]);
    setIsBindServiceSelected(false);
    setSomentePa(false);
    setRecords([]);
    setRecordsCodes(new Set());
    setFuncionarioSelecionado(null);
  }, []);

  // ---------------------------------------------------------
  // Data de nascimento Modal
  // ---------------------------------------------------------
  const handleDataNascimento = (e: string) => {
    const formated = formatBrithdayDate(e);

    setDataNascimento(formated);
  };

  // ---------------------------------------------------------
  // CPF Modal
  // ---------------------------------------------------------
  const handleCpfInput = (e: string) => {
    const formated = formatCPF(e);

    setCpf(formated);
  };

  const handleTelefoneInput = (e: string) => {
    const formated = formatPhone(e);

    setFuncionarioSelecionado((prev: any) => ({
      ...prev,
      TELEFONE: formated,
    }));
    setTelefone(formated);
  };

  // ---------------------------------------------------------
  // Toggle Tipo de Exame - acessível (role="radiogroup")
  // ---------------------------------------------------------
  const handleToggleTipo = (key: string) => {
    const value = TIPOS_EXAME[key];

    setTipoExame((prev) => (prev === value ? "" : value));
  };

  // ---------------------------------------------------------
  // Exames list (compact) - função para desmarcar exames
  // ---------------------------------------------------------
  const toggleExame = useCallback(
    (exame: string) => {
      setCodigoExames((prev) => {
        if (prev.includes(exame)) {
          // já estava selecionado → remove
          return prev.filter((ex) => ex !== exame);
        } else {
          // não estava → adiciona
          return [...prev, exame];
        }
      });
    },
    [funcionarioSelecionado],
  );

  const handlePsicoExame = () => {
    const novoValor = !psicoPresencial;

    setPsicoPresencial(novoValor);

    if (funcionarioSelecionado) {
      const updatedFuncionario = {
        ...funcionarioSelecionado,
        EXAMES: funcionarioSelecionado.EXAMES?.map((exam) => {
          if (exam.grupo.includes("Psicossocial")) {
            return {
              ...exam,
              preparacao: novoValor ? "Entrevista presencial" : "",
            };
          }

          return exam;
        }),
      };

      setFuncionarioSelecionado(updatedFuncionario);
    }
  };

  // ---------------------------------------------------------
  // Atendimento preferencial (single select)
  // ---------------------------------------------------------
  const togglePreferencial = useCallback(
    (p: string) => {
      setPreferencialTipo(p);
    },
    [
      ticketSelecionado,
      funcionarioSelecionado,
      salaSelecionada,
      unidadeSelecionada,
    ],
  );

  // ---------------------------------------------------------
  // Visualizar anexo
  // ----------------------------------------------------------
  const handleViewAttachment = (anexo: FileUpload) => {
    const link = document.createElement("a");

    link.href = anexo.StoragePath ?? "#";
    link.target = "_blank";

    link.click();
  };

  // ---------------------------------------------------------
  // Solicitação somente de PA
  // ----------------------------------------------------------
  const handleSomentePa = (value: boolean) => {
    setSomentePa(value);

    if (!codigoExames) return;

    if (value === true) {
      // Marcar -> remover Exame Clínico
      setCodigoExames((prev) => prev.filter((g) => g !== "Exame Clínico"));
    } else {
      // Desmarcar -> adicionar Exame Clínico novamente, se não existir
      setCodigoExames((prev) => {
        if (!prev.includes("Exame Clínico")) {
          return [...prev, "Exame Clínico"];
        }

        return prev;
      });
    }
  };

  // ---------------------------------------------------------
  // Vincular atendimento
  // ----------------------------------------------------------
  const handleBindService = async (value: boolean) => {
    setIsBindServiceSelected(value);

    if (!empresa || !codigoFuncionario) return;

    // pela lógica implementada a negação faz a busca quando o check for true
    if (value) {
      const url = `${NEST_SCHEDULINGS_RECORDS}empresa=${empresa}&funcionario=${codigoFuncionario}&ficha=${funcionarioSelecionado?.SEQUENCIAFICHA}`;
      const response = await fetch(url);

      if (response.ok) {
        const records: AsoFuncionarioDto[] = await response.json();

        if (records && records.length > 0) {
          setRecords(records);
        }
      }
    }
  };

  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const files = event.target.files;

    if (files) {
      const arrFiles = Array.from(files);

      for (const file of arrFiles) {
        setFilesUpload((prev) => [...prev, file]);
      }
    }
  };

  const handleRemoveFile = (fileName: string) => {
    setFilesUpload((prev) => prev.filter((f) => f.name !== fileName));
    funcionarioSelecionado!.ANEXOS = funcionarioSelecionado!.ANEXOS.filter(
      (f) => f.Name !== fileName,
    );
  };

  const updateTicketFuncionarioSelecionado = useCallback(
    async (ticket: Ticket) => {
      if (ticket && funcionarioSelecionado) {
        ticket.atendente = user.nome;
        ticket.sala = salaSelecionada;
        ticket.preferencialTipo = preferencialTipo;
        ticket.status = TicketStatus.AGUARDANDO;
        ticket.grupo = TicketGroups.EXAME;

        funcionarioSelecionado.TICKET = ticket;
      } else if (funcionarioSelecionado) {
        // Se for lançado sem vinculo de ticket, realiza a "emissão"
        // direto para o servidor como fosse o mesmo da recepção

        const ticketPrefix = preferencialTipo === "" ? "" : "P"; // Caso não houver info preferencial padrão é normal

        const ticket: TicketEmitedDto = {
          emissao: new Date(),
          numero: 0,
          prefixo: ticketPrefix,
          preferencial: ticketPrefix === "P",
          status: TicketStatus.EM_ATENDIMENTO,
          type: WebsocketType.TICKET,
          unidade: unidadeSelecionada,
          grupo: TicketGroups.EXAME,
        };

        try {
          const response = await fetch(NEST_TICKETS_URL, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Accept: "application/json",
            },
            body: JSON.stringify(ticket),
          });

          if (!response.ok) {
            throw new Error("Erro ao emitir o ticket.");
          }

          const ticketResponse: Ticket = await response.json();

          ticketResponse.atendente = user.nome;
          ticketResponse.sala = salaSelecionada;
          ticketResponse.preferencialTipo = preferencialTipo;
          ticketResponse.status = TicketStatus.AGUARDANDO;
          ticketResponse.grupo = TicketGroups.EXAME;

          funcionarioSelecionado!.TICKET = ticketResponse;
          ticketSelecionado = ticketResponse;
        } catch (e) {
          console.error(e);
          alert(`Erro durante processamento do ticket`);
        }
      } else {
        alert("Não foi possível criar vinculo ticket ao funcionário");
      }
    },
    [
      ticketSelecionado,
      preferencialTipo,
      funcionarioSelecionado,
      unidadeSelecionada,
    ],
  );

  const handlePreparationModal = () => {
    setIsOpenPreparationModal(true);
  };

  // Função que faz o print da guia de atendimento
  const handlePrint = () => {
    if (!funcionarioSelecionado) alert("Selecione um funcionário");
    else {
      const htmlContent = reportInternal(funcionarioSelecionado);
      const printWindow = window.open("", "_blank", "width=900,height=800");

      if (printWindow) {
        printWindow.document.open();
        printWindow.document.write(htmlContent);
        printWindow.document.close();

        // opcional: aguarda o carregamento antes de imprimir
        printWindow.onload = () => {
          printWindow.focus();
        };
      }
    }
  };

  // ---------------------------------------------------------
  // Submit
  // ---------------------------------------------------------
  const handleSubmit = useCallback(async () => {
    setShowErrors(true);
    if (!validation.all || isSubmitting || !funcionarioSelecionado || !socket)
      return;

    setIsSubmitting(true);
    const formData = new FormData();

    await updateTicketFuncionarioSelecionado(ticketSelecionado!);
    funcionarioSelecionado.UNIDADEATENDIMENTO = unidadeSelecionada;
    funcionarioSelecionado.ANOTACOES = anotacoes.toUpperCase();

    // Adiciona códigos de prontuários
    if (recordsCodes && recordsCodes.size > 0) {
      funcionarioSelecionado.PRONTUARIOSVINCULADOS = Array.from(recordsCodes);
    }

    // Adiciona anexos do upload
    if (filesUpload && filesUpload.length > 0) {
      // funcionarioSelecionado.ANEXOS.push(...filesUpload)
      for (const item of filesUpload) {
        formData.append("files", item);
      }
    }

    // Caso tiver vindo do preparo finalizado, limpa a listagem
    if (funcionarioSelecionado.TICKET.id)
      onSetPreparacaoFinalizada((prev) =>
        prev.filter((e) => e.ticketId != funcionarioSelecionado.TICKET.id),
      );

    if (psicoPresencial) {
      const psicoIndex = funcionarioSelecionado.EXAMES.findIndex(
        (e) => e.grupo === "Psicossocial",
      );

      funcionarioSelecionado.EXAMES[psicoIndex] = {
        ...funcionarioSelecionado.EXAMES[psicoIndex],
        preparacao: "Entrevista presencial",
      };
    }

    try {
      formData.append("scheduling", JSON.stringify(funcionarioSelecionado));
      formData.append("somentepa", String(somentePa));

      const submmitResponse = await fetch(NEST_SCHEDULINGS_UPDATE, {
        method: "POST",
        body: formData,
      });

      if (submmitResponse.ok) {
        onExecutarAcao(
          funcionarioSelecionado.TICKET.id,
          TicketActionType.EXAME,
          unidadeSelecionada,
          socket,
          salaSelecionada,
          user.nome,
          funcionarioSelecionado._id,
        );

        alert("Atendimento enviado com sucesso");
        onClose();
      }
    } catch (err) {
      alert(`Erro ao submeter atendimento: ${err}`);
    } finally {
      setIsSubmitting(false);
    }
  }, [
    validation.all,
    isSubmitting,
    codigoFuncionario,
    empresa,
    nome,
    tipoExame,
    codigoExames,
    preferencialTipo,
    anotacoes,
    filesUpload,
    recordsCodes,
    ticketSelecionado,
    selectedSchedulingId,
    funcionarioSelecionado,
    psicoPresencial,
  ]);

  // Prevent rendering when closed
  if (!isOpen) return null;

  const LoadingOverlay = () => (
    <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-50 flex items-center justify-center rounded-lg">
      <div className="text-center">
        <div className="flex flex-col items-center gap-4">
          {/* Spinner animado */}
          <Spinner color="success" size="lg" variant="default" />

          {/* Texto de loading */}
          <div className="space-y-1">
            <p className="text-sm font-medium text-gray-700">Processando...</p>
            <p className="text-xs text-gray-500">Buscando informações</p>
          </div>

          {/* Barra de progresso sutil */}
          {/* <div className="w-32 h-1 bg-gray-200 rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-[#104e35] to-[#a6ce39] rounded-full animate-pulse"></div>
        </div> */}
        </div>
      </div>
    </div>
  );

  // ---------------------------------------------------------
  // Paciente item memoizado (para react-window) - com indicação de selecionado
  // ---------------------------------------------------------
  const PacienteItem = React.memo(function _PacienteItem({
    index,
    style,
    data,
  }: ListChildComponentProps & { data?: Scheduling[] }) {
    const paciente: Scheduling = (data as Scheduling[])[index];
    const isSelected = selectedSchedulingId === paciente.CODIGOPRONTUARIO;

    // Renderiza o card sem o Tooltip se não houver observações
    if (!paciente.OBSERVACOES) {
      return (
        <div
          className="px-2 py-1"
          id={`card-${paciente.CODIGOPRONTUARIO}`}
          style={style}
        >
          <div
            onClick={() => {
              if (isSelected) {
                handleDeselecionarAgendamento();
              } else {
                handleSelecionarPacienteAgendamento(paciente);
              }
            }}
            // Adicionei a classe 'relative' para que o chip 'absolute' funcione
            className={` p-2 rounded-lg border cursor-pointer transition-all duration-200 ${
              isSelected
                ? "bg-[#e6f0ff] border-[#003366] ring-2 ring-[#003366]/20 shadow-md"
                : "bg-white border-gray-200 hover:border-[#003366] hover:shadow-sm hover:scale-[1.01]"
            }`}
          >
            {/* Conteúdo do card */}
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <div
                    className={`font-medium text-sm truncate ${isSelected ? "text-[#003366]" : ""}`}
                  >
                    {paciente.NOME}
                  </div>
                  {isSelected && (
                    <Chip
                      className="ml-2"
                      color="primary"
                      size="sm"
                      variant="solid"
                    >
                      Selecionado
                    </Chip>
                  )}
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-600 mb-1">
                  <span className="truncate">{paciente.NOMEEMPRESA}</span>
                </div>
                <div className="flex items-center text-xs text-gray-500 gap-2">
                  <Clock className="h-3 w-3 text-gray-400" />
                  <span>
                    {paciente.HORARIO} - {paciente.TIPOEXAMENOME}
                  </span>
                </div>
              </div>
            </div>
            {/* Chip do ASOSTATUS fixo no canto inferior direito */}
            {paciente.ASOSTATUS === AsoStatus.GERADO && (
              <div className=" bottom-2 right-4 text-green-400">
                <span
                  className={`text-left text-xs text-${getStatusColor(paciente.ATENDIMENTOSTATUS)}-500`}
                >
                  {paciente.ATENDIMENTOSTATUS.replace(/_/g, " ").replace(
                    /\b\w/g,
                    (l: string) => l.toUpperCase(),
                  )}
                </span>
              </div>
            )}

            {paciente.ASOSTATUS === AsoStatus.KIT_CREDENCIADA && (
              <div className=" bottom-2 right-2 text-yellow-400">
                <span className="text-xs">{paciente.ASOSTATUS}</span>
              </div>
            )}
          </div>
        </div>
      );
    }

    // Renderiza o card com o Tooltip se houver observações
    return (
      <div className="px-2 py-1" style={style}>
        <Tooltip
          key={`tooltip-obscard-${paciente.CODIGOPRONTUARIO}`}
          color="warning"
          content={
            <div className="px-1 py-2 max-w-xs">
              <p className="text-xs break-words font-medium">OBSERVAÇÃO:</p>
              <p className="text-xs break-words">{paciente.OBSERVACOES}</p>
            </div>
          }
          placement="right"
        >
          <div
            onClick={() => {
              if (isSelected) {
                handleDeselecionarAgendamento();
              } else {
                handleSelecionarPacienteAgendamento(paciente);
              }
            }}
            // Adicionei a classe 'relative' para que o chip 'absolute' funcione
            className={`relative p-2 rounded-lg border cursor-pointer transition-all duration-200 ${
              isSelected
                ? "bg-[#e6f0ff] border-[#003366] ring-2 ring-[#003366]/20 shadow-md"
                : "bg-white border-gray-200 hover:border-[#003366] hover:shadow-sm hover:scale-[1.01]"
            }`}
          >
            {/* Conteúdo do card */}
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <InformationCircleIcon className={`h-4 w-4 text-amber-500`} />
                  <div
                    className={`font-medium text-sm truncate ${isSelected ? "text-[#003366]" : ""}`}
                  >
                    {paciente.NOME}
                  </div>
                  {isSelected && (
                    <Chip
                      className="ml-2"
                      color="primary"
                      size="sm"
                      variant="solid"
                    >
                      Selecionado
                    </Chip>
                  )}
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-600 mb-1">
                  <Building2 className="h-3 w-3 text-gray-400" />
                  <span className="truncate">{paciente.NOMEEMPRESA}</span>
                </div>
                <div className="flex items-center text-xs text-gray-500 gap-2">
                  <Clock className="h-3 w-3 text-gray-400" />
                  <span>
                    {paciente.HORARIO} - {paciente.TIPOEXAMENOME}
                  </span>
                </div>
              </div>
            </div>
            {/* Chip do ASOSTATUS fixo no canto inferior direito */}
            {paciente.ASOSTATUS === AsoStatus.GERADO && (
              <div className="absolute bottom-2 right-2  text-green-400">
                <span className="text-xs">ASO OK</span>
              </div>
            )}
          </div>
        </Tooltip>
      </div>
    );
  });

  // ---------------------------------------------------------
  // Render
  // ---------------------------------------------------------
  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div
        ref={containerRef}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl h-[90vh] flex flex-col overflow-hidden"
      >
        {/* HEADER */}
        <header className="flex items-center justify-between gap-4 p-2 bg-gradient-to-r from-[#395467] to-[#40b9b0] text-white">
          <div className="flex items-center gap-4">
            {/* Senha/Ticket em destaque */}
            {ticketSelecionado ? (
              <div className="flex items-center gap-3 bg-white/10 px-3 py-2 rounded-lg border border-white/20">
                <div className="text-center">
                  <div className="text-xs text-white/90">Senha</div>
                  <div className="font-bold text-3xl tracking-wide text-yellow-300">
                    {ticketSelecionado.prefixo + ticketSelecionado.numero}
                  </div>
                </div>
              </div>
            ) : (
              <FilePlus size={40} />
            )}
            <div>
              <h3 className="text-xl font-semibold">Atendimento</h3>
              <p className="text-sm opacity-90">
                Preencha os dados para iniciar o atendimento
              </p>
            </div>
          </div>

          {/* Close button */}
          <div className="ml-2">
            <Button
              isIconOnly
              aria-label="Fechar modal"
              className="bg-white/10 hover:bg-white/20 text-white rounded-full h-12 w-12 p-0"
              size="lg"
              variant="light"
              onPress={onClose}
            >
              <X className="h-6 w-6" />
            </Button>
          </div>
        </header>

        {/* BODY: left=form (scroll), right=sidebar (scroll) */}
        <div className="flex-1 flex min-h-0">
          {/* FORM (esquerda) */}
          <main className="flex-1 min-h-0 overflow-y-auto p-3 relative">
            {/* Overlay de Loading */}
            {isLoading && <LoadingOverlay />}

            {/* Conteúdo do modal (fica desabilitado durante o loading) */}
            <div
              className={`max-w-3xl mx-auto space-y-3 transition-opacity duration-300 ${
                isLoading ? "opacity-50 pointer-events-none" : "opacity-100"
              }`}
            >
              {/* Indicador de agendamento selecionado */}
              {selectedSchedulingId && (
                <div
                  className="bg-blue-50 border border-blue-200 rounded-lg p-1 flex items-center justify-between"
                  id="empresa-autocomplete"
                >
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-blue-600" />
                    <span className="text-sm text-blue-800">
                      Agendamento selecionado:{" "}
                      <strong>{selectedSchedulingId}</strong>
                    </span>
                  </div>
                  <Button
                    className="text-blue-600 hover:bg-blue-100"
                    disabled={isLoading}
                    size="sm"
                    variant="light"
                    onPress={handleDeselecionarAgendamento}
                  >
                    <X className="h-3 w-3 mr-1" />
                    Desselecionar
                  </Button>
                </div>
              )}

              {/* Empresa (obrigatório) */}
              <div>
                <Autocomplete
                  aria-label="Selecione a empresa"
                  className="w-full"
                  defaultItems={socCompanies}
                  inputProps={{
                    className:
                      showErrors && !validation.empresa
                        ? "ring-1 ring-amber-300"
                        : "",
                  }}
                  isDisabled={isLoading}
                  label={"Empresa"}
                  selectedKey={empresa || ""}
                  size="sm"
                  onSelectionChange={(key) => setEmpresa(String(key))}
                >
                  {(item: CadastroEmpresa) => (
                    <AutocompleteItem
                      key={item.CODIGO}
                      textValue={item.RAZAOSOCIAL}
                    >
                      <div className="flex justify-between">
                        <span className="text-sm font-medium">
                          {item.RAZAOSOCIAL}
                        </span>
                        <span className="text-xs text-gray-500">
                          Cód {item.CODIGO}
                        </span>
                      </div>
                    </AutocompleteItem>
                  )}
                </Autocomplete>

                {showErrors && !validation.empresa && (
                  <div className="text-xs text-amber-700 mt-1">
                    Informe a empresa.
                  </div>
                )}
              </div>

              {/* Código funcionário (compact) e Nome funcionário */}
              <section className="flex items-baseline gap-2">
                <div className="mt-1">
                  <Input
                    aria-label="Código do funcionário"
                    className={`flex-1 ${showErrors && !codigoFuncionario ? "ring-1 ring-amber-300" : ""}`}
                    disabled={isLoading}
                    endContent={
                      codigoFuncionario != "" &&
                      empresa && (
                        <Button
                          aria-label="Buscar funcionário"
                          className="bg-transparent"
                          disabled={isLoading}
                          isIconOnly={true}
                          size="sm"
                          type="button"
                          onPress={handleBuscarFuncionario}
                        >
                          <Tooltip
                            key={`tooltip-searchbutton-${funcionarioSelecionado?.CODIGOPRONTUARIO}`}
                            color="foreground"
                            content="Buscar funcionário"
                            disableAnimation={true}
                          >
                            <UserRoundSearch />
                          </Tooltip>
                        </Button>
                      )
                    }
                    inputMode="numeric"
                    label={"Código SOC"}
                    size="sm"
                    value={codigoFuncionario}
                    onChange={(e: any) => {
                      const val = e.target.value;

                      if (/^\d*$/.test(val)) setCodigoFuncionario(val);
                    }}
                  />
                </div>

                {/* Nome do funcionário (obrigatório) */}
                <div className="w-full">
                  <Input
                    aria-invalid={!validation.nome && showErrors}
                    className={`${showErrors && !validation.nome ? "ring-1 ring-amber-300" : ""}`}
                    disabled={isLoading}
                    endContent={
                      <Tooltip
                        key={`clipboard-copy-tooltip-${funcionarioSelecionado?.SCHEDULINGCODE}`}
                        color="foreground"
                        content="Copiar nome"
                        disableAnimation={true}
                      >
                        <Button
                          aria-label="Copiar nome"
                          isIconOnly={true}
                          size="sm"
                          type="button"
                          variant="light"
                          onPress={() => copyToClipboard(nome)}
                        >
                          <Copy />
                        </Button>
                      </Tooltip>
                    }
                    label={"Nome completo"}
                    size="sm"
                    value={nome}
                    onChange={(e: any) => setNome(e.target.value.toUpperCase())}
                  />
                  {showErrors && !validation.nome && (
                    <div className="text-xs text-amber-700 mt-1">
                      Informe o nome do funcionário.
                    </div>
                  )}
                </div>
              </section>

              {/* Informações adicionais: Nascimento, CPF, Horário */}
              <section className="flex gap-2">
                <Input
                  className="text-xs"
                  disabled={isLoading}
                  label={"Data Nascimento"}
                  maxLength={10}
                  size="sm"
                  value={dataNascimento}
                  onChange={(e) => handleDataNascimento(e.target.value)}
                />
                <Input
                  className="text-xs"
                  disabled={isLoading}
                  label={"CPF"}
                  size="sm"
                  value={cpf}
                  onChange={(e) => handleCpfInput(e.target.value)}
                />
                <Input
                  readOnly
                  className="text-xs"
                  disabled={isLoading}
                  label={"Horário"}
                  size="sm"
                  value={
                    funcionarioSelecionado?.HORARIO
                      ? funcionarioSelecionado.HORARIO
                      : undefined
                  }
                />
                <Input
                  className="text-xs"
                  disabled={isLoading}
                  label={"Telefone"}
                  size="sm"
                  value={telefone}
                  onChange={(e) => handleTelefoneInput(e.target.value)}
                />
              </section>

              <section className="flex gap-2">
                <Input
                  readOnly
                  className="text-xs"
                  disabled={isLoading}
                  label={"Cargo"}
                  size="sm"
                  value={
                    funcionarioSelecionado?.NOMECARGO
                      ? funcionarioSelecionado.NOMECARGO
                      : undefined
                  }
                />
                <Input
                  readOnly
                  className="text-xs"
                  disabled={isLoading}
                  label={"Setor"}
                  size="sm"
                  value={
                    funcionarioSelecionado?.NOMESETOR
                      ? funcionarioSelecionado.NOMESETOR
                      : undefined
                  }
                />
                <Input
                  readOnly
                  className="text-xs"
                  disabled={isLoading}
                  label={"Unidade"}
                  size="sm"
                  value={
                    funcionarioSelecionado?.NOMEUNIDADE
                      ? funcionarioSelecionado.NOMEUNIDADE
                      : undefined
                  }
                />
              </section>

              {/* Tipo de Exame - ToggleGroup (acessível) */}
              <div className="mt-8">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-gray-700">
                    Tipo de Exame *
                  </label>
                </div>

                <div
                  aria-label="Tipo de exame"
                  className="grid grid-cols-3 mt-2 gap-2 flex-wrap"
                  role="radiogroup"
                >
                  {Object.entries(TIPOS_EXAME).map(([key, value]) => {
                    const active = tipoExame === value;

                    return (
                      <Button
                        key={key}
                        aria-checked={active}
                        className={`px-3 py-1.5 rounded-md text-xs border transition  ${
                          active
                            ? "bg-[#6AA84F] text-white border-[#6AA84F]"
                            : "bg-white text-gray-700 border-gray-200 hover:border-[#003366]"
                        } ${isLoading ? "opacity-50 cursor-not-allowed" : ""}`}
                        disableAnimation={true}
                        disabled={isLoading}
                        role="radio"
                        size="sm"
                        type="button"
                        onChange={() => handleToggleTipo(key)}
                      >
                        {value}
                      </Button>
                    );
                  })}
                </div>

                {showErrors && !validation.tipoExame && (
                  <div className="text-xs text-amber-700 mt-1">
                    Selecione o tipo de exame.
                  </div>
                )}

                <div className="mt-4">
                  {empresa && codigoFuncionario && funcionarioSelecionado && (
                    <div className="flex justify-end">
                      <Checkbox
                        color="danger"
                        disabled={isLoading}
                        isSelected={somentePa}
                        onValueChange={handleSomentePa}
                      >
                        <span
                          className={`text-sm ${somentePa ? "text-red-600" : "text-gray-700"}`}
                        >
                          Somente P.A
                        </span>
                      </Checkbox>

                      {/* <Checkbox
                      color="success"
                      disabled={isLoading}
                      isSelected={isBindServiceSelected}
                      onValueChange={handleBindService}
                    >
                      <span className="text-sm text-gray-700">
                        Vincular ASO
                      </span>
                    </Checkbox> */}
                    </div>
                  )}

                  {isBindServiceSelected && (
                    <div className="mt-1 flex flex-col align-center items-start space-x-2">
                      <div className="mt-2 mb-2">
                        {records && (
                          <Select
                            className="min-w-lg"
                            disabled={isLoading}
                            label="Prontuários"
                            placeholder="prontuários disponíveis"
                            selectedKeys={recordsCodes}
                            selectionMode="multiple"
                            size="sm"
                            onSelectionChange={(keys) => {
                              const stringKeys = new Set(
                                Array.from(keys).map(String),
                              );

                              setRecordsCodes(stringKeys);
                            }}
                          >
                            {records.map((rec) => (
                              <SelectItem key={String(rec.IDFICHA)}>
                                {`${convertTipoAsoNome(rec.TPASO)} - ${rec.DATAFICHA} - ${convertRespAso(rec.RESASO)}`}
                              </SelectItem>
                            ))}
                          </Select>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Exames (checkbox grid) */}
              <div>
                <div className="flex items-center justify-start mb-2">
                  <div className="text-xs text-gray-400">
                    {codigoExames.length} selecionado(s)
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {Object.keys(EXAMES_LIST).map((exame, index) => {
                    const isSelected = codigoExames.includes(exame);

                    return (exame === "Laboratório" || exame === "Raio-X") &&
                      isSelected ? (
                      <Tooltip
                        key={`tooltip-exame-${exame}-${index}`}
                        className="p-2 bg-amber-100"
                        content={
                          exame == "Laboratório"
                            ? laboratorialExames?.map((e, i) => (
                                <span key={`lab-${i}`} className="text-xs">
                                  {e}
                                </span>
                              ))
                            : examesImagem?.map((e, i) => (
                                <span key={`img-${i}`} className="text-xs">
                                  {e}
                                </span>
                              ))
                        }
                        disableAnimation={true}
                      >
                        <Button
                          key={exame}
                          aria-checked={isSelected}
                          className={`px-3 py-1.5 rounded-md justify-start items-center text-xs border transition ${
                            isSelected
                              ? "bg-[#6AA84F] text-white font-medium border-[#6AA84F]"
                              : "bg-white text-gray-700 border-gray-200 hover:border-[#003366]"
                          } ${isLoading ? "opacity-50 cursor-not-allowed" : ""}`}
                          disableAnimation={true}
                          disabled={isLoading}
                          role="radio"
                          size="sm"
                          type="button"
                          onChange={() => toggleExame(exame)}
                        >
                          {exame}
                        </Button>
                      </Tooltip>
                    ) : (
                      <Button
                        key={exame}
                        aria-checked={isSelected}
                        className={`px-3 py-1.5 rounded-md justify-start items-center text-xs border transition ${
                          isSelected
                            ? "bg-[#6AA84F] text-white font-medium border-[#6AA84F]"
                            : "bg-white text-gray-700 border-gray-200 hover:border-[#003366]"
                        } ${isLoading ? "opacity-50 cursor-not-allowed" : ""}`}
                        disableAnimation={true}
                        disabled={isLoading}
                        role="radio"
                        size="sm"
                        type="button"
                        onChange={() => toggleExame(exame)}
                      >
                        {exame.includes("Psico") && isSelected ? (
                          <div className="flex justify-between items-baseline-last w-full">
                            <span>{exame}</span>
                            <span>
                              Com psico.{" "}
                              <Switch
                                checked={psicoPresencial}
                                color="warning"
                                disabled={isLoading}
                                id="psicossocial-switch"
                                size="md"
                                onValueChange={handlePsicoExame}
                              />
                            </span>
                          </div>
                        ) : (
                          <span>{exame}</span>
                        )}
                      </Button>
                    );
                  })}
                </div>

                {showErrors && !validation.exames && (
                  <div className="text-xs text-amber-700 mt-1">
                    Marque ao menos 1 exame.
                  </div>
                )}
              </div>

              {/* Observações */}
              {observacoes && (
                <div className="p-2.5 bg-amber-50 rounded-lg border border-amber-200">
                  <div className="text-xs text-amber-700 flex justify-baseline gap-2">
                    <Info className="h-4 w-4" />
                    <strong>Observações:</strong> {observacoes}
                  </div>
                </div>
              )}

              {/* Anexos */}
              {anexos.length > 0 && (
                <div>
                  <label className="text-sm font-medium text-gray-700">
                    Anexos
                  </label>
                  {anexos.map((anexo: FileUpload, index) => (
                    <Button
                      key={anexo.Name || index}
                      color="default"
                      disabled={isLoading}
                      size="sm"
                      variant="light"
                      onPress={() => handleViewAttachment(anexo)}
                    >
                      {anexo.Name}
                    </Button>
                  ))}
                </div>
              )}

              {/* Anotações */}
              <div>
                <label className="text-sm font-medium text-gray-700">
                  Anotações
                </label>
                <Textarea
                  isClearable
                  className="resize-none"
                  disabled={isLoading}
                  label="Informações internas"
                  minRows={2}
                  value={anotacoes}
                  onValueChange={setAnotacoes}
                />
              </div>

              {/* Vincular prontuário */}
              <div>
                <div>
                  <input
                    multiple
                    accept=".pdf,image/*"
                    className="hidden"
                    disabled={isLoading}
                    id="file-upload"
                    type="file"
                    onChange={handleFileUpload}
                  />
                  <label
                    className={`cursor-pointer text-xs inline-flex items-center px-3 py-2 rounded-full ${
                      isLoading
                        ? "bg-gray-400 text-gray-200 cursor-not-allowed"
                        : "bg-gray-500 text-white hover:bg-gray-600"
                    }`}
                    htmlFor="file-upload"
                  >
                    Anexos {filesUpload.length > 0 ? filesUpload.length : ""}
                  </label>
                  {filesUpload.map((file) => (
                    <Chip
                      key={file.name}
                      className="mt-2 text-xs"
                      size="sm"
                      onClose={() => handleRemoveFile(file.name)}
                    >
                      {file.name}
                    </Chip>
                  ))}
                </div>
              </div>

              {/* Atendimento Preferencial */}
              {ticketSelecionado?.preferencial || ticketSelecionado == null ? (
                <div>
                  <label className="text-sm font-medium text-gray-700">
                    Atendimento Preferencial
                  </label>
                  <div className="mt-2 flex gap-2">
                    {PREFERENCIAL_OPTIONS.map((pref) => {
                      const active = preferencialTipo === pref;

                      return (
                        <Button
                          key={pref}
                          className={`px-3 py-1 rounded-md text-sm border transition ${
                            active
                              ? "bg-[#6AA84F] text-white border-[#6AA84F]"
                              : "bg-white text-gray-700 border-gray-200 hover:border-[#003366]"
                          } ${isLoading ? "opacity-50 cursor-not-allowed" : ""}`}
                          disabled={isLoading}
                          type="button"
                          value={pref}
                          onPress={(e: any) =>
                            togglePreferencial(e.target.value)
                          }
                        >
                          {pref}
                        </Button>
                      );
                    })}
                  </div>
                </div>
              ) : (
                ""
              )}
            </div>
          </main>

          {/* SIDEBAR (direita) */}
          <aside className="w-80 border-l border-gray-200 bg-gray-100 flex flex-col min-h-0">
            <div className="p-3 border-b border-gray-200 bg-white">
              <div className="flex justify-between mb-2">
                {/* <div className="p-2 rounded ">
                  <Calendar className="h-5 w-5 " />
                </div> */}
                <div>
                  <h4 className="font-medium">Atendimentos</h4>
                  <div className="text-xs text-gray-500">
                    {filteredAgendamentos.length} funcionários
                  </div>
                </div>

                <Select
                  className="max-w-26"
                  defaultSelectedKeys={["all"]}
                  disableAnimation={true}
                  required={true}
                  selectionMode="single"
                  size="sm"
                  variant="underlined"
                  onChange={(key) => {
                    handleDeselecionarAgendamento();
                    setStatusFilter(key.target.value);
                  }}
                >
                  <SelectItem key={"all"} variant="light">
                    Todos
                  </SelectItem>
                  <SelectItem key={"MANHA"} variant="light">
                    Manhã
                  </SelectItem>
                  <SelectItem key={"TARDE"} variant="light">
                    Tarde
                  </SelectItem>
                </Select>
              </div>

              {/* Search */}
              <div className="relative">
                <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Buscar funcionário, empresa ou CPF..."
                  size="sm"
                  value={searchTerm}
                  onChange={(e: any) => setSearchTerm(e.target.value)}
                />
                {searchTerm && (
                  <Button
                    isIconOnly
                    className="absolute right-1 top-1/2 -translate-y-1/2"
                    size="sm"
                    variant="light"
                    onPress={() => setSearchTerm("")}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                )}
              </div>
            </div>

            <div className="flex-1 overflow-hidden">
              {filteredAgendamentos.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-gray-500 p-4">
                  <Filter className="h-10 w-10 mb-2 text-gray-300" />
                  <div className="text-sm text-center">
                    {searchTerm
                      ? "Nenhum paciente encontrado"
                      : "Nenhum agendamento para hoje"}
                  </div>
                </div>
              ) : (
                <List
                  ref={listRef}
                  className="overflow-auto min-h-full"
                  height={280}
                  itemCount={filteredAgendamentos.length}
                  itemData={filteredAgendamentos}
                  itemSize={110} // Aumentado para acomodar o chip de selecionado
                  width={"100%"}
                >
                  {(props) => (
                    <PacienteItem {...props} data={filteredAgendamentos} />
                  )}
                </List>
              )}
            </div>
          </aside>
        </div>

        {/* FOOTER (fora do scroll) */}
        <footer className="border-t border-gray-200 bg-white p-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {showErrors && !validation.all && (
              <div className="text-xs text-amber-700 bg-amber-50 px-2 py-1 rounded border border-amber-200">
                Corrija os campos obrigatórios
              </div>
            )}
          </div>

          <div className="flex items-center gap-3">
            <Button
              className="px-4 py-2 rounded hover:bg-gray-100"
              disabled={isSubmitting}
              variant="flat"
              onPress={handlePreparationModal}
            >
              <FileInput className="h-4 w-4 mr-2" /> Preparar documentação
            </Button>
            <Button
              className="px-4 py-2 rounded hover:bg-gray-100"
              disabled={isSubmitting}
              variant="flat"
              onPress={handlePrint}
            >
              <PrinterCheck className="h-4 w-4 mr-2" /> Guia
            </Button>
            <Button
              className="px-4 py-2 rounded hover:bg-gray-100"
              disabled={isSubmitting}
              variant="flat"
              onPress={onClose}
            >
              <X className="h-4 w-4 mr-2" /> Cancelar
            </Button>

            <Button
              className="px-4 py-2 rounded bg-gradient-to-r from-[#003366] to-[#6AA84F] text-white hover:shadow-lg transition-all duration-200"
              isDisabled={!validation.all || isSubmitting}
              isLoading={isSubmitting}
              onPress={handleSubmit}
            >
              {isSubmitting ? (
                <>Enviado...</>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" /> Enviar Atendimento
                </>
              )}
            </Button>
          </div>
        </footer>
      </div>

      {socket && funcionarioSelecionado && (
        <EmPreparacaoModal
          funcionario={funcionarioSelecionado}
          isOpen={isOpenPreparationModal}
          salaSelecionada={salaSelecionada}
          socket={socket}
          ticket={ticketSelecionado ?? null}
          unidadeSelecionada={unidadeSelecionada}
          onOpenChange={setIsOpenPreparationModal}
        />
      )}
    </div>
  );
};

export default React.memo(AtendimentoModal);
