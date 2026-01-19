import { AnimatePresence } from "framer-motion";
import {
  CheckCircle,
  Clock,
  FilePlus,
  Pause,
  Users,
  X,
  BarChart3,
  Eye,
} from "lucide-react";

import { Ticket } from "@/lib/ticket/ticket";
import { Scheduling } from "@/lib/scheduling/interface/scheduling";
import { PreparationRequest } from "@/lib/ticket/ticket";
import { StatisticsSection } from "@/app/dashboard/components/StatisticsSection";

// Componente de botão de grupo para estatísticas - Compacto para header
const StatButton: React.FC<{
  icon: React.ReactNode;
  value: number;
  label: string;
  color: string;
  onClick?: () => void;
}> = ({ icon, value, label, color, onClick }) => (
  <button
    aria-label={label}
    className="flex gap-2 items-center justify-center p-2 rounded-lg transition-all duration-200 hover:bg-gray-50 focus:outline-none focus:ring-1 focus:ring-[#104e35] min-w-[50px]"
    onClick={onClick}
  >
    <div
      className={`w-4 h-4 rounded-full flex items-center justify-center mb-1 ${color}`}
    >
      {icon}
    </div>
    <span className="text-lg font-bold text-gray-900">{value}</span>
    <span className="text-xs text-gray-600 text-center leading-tight mt-1">
      {label}
    </span>
  </button>
);

// Componente de modal de estatísticas em tela cheia refatorado
export const StatsModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  estatisticasSenhas: {
    recepcaoAguardando: number;
    examesAguardando: number;
    emAtendimento: number;
    preparacao: number;
    raiox: number;
    finalizados: number;
    total: number;
  };
  tickets: Ticket[];
  agendamentos: Scheduling[];
  preparationRequests: PreparationRequest[];
}> = ({
  isOpen,
  onClose,
  estatisticasSenhas,
  tickets,
  agendamentos,
  preparationRequests,
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl w-full h-full max-h-screen overflow-hidden flex flex-col max-w-6xl">
              {/* Cabeçalho do modal */}
              <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-white">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">
                    Estatísticas de Atendimentos
                  </h2>
                  <p className="text-sm text-gray-600 mt-1">
                    Visão geral do desempenho
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    aria-label="Fechar"
                    className="w-7 h-7 flex items-center justify-center text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100 transition-colors focus:outline-none focus:ring-1 focus:ring-[#104e35]"
                    onClick={onClose}
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>

              {/* Conteúdo do modal */}
              <div className="flex-1 overflow-y-auto p-4">
                <StatisticsSection />
              </div>
            </div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
};

interface SenhasEstatisticasProps {
  estatisticasSenhas: {
    recepcaoAguardando: number;
    examesAguardando: number;
    emAtendimento: number;
    preparacao: number;
    raiox: number;
    finalizados: number;
    total: number;
  };
  onSetStatsModalOpen: (status: boolean) => void;
  agendamentos: Scheduling[];
  preparationRequests: PreparationRequest[];
  tickets: Ticket[];
}

export default function SenhasEstatisticas({
  estatisticasSenhas,
  onSetStatsModalOpen,
  agendamentos,
  preparationRequests,
  tickets,
}: SenhasEstatisticasProps) {
  // Cores apenas para ícones (fundo branco no header)
  const getIconColor = (status: string) => {
    const colors = {
      total: "bg-gradient-to-r from-[#104e35] to-[#a6ce39] text-white",
      aguardando: "bg-amber-100 text-amber-600",
      emAtendimento: "bg-red-100 text-red-600",
      preparacao: "bg-blue-100 text-blue-600",
      raiox: "bg-purple-100 text-purple-600",
      finalizados: "bg-green-100 text-green-600",
    };

    return colors[status as keyof typeof colors] || "bg-gray-100 text-gray-600";
  };

  return (
    <>
      {/* Grupo de botões de estatísticas - Desktop (compacto para header) */}
      <div className="hidden lg:flex items-center gap-1 bg-white rounded-lg p-1 border border-gray-200">
        <StatButton
          color={getIconColor("aguardando")}
          icon={<Clock size={12} />}
          label="Recep."
          value={estatisticasSenhas.recepcaoAguardando}
          onClick={() => onSetStatsModalOpen(true)}
        />
        <StatButton
          color={getIconColor("aguardando")}
          icon={<Clock size={12} />}
          label="Exames"
          value={estatisticasSenhas.examesAguardando}
          onClick={() => onSetStatsModalOpen(true)}
        />
        <StatButton
          color={getIconColor("emAtendimento")}
          icon={<FilePlus size={12} />}
          label="Atend."
          value={estatisticasSenhas.emAtendimento}
          onClick={() => onSetStatsModalOpen(true)}
        />
        <StatButton
          color={getIconColor("preparacao")}
          icon={<Pause size={12} />}
          label="Prep."
          value={estatisticasSenhas.preparacao}
          onClick={() => onSetStatsModalOpen(true)}
        />
        <StatButton
          color={getIconColor("raiox")}
          icon={<Eye size={12} />}
          label="Raio-X"
          value={estatisticasSenhas.raiox}
          onClick={() => onSetStatsModalOpen(true)}
        />
        <StatButton
          color={getIconColor("finalizados")}
          icon={<CheckCircle size={12} />}
          label="Concl."
          value={estatisticasSenhas.finalizados}
          onClick={() => onSetStatsModalOpen(true)}
        />
        <StatButton
          color={getIconColor("total")}
          icon={<Users size={12} />}
          label="Total"
          value={estatisticasSenhas.total}
          onClick={() => onSetStatsModalOpen(true)}
        />
      </div>

      {/* Versão mobile */}
      <div className="lg:hidden">
        <button
          aria-label="Ver estatísticas"
          className="p-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors focus:outline-none focus:ring-1 focus:ring-[#104e35]"
          onClick={() => onSetStatsModalOpen(true)}
        >
          <BarChart3 className="text-[#104e35]" size={16} />
        </button>
      </div>
    </>
  );
}
