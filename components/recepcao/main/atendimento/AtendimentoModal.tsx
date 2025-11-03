// AtendimentoModalComplete.tsx
"use client"

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react"
import {
  Calendar,
  Search as IconSearch,
  Clock,
  Building2,
  User,
  X,
  Filter,
  Send,
  Save,
  Ticket as IconTicket,
  Image as ImageIcon,
  FilePlus,
  Info,
  UserRoundSearch,
  Copy,
  TimerIcon,
  Pause,
  FileInput,
} from "lucide-react"
import { Input, Button, Chip, Textarea, Autocomplete, AutocompleteItem, Tooltip, Select, SelectItem, Switch, user, addToast, SharedSelection } from "@heroui/react"
import { FixedSizeList as List, ListChildComponentProps } from "react-window"
import { PreparationRequest, Ticket, TicketActionType, TicketEmitedDto, TicketGroups, TicketStatus, TicketTypes } from "@/lib/ticket/ticket"

import { CadastroEmpresa } from "@/lib/soc/interfaces/CadastroEmpresa"
import { EMPRESAS_COM_PSICOLOGA, EXAMES_LIST, NEST_SCHEDULINGS, NEST_SCHEDULINGS_RECORDS, NEST_SOC_PEDIDOEXAME, NEST_TICKETS_URL, PREFERENCIAL_OPTIONS, TIPOS_EXAME } from "@/config/constants"
import { AsoStatus, AtendimentoStatus } from "@/lib/scheduling/enum/scheduling.enum"
import { InformationCircleIcon } from "@heroicons/react/24/outline"
import { FileUpload, Scheduling } from "@/lib/scheduling/interface/scheduling"
import { convertRespAso, convertTipoAsoNome, copyToClipboard, formatBrithdayDate, formatCPF, toBase64 } from "@/lib/utils"
import { WebsocketType } from "@/lib/websocket/enums/websocket.enum"
import { IUserInfo } from "@/lib/user/interfaces/IUser"
import { AsoFuncionarioDto } from "@/lib/soc/interfaces/AsoFuncionario"
import EmPreparacaoModal from "./PreparoModal"
import { Socket } from "socket.io-client"



interface AtendimentoModalProps {
  isOpen: boolean
  onClose: () => void
  agendamentos: Scheduling[]
  ticketSelecionado: Ticket | null
  socCompanies: CadastroEmpresa[]
  unidadeSelecionada: string
  salaSelecionada: string
  user:IUserInfo
  socket: Socket | null
  onSetPreparacaoFinalizada: React.Dispatch<React.SetStateAction<PreparationRequest[]>>;
  onExecutarAcao: (    
    ticketId: number,
    action: TicketActionType,
    unidade:string,
    socket: Socket,
    sala?: string,
    user?: string,
  ) => void;
}

export default function AtendimentoModalComplete({
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
}: AtendimentoModalProps) {


  const [isLoading, setIsLoading] = useState(false);
  const [codigoFuncionario, setCodigoFuncionario] = useState<string>("")
  const [empresa, setEmpresa] = useState<string>("")
  const [nome, setNome] = useState<string>("")
  const [dataNascimento, setDataNascimento] = useState<string>("")
  const [cpf, setCpf] = useState<string>("")
  const [tipoExame, setTipoExame] = useState<string>("") // ToggleGroup value
  const [codigoExames, setCodigoExames] = useState<string[]>([])
  const [psicoPresencial, setPsicoPresencial] = useState<boolean>(false)
  const [laboratorialExames, setLaboratorioExames] = useState<string[]>()
  const [examesImagem, setExamesImagem] = useState<string[]>()
  const [preferencialTipo, setPreferencialTipo] = useState<string>("") // '' | 'gestante' | 'idoso' | 'pcd'
  const [observacoes, setObservacoes] = useState<string>("")
  const [anotacoes, setAnotacoes] = useState<string>("")
  const [anexos, setAnexos] = useState<FileUpload[]>([])
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false)
  const [isBindServiceSelected, setIsBindServiceSelected] = useState<boolean>(false);
  const [filesUpload, setFilesUpload] = useState<File[]>([]);
  const [funcionarioSelecionado, setFuncionarioSelecionado] = useState<Scheduling|null>(null);
  const [records, setRecords] = useState<AsoFuncionarioDto[]>()
  const [recordsCodes, setRecordsCodes] = useState<Set<string>>(new Set());
  const [isOpenPreparationModal, setIsOpenPreparationModal] = useState(false);

  // referencia para o sidebar dos cards
  const listRef = useRef<any>(null);


  // Controls when error labels are shown
  const [showErrors, setShowErrors] = useState<boolean>(false)

  // Controle de agendamento selecionado
  const [selectedSchedulingId, setSelectedSchedulingId] = useState<string | null>(null)

  // Ref for containing element (for focus management if needed)
  const containerRef = useRef<HTMLDivElement | null>(null)



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
      preferencial: ticketSelecionado?.preferencial ? preferencialTipo.length > 0 : null,
      all: empresa.trim().length > 0 && codigoFuncionario.trim().length > 0 
            && nome.trim().length > 0 && tipoExame.trim().length > 0 
            && codigoExames.length > 0 && (ticketSelecionado?.preferencial ? preferencialTipo.length > 0 : true)
            && funcionarioSelecionado?.ATENDIMENTOSTATUS === AtendimentoStatus.AGENDADO
    }
  }, [empresa, codigoFuncionario, nome, tipoExame, codigoExames, preferencialTipo])





  // ---------------------------------------------------------
  // Keyboard shortcuts: ESC close, Enter submit (if valid)
  // ---------------------------------------------------------
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === "Escape") {
      onClose()
    } else if (e.key === "Enter") {
      // Avoid interfering with multi-line textarea Enter
      const active = document.activeElement
      const isTextarea = active && (active.tagName === "TEXTAREA" || (active as HTMLElement).getAttribute("role") === "textbox")
      if (!isTextarea && validation.all && !isSubmitting) {
        handleSubmit()
      }
    }
  }, [onClose, validation.all, isSubmitting])



  useEffect(() => {
    if (!isOpen) return
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [isOpen, handleKeyDown])





// ---------------------------------------------------------
// filtros de agendamentos: search + status (manhã/tarde/all)
// ---------------------------------------------------------
const [searchTerm, setSearchTerm] = useState<string>("")
const [statusFilter, setStatusFilter] = useState<string>("all")

const filteredAgendamentos = useMemo(() => {
  if (!agendamentos) return []
  const term = searchTerm.trim().toLowerCase()

  return agendamentos.filter((p) => {
    const matchesSearch =
      term === "" ||
      p.NOME.toLowerCase().includes(term) ||
      p.NOMEEMPRESA.toLowerCase().includes(term) ||
      p.CPFFUNCIONARIO?.toLowerCase().includes(term) 


    // 1. Caso "all" (todos)
    if (statusFilter === "all") {
      return matchesSearch
    }

    // 2. Trata o horário em branco ("") - Inclui em MANHÃ e TARDE
    if (p.HORARIO === "") {
      return matchesSearch // Se não tem horário, é incluído
    }

    const hora = parseInt(p.HORARIO.substring(0, 2), 10) 

    if (statusFilter === "MANHA") {
      const isManha = hora < 12
      return matchesSearch && isManha
    }
    
    if (statusFilter === "TARDE") {
      const isTarde = hora >= 12
      return matchesSearch && isTarde
    }

    // Se houver outros status (caso inesperado)
    return matchesSearch
  })
}, [agendamentos, searchTerm, statusFilter])





// ---------------------------------------------------------
// Actions: buscar funcionario por código (somente números) 
// ---------------------------------------------------------
const handleBuscarFuncionario = useCallback(async () => {
  if (!empresa || !codigoFuncionario) return alert("Informe empresa e código do funcionário");
  if (!unidadeSelecionada) return alert("Selecione uma unidade");

  try {
    setIsLoading(true);

    const response = await fetch(`${NEST_SOC_PEDIDOEXAME}codempresa=${empresa}&codfuncionario=${codigoFuncionario}`);

    if (response.ok) {
      const prontuario: Scheduling = await response.json();

      // Seleciona o paciente normalmente
      // handleDeselecionarAgendamento()
      await handleSelecionarPacienteAgendamento(prontuario);

      // Localiza o índice na lista
      const index = filteredAgendamentos.findIndex(
        (a) => a.CODIGOPRONTUARIO === prontuario.CODIGOPRONTUARIO
      );

      // Faz o scroll até o funcionário encontrado
      if (index !== -1 && listRef.current) {
        listRef.current.scrollToItem(index, "center"); // pode ser "auto", "center" ou "smart"
      }

      return;
    } else {
      const { message } = await response.json();
      alert(message);
      handleDeselecionarAgendamento()
    }
  } catch (err) {
    alert(`Erro ao buscar funcionário: ${err}`);
    handleDeselecionarAgendamento()

  } finally {
    setIsLoading(false);
  }
}, [empresa, codigoFuncionario, unidadeSelecionada, filteredAgendamentos]);





  // ---------------------------------------------------------
  // Quando seleciona um paciente no sidebar
  // caso estiver com ASO OK, preenche formulário
  // do contrário realiza fetch ASO no SOC para preenchimento
  // ---------------------------------------------------------
  const handleSelecionarPacienteAgendamento = useCallback(async(paciente: Scheduling) => {
    document.getElementById('empresa-autocomplete')?.scrollIntoView({ behavior: 'smooth', block: 'start', inline: 'nearest' });

    handleDeselecionarAgendamento()
    setIsLoading(true)
    setFuncionarioSelecionado(paciente)
    
    if((paciente.ASOSTATUS === AsoStatus.GERADO || paciente.ASOSTATUS === AsoStatus.KIT_CREDENCIADA) && paciente.EXAMES.length > 0)
    {
      const pedidos = paciente.EXAMES
      
      // 1. Cria dois mapas: código -> grupo e código -> nome real
      const { codigoToGrupo, codigoToNome } = Object.entries(EXAMES_LIST).reduce(
        (acc, [grupo, examList]) => {
          examList.forEach((ex) => {
            ex.codigos.forEach((codigo) => {
              acc.codigoToGrupo[codigo] = grupo;
              acc.codigoToNome[codigo] = ex.nome;
            });
          });
          return acc;
        },
        { codigoToGrupo: {} as Record<string, string>, codigoToNome: {} as Record<string, string> }
      );

      // 2. Pega todos os códigos do paciente
      const examesToSet = pedidos.map((e) => e.codigoExame) || [];

      // 3. Converte códigos em nomes de grupos válidos
      const examesSelecionados = examesToSet
        .map((cod) => codigoToGrupo[cod])
        .filter(Boolean);

      setCodigoExames(examesSelecionados);

      // 4. Filtra só laboratório -> pega nomes REAIS dos exames
      const examesLaboratorio = examesToSet
        .filter((cod) => codigoToGrupo[cod] === "Laboratório")
        .map((cod) => codigoToNome[cod]);

      setLaboratorioExames(examesLaboratorio);

      // 5. Filtra só raio-x -> pega nomes REAIS dos exames
      const examesImagem = examesToSet
        .filter((cod) => codigoToGrupo[cod] === "Raio-X")
        .map((cod) => codigoToNome[cod]);

      setExamesImagem(examesImagem);

      handlePsicoExame()
    }

    else
    {
      /*
        Tratativa para ASO não OK - sem implementação no momento...
      */
    }

 
    setEmpresa(String(paciente.CODIGOEMPRESA) || String(""))
    setCodigoFuncionario(paciente.CODIGO || "")
    setNome(paciente.NOME || "")
    setDataNascimento(paciente.DATANASCIMENTO || "")
    setCpf(formatCPF(paciente.CPFFUNCIONARIO || ""))
    setTipoExame(TIPOS_EXAME[paciente.TIPOEXAMENOME] || "")
    setSelectedSchedulingId(paciente.SCHEDULINGCODE || "")
    setObservacoes(paciente.OBSERVACOES || "")
    setAnotacoes("")
    setPreferencialTipo("")
    setAnexos(paciente.ANEXOS?.map(a => a) || [])
    setIsBindServiceSelected(false)

    setIsLoading(false)
     
  }, [funcionarioSelecionado])

  


  // ---------------------------------------------------------
  // Reset form when modal opens/closes
  // ---------------------------------------------------------
  useEffect(() => {
    handleDeselecionarAgendamento()
    setSearchTerm("")
  }, [isOpen, onClose])


  // ---------------------------------------------------------
  // Função para "desclicar" um agendamento selecionado
  // ---------------------------------------------------------
  const handleDeselecionarAgendamento = useCallback(() => {
      // Reset form after successful submission
      setCodigoFuncionario("")
      setEmpresa( String(""))
      setNome("")
      setDataNascimento("")
      setCpf("")
      setTipoExame("")
      setCodigoExames([])
      setPsicoPresencial(false)
      setObservacoes("")
      setPreferencialTipo("")
      setAnotacoes("")
      setShowErrors(false)
      setSelectedSchedulingId(null)
      setAnexos([])
      setFilesUpload([])
      setIsBindServiceSelected(false)
      setRecords([])
      setRecordsCodes(new Set())
      setFuncionarioSelecionado(null)
  }, [])



  // ---------------------------------------------------------
  // Data de nascimento Modal
  // ---------------------------------------------------------
  const handleDataNascimento = (e: string) => {
    const formated = formatBrithdayDate(e)
    setDataNascimento(formated)
  }

  // ---------------------------------------------------------
  // CPF Modal
  // ---------------------------------------------------------
  const handleCpfInput = (e: string) => {
    const formated = formatCPF(e)
    setCpf(formated)
  }



  // ---------------------------------------------------------
  // Toggle Tipo de Exame - acessível (role="radiogroup")
  // ---------------------------------------------------------
  const handleToggleTipo = (key: string) => {
    const value = TIPOS_EXAME[key]
    setTipoExame((prev) => (prev === value ? "" : value))
  }





  // ---------------------------------------------------------
  // Exames list (compact) - função para desmarcar exames
  // ---------------------------------------------------------
const toggleExame = useCallback((exame: string) => {
  setCodigoExames((prev) => {
    if (prev.includes(exame)) {
      // já estava selecionado → remove
      return prev.filter((ex) => ex !== exame);
    } else {
      // não estava → adiciona
      return [...prev, exame];
    }
  });

}, [funcionarioSelecionado]);



const handlePsicoExame = () => {
 
  setPsicoPresencial((prev) => {
    if (funcionarioSelecionado) {
      funcionarioSelecionado.EXAMES?.forEach(exam => {
        if (exam.nomeExame.includes('Psico')) {
          prev
            ? exam.preparacao = ""
            : exam.preparacao = "Entrevista presencial";
        }
      });
    }
    return !prev;
  });
}





// ---------------------------------------------------------
// Atendimento preferencial (single select)
// ---------------------------------------------------------
  const togglePreferencial = useCallback((p: string) => {
    setPreferencialTipo(p)
  }, [ticketSelecionado, funcionarioSelecionado, salaSelecionada, unidadeSelecionada])


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
// Vincular atendimento
// ----------------------------------------------------------
const handleBindService = async(value:boolean) => {
  setIsBindServiceSelected(value)

  if(!empresa || !codigoFuncionario) return

  // pela lógica implementada a negação faz a busca quando o check for true
  if(value)
  {
    const url = `${NEST_SCHEDULINGS_RECORDS}empresa=${empresa}&funcionario=${codigoFuncionario}&ficha=${funcionarioSelecionado?.SEQUENCIAFICHA}`
    const response= await fetch(url)

    if(response.ok)
    {
      const records: AsoFuncionarioDto[] = await response.json()
      if(records && records.length > 0)
      {
        setRecords(records)
      }
    }
  }
  
  setFilesUpload([])
}





const handleFileUpload = async(event: React.ChangeEvent<HTMLInputElement>) => {
  const files = event.target.files
  if(files) {
    const arrFiles = Array.from(files)

    for(const file of arrFiles)
    {
      setFilesUpload((prev) => [...prev, file] )
    }
  }
}

const handleRemoveFile = (fileName: string) => {
  setFilesUpload(prev => prev.filter(f => f.name !== fileName))
  funcionarioSelecionado!.ANEXOS = funcionarioSelecionado!.ANEXOS.filter(f => f.Name !== fileName)
}


const updateTicketFuncionarioSelecionado = useCallback( async(ticket: Ticket) => {
  if(ticket && funcionarioSelecionado){
      ticket.atendente = user.nome
      ticket.sala = salaSelecionada 
      ticket.preferencialTipo = preferencialTipo
      ticket.status = TicketStatus.AGUARDANDO
      ticket.grupo = TicketGroups.EXAME

      funcionarioSelecionado.TICKET = ticket 
  }
  else if(funcionarioSelecionado) {
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
      grupo: TicketGroups.EXAME
    };

    try {
      const response = await fetch(NEST_TICKETS_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
        },
        body: JSON.stringify(ticket),
      });

      if (!response.ok) {
        throw new Error("Erro ao emitir o ticket.");
      }

      const ticketResponse: Ticket = await response.json()
      
      ticketResponse.atendente = user.nome
      ticketResponse.sala = salaSelecionada 
      ticketResponse.preferencialTipo = preferencialTipo
      ticketResponse.status = TicketStatus.AGUARDANDO
      ticketResponse.grupo = TicketGroups.EXAME

      funcionarioSelecionado!.TICKET = ticketResponse
      ticketSelecionado = ticketResponse
    }
    catch(e)
    {
      console.error(e)
      alert(`Erro durante processamento do ticket`)
    }
  }
  else {
    alert("Não foi possível criar vinculo ticket ao funcionário")
  }

  }, [ticketSelecionado, preferencialTipo, funcionarioSelecionado, unidadeSelecionada])




  const handlePreparationModal = () => {
    setIsOpenPreparationModal(true)
  }


 
  // ---------------------------------------------------------
  // Submit
  // ---------------------------------------------------------
  const handleSubmit = useCallback(async () => {
    
    setShowErrors(true)
    if (!validation.all || isSubmitting || !funcionarioSelecionado || !socket) return
    
    setIsSubmitting(true)
    const formData = new FormData()

    await updateTicketFuncionarioSelecionado(ticketSelecionado!)
    funcionarioSelecionado.UNIDADEATENDIMENTO = unidadeSelecionada
    funcionarioSelecionado.ANOTACOES = anotacoes.toUpperCase()

    // Adiciona códigos de prontuários
    if (recordsCodes && recordsCodes.size > 0) {
      
      funcionarioSelecionado.PRONTUARIOSVINCULADOS = Array.from(recordsCodes);
    } 

    // Adiciona anexos do upload
    if(filesUpload && filesUpload.length > 0)
    {
      // funcionarioSelecionado.ANEXOS.push(...filesUpload)
      for(const item of filesUpload)
      {
        formData.append("files", item)
      }
    }

    // Caso tiver vindo do preparo finalizado, limpa a listagem
    if(funcionarioSelecionado.TICKET.id) onSetPreparacaoFinalizada(prev => prev.filter(e => e.ticketId != funcionarioSelecionado.TICKET.id ))
    
   
    try {
      formData.append("scheduling", JSON.stringify(funcionarioSelecionado))
      
      const submmitResponse = await fetch(NEST_SCHEDULINGS, 
      { method: "POST", 
        body: formData
      })

      if(submmitResponse.ok)
      {
        onExecutarAcao(
          funcionarioSelecionado.TICKET.id,
          TicketActionType.EXAME,
          unidadeSelecionada,
          socket,
          salaSelecionada,
          user.nome
        )
        
        alert("Atendimento enviado com sucesso")
        onClose()
      } 
      
    } catch (err) {
      alert(`Erro ao submeter atendimento: ${err}`)

    } finally {
      setIsSubmitting(false)
    }
  }, [validation.all, isSubmitting, codigoFuncionario, empresa, nome, tipoExame, codigoExames, preferencialTipo, anotacoes, filesUpload, recordsCodes,ticketSelecionado, selectedSchedulingId])

  // Prevent rendering when closed
  if (!isOpen) return null

const LoadingOverlay = () => (
  <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-50 flex items-center justify-center rounded-lg">
    <div className="text-center">
      <div className="flex flex-col items-center gap-4">
        {/* Spinner animado */}
        <div className="relative">
          <div className="w-12 h-12 border-4 border-[#104e35]/20 rounded-full"></div>
          <div className="absolute top-0 left-0 w-12 h-12 border-4 border-[#104e35] border-t-transparent rounded-full animate-spin"></div>
        </div>
        
        {/* Texto de loading */}
        <div className="space-y-1">
          <p className="text-sm font-medium text-gray-700">Processando...</p>
          <p className="text-xs text-gray-500">Aguarde enquanto buscamos as informações</p>
        </div>
        
        {/* Barra de progresso sutil */}
        <div className="w-32 h-1 bg-gray-200 rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-[#104e35] to-[#a6ce39] rounded-full animate-pulse"></div>
        </div>
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
  const isSelected = selectedSchedulingId === paciente.SCHEDULINGCODE;


  // Renderiza o card sem o Tooltip se não houver observações
  if (!paciente.OBSERVACOES) {
    return (
      <div id={`card-${paciente.CODIGOPRONTUARIO}`} style={style} className="px-2 py-1">
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
                <User className={`h-4 w-4 ${isSelected ? "text-[#003366]" : "text-[#003366]"}`} />
                <div className={`font-medium text-sm truncate ${isSelected ? "text-[#003366]" : ""}`}>
                  {paciente.NOME}
                </div>
                {isSelected && (
                  <Chip size="sm" variant="solid" color="primary" className="ml-2">
                    Selecionado
                  </Chip>
                )}
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-600 mb-1">
                <span className="truncate">{paciente.NOMEEMPRESA}</span>
              </div>
              <div className="flex items-center text-xs text-gray-500 gap-2">
                <Clock className="h-3 w-3 text-gray-400" /> 
                <span>{paciente.HORARIO} - {paciente.TIPOEXAMENOME}</span>
              </div>
            </div>
          </div>
          {/* Chip do ASOSTATUS fixo no canto inferior direito */}
          {paciente.ASOSTATUS === AsoStatus.GERADO && (
            <div className="absolute bottom-2 right-2  text-green-400">
              <span
                className="text-xs"
              >
                {paciente.ATENDIMENTOSTATUS != "AGENDADO" ? paciente.ATENDIMENTOSTATUS : "ASO OK"}
              </span>
            </div>
          )}

            {paciente.ASOSTATUS === AsoStatus.KIT_CREDENCIADA && (
            <div className="absolute bottom-2 right-2 text-yellow-400">
              <span
                className="text-xs"
              >
                {paciente.ASOSTATUS}
              </span>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Renderiza o card com o Tooltip se houver observações
  return (
    <div style={style} className="px-2 py-1">
      <Tooltip
        key={`tooltip-obscard-${paciente.CODIGOPRONTUARIO}`}
        content={
          <div className="px-1 py-2 max-w-xs">
            <p className="text-xs break-words font-medium">
              OBSERVAÇÃO:
            </p>
            <p className="text-xs break-words">
              {paciente.OBSERVACOES}
            </p>
          </div>
        }
        color="warning"
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
                <div className={`font-medium text-sm truncate ${isSelected ? "text-[#003366]" : ""}`}>
                  {paciente.NOME}
                </div>
                {isSelected && (
                  <Chip size="sm" variant="solid" color="primary" className="ml-2">
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
                <span>{paciente.HORARIO} - {paciente.TIPOEXAMENOME}</span>
              </div>
            </div>
          </div>
          {/* Chip do ASOSTATUS fixo no canto inferior direito */}
          {paciente.ASOSTATUS === AsoStatus.GERADO && (
            <div className="absolute bottom-2 right-2  text-green-400">
              <span
                className="text-xs"
              >
                ASO OK
              </span>
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
      <div ref={containerRef} className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl h-[90vh] flex flex-col overflow-hidden">
        {/* HEADER */}
        <header className="flex items-center justify-between gap-4 p-2 bg-gradient-to-r from-[#395467] to-[#40b9b0] text-white">
          <div className="flex items-center gap-4">
          {/* Senha/Ticket em destaque */}
            {ticketSelecionado ? (
              <div className="flex items-center gap-3 bg-white/10 px-3 py-2 rounded-lg border border-white/20">
                <div className="text-center">
                  <div className="text-xs text-white/90">Senha</div>
                  <div className="font-bold text-3xl tracking-wide text-yellow-300">{ ticketSelecionado.prefixo + ticketSelecionado.numero }</div>
                </div>
              </div>
            ) : (
              <FilePlus size={40} />
            )}
            <div>
              <h3 className="text-xl font-semibold">Atendimento</h3>
              <p className="text-sm opacity-90">Preencha os dados para iniciar o atendimento</p>
            </div>
          </div>

          

          {/* Close button */}
          <div className="ml-2">
            <Button
              isIconOnly
              variant="light"
              size="lg"
              onPress={onClose}
              className="bg-white/10 hover:bg-white/20 text-white rounded-full h-12 w-12 p-0"
              aria-label="Fechar modal"
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
  <div className={`max-w-3xl mx-auto space-y-3 transition-opacity duration-300 ${
    isLoading ? 'opacity-50 pointer-events-none' : 'opacity-100'
  }`}>
    
    {/* Indicador de agendamento selecionado */}
    {selectedSchedulingId && (
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-1 flex items-center justify-between" id="empresa-autocomplete">
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-blue-600" />
          <span className="text-sm text-blue-800">
            Agendamento selecionado: <strong>{selectedSchedulingId}</strong>
          </span>
        </div>
        <Button
          size="sm"
          variant="light"
          onPress={handleDeselecionarAgendamento}
          className="text-blue-600 hover:bg-blue-100"
          disabled={isLoading}
        >
          <X className="h-3 w-3 mr-1" />
          Desselecionar
        </Button>
      </div>
    )}

    {/* Empresa (obrigatório) */}
    <div>
      <Autocomplete
        
        size="sm"
        label={"Empresa"}
        aria-label="Selecione a empresa"
        defaultItems={socCompanies}
        selectedKey={empresa || ""}
        onSelectionChange={(key) => setEmpresa(String(key))}
        inputProps={{
          className: showErrors && !validation.empresa ? "ring-1 ring-amber-300" : "",
        }}
        className="w-full"
        isDisabled={isLoading}
      >
        {(item: CadastroEmpresa) => (
          <AutocompleteItem key={item.CODIGO} textValue={item.RAZAOSOCIAL}>
            <div className="flex justify-between">
              <span className="text-sm font-medium">{item.RAZAOSOCIAL}</span>
              <span className="text-xs text-gray-500">Cód {item.CODIGO}</span>
            </div>
          </AutocompleteItem>
        )}
      </Autocomplete>

      {showErrors && !validation.empresa && (
        <div className="text-xs text-amber-700 mt-1">Informe a empresa.</div>
      )}
    </div>

    {/* Código funcionário (compact) e Nome funcionário */}
    <section className="flex items-baseline gap-2">
      <div className="mt-1">
        <Input
          size="sm"
          label={"Código SOC"}
          value={codigoFuncionario}
          inputMode="numeric"
          onChange={(e: any) => {
            const val = e.target.value
            if (/^\d*$/.test(val)) setCodigoFuncionario(val)
          }}
          className={`flex-1 ${showErrors && !codigoFuncionario ? "ring-1 ring-amber-300" : ""}`}
          aria-label="Código do funcionário"
          disabled={isLoading}
          endContent={
            (codigoFuncionario != "" && empresa) && (
              <Button
                size="sm"
                isIconOnly={true}
                onPress={handleBuscarFuncionario}
                type="button"
                aria-label="Buscar funcionário"
                disabled={isLoading}
                className="bg-transparent"
              >
                <Tooltip
                  key={`tooltip-searchbutton-${funcionarioSelecionado?.CODIGOPRONTUARIO}`}
                  content="Buscar funcionário"
                  disableAnimation={true}
                  color="foreground"
                >
                  <UserRoundSearch />
                </Tooltip>
              </Button>
            )
          }
        />
      </div>

      {/* Nome do funcionário (obrigatório) */}
      <div className="w-full">
        <Input
          readOnly
          size="sm"
          label={"Nome completo"}
          value={nome}
          onChange={(e: any) => setNome(e.target.value.toUpperCase())}
          className={`${showErrors && !validation.nome ? "ring-1 ring-amber-300" : ""}`}
          aria-invalid={!validation.nome && showErrors}
          disabled={isLoading}
          endContent={
            <Tooltip
              key={`clipboard-copy-tooltip-${funcionarioSelecionado?.SCHEDULINGCODE}`}
              content="Copiar nome"
              disableAnimation={true}
              color="foreground"
            >
                <Button
                isIconOnly={true}
                size="sm"
                variant="light"
                onPress={() => copyToClipboard(nome)}
                type="button"
                aria-label="Copiar nome"
              >
                <Copy />
              </Button>
            </Tooltip>
            
          }
        />
        {showErrors && !validation.nome && (
          <div className="text-xs text-amber-700 mt-1">Informe o nome do funcionário.</div>
        )}
      </div>
    </section>

    {/* Informações adicionais: Nascimento, CPF, Horário */}
    <section className="flex gap-2">
      <Input
        size="sm"
        label={"Data Nascimento"}
        value={dataNascimento}
        className="text-xs"
        disabled={isLoading}
        maxLength={10}
        onChange={(e) => handleDataNascimento(e.target.value)}
      />
      <Input
        size="sm"
        label={"CPF"}
        value={cpf}
        onChange={(e) => handleCpfInput(e.target.value)}
        className="text-xs"
        disabled={isLoading}
      />
      <Input
        readOnly
        size="sm"
        label={"Horário"}
        value={funcionarioSelecionado?.HORARIO ? funcionarioSelecionado.HORARIO : undefined}
        className="text-xs"
        disabled={isLoading}
      />
    </section>

    <section className="flex gap-2">
      <Input
        readOnly
        size="sm"
        label={"Cargo"}
        value={funcionarioSelecionado?.NOMECARGO ? funcionarioSelecionado.NOMECARGO : undefined}
        className="text-xs"
        disabled={isLoading}
      />
      <Input
        readOnly
        size="sm"
        label={"Setor"}
        value={funcionarioSelecionado?.NOMESETOR ? funcionarioSelecionado.NOMESETOR : undefined}
        className="text-xs"
        disabled={isLoading}
      />
      <Input
        readOnly
        size="sm"
        label={"Unidade"}
        value={funcionarioSelecionado?.NOMEUNIDADE ? funcionarioSelecionado.NOMEUNIDADE : undefined}
        className="text-xs"
        disabled={isLoading}
      />
    </section>

    {/* Tipo de Exame - ToggleGroup (acessível) */}
    <div className="mt-8">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-gray-700">Tipo de Exame *</label>
        <div className="text-xs text-gray-400">Selecione um</div>
      </div>

      <div role="radiogroup" aria-label="Tipo de exame" className="grid grid-cols-3 mt-2 gap-2 flex-wrap">
        {Object.entries(TIPOS_EXAME).map(([key, value]) => {
          const active = tipoExame === value; 
          return (
            <Button
              key={key}
              type="button"
              role="radio"
              size="sm"
              disableAnimation={true}
              aria-checked={active}
              onChange={() => handleToggleTipo(key)} 
              disabled={isLoading}
              className={`px-3 py-1.5 rounded-md text-xs border transition  ${
                active
                  ? "bg-[#6AA84F] text-white border-[#6AA84F]"
                  : "bg-white text-gray-700 border-gray-200 hover:border-[#003366]"
              } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {value}
            </Button>
          );
        })}
      </div>

      {showErrors && !validation.tipoExame && (
        <div className="text-xs text-amber-700 mt-1">Selecione o tipo de exame.</div>
      )}
    </div>

    {/* Exames (checkbox grid) */}
    <div>
      <div className="flex items-center justify-start mb-2">
        <div className="text-xs text-gray-400">{codigoExames.length} selecionado(s)</div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {Object.keys(EXAMES_LIST).map((exame, index) => {
          const isSelected = codigoExames.includes(exame);

          return (exame === "Laboratório" || exame === "Raio-X") && isSelected ? (
            <Tooltip 
              key={`tooltip-exame-${exame}-${index}`} 
              className="p-2 bg-amber-100"
              disableAnimation={true}
              content={exame == "Laboratório" ? 
                laboratorialExames?.map((e, i) => <span key={`lab-${i}`} className="text-xs">{e}</span>)
                : examesImagem?.map((e, i) => <span key={`img-${i}`}  className="text-xs">{e}</span>)
              }
            >
              <Button
                key={exame}
                type="button"
                role="radio"
                size="sm"
                disableAnimation={true}
                aria-checked={isSelected}
                onChange={() => toggleExame(exame)}
                disabled={isLoading}
                className={`px-3 py-1.5 rounded-md justify-start items-center text-xs border transition ${
                  isSelected
                    ? "bg-[#6AA84F] text-white font-medium border-[#6AA84F]"
                    : "bg-white text-gray-700 border-gray-200 hover:border-[#003366]"
                } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {exame}
              </Button>
            </Tooltip>
          ) : (
            <Button
              
              key={exame}
              type="button"
              role="radio"
              size="sm"
              disableAnimation={true}
              aria-checked={isSelected}
              onChange={() => toggleExame(exame)}
              disabled={isLoading}
              className={`px-3 py-1.5 rounded-md justify-start items-center text-xs border transition ${
                isSelected
                  ? "bg-[#6AA84F] text-white font-medium border-[#6AA84F]"
                  : "bg-white text-gray-700 border-gray-200 hover:border-[#003366]"
              } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {exame.includes('Psico') && isSelected ? (
                <div className="flex justify-between items-baseline-last w-full">
                  <span>{exame}</span>
                  <span>Com psico. <Switch id="psicossocial-switch" size="sm" color="warning" checked={psicoPresencial} onValueChange={handlePsicoExame} disabled={isLoading}></Switch></span> 
                </div>
              ) : <span>{exame}</span>}
            </Button>
          );
        })}
      </div>

      {showErrors && !validation.exames && (
        <div className="text-xs text-amber-700 mt-1">Marque ao menos 1 exame.</div>
      )}
    </div>

    {/* Observações */}
    {observacoes && (
      <div className="p-2.5 bg-amber-50 rounded-lg border border-amber-200">
        <div className="text-xs text-amber-700 flex justify-baseline gap-2">
          <Info className="h-4 w-4"/>
          <strong>Observações:</strong> {observacoes}
        </div>
      </div>
    )}         

    {/* Anexos */}
    {anexos.length > 0 && (
      <div>
        <label className="text-sm font-medium text-gray-700">Anexos</label>
        {anexos.map((anexo: FileUpload, index) => (
          <Button
            key={anexo.Name || index}
            color="primary"
            variant="light"
            size="sm"
            onPress={() => handleViewAttachment(anexo)}
            disabled={isLoading}
          >
            {anexo.Name}
          </Button>
        ))}
      </div>
    )}

    {/* Anotações */}
    <div>
      <label className="text-sm font-medium text-gray-700">Anotações</label>
      <Textarea
        isClearable
        value={anotacoes}
        onValueChange={setAnotacoes}
        label="Informações internas"
        minRows={2}
        className="resize-none"
        disabled={isLoading}
      />
    </div>

    {/* Vincular prontuário */}
    <div>
      {(empresa && codigoFuncionario) && (
        <Switch 
          isSelected={isBindServiceSelected} 
          onValueChange={handleBindService}
          disabled={isLoading}
        >
          <span className="text-sm text-gray-700">Vincular atendimento</span>
        </Switch>
      )}

      {isBindServiceSelected && (
        <div className="mt-1 flex flex-col align-center items-start space-x-2">
          <div className="mt-2 mb-2">
            {records && (
              <Select
                className="min-w-lg"
                label="Prontuários"
                placeholder="prontuários disponíveis"
                selectionMode="multiple"
                size="sm"
                selectedKeys={recordsCodes}
                onSelectionChange={(keys) => {
                  const stringKeys = new Set(Array.from(keys).map(String));
                  setRecordsCodes(stringKeys);
                }}
                disabled={isLoading}
              >
                {records.map((rec) => (
                  <SelectItem key={String(rec.IDFICHA)}>
                    {`${convertTipoAsoNome(rec.TPASO)} - ${rec.DATAFICHA} - ${convertRespAso(rec.RESASO)}`}
                  </SelectItem>
                ))}
              </Select>

            )}
          </div>
          <div>
            <input
              id="file-upload"
              type="file"
              multiple
              accept=".pdf,image/*"
              onChange={handleFileUpload}
              className="hidden"
              disabled={isLoading}
            />
            <label
              htmlFor="file-upload"
              className={`cursor-pointer text-xs inline-flex items-center px-3 py-2 rounded ${
                isLoading 
                  ? 'bg-gray-400 text-gray-200 cursor-not-allowed' 
                  : 'bg-blue-500 text-white hover:bg-blue-600'
              }`}
            >
              Documentos {filesUpload.length > 0 ? filesUpload.length : ""}
            </label>
            {filesUpload.map(file => (
              <Chip
                key={file.name}
                size="sm"
                onClose={() => handleRemoveFile(file.name)}
                className="mt-2 text-xs"
              >
                {file.name}
              </Chip>
            ))}
          </div>
        </div>
      )}
    </div>   

    {/* Atendimento Preferencial */}
    {ticketSelecionado?.preferencial || ticketSelecionado == null ? (
      <div>
        <label className="text-sm font-medium text-gray-700">Atendimento Preferencial</label>
        <div className="mt-2 flex gap-2">
          {PREFERENCIAL_OPTIONS.map((pref) => {
            const active = preferencialTipo === pref
            return (
              <Button
                key={pref}
                value={pref}
                type="button"
                onPress={(e: any) => togglePreferencial(e.target.value)}
                disabled={isLoading}
                className={`px-3 py-1 rounded-md text-sm border transition ${
                  active ? "bg-[#6AA84F] text-white border-[#6AA84F]" : "bg-white text-gray-700 border-gray-200 hover:border-[#003366]"
                } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {pref}
              </Button>
            )
          })}
        </div>
      </div>
    ) : ""}
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
                  <div className="text-xs text-gray-500">{filteredAgendamentos.length} funcionários</div>
                </div>

                <Select
                  size="sm"
                  className="max-w-26"
                  variant="underlined"
                  required={true}
                  selectionMode="single"
                  defaultSelectedKeys={["all"]}
                  disableAnimation={true}
                  onChange={(key) => {
                    handleDeselecionarAgendamento()
                    setStatusFilter(key.target.value)
                  } }
                >
                  <SelectItem
                    key={"all"}
                    variant="light"
                    
                  >
                    Todos
                  </SelectItem>
                  <SelectItem
                    key={"MANHA"}
                    variant="light"
                  >
                    Manhã
                  </SelectItem>
                  <SelectItem
                    key={"TARDE"}
                    variant="light"
                  >
                    Tarde
                  </SelectItem>
                </Select>
              </div>

              {/* Search */}
              <div className="relative">
                <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Buscar funcionário, empresa ou CPF..."
                  value={searchTerm}
                  onChange={(e: any) => setSearchTerm(e.target.value)}
                  size="sm"
                />
                {searchTerm && (
                  <Button 
                    isIconOnly 
                    size="sm" 
                    variant="light" 
                    className="absolute right-1 top-1/2 -translate-y-1/2" 
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
                    {searchTerm ? "Nenhum paciente encontrado" : "Nenhum agendamento para hoje"}
                  </div>
                </div>
              ) : (
                <List
                  ref={listRef}
                  height={280}
                  itemCount={filteredAgendamentos.length}
                  itemSize={90} // Aumentado para acomodar o chip de selecionado
                  width={"100%"}
                  itemData={filteredAgendamentos}
                  className="overflow-auto min-h-full"
                >
                  {(props) => <PacienteItem {...props} data={filteredAgendamentos} />}
                </List>
              )}
            </div>

          </aside>
        </div>

        {/* FOOTER (fora do scroll) */}
        <footer className="border-t border-gray-200 bg-white p-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="text-sm text-gray-600">Observação: campos com * são obrigatórios</div>
            {showErrors && !validation.all && (
              <div className="text-xs text-amber-700 bg-amber-50 px-2 py-1 rounded border border-amber-200">
                Corrija os campos obrigatórios
              </div>
            )}
          </div>

          <div className="flex items-center gap-3">
            { ticketSelecionado && (
                <Button 
                variant="flat" 
                disabled={isSubmitting} 
                className="px-4 py-2 rounded hover:bg-gray-100"
                onPress={handlePreparationModal}
              >
                <FileInput className="h-4 w-4 mr-2" /> Preparar documentação
              </Button>
            )}
            <Button 
              variant="flat" 
              onPress={onClose} 
              disabled={isSubmitting} 
              className="px-4 py-2 rounded hover:bg-gray-100"
            >
              <X className="h-4 w-4 mr-2" /> Cancelar
            </Button>

            <Button
              onPress={handleSubmit}
              isLoading={isSubmitting}
              isDisabled={!validation.all || isSubmitting}
              className="px-4 py-2 rounded bg-gradient-to-r from-[#003366] to-[#6AA84F] text-white hover:shadow-lg transition-all duration-200"
            >
              {isSubmitting ? (
                <>
                  <Save className="h-4 w-4 mr-2" /> Salvando...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" /> Enviar Atendimento
                </>
              )}
            </Button>
          </div>
        </footer>
      </div>

      {
        (ticketSelecionado && socket && funcionarioSelecionado) && (
          <EmPreparacaoModal
            isOpen={isOpenPreparationModal}
            onOpenChange={setIsOpenPreparationModal}
            ticket={ticketSelecionado}
            salaSelecionada={salaSelecionada}
            socket={socket}
            unidadeSelecionada={unidadeSelecionada}
            funcionario={funcionarioSelecionado}
          />
        )
      }
    </div>
  )
}