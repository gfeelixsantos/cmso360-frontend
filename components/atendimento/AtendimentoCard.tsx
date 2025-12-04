import React, { useState, useMemo } from "react";
import {
  Card,
  Button,
  Spinner,
  Tooltip,
  Badge,
  Progress,
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Chip,
} from "@heroui/react";
import {
  Clock,
  FileText,
  Phone,
  ArrowLeft,
  User,
  Calendar,
  MapPin,
  FilePlus,
  ChevronDown,
  ChevronUp,
  Pin,
  Ticket as Senha,
  Eye,
  Paperclip,
} from "lucide-react";
import { Socket } from "socket.io-client";

import { getCurrentUser } from "@/lib/utils";
import { Ticket, TicketActionType, TicketStatus } from "@/lib/ticket/ticket";
import {
  Scheduling,
  ExamRegister,
} from "@/lib/scheduling/interface/scheduling";
import { EXAMES_LIST } from "@/config/constants";
import { ExamStatus } from "@/lib/scheduling/enum/scheduling.enum";
import { useSchedulingEntityManager } from "@/hooks/SchedulingEntityManager";

interface AtendimentoCardProps {
  atendimento: Scheduling;
  salaSelecionada: string;
  unidadeSelecionada: string;
  socket: Socket;
  onHandleModal: (state: boolean) => void;
  // setTicketSelecionado: (ticket: Ticket | null) => void;
  setFuncionarioSelecionado: (funcionario: Scheduling | null) => void;
  exameSelecionado: string;
}

// Hook para cálculo de progresso dos exames (memorizado para performance)
const useExamProgress = (exames: ExamRegister[]) => {
  return useMemo(() => {
    if (!exames || exames.length === 0)
      return { progress: 0, completed: 0, total: 0 };

    const completed = exames.filter(
      (exame) =>
        exame.status === ExamStatus.FINALIZADO ||
        exame.status === ExamStatus.AGUARDANDO_RESULTADO,
    ).length;

    const total = exames.length;
    const progress = total > 0 ? Math.round((completed / total) * 100) : 0;

    return { progress, completed, total };
  }, [exames]);
};

// Função para calcular idade a partir da data de nascimento
const calcularIdade = (dataNascimento: string | null): string => {
  if (!dataNascimento) return "";

  try {
    const nascimento = new Date(dataNascimento);
    const hoje = new Date();

    let idade = hoje.getFullYear() - nascimento.getFullYear();
    const mesAtual = hoje.getMonth();
    const diaAtual = hoje.getDate();
    const mesNascimento = nascimento.getMonth();
    const diaNascimento = nascimento.getDate();

    // Ajusta a idade se ainda não fez aniversário este ano
    if (
      mesAtual < mesNascimento ||
      (mesAtual === mesNascimento && diaAtual < diaNascimento)
    ) {
      idade--;
    }

    return `${idade} anos`;
  } catch (error) {
    return "";
  }
};

// Função para determinar a cor do avatar baseado no ticket
const getAvatarColor = (ticket: Ticket): string => {
  if (ticket.preferencial) {
    return "bg-gradient-to-br from-red-500 to-red-600"; // Vermelho para preferencial
  } else if (ticket.prefixo && ticket.prefixo.trim() !== "") {
    return "bg-gradient-to-br from-blue-500 to-blue-600"; // Azul para prefixo
  } else {
    return "bg-gradient-to-br from-green-500 to-green-600"; // Verde para normal
  }
};

// Função para determinar a cor do texto do avatar
const getAvatarTextColor = (ticket: Ticket): string => {
  return "text-white"; // Texto branco para todos os casos (bom contraste)
};

// Função para formatar o número do ticket para o avatar
const getTicketNumberForAvatar = (ticket: Ticket): string => {
  if (Number(ticket.numero) < 0) {
    return "N/A";
  }

  if (ticket.prefixo && ticket.prefixo.trim() !== "") {
    return `${ticket.prefixo}${ticket.numero}`;
  }

  return ticket.numero.toString();
};

// Componente para o avatar do funcionário
const EmployeeAvatar: React.FC<{ atendimento: Scheduling }> = ({
  atendimento,
}) => {
  const avatarColor = getAvatarColor(atendimento.TICKET);
  const textColor = getAvatarTextColor(atendimento.TICKET);
  const ticketNumber = getTicketNumberForAvatar(atendimento.TICKET);

  return (
    <div
      className={`flex-shrink-0 w-10 h-10 ${avatarColor} rounded-full flex items-center justify-center font-semibold text-xs ${textColor}`}
    >
      <span className="text-lg">{ticketNumber}</span>
    </div>
  );
};

// Componente para informações do funcionário
const EmployeeInfo: React.FC<{ atendimento: Scheduling }> = ({
  atendimento,
}) => {
  const idade = calcularIdade(atendimento.DATANASCIMENTO);

  return (
    <div className="flex items-start gap-3 w-full">
      <EmployeeAvatar atendimento={atendimento} />

      <div className="flex-1 min-w-0">
        <h3
          className="font-semibold text-gray-900 truncate text-md"
          title={atendimento.NOME}
        >
          {atendimento.NOME}
        </h3>

        <div className="flex flex-wrap gap-3 text-xs text-gray-600">
          {atendimento.TIPOEXAMENOME && (
            <div className="flex items-center gap-1">
              <span>{atendimento.TIPOEXAMENOME}:</span>
            </div>
          )}

          <div className="flex items-center gap-1">
            <span title={atendimento.NOMECARGO}>{atendimento.NOMECARGO}</span>
          </div>

          {idade && (
            <div className="flex items-center gap-1">
              <span title={atendimento.DATANASCIMENTO ?? ""}>- {idade}</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-1 text-xs text-gray-600">
          <span className="truncate" title={atendimento.NOMEEMPRESA}>
            {atendimento.NOMEEMPRESA}
          </span>
        </div>
      </div>
    </div>
  );
};

// Componente para a barra de progresso dos exames
const ExamProgress: React.FC<{ exames: ExamRegister[] }> = ({ exames }) => {
  const { progress, completed, total } = useExamProgress(exames);

  if (!exames || exames.length === 0) {
    return (
      <div className="flex items-center gap-2 text-gray-500 text-sm">
        <span>Nenhum exame agendado</span>
      </div>
    );
  }

  return (
    <div className="space-y-2 w-full">
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-2 font-medium text-gray-700">
          <span>Exames:</span>
          <span className="text-xs text-gray-500">
            {total - completed} restantes
          </span>
        </div>
        <span className="text-xs text-gray-500">
          {completed}/{total} concluídos <span>{progress}% </span>
        </span>
      </div>

      <Progress
        className="w-full"
        color={
          progress === 100 ? "success" : progress >= 50 ? "primary" : "warning"
        }
        size="sm"
        value={progress}
      />
    </div>
  );
};

// Função para buscar o nome do exame baseado no código
const getExamNameByCode = (codigoExame: string): string => {
  // Procura em todas as categorias de exames
  for (const [categoriaName, exames] of Object.entries(EXAMES_LIST)) {
    for (const exame of exames) {
      if (exame.codigos.includes(codigoExame)) {
        // Retorna o nome do exame se existir, senão retorna o nome da categoria
        return exame.nome || categoriaName;
      }
    }
  }

  // Se não encontrou, retorna o código como fallback
  return codigoExame;
};

// Função para formatar apenas o horário do exame
const formatExamTime = (dateString: string | null): string => {
  if (!dateString) return "";

  try {
    const date = new Date(dateString);

    return date.toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch (error) {
    return "";
  }
};

// Função para obter a cor do status
const getStatusColor = (status: string) => {
  switch (status) {
    case "AGENDADO":
      return {
        bg: "bg-blue-50",
        text: "text-blue-700",
        border: "border-blue-200",
      };
    case "REALIZADO":
      return {
        bg: "bg-green-50",
        text: "text-green-700",
        border: "border-green-200",
      };
    case "EM ANDAMENTO":
      return {
        bg: "bg-amber-50",
        text: "text-amber-700",
        border: "border-amber-200",
      };
    case "CANCELADO":
      return {
        bg: "bg-red-50",
        text: "text-red-700",
        border: "border-red-200",
      };
    case "FINALIZADO":
      return {
        bg: "bg-purple-50",
        text: "text-purple-700",
        border: "border-purple-200",
      };
    case "PENDENTE":
      return {
        bg: "bg-gray-50",
        text: "text-gray-700",
        border: "border-gray-200",
      };
    default:
      return {
        bg: "bg-gray-50",
        text: "text-gray-700",
        border: "border-gray-200",
      };
  }
};

// Hook para ordenar exames alfabeticamente
const useSortedExams = (exames: ExamRegister[]) => {
  return useMemo(() => {
    if (!exames || exames.length === 0) return [];

    return [...exames].sort((a, b) => {
      const nameA = getExamNameByCode(a.codigoExame).toLowerCase();
      const nameB = getExamNameByCode(b.codigoExame).toLowerCase();

      return nameA.localeCompare(nameB, "pt-BR");
    });
  }, [exames]);
};

// Componente para detalhes dos exames em tabela
const ExamDetails: React.FC<{ exames: ExamRegister[] }> = ({ exames }) => {
  const sortedExams = useSortedExams(exames);

  const handleViewResult = (url: string) => {
    if (url) {
      window.open(url, "_blank", "noopener,noreferrer");
    }
  };

  return (
    <div className="space-y-3">
      {/* Tabela para desktop */}
      <div className="hidden lg:block">
        <Table
          removeWrapper
          aria-label="Tabela de exames"
          classNames={{
            base: "max-h-none",
            table: "min-w-full",
            th: "bg-gray-50 text-gray-700 font-semibold text-xs uppercase border-b py-2 px-3",
            td: "border-b border-gray-100 py-2 px-3",
          }}
        >
          <TableHeader>
            <TableColumn className="text-left">Exame</TableColumn>
            <TableColumn className="text-center">Status</TableColumn>
            <TableColumn className="text-center">Profissional</TableColumn>
            <TableColumn className="text-center">Sala</TableColumn>
            <TableColumn className="text-center">Finalizado</TableColumn>
            <TableColumn className="text-center">Resultado</TableColumn>
          </TableHeader>
          <TableBody>
            {sortedExams.map((exame, index) => {
              const statusColors = getStatusColor(exame.status);
              const examName = getExamNameByCode(exame.codigoExame);
              const formattedTime = formatExamTime(exame.dataExame);

              return (
                <TableRow
                  key={exame.codigoExame || index}
                  className="hover:bg-gray-50 transition-colors"
                >
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium text-xs text-gray-900">
                        {examName}
                      </span>
                    </div>
                  </TableCell>

                  <TableCell>
                    <div className="flex justify-center">
                      <span className="font-medium text-xs text-gray-900 text-center">
                        {exame.status.replace(/_/g, " ")}
                      </span>
                    </div>
                  </TableCell>

                  <TableCell>
                    <div className="flex items-center gap-1 justify-center">
                      <span className="text-xs text-gray-700 text-left">
                        {exame.profissional?.split(" ")[0] || "—"}
                      </span>
                    </div>
                  </TableCell>

                  <TableCell>
                    <div className="flex items-center gap-1 justify-left whitespace-nowrap">
                      <span className="text-xs text-gray-700">
                        {exame.sala || "—"}
                      </span>
                    </div>
                  </TableCell>

                  <TableCell>
                    <div className="flex justify-center">
                      {formattedTime ? (
                        <div className="flex items-center gap-1 text-sm text-gray-600">
                          <span className="text-xs">{formattedTime}</span>
                        </div>
                      ) : (
                        <span className="text-gray-400 text-xs">—</span>
                      )}
                    </div>
                  </TableCell>

                  <TableCell>
                    <div className="flex justify-center">
                      {exame.url ? (
                        <Tooltip content="Visualizar resultado" placement="top">
                          <Button
                            className="text-blue-600 hover:text-blue-800 hover:bg-blue-50 min-w-20"
                            size="sm"
                            startContent={<Eye className="h-3 w-3" />}
                            variant="light"
                            onPress={() => handleViewResult(exame.url)}
                          >
                            Ver
                          </Button>
                        </Tooltip>
                      ) : (
                        <span className="text-gray-400 text-sm">—</span>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* Versão mobile responsiva */}
      <div className="lg:hidden space-y-2">
        {sortedExams.map((exame, index) => {
          const statusColors = getStatusColor(exame.status);
          const examName = getExamNameByCode(exame.codigoExame);
          const formattedTime = formatExamTime(exame.dataExame);

          return (
            <div
              key={exame.codigoExame || index}
              className="p-3 bg-gray-50 rounded-lg border border-gray-200"
            >
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="col-span-2">
                  <span className="font-semibold text-gray-900">
                    {examName}
                  </span>
                  <span className="text-xs text-gray-400 font-mono ml-2">
                    {exame.codigoExame}
                  </span>
                </div>

                <div className="col-span-2">
                  <Badge
                    className={`${statusColors.bg} ${statusColors.text} border-0 text-xs font-medium`}
                    size="sm"
                    variant="flat"
                  >
                    {exame.status}
                  </Badge>
                </div>

                <div className="flex items-center gap-1">
                  <User className="h-3 w-3 text-gray-400" />
                  <span className="text-xs">
                    {exame.profissional || "Não atribuído"}
                  </span>
                </div>

                <div className="flex items-center gap-1">
                  <MapPin className="h-3 w-3 text-gray-400" />
                  <span className="text-xs">
                    {exame.sala || "Não definida"}
                  </span>
                </div>

                {/* Horário do exame para mobile */}
                {formattedTime && (
                  <div className="col-span-2 flex items-center gap-1 pt-1 border-t border-gray-200 mt-1">
                    <Calendar className="h-3 w-3 text-gray-400" />
                    <span className="text-xs text-gray-600">
                      {formattedTime}
                    </span>
                  </div>
                )}

                <div className="col-span-2 flex justify-center pt-2">
                  {exame.url ? (
                    <Button
                      className="text-blue-600 hover:text-blue-800"
                      size="sm"
                      startContent={<Eye className="h-3 w-3" />}
                      variant="light"
                      onPress={() => handleViewResult(exame.url)}
                    >
                      Ver Resultado
                    </Button>
                  ) : (
                    <span className="text-gray-400 text-xs flex items-center gap-1">
                      <FileText className="h-3 w-3" />
                      Resultado indisponível
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// Componente para anexos do atendimento
const Anexos: React.FC<{ anexos: any[] }> = ({ anexos }) => {
  if (!anexos || anexos.length === 0) return null;

  const handleOpenAnexo = (url: string, nome: string) => {
    if (url) {
      window.open(url, "_blank", "noopener,noreferrer");
    }
  };

  return (
    <div className="flex flex-wrap gap-2">
      {anexos.map((anexo, index) => (
        <Chip
          className="text-gray-700 hover:text-blue-600 hover:bg-blue-50 border border-gray-300 text-xs hover:cursor-pointer"
          color="warning"
          size="sm"
          variant="dot"
          onClick={() => handleOpenAnexo(anexo.StoragePath, anexo.Name)}
        >
          <span className="text-xs max-w-20 truncate">{anexo.Name}</span>
        </Chip>
      ))}
    </div>
  );
};

// Componente para observações e anotações (sempre visível)
const Observations: React.FC<{ atendimento: Scheduling }> = ({
  atendimento,
}) => {
  const hasObservations = atendimento.ANOTACOES || atendimento.OBSERVACOES;

  if (!hasObservations) return null;

  return (
    <div className="space-y-2">
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
        <div className="space-y-2 text-xs text-gray-700">
          {atendimento.ANOTACOES && (
            <div>
              <span className="font-medium block text-xs text-yellow-800 mb-1">
                Anotações internas:
              </span>
              <p className="text-xs">{atendimento.ANOTACOES}</p>
            </div>
          )}

          {atendimento.OBSERVACOES && (
            <div>
              <span className="font-medium block text-xs text-yellow-800 mb-1">
                Observações cliente:
              </span>
              <p className="text-xs">{atendimento.OBSERVACOES}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Tema visual por status (baseado no SenhaCard)
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
        hoverBg: "hover:bg-amber-100",
        pillBg: "bg-amber-500 text-white",
        pillDotColor: "bg-white",
        pillClass: "px-3 py-1 rounded-full",
        textColor: "text-gray-900",
      };
    case TicketStatus.EM_ATENDIMENTO:
      return {
        cardBg: "bg-red-50",
        border: "border-2 border-red-500",
        hoverBg: "hover:bg-red-100",
        pillBg: "bg-red-500 text-white",
        pillDotColor: "bg-white",
        pillClass: "px-3 py-1 rounded-full",
        textColor: "text-gray-900",
      };
    case TicketStatus.FINALIZADO:
      return {
        cardBg: "bg-gray-100",
        border: "border-2 border-gray-400",
        hoverBg: "hover:bg-gray-200",
        pillBg: "bg-gray-400 text-white",
        pillDotColor: "bg-gray-200",
        pillClass: "px-3 py-1 rounded-full",
        textColor: "text-gray-500",
      };
    case TicketStatus.EM_PREPARACAO:
      return {
        cardBg: "bg-blue-100",
        border: "border-2 border-blue-400",
        hoverBg: "hover:bg-blue-200",
        pillBg: "bg-blue-400 text-white",
        pillDotColor: "bg-blue-200",
        pillClass: "px-3 py-1 rounded-full",
        textColor: "text-blue-500",
      };
    case TicketStatus.ENCAMINHADO_RX:
      return {
        cardBg: "bg-blue-100",
        border: "border-2 border-blue-400",
        hoverBg: "hover:bg-blue-200",
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

// Componente para o badge de status
const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const { pillBg, pillClass } = getStatusVisual(status);

  return (
    <div className={`${pillBg} ${pillClass} flex items-center justify-center`}>
      {(status === TicketStatus.EM_PREPARACAO ||
        status === TicketStatus.ENCAMINHADO_RX) && (
        <Spinner className="mr-2" color="white" size="sm" variant="simple" />
      )}
      {status === TicketStatus.EM_CHAMADA && (
        <Spinner className="mr-2" color="white" size="sm" variant="simple" />
      )}
      {status === TicketStatus.EM_ATENDIMENTO && (
        <Spinner className="mr-2" color="white" size="sm" variant="simple" />
      )}
      <span className="text-xs font-semibold uppercase truncate">{status}</span>
    </div>
  );
};

// Componente para as ações do ticket (com cores do SenhaCard)
const TicketActions: React.FC<{
  ticket: Ticket;
  salaSelecionada: string;
  unidadeSelecionada: string;
  socket: Socket;
  atendimento: Scheduling;
  onHandleModal: (state: boolean) => void;
  // setTicketSelecionado: (ticket: Ticket) => void;
  setFuncionarioSelecionado: (funcionario: Scheduling | null) => void;
  exameSelecionado: string;
}> = ({
  ticket,
  salaSelecionada,
  unidadeSelecionada,
  socket,
  atendimento,
  onHandleModal,
  // setTicketSelecionado,
  setFuncionarioSelecionado,
  exameSelecionado,
}) => {
  const { executarAtendimentoAcao } = useSchedulingEntityManager([]);
  // 🔹 Armazena IDs que já tiveram o primeiro clique
  const [firstClickMap, setFirstClickMap] = useState<Record<string, boolean>>(
    {},
  );

  // Utilizado para chamar e nas demais ações
  const handleExecutarAcao = (
    atendimento: Scheduling,
    action: TicketActionType,
  ) => {
    const currentUser = getCurrentUser();

    executarAtendimentoAcao(
      atendimento._id,
      ticket.id,
      action,
      unidadeSelecionada,
      socket,
      salaSelecionada,
      exameSelecionado,
      currentUser?.nome,
    );
  };

  const handleAtender = (
    ticket: Ticket,
    action: TicketActionType,
    funcionario: Scheduling,
  ) => {
    const currentUser = getCurrentUser();

    if (!firstClickMap[ticket.id]) {
      // Primeiro clique: executa ação, mas não abre o modal
      executarAtendimentoAcao(
        atendimento._id,
        ticket.id,
        action,
        unidadeSelecionada,
        socket,
        salaSelecionada,
        exameSelecionado,
        currentUser?.nome,
      );
      setFirstClickMap((prev) => ({ ...prev, [ticket.id]: true }));
    } else {
      // Segundo clique: abre o modal de atendimento
      setFuncionarioSelecionado(funcionario);
      onHandleModal(true);

      // Reseta o clique para permitir novo ciclo
      setFirstClickMap((prev) => {
        const updated = { ...prev };

        delete updated[ticket.id];

        return updated;
      });
    }
  };

  const handleRetornar = (
    atendimento: Scheduling,
    action: TicketActionType,
  ) => {
    // Reseta o clique para permitir novo ciclo
    setFirstClickMap((prev) => {
      const updated = { ...prev };

      delete updated[ticket.id];

      return updated;
    });

    return executarAtendimentoAcao(
      atendimento._id,
      ticket.id,
      action,
      unidadeSelecionada,
      socket,
    );
  };

  const handleDisabledStatus = (ticket: Ticket) => {
    const currentUser = getCurrentUser();

    // // 1. Se o ticket estiver em atendimento / chamada / finalizado - desabilita botões
    // if ((ticket.status === TicketStatus.EM_ATENDIMENTO || ticket.status === TicketStatus.EM_CHAMADA || ticket.status === TicketStatus.FINALIZADO)
    //   && (ticket.sala != salaSelecionada || ticket.profissional !== currentUser?.nome)
    // ) {
    //   return true;
    // }

    // 5. Para qualquer outra situação, o botão deve estar habilitado.
    return false;
  };

  const isDisabled = handleDisabledStatus(ticket);

  return (
    <div className="flex items-center gap-2">
      {/* Botão Chamar - Amarelo */}
      <Tooltip content="Chamar" placement="bottom">
        <Button
          isIconOnly
          className="min-w-8 h-8 bg-amber-500 hover:bg-amber-600 text-white shadow-lg transition-all disabled:bg-gray-300 disabled:opacity-50"
          disabled={isDisabled}
          size="md"
          onPress={() =>
            handleExecutarAcao(atendimento, TicketActionType.CHAMAR)
          }
        >
          <Phone className="h-4 w-4" />
        </Button>
      </Tooltip>

      {/* Botão Atender - Vermelho */}
      <Tooltip content="Atender" placement="bottom">
        <Button
          isIconOnly
          className="min-w-8 h-8 bg-red-500 hover:bg-red-600 text-white shadow-lg transition-all disabled:bg-gray-300 disabled:opacity-50"
          disabled={isDisabled}
          size="md"
          onPress={() =>
            handleAtender(ticket, TicketActionType.ATENDER, atendimento)
          }
        >
          <FilePlus className="h-4 w-4" />
        </Button>
      </Tooltip>

      {/* Botão Retornar - Cinza */}
      <Tooltip content="Retornar" placement="bottom">
        <Button
          isIconOnly
          className="min-w-8 h-8 bg-gray-500 hover:bg-gray-600 text-white shadow-lg transition-all disabled:bg-gray-300 disabled:opacity-50"
          size="md"
          onPress={() => handleRetornar(atendimento, TicketActionType.RETORNAR)}
          // disabled={isDisabled}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
      </Tooltip>
    </div>
  );
};

// Componente principal refatorado
const AtendimentoCard: React.FC<AtendimentoCardProps> = ({
  atendimento,
  salaSelecionada,
  unidadeSelecionada,
  socket,
  onHandleModal,
  // setTicketSelecionado,
  setFuncionarioSelecionado,
  exameSelecionado,
}) => {
  const [showExamDetails, setShowExamDetails] = useState(false);
  const { cardBg, border, hoverBg } = getStatusVisual(
    atendimento.TICKET.status,
  );

  const formatarTempoEspera = (emissao: string | Date) => {
    const dataEmissao = new Date(emissao);
    const agora = new Date();
    const diferencaMs = agora.getTime() - dataEmissao.getTime();
    const minutos = Math.floor(diferencaMs / 1000 / 60);
    const horas = Math.floor(minutos / 60);
    const minutosRestantes = minutos % 60;

    return horas > 0 ? `${horas}h ${minutosRestantes}m` : `${minutos}m`;
  };

  return (
    <Card
      className={`${cardBg} ${border} ${hoverBg} rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 p-4`}
    >
      <div className="space-y-4">
        {/* Header com informações do funcionário e badge de status */}
        <div className="flex items-start justify-between">
          <EmployeeInfo atendimento={atendimento} />

          {/* Ações do ticket */}
          <div className="flex flex-col gap-2">
            <StatusBadge status={atendimento.TICKET.status} />
            <TicketActions
              atendimento={atendimento}
              exameSelecionado={exameSelecionado}
              salaSelecionada={salaSelecionada}
              setFuncionarioSelecionado={setFuncionarioSelecionado}
              // setTicketSelecionado={setTicketSelecionado}
              socket={socket}
              ticket={atendimento.TICKET}
              unidadeSelecionada={unidadeSelecionada}
              onHandleModal={onHandleModal}
            />
          </div>
        </div>

        {/* Observações e anotações (sempre visíveis) */}
        <Observations atendimento={atendimento} />

        {/* Botão para ver detalhes dos exames */}
        {atendimento.EXAMES && atendimento.EXAMES.length > 0 && (
          <Button
            className="w-full text-xs"
            color="success"
            endContent={
              showExamDetails ? (
                <ChevronUp className="h-3 w-3" />
              ) : (
                <ChevronDown className="h-3 w-3" />
              )
            }
            size="lg"
            variant="light"
            onPress={() => setShowExamDetails(!showExamDetails)}
          >
            {/* Barra de progresso dos exames */}
            <ExamProgress exames={atendimento.EXAMES} />
          </Button>
        )}

        {/* Detalhes dos exames em tabela (renderizado condicionalmente) */}
        {showExamDetails && <ExamDetails exames={atendimento.EXAMES} />}

        {/* Footer com informações do ticket e anexos */}
        <div className="space-y-3 pt-4 border-t border-gray-200">
          {/* Anexos */}
          {atendimento.ANEXOS && atendimento.ANEXOS.length > 0 && (
            <div className="flex gap-2">
              <div className="flex items-center gap-1 text-xs text-gray-500">
                <Paperclip className="h-3 w-3" />
                <span className="font-medium">Anexos:</span>
              </div>
              <Anexos anexos={atendimento.ANEXOS} />
            </div>
          )}

          {/* Informações do ticket */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <Clock className="h-4 w-4" />
              <span>{formatarTempoEspera(atendimento.TICKET.emissao)}</span>
              <User className="h-4 w-4 text-gray-400" />
              <span className="truncate">
                {atendimento.TICKET.atendente?.split(" ")[0] || "Não atribuído"}
              </span>
              <Senha className="h-4 w-4 text-gray-400" />
              {Number(atendimento.TICKET.numero) < 0
                ? "N/A"
                : atendimento.TICKET.prefixo + atendimento.TICKET.numero}
              <Pin className="h-4 w-4 text-gray-400" />
              {atendimento.TICKET.unidade}
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default React.memo(AtendimentoCard);
