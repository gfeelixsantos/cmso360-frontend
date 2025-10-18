import { Ticket, TicketStatus } from "@/lib/ticket/ticket";
import { AnimatePresence, motion } from "framer-motion";
import { AlertCircle, CheckCircle, Clock, FilePlus, Pause, TrendingUp, Users, X, Activity, BarChart3, Download, FileText, Building, Eye } from "lucide-react";
import { useState, useMemo } from "react";
import { Scheduling } from "@/lib/scheduling/interface/scheduling";
import { PreparationRequest } from "@/lib/ticket/ticket";

// Componente de card de estatística refatorado
const StatCard: React.FC<{
  title: string;
  value: number;
  icon: React.ReactNode;
  color: string;
  trend?: number;
  description?: string;
  onClick?: () => void;
}> = ({ title, value, icon, color, trend, description, onClick }) => (
  <div
    className={`bg-white rounded-lg p-3 border border-gray-200 transition-all duration-200 hover:shadow-md ${
      onClick ? 'cursor-pointer hover:border-gray-300' : ''
    }`}
    onClick={onClick}
  >
    <div className="flex justify-between items-center">
      <div className="flex-1">
        <p className="text-xs font-medium text-gray-600 mb-1">{title}</p>
        <p className="text-xl font-bold text-gray-900">{value}</p>
      </div>
      <div className={`w-4 h-4 rounded-full flex items-center justify-center ${color}`}>
        {icon}
      </div>
    </div>
    {trend !== undefined && (
      <div className={`flex items-center mt-1 text-xs font-medium ${
        trend >= 0 ? 'text-green-600' : 'text-red-600'
      }`}>
        {trend >= 0 ? <TrendingUp size={10} /> : <AlertCircle size={10} />}
        <span className="ml-1">{Math.abs(trend)}%</span>
      </div>
    )}
  </div>
);

// Componente de botão de grupo para estatísticas - Compacto para header
const StatButton: React.FC<{
  icon: React.ReactNode;
  value: number;
  label: string;
  color: string;
  onClick?: () => void;
}> = ({ icon, value, label, color, onClick }) => (
  <button
    onClick={onClick}
    className="flex gap-2 items-center justify-center p-2 rounded-lg transition-all duration-200 hover:bg-gray-50 focus:outline-none focus:ring-1 focus:ring-[#104e35] min-w-[50px]"
    aria-label={label}
  >
    <div className={`w-4 h-4 rounded-full flex items-center justify-center mb-1 ${color}`}>
      {icon}
    </div>
    <span className="text-lg font-bold text-gray-900">{value}</span>
    <span className="text-xs text-gray-600 text-center leading-tight mt-1">{label}</span>
  </button>
);

// Componente de barra de progresso
const ProgressBar: React.FC<{
  value: number;
  max: number;
  color: string;
}> = ({ value, max, color }) => (
  <div className="w-full bg-gray-200 rounded-full h-1.5">
    <div 
      className={`h-1.5 rounded-full ${color}`} 
      style={{ width: `${(value / max) * 100}%` }}
    ></div>
  </div>
);

// Componente de modal de estatísticas em tela cheia refatorado
export const StatsModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  estatisticasSenhas: {
    aguardando: number,
    emAtendimento: number,
    preparacao: number
    raiox: number,
    finalizados: number,
    total: number,
  };
  tickets: Ticket[];
  agendamentos: Scheduling[];
  preparationRequests: PreparationRequest[];
}> = ({ isOpen, onClose, estatisticasSenhas, tickets, agendamentos, preparationRequests }) => {
  
  // Calcular estatísticas adicionais
  const estatisticasAdicionais = useMemo(() => {
    const ticketsFinalizados = tickets.filter(t => t.status === TicketStatus.FINALIZADO);
    const tempoTotal = ticketsFinalizados.reduce((acc, ticket) => {
      if (ticket.emissao) {
        const criacao = new Date(ticket.emissao).getTime();
        const finalizacao = new Date(ticket.emissao).getTime();
        return acc + (finalizacao - criacao);
      }
      return acc;
    }, 0);
    
    const tempoMedio = ticketsFinalizados.length > 0 
      ? Math.round((tempoTotal / ticketsFinalizados.length) / 60000) 
      : 0;
    
    const taxaConclusao = estatisticasSenhas.total > 0
      ? Math.round((estatisticasSenhas.finalizados / estatisticasSenhas.total) * 100)
      : 0;
    
    const ticketsAguardando = tickets.filter(t => 
      t.status === TicketStatus.AGUARDANDO || 
      t.status === TicketStatus.PREPARO_OK ||
      t.status === TicketStatus.EM_PREPARACAO
    );
    
    let maiorTempoEspera = 0;
    if (ticketsAguardando.length > 0) {
      const agora = new Date().getTime();
      ticketsAguardando.forEach(ticket => {
        if (ticket.emissao) {
          const criacao = new Date(ticket.emissao).getTime();
          const tempoEspera = Math.round((agora - criacao) / 60000);
          if (tempoEspera > maiorTempoEspera) {
            maiorTempoEspera = tempoEspera;
          }
        }
      });
    }
    
    // SUGESTÃO 1: Estatísticas por Tipo de Exame
    const examesRealizados = agendamentos.reduce((acc, agendamento) => {
      agendamento.EXAMES.forEach(exame => {
        acc[exame.nomeExame] = (acc[exame.nomeExame] || 0) + 1;
      });
      return acc;
    }, {} as Record<string, number>);

    const examesPorStatus = agendamentos.reduce((acc, agendamento) => {
      agendamento.EXAMES.forEach(exame => {
        const status = exame.status || 'Pendente';
        acc[status] = (acc[status] || 0) + 1;
      });
      return acc;
    }, {} as Record<string, number>);

    // SUGESTÃO 2: Estatísticas por Tipo de ASO
    const tiposASO = agendamentos.reduce((acc, agendamento) => {
      const tipo = agendamento.TIPOEXAMENOME || 'Não especificado';
      acc[tipo] = (acc[tipo] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const examesPorTipo = agendamentos.reduce((acc, agendamento) => {
      const tipo = agendamento.TIPOEXAMENOME || 'Não especificado';
      acc[tipo] = (acc[tipo] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const empresasCount = agendamentos.reduce((acc, agendamento) => {
      const empresa = agendamento.NOMEEMPRESA || 'Não especificada';
      acc[empresa] = (acc[empresa] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const topEmpresas = Object.entries(empresasCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
    
    const totalAgendamentos = agendamentos.length;
    const compareceram = tickets.filter(t => 
      t.status === TicketStatus.FINALIZADO || 
      t.status === TicketStatus.EM_ATENDIMENTO ||
      t.status === TicketStatus.EM_CHAMADA
    ).length;
    
    // SUGESTÃO 3: Métricas de Tempo de Atendimento por Exame
    const tempoPorExame = {
      'CLINICO': 30,
      'AUDIOMETRIA': 45,
      'ACUIDADE VISUAL': 20,
      'LABORATORIO': 60,
      'RAIO-X': 25,
      'ECG': 15,
      'TRIAGEM': 10,
      'Admissional': 30,
      'Periódico': 45,
      'Demissional': 25,
      'Mudança de Função': 40,
      'Retorno ao Trabalho': 35,
      'Não especificado': 30
    };
    
    let tempoTotalEstimado = 0;
    agendamentos.forEach(agendamento => {
      const tipo = agendamento.TIPOEXAMENOME || 'Não especificado';
      tempoTotalEstimado += tempoPorExame[tipo as keyof typeof tempoPorExame] || 30;
    });
    
    return {
      tempoMedioAtendimento: tempoMedio,
      taxaConclusao: taxaConclusao,
      maiorTempoEspera: maiorTempoEspera,
      ticketsPorStatus: {
        aguardando: estatisticasSenhas.aguardando,
        emAtendimento: estatisticasSenhas.emAtendimento,
        preparacao: estatisticasSenhas.preparacao,
        raiox: estatisticasSenhas.raiox,
        finalizados: estatisticasSenhas.finalizados,
      },
      examesPorTipo,
      examesRealizados,
      examesPorStatus,
      tiposASO,
      topEmpresas,
      taxaComparecimento: totalAgendamentos > 0 ? Math.round((compareceram / totalAgendamentos) * 100) : 0,
      tempoTotalEstimado: Math.round(tempoTotalEstimado / 60),
      totalAgendamentos,
      compareceram,
      tempoMedioPorExame: tempoPorExame
    };
  }, [estatisticasSenhas, tickets, agendamentos, preparationRequests]);

  const handleExport = () => {
    console.log("Exportando estatísticas...");
  };

  // Cores baseadas nas ações do componente de tickets (apenas para ícones)
  const getStatusColor = (status: string) => {
    const colors = {
      total: 'bg-gradient-to-r from-[#104e35] to-[#a6ce39] text-white',
      aguardando: 'bg-amber-100 text-amber-600',
      emAtendimento: 'bg-red-100 text-red-600',
      preparacao: 'bg-blue-100 text-blue-600',
      raiox: 'bg-purple-100 text-purple-600',
      finalizados: 'bg-green-100 text-green-600',
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-600';
  };

  const getIconColor = (status: string) => {
    const colors = {
      total: 'text-white',
      aguardando: 'text-amber-600',
      emAtendimento: 'text-red-600',
      preparacao: 'text-blue-600',
      raiox: 'text-purple-600',
      finalizados: 'text-green-600',
    };
    return colors[status as keyof typeof colors] || 'text-gray-600';
  };

  // Seção de estatísticas empresariais
  const renderEstatisticasEmpresariais = () => (
    <div className="bg-white rounded-lg p-4 border border-gray-200">
      <h3 className="text-md font-semibold text-gray-900 mb-3 flex items-center gap-2">
        <Building size={18} className="text-[#104e35]" />
        Estatísticas por Empresa
      </h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-2">Top 5 Empresas</h4>
          <div className="space-y-1">
            {estatisticasAdicionais.topEmpresas.map(([empresa, quantidade], index) => (
              <div key={empresa} className="flex justify-between items-center py-1">
                <span className="text-xs text-gray-600 truncate">
                  {index + 1}. {empresa}
                </span>
                <span className="text-xs font-medium text-gray-900 bg-gray-50 px-2 py-1 rounded">
                  {quantidade}
                </span>
              </div>
            ))}
          </div>
        </div>
        
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-2">Comparecimento</h4>
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <div className="text-2xl font-bold text-gray-900 mb-1">
              {estatisticasAdicionais.taxaComparecimento}%
            </div>
            <ProgressBar 
              value={estatisticasAdicionais.taxaComparecimento} 
              max={100} 
              color="bg-gradient-to-r from-[#104e35] to-[#a6ce39]" 
            />
            <p className="text-xs text-gray-500 mt-1">
              {estatisticasAdicionais.compareceram}/{estatisticasAdicionais.totalAgendamentos}
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  // SUGESTÃO 1: Seção de Estatísticas de Exames
  const renderEstatisticasExames = () => (
    <div className="bg-white rounded-lg p-4 border border-gray-200 mt-4">
      <h3 className="text-md font-semibold text-gray-900 mb-3 flex items-center gap-2">
        <FileText size={18} className="text-[#104e35]" />
        Estatísticas por Exame
      </h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-2">Exames Mais Solicitados</h4>
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {Object.entries(estatisticasAdicionais.examesRealizados)
              .sort((a, b) => b[1] - a[1])
              .slice(0, 5)
              .map(([exame, quantidade]) => (
                <div key={exame} className="flex justify-between items-center">
                  <span className="text-xs text-gray-600 truncate">{exame}</span>
                  <span className="text-xs font-medium bg-gray-100 px-2 py-1 rounded">
                    {quantidade}
                  </span>
                </div>
              ))}
          </div>
        </div>
        
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-2">Status dos Exames</h4>
          <div className="space-y-2">
            {Object.entries(estatisticasAdicionais.examesPorStatus).map(([status, quantidade]) => (
              <div key={status} className="flex justify-between items-center">
                <span className="text-xs text-gray-600">{status}</span>
                <span className="text-xs font-medium bg-gray-100 px-2 py-1 rounded">
                  {quantidade}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  // SUGESTÃO 2: Seção de Tipos de ASO
  const renderTiposASO = () => (
    <div className="bg-white rounded-lg p-4 border border-gray-200 mt-4">
      <h3 className="text-md font-semibold text-gray-900 mb-3 flex items-center gap-2">
        <Activity size={18} className="text-[#104e35]" />
        Distribuição por Tipo de ASO
      </h3>
      
      <div className="space-y-2 max-h-40 overflow-y-auto">
        {Object.entries(estatisticasAdicionais.tiposASO)
          .sort((a, b) => b[1] - a[1])
          .map(([tipoASO, quantidade]) => (
            <div key={tipoASO} className="flex justify-between items-center">
              <span className="text-xs text-gray-600 truncate">{tipoASO}</span>
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium bg-gray-100 px-2 py-1 rounded">
                  {quantidade}
                </span>
                <span className="text-xs text-gray-500">
                  {Math.round((quantidade / estatisticasAdicionais.totalAgendamentos) * 100)}%
                </span>
              </div>
            </div>
          ))}
      </div>
    </div>
  );

  // SUGESTÃO 3: Métricas de Eficiência
  const renderMetricasEficiencia = () => (
    <div className="bg-white rounded-lg p-4 border border-gray-200 mt-4">
      <h3 className="text-md font-semibold text-gray-900 mb-3 flex items-center gap-2">
        <BarChart3 size={18} className="text-[#104e35]" />
        Métricas de Eficiência
      </h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="text-center p-3 bg-gray-50 rounded-lg">
          <p className="text-xs text-gray-600 mb-1">Capacidade Diária</p>
          <p className="text-lg font-bold text-gray-900">
            {Math.round(estatisticasAdicionais.tempoTotalEstimado / 8)}
          </p>
          <p className="text-xs text-gray-500">horas/dia</p>
        </div>
        
        <div className="text-center p-3 bg-gray-50 rounded-lg">
          <p className="text-xs text-gray-600 mb-1">Exames/Hora</p>
          <p className="text-lg font-bold text-gray-900">
            {estatisticasAdicionais.totalAgendamentos > 0 
              ? Math.round((estatisticasAdicionais.totalAgendamentos / estatisticasAdicionais.tempoTotalEstimado) * 60)
              : 0
            }
          </p>
          <p className="text-xs text-gray-500">média</p>
        </div>
        
        <div className="text-center p-3 bg-gray-50 rounded-lg">
          <p className="text-xs text-gray-600 mb-1">Taxa de Absenteísmo</p>
          <p className="text-lg font-bold text-gray-900">
            {100 - estatisticasAdicionais.taxaComparecimento}%
          </p>
          <p className="text-xs text-gray-500">não compareceram</p>
        </div>
        
        <div className="text-center p-3 bg-gray-50 rounded-lg">
          <p className="text-xs text-gray-600 mb-1">Tempo Total Estimado</p>
          <p className="text-lg font-bold text-gray-900">
            {estatisticasAdicionais.tempoTotalEstimado}h
          </p>
          <p className="text-xs text-gray-500">para concluir</p>
        </div>
      </div>
    </div>
  );

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl w-full h-full max-h-screen overflow-hidden flex flex-col max-w-6xl">
              {/* Cabeçalho do modal */}
              <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-white">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Estatísticas de Atendimentos</h2>
                  <p className="text-sm text-gray-600 mt-1">Visão geral do desempenho</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleExport}
                    className="flex items-center gap-2 px-3 py-1.5 text-sm bg-[#104e35] text-white rounded-lg hover:bg-[#0d3d29] transition-all focus:outline-none focus:ring-1 focus:ring-[#104e35]"
                    aria-label="Exportar estatísticas"
                  >
                    <Download size={14} />
                    Exportar
                  </button>
                  <button
                    onClick={onClose}
                    className="w-7 h-7 flex items-center justify-center text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100 transition-colors focus:outline-none focus:ring-1 focus:ring-[#104e35]"
                    aria-label="Fechar"
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>
              
              {/* Conteúdo do modal */}
              <div className="flex-1 overflow-y-auto p-4">
                {/* Estatísticas principais */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
                  <StatCard
                    title="Total"
                    value={estatisticasSenhas.total}
                    icon={<Users size={16} className={getIconColor('total')} />}
                    color={getStatusColor('total')}
                  />
                  <StatCard
                    title="Aguardando"
                    value={estatisticasSenhas.aguardando}
                    icon={<Clock size={16} className={getIconColor('aguardando')} />}
                    color={getStatusColor('aguardando')}
                  />
                  <StatCard
                    title="Atendimento"
                    value={estatisticasSenhas.emAtendimento}
                    icon={<FilePlus size={16} className={getIconColor('emAtendimento')} />}
                    color={getStatusColor('emAtendimento')}
                  />
                  <StatCard
                    title="Preparação"
                    value={estatisticasSenhas.preparacao}
                    icon={<Pause size={16} className={getIconColor('preparacao')} />}
                    color={getStatusColor('preparacao')}
                  />
                  <StatCard
                    title="Raio-X"
                    value={estatisticasSenhas.raiox}
                    icon={<Eye size={16} className={getIconColor('raiox')} />}
                    color={getStatusColor('raiox')}
                  />
                  <StatCard
                    title="Concluídos"
                    value={estatisticasSenhas.finalizados}
                    icon={<CheckCircle size={16} className={getIconColor('finalizados')} />}
                    color={getStatusColor('finalizados')}
                  />
                </div>
                
                {/* Estatísticas empresariais */}
                {renderEstatisticasEmpresariais()}
                
                {/* Estatísticas de exames */}
                {renderEstatisticasExames()}
                
                {/* Tipos de ASO */}
                {renderTiposASO()}
                
                {/* Métricas de eficiência */}
                {renderMetricasEficiencia()}
                
                {/* Análise de desempenho */}
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 mt-4">
                  <h3 className="text-md font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <BarChart3 size={18} className="text-[#104e35]" />
                    Análise de Desempenho
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-white p-3 rounded-lg border border-gray-200">
                      <p className="text-xs text-gray-600 mb-1">Taxa de Conclusão</p>
                      <div className="flex items-end justify-between mb-2">
                        <span className="text-lg font-bold text-gray-900">
                          {estatisticasAdicionais.taxaConclusao}%
                        </span>
                      </div>
                      <ProgressBar 
                        value={estatisticasAdicionais.taxaConclusao} 
                        max={100} 
                        color="bg-gradient-to-r from-[#104e35] to-[#a6ce39]" 
                      />
                    </div>
                    
                    <div className="bg-white p-3 rounded-lg border border-gray-200">
                      <p className="text-xs text-gray-600 mb-1">Tempo Médio</p>
                      <div className="flex items-end justify-between mb-2">
                        <span className="text-lg font-bold text-gray-900">
                          {estatisticasAdicionais.tempoMedioAtendimento} min
                        </span>
                      </div>
                      <p className="text-xs text-gray-500">por atendimento</p>
                    </div>
                    
                    <div className="bg-white p-3 rounded-lg border border-gray-200">
                      <p className="text-xs text-gray-600 mb-1">Maior Espera</p>
                      <div className="flex items-end justify-between mb-2">
                        <span className="text-lg font-bold text-gray-900">
                          {estatisticasAdicionais.maiorTempoEspera} min
                        </span>
                      </div>
                      <p className="text-xs text-gray-500">ticket atual</p>
                    </div>
                  </div>
                </div>
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
    aguardando: number,
    emAtendimento: number,
    preparacao: number
    raiox: number,
    finalizados: number,
    total: number,
  };
  onSetStatsModalOpen: (status:boolean) => void;
  agendamentos: Scheduling[];
  preparationRequests: PreparationRequest[];
  tickets: Ticket[];
}

export default function SenhasEstatisticas({ 
  estatisticasSenhas, 
  onSetStatsModalOpen, 
  agendamentos, 
  preparationRequests, 
  tickets 
}: SenhasEstatisticasProps) {
  
  // Cores apenas para ícones (fundo branco no header)
  const getIconColor = (status: string) => {
    const colors = {
      total: 'bg-gradient-to-r from-[#104e35] to-[#a6ce39] text-white',
      aguardando: 'bg-amber-100 text-amber-600',
      emAtendimento: 'bg-red-100 text-red-600',
      preparacao: 'bg-blue-100 text-blue-600',
      raiox: 'bg-purple-100 text-purple-600',
      finalizados: 'bg-green-100 text-green-600',
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-600';
  };

  return (
    <>
      {/* Grupo de botões de estatísticas - Desktop (compacto para header) */}
      <div className="hidden lg:flex items-center gap-1 bg-white rounded-lg p-1 border border-gray-200">
        <StatButton
          icon={<Users size={12} />}
          value={estatisticasSenhas.total}
          label="Total"
          color={getIconColor('total')}
          onClick={() => onSetStatsModalOpen(true)}
        />
        <StatButton
          icon={<Clock size={12} />}
          value={estatisticasSenhas.aguardando}
          label="Aguard."
          color={getIconColor('aguardando')}
          onClick={() => onSetStatsModalOpen(true)}
        />
        <StatButton
          icon={<FilePlus size={12} />}
          value={estatisticasSenhas.emAtendimento}
          label="Atend."
          color={getIconColor('emAtendimento')}
          onClick={() => onSetStatsModalOpen(true)}
        />
        <StatButton
          icon={<Pause size={12} />}
          value={estatisticasSenhas.preparacao}
          label="Prep."
          color={getIconColor('preparacao')}
          onClick={() => onSetStatsModalOpen(true)}
        />
        <StatButton
          icon={<Eye size={12} />}
          value={estatisticasSenhas.raiox}
          label="Raio-X"
          color={getIconColor('raiox')}
          onClick={() => onSetStatsModalOpen(true)}
        />
        <StatButton
          icon={<CheckCircle size={12} />}
          value={estatisticasSenhas.finalizados}
          label="Concl."
          color={getIconColor('finalizados')}
          onClick={() => onSetStatsModalOpen(true)}
        />
      </div>

      {/* Versão mobile */}
      <div className="lg:hidden">
        <button 
          onClick={() => onSetStatsModalOpen(true)}
          className="p-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors focus:outline-none focus:ring-1 focus:ring-[#104e35]"
          aria-label="Ver estatísticas"
        >
          <BarChart3 size={16} className="text-[#104e35]" />
        </button>
      </div>
    </>
  );
}