import React, { useCallback, useEffect, useState } from "react";
import { Card, Button, Spinner, Dropdown, DropdownItem, DropdownMenu, DropdownTrigger, Tooltip } from "@heroui/react";
import { Clock, FileText, Phone, CheckCircle, Pause, ArrowLeft, User, Star, Dot, Badge, Loader, FilePlus } from "lucide-react";
import { useEntityManager } from "@/hooks/useEntityManager";
import { Socket } from "socket.io-client";
import { getCurrentUser } from "@/lib/utils";
import { PreparationRequest, Ticket, TicketActionType, TicketStatus } from "@/lib/ticket/ticket";
import { Scheduling } from "@/lib/scheduling/interface/scheduling";

import { IndexDb } from "@/lib/indexDb/indexdb";
import EmPreparacaoModal from "./atendimento/PreparoModal";


// Interface para tipagem robusta
interface SenhaCardProps {
  ticket: Ticket;
  salaSelecionada: string;
  unidadeSelecionada: string;
  socket: Socket;
  agendamentos: Scheduling[]
  onHandleModal: (state: Boolean) => void
  setTicketSelecionado: (ticket:Ticket | null) => void
  onPreparationRequests: PreparationRequest[];
  preparacoesFinalizadas: PreparationRequest[]
}



// Componente para o número do ticket
const TicketNumber: React.FC<{ ticket: Ticket }> = ({ ticket }) => {
  const numberClass = ticket.preferencial ? "text-red-600" : "text-gray-900";
  return (
    <div className="flex flex-col items-center justify-center">
      <div className="flex items-end font-bold text-4xl">
        <span className={`${numberClass} font-semibold`} aria-label={`Número do ticket: ${ticket.prefixo || ""}${ticket.numero}`}>
          {ticket.prefixo || ""}
          {ticket.numero.toString()}
        </span>
      </div>
    </div>
  );
};

// Componente para as ações do ticket
const TicketActions: React.FC<{
  ticket: Ticket;
  salaSelecionada: string;
  unidadeSelecionada: string;
  socket: Socket;
  agendamentos: Scheduling[]
  onHandleModal: (state: Boolean) => void
  setTicketSelecionado: (ticket:Ticket) => void

}> = ({
  ticket,
  salaSelecionada,
  unidadeSelecionada,
  socket,
  onHandleModal,
  setTicketSelecionado
}) => {
  const { executarAcao } = useEntityManager<Ticket>([]);
  const [isOpen, setIsOpen] = useState(false);

    const items = [
    {
      key: "preparo",
      label: "Em prepração",
      action: "EM PREPARAÇÃO"
    },
    {
      key: "raiox",
      label: "Encaminhado RX",
      action: "ENCAMINHADO RAIO-X"
    }
  ];

  const handleExecutarAcao = (ticket: Ticket, action: TicketActionType) => {
    const currentUser = getCurrentUser();
    executarAcao(ticket.id, action, unidadeSelecionada, socket, salaSelecionada, currentUser?.nome);
  };

  const handleAtender = (ticket: Ticket, action: TicketActionType) => {
    const currentUser = getCurrentUser();

    executarAcao(ticket.id, action, unidadeSelecionada, socket, salaSelecionada, currentUser?.nome);
    setTicketSelecionado(ticket)
    onHandleModal(true)
  };

  const handleAguardar = (ticket: Ticket, action: TicketActionType) => {
    const currentUser = getCurrentUser();

    // exibe modal de solicitação preparo
    if(action == TicketActionType.EM_PREPARACAO){
      setIsOpen(true)
    }
    else {
      executarAcao(ticket.id, action, unidadeSelecionada, socket, salaSelecionada, currentUser?.nome);
    }
  };



  const handleRetornar = (ticket: Ticket, action: TicketActionType) => {
    if(ticket.status == TicketStatus.EM_PREPARACAO){
      const response = confirm("Deseja retornar a senha da prapação ?")
      return response ?  executarAcao(ticket.id, action, unidadeSelecionada, socket) : null
    }
    return executarAcao(ticket.id, action, unidadeSelecionada, socket);
  };

const handleDisabledStatus = (ticket: Ticket) => {
  const currentUser = getCurrentUser();

  // 1. Se o ticket já estiver finalizado, o botão deve estar desabilitado
  if (ticket.status === TicketStatus.FINALIZADO) {
    return true;
  }

  // 2. Verifica se o ticket tem atendente ou sala atribuídos.
  // Se não tiver, o botão deve estar habilitado para ser clicado por qualquer um.
  if (!ticket.atendente || !ticket.sala) {
    return false;
  }

  // 3. Adiciona a nova condição para os status de exceção
  // Se o status for EM_PREPARACAO ou ENCAMINHADO_RX, o botão deve estar habilitado
  // para qualquer usuário, independentemente do atendente ou sala.
  if (
    ticket.status === TicketStatus.EM_PREPARACAO 
  ) {
    return true;
  }

  if (
    ticket.status === TicketStatus.ENCAMINHADO_RX
  ) {
    return false;
  }

  // 4. Verifica se o atendente e a sala do ticket são diferentes do usuário atual e da sala selecionada.
  // Se forem diferentes, o botão deve estar desabilitado para evitar ações indevidas.
  if (ticket.atendente !== currentUser?.nome || ticket.sala !== salaSelecionada) {
    return true;
  }

  // 5. Para qualquer outra situação, o botão deve estar habilitado.
  return false;
};


  const isDisabled = handleDisabledStatus(ticket);

  return (
    <div className="flex flex-wrap items-center justify-center gap-2 mt-4">
      {/* Botão Chamar - Amarelo */}
      <Button
        size="sm"
        isIconOnly
        color="warning"
        className="min-w-6 rounded-full bg-amber-500 hover:bg-amber-600 text-white shadow-lg transition-all disabled:bg-gray-300 disabled:opacity-50"
        onPress={() => handleExecutarAcao(ticket, TicketActionType.CHAMAR)}
        disabled={isDisabled}
        aria-label="Chamar ticket"
      >
        <Phone className="h-4 w-4" /> 
      </Button>

      {/* Botão Atender - Verde */}
      <Button
        size="sm"
        isIconOnly
        color="success"
        className="min-w-6 rounded-full bg-red-500 hover:bg-red-600 text-white shadow-lg transition-all disabled:bg-gray-300 disabled:opacity-50"
        onPress={() => handleAtender(ticket, TicketActionType.ATENDER)}
        disabled={isDisabled}
        aria-label="Atender ticket"
      >
        <FilePlus className="h-4 w-4" /> 
      </Button>

      {/* Botão Aguardar - Azul */}
      <div className="relative">
        <Dropdown>
        <DropdownTrigger>
          <Button
            size="sm"
            isIconOnly
            color="primary"
            className="min-w-6 rounded-full bg-blue-500 hover:bg-blue-600 text-white shadow-lg transition-all disabled:bg-blue-300 disabled:opacity-50"
            disabled={isDisabled}
            aria-label="Aguardar ticket"
          >
            <Pause className="h-4 w-4" /> 
          </Button>
        </DropdownTrigger>
        <DropdownMenu aria-label="Dynamic Actions" items={items}>
          {(item) => (
            <DropdownItem
              key={item.key}
              onPress={() => handleAguardar(ticket, item.action as TicketActionType)}
            >
              {item.label}
            </DropdownItem>
          )}
        </DropdownMenu>
      </Dropdown>
      </div>

      {/* Botão Retornar - Cinza */}
      <Button
        size="sm"
        isIconOnly
        color="default"
        className="min-w-6  rounded-full bg-gray-500 hover:bg-gray-600 text-white shadow-lg transition-all disabled:bg-gray-300 disabled:opacity-50"
        onPress={() => handleRetornar(ticket, TicketActionType.RETORNAR)}
        disabled={isDisabled}
        aria-label="Retornar ticket"
      >
        <ArrowLeft className="h-4 w-4" /> 
      </Button>

      <EmPreparacaoModal
        isOpen={isOpen}
        onOpenChange={setIsOpen}
        ticket={ticket}
        salaSelecionada={salaSelecionada}
        socket={socket}
        unidadeSelecionada={unidadeSelecionada}
      />
    </div>
  );
};

// Componente principal
const SenhaCard: React.FC<SenhaCardProps> = ({
  ticket,
  salaSelecionada,
  unidadeSelecionada,
  socket,
  agendamentos,
  onHandleModal,
  setTicketSelecionado,
  onPreparationRequests,
  preparacoesFinalizadas,
}) => {
  const formatarTempoEspera = (emissao: string | Date) => {
    const dataEmissao = new Date(emissao);
    const agora = new Date();
    const diferencaMs = agora.getTime() - dataEmissao.getTime();
    const minutos = Math.floor(diferencaMs / 1000 / 60);
    const horas = Math.floor(minutos / 60);
    const minutosRestantes = minutos % 60;
    return horas > 0 ? `${horas}h ${minutosRestantes}m` : `${minutos}m`;
  };



  // Tema visual por status
  const getStatusVisual = (status: string) => {
    switch (status) {
      case TicketStatus.AGUARDANDO:
        return {
          cardBg: "bg-white",
          border: "border-2 border-green-500",
          hoverBg: "hover:bg-green-50",
          pillBg: "bg-green-500 text-white",
          pillDotColor: "bg-white",
          pillClass: "px-3 py-1 rounded-full animate-pulse",
          textColor: "text-gray-900",
        };
      case TicketStatus.EM_CHAMADA:
        return {
          cardBg: "bg-amber-50",
          border: "border-2 border-amber-500",
          hoverBg: "hover:bg-amber-100", // Tonalidade mais clara para o hover
          pillBg: "bg-amber-500 text-white",
          pillDotColor: "bg-white",
          pillClass: "px-3 py-1 rounded-full",
          textColor: "text-gray-900",
        };
      case TicketStatus.EM_ATENDIMENTO:
        return {
          cardBg: "bg-red-50",
          border: "border-2 border-red-500",
          hoverBg: "hover:bg-red-100", // Tonalidade mais clara para o hover
          pillBg: "bg-red-500 text-white",
          pillDotColor: "bg-white",
          pillClass: "px-3 py-1 rounded-full",
          textColor: "text-gray-900",
        };
      case TicketStatus.FINALIZADO:
        return {
          cardBg: "bg-gray-100",
          border: "border-2 border-gray-400",
          hoverBg: "hover:bg-gray-200", // Tonalidade mais clara para o hover
          pillBg: "bg-gray-400 text-white",
          pillDotColor: "bg-gray-200",
          pillClass: "px-3 py-1 rounded-full",
          textColor: "text-gray-500",
        };
      case TicketStatus.EM_PREPARACAO:
        return {
          cardBg: "bg-blue-100",
          border: "border-2 border-blue-400",
          hoverBg: "hover:bg-blue-200", // Tonalidade mais clara para o hover
          pillBg: "bg-blue-400 text-white",
          pillDotColor: "bg-blue-200",
          pillClass: "px-3 py-1 rounded-full",
          textColor: "text-blue-500",
        };
      case TicketStatus.ENCAMINHADO_RX:
        return {
          cardBg: "bg-blue-100",
          border: "border-2 border-blue-400",
          hoverBg: "hover:bg-blue-200", // Tonalidade mais clara para o hover
          pillBg: "bg-blue-400 text-white",
          pillDotColor: "bg-blue-200",
          pillClass: "px-3 py-1 rounded-full",
          textColor: "text-blue-500",
        };
      default:
        return {
          cardBg: "bg-white",
          border: "border-2 border-gray-200",
          hoverBg: "hover:bg-gray-100",
          pillBg: "bg-gray-300 text-gray-700",
          pillDotColor: "bg-gray-500",
          pillClass: "px-3 py-1 rounded-full",
          textColor: "text-gray-900",
        };
    }
  };

  const { cardBg, border, hoverBg, pillBg, pillDotColor, pillClass, textColor } = getStatusVisual(ticket.status);
  const [preparation, setPreparation] = useState<PreparationRequest|null>();
  const [empresaPreparation, setEmpresaPrepration] = useState<string|null>();

  /**
   * Ao receber um ticket ou um pedido de preparação verifica se
   * é ppreparação em andamento ou preparação finalziada.
   */
  const handlePreparation = async () => {
    const hasPreparationRequest = onPreparationRequests.find(p => p.ticketId == ticket.id);
    if (hasPreparationRequest) {
      setPreparation(hasPreparationRequest);
      
      const empresaNome = await IndexDb.getCompanyById(hasPreparationRequest.empresa);
      setEmpresaPrepration(empresaNome?.RAZAOSOCIAL);
    }
    else if(preparacoesFinalizadas.some(p => p.ticketId == ticket.id)){
      const hasPreparationFinished = preparacoesFinalizadas.find(p => p.ticketId == ticket.id)
      
      if(hasPreparationFinished)
      {
        setPreparation(hasPreparationFinished);
        const empresaNome = await IndexDb.getCompanyById(hasPreparationFinished?.empresa);
        setEmpresaPrepration(empresaNome?.RAZAOSOCIAL);
      }

    } else {
      setPreparation(null);
      setEmpresaPrepration(null);
    }
  }; 


  useEffect(() => {
    handlePreparation()

  }, [onPreparationRequests, ticket]);
 

  return (
    <Card
      // Aplicando a nova classe de hover com o background dinâmico
      className={`${cardBg} ${border} ${hoverBg} rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 p-4 flex flex-col items-center justify-between text-center min-h-[220px]`}
      role="region"
      aria-label={`Ticket ${ticket.prefixo || ""}${ticket.numero}`}
    >
      <div className="flex flex-col items-center flex-1 w-full">
        <TicketNumber ticket={ticket} />

        {/* Badge de status centralizado */}
        <div className={`${pillBg} ${pillClass} mt-4 flex items-center justify-center`}>
          {(ticket.status === TicketStatus.EM_PREPARACAO || ticket.status === TicketStatus.ENCAMINHADO_RX || ticket.status === TicketStatus.PREPARO_OK) && (
            <Tooltip
              className="ring ring-blue-400"
              placement="bottom"
              content={
                <div className="flex flex-col p-1">
                  <div className="mb-3">
                    <span className="font-semibold text-sm">Nome: </span>
                    <span className="text-sm">{preparation?.nome || 'Não informado'}</span>
                  </div>
                  <div className="mb-3">
                    <span className="font-semibold text-sm">CPF: </span>
                    <span className="text-sm">{preparation?.cpf || 'Não informado'}</span>
                  </div>
                  <div className="mb-3">
                    <span className="font-semibold text-sm">Data de Nascimento: </span>
                    <span className="text-sm">{preparation?.dataNascimento || 'Não informado'}</span>
                  </div>
                  <div className="mb-3">
                    <span className="font-semibold text-sm">Empresa: </span>
                    <span className="text-sm">{empresaPreparation || 'Não informado'}</span>
                  </div>
                  <div className="mb-3">
                    <span className="font-semibold text-sm">Tipo de Exame: </span>
                    <span className="text-sm">{preparation?.tipoExame || 'Não informado'}</span>
                  </div>
                  <div>
                    <span className="font-semibold text-sm">Informações Adicionais: </span>
                    <span className="text-sm">{preparation?.informacoes || 'Nenhuma informação'}</span>
                  </div>
                </div>
              }
            >
              <Spinner size="sm" color="white" variant="simple" className="mr-2 cursor-wait" />
            </Tooltip>
          )}
          {ticket.status === TicketStatus.EM_CHAMADA && (
            <Spinner size="sm" color="white" variant="simple" className="mr-2" />
          )}
          {ticket.status === TicketStatus.EM_ATENDIMENTO && (
            <Spinner size="sm" color="white" variant="simple" className="mr-2" />
          )}
          <span className="text-xs font-semibold uppercase">{ticket.status}</span>
        </div>

        {/* Informações da sala e usuário */}
        {ticket.sala && ticket.atendente && (
          <div className="flex items-center gap-2 text-xs text-gray-500 mt-4">
            <User className="h-3 w-3" />
            <span>{ticket.sala} • {ticket.atendente.split(" ")[0]}</span>
          </div>
        )}
      </div>

      {/* Ações e Informações do rodapé */}
      <div className="w-full">
        <TicketActions
          ticket={ticket}
          salaSelecionada={salaSelecionada}
          unidadeSelecionada={unidadeSelecionada}
          socket={socket}
          agendamentos={agendamentos}
          onHandleModal={onHandleModal}
          setTicketSelecionado={setTicketSelecionado}
        />
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200 w-full">
          <div className="flex items-center text-xs text-gray-500">
            <Clock className="h-3 w-3 mr-1" aria-hidden="true" />
            <span>{formatarTempoEspera(ticket.emissao)}</span>
          </div>
          <div className="text-xs text-gray-500">
            {ticket.unidade}
          </div>
        </div>
      </div>
    </Card>
  );
};

export default React.memo(SenhaCard);