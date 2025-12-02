import React from "react";
import { Card, Progress, Chip } from "@heroui/react";
import { Clock, User, Ticket as Senha } from "lucide-react";

import { TicketStatus } from "@/lib/ticket/ticket";
import {
  ExamRegister,
  Scheduling,
} from "@/lib/scheduling/interface/scheduling";
import { ExamStatus } from "@/lib/scheduling/enum/scheduling.enum";

interface AtendimentoCardProps {
  atendimento: Scheduling;
}

// Função para calcular idade
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

// Tema visual por status
const getStatusVisual = (status: string) => {
  switch (status) {
    case TicketStatus.AGUARDANDO:
      return { border: "border-l-4 border-l-green-500", bg: "bg-white" };
    case TicketStatus.EM_CHAMADA:
      return { border: "border-l-4 border-l-amber-500", bg: "bg-amber-50" };
    case TicketStatus.EM_ATENDIMENTO:
      return { border: "border-l-4 border-l-red-500", bg: "bg-red-50" };
    case TicketStatus.FINALIZADO:
      return { border: "border-l-4 border-l-gray-400", bg: "bg-gray-100" };
    default:
      return { border: "border-l-4 border-l-gray-300", bg: "bg-white" };
  }
};

// Cores do badge de status
const getStatusColor = (status: string) => {
  switch (status) {
    case TicketStatus.AGUARDANDO:
      return "bg-green-100 text-green-800";
    case TicketStatus.EM_CHAMADA:
      return "bg-amber-100 text-amber-800";
    case TicketStatus.EM_ATENDIMENTO:
      return "bg-red-100 text-red-800";
    case TicketStatus.FINALIZADO:
      return "bg-gray-100 text-gray-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

// Progresso dos exames
const useExamProgress = (exames: ExamRegister[]) => {
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
};

// Componente compacto
const AtendimentoCardCompacto: React.FC<AtendimentoCardProps> = ({
  atendimento,
}) => {
  const { border, bg } = getStatusVisual(atendimento.TICKET.status);
  const { progress, completed, total } = useExamProgress(
    atendimento.EXAMES || [],
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
      className={`${bg} ${border} rounded-lg p-3 mb-2 hover:shadow-md transition-shadow cursor-pointer`}
    >
      <div className="space-y-2">
        {/* Header com nome e status */}
        <div className="flex justify-between items-start gap-2">
          <div className="min-w-0 flex-1">
            <h3 className="font-semibold text-sm text-gray-900 truncate">
              {atendimento.NOME}
            </h3>
            <div className="flex items-center gap-1 text-xs text-gray-600 mt-1">
              <span>{atendimento.TIPOEXAMENOME}</span>
            </div>
          </div>

          <Chip
            className={`${getStatusColor(atendimento.TICKET.status)} text-xs text-center p-4`}
            size="sm"
            variant="flat"
          >
            <div>{atendimento.TICKET.status}</div>
            <div className="text-xs">{atendimento.TICKET.sala}</div>
          </Chip>
        </div>

        {/* Empresa e cargo */}
        <div className="text-xs text-gray-600">
          <div className="truncate">{atendimento.NOMEEMPRESA}</div>
        </div>

        {/* Progresso dos exames */}
        {total > 0 && (
          <div className="space-y-1">
            <div className="flex justify-between text-xs text-gray-600">
              <span>
                Exames: {completed}/{total}
              </span>
              <span>{progress}%</span>
            </div>
            <Progress
              color={
                progress === 100
                  ? "success"
                  : progress >= 50
                    ? "primary"
                    : "warning"
              }
              size="sm"
              value={progress}
            />
          </div>
        )}

        {/* Footer com informações do ticket */}
        <div className="flex items-center justify-between text-xs text-gray-500 pt-2 border-t border-gray-200">
          <div className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            <span>{formatarTempoEspera(atendimento.TICKET.emissao)}</span>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              <User className="h-3 w-3" />
              <span className="truncate max-w-20">
                {atendimento.TICKET.atendente?.split(" ")[0] || "N/A"}
              </span>
            </div>

            <div className="flex items-center gap-1">
              <Senha className="h-3 w-3" />
              <span>
                {Number(atendimento.TICKET.numero) < 0
                  ? "N/A"
                  : atendimento.TICKET.prefixo + atendimento.TICKET.numero}
              </span>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default React.memo(AtendimentoCardCompacto);
