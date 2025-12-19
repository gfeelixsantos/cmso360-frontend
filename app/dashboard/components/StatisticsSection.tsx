"use client";

import { ExameStatisticsDto, StatisticsResponseDto, useStatistics } from "@/hooks/useStatictics";
import { Button } from "@heroui/button";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Building2, 
  TrendingUp, 
  RefreshCw, 
  AlertCircle,
  Users,
  FileText,
  Ticket,
  CheckCircle,
  Clock,
  Activity,
  ChevronDown,
  ChevronUp,
  BarChart3,
  Smartphone,
  Zap,
  Calendar,
  AlertTriangle,
  CheckCheck,
  Hourglass,
  Target,
  ClipboardCheck,
  PieChart,
  Eye,
  EyeOff,
  ListFilter,
  BarChart,
  Layers,
  Grid3x3,
  Hash,
  Tag,
  Filter,
  ChartBar,
  ChartPie,
  TrendingDown,
  CheckSquare,
  Clock4,
  UserCheck,
  FileBarChart,
  BarChart2,
  LineChart,
  Grid,
  Users as UsersIcon,
  Flag,
  Shield,
  Building,
  MapPin
} from "lucide-react";
import { useEffect, useState, useMemo } from "react";



// Componente de badge de status por unidade
const UnitExamStatusBadge = ({ status, count }: { status: string; count: number }) => {
  const getStatusConfig = (status: string) => {
    const normalized = status.toUpperCase();
    switch (normalized) {
      case 'PENDENTE':
      case 'PENDENTE_LABORATORIO':
        return { 
          color: 'text-yellow-700',
          bg: 'bg-yellow-50',
          border: 'border-yellow-200',
          icon: <AlertTriangle className="h-3 w-3" />
        };
      case 'AGUARDANDO_RESULTADO':
      case 'EM_ANALISE':
        return { 
          color: 'text-blue-700',
          bg: 'bg-blue-50',
          border: 'border-blue-200',
          icon: <Hourglass className="h-3 w-3" />
        };
      case 'FINALIZADO':
      case 'CONCLUIDO':
        return { 
          color: 'text-green-700',
          bg: 'bg-green-50',
          border: 'border-green-200',
          icon: <CheckCheck className="h-3 w-3" />
        };
      default:
        return { 
          color: 'text-gray-700',
          bg: 'bg-gray-50',
          border: 'border-gray-200',
          icon: <FileText className="h-3 w-3" />
        };
    }
  };

  const config = getStatusConfig(status);
  
  return (
    <div className={`flex items-center gap-1.5 px-2 py-1 rounded text-xs ${config.bg} ${config.border}`}>
      {config.icon}
      <span className={`font-bold ${config.color}`}>{count}</span>
    </div>
  );
};

// Barra de progresso horizontal
const HorizontalProgressBar = ({ value, max, color = 'bg-[#44735E]', showLabel = true }: { 
  value: number; 
  max: number; 
  color?: string;
  showLabel?: boolean;
}) => {
  const percentage = max > 0 ? (value / max) * 100 : 0;
  
  return (
    <div className="w-full">
      {showLabel && (
        <div className="flex justify-between text-xs text-gray-600 mb-1">
          <span>{value.toLocaleString('pt-BR')}</span>
          <span className="font-medium">{percentage.toFixed(1)}%</span>
        </div>
      )}
      <div className="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.8 }}
          className={`h-1.5 rounded-full ${color}`}
        />
      </div>
    </div>
  );
};

export function StatisticsSection() {
  const { data, loading, error, refetch } = useStatistics({
    autoRefresh: true,
    refreshInterval: 300000,
  });

  const [expandedUnit, setExpandedUnit] = useState<string | null>(null);
  const [expandedExameUnit, setExpandedExameUnit] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showAllExams, setShowAllExams] = useState<Record<string, boolean>>({});
  const [lastUpdate, setLastUpdate] = useState<string>('');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Cast data para o novo tipo
  const statisticsData = data as unknown as StatisticsResponseDto;

  // Calcular resumos por unidade
  const unitSummaries = useMemo(() => {
    if (!statisticsData?.porUnidade) return {};

    const summaries: Record<string, {
      totalExames: number;
      totalExamesFinalizados: number;
      totalExamesPendentes: number;
      percentualFinalizados: number;
      examesMaisRealizados: ExameStatisticsDto[];
    }> = {};

    statisticsData.porUnidade.forEach(unidade => {
      let totalExames = 0;
      let totalExamesFinalizados = 0;
      let totalExamesPendentes = 0;

      unidade.exames.forEach(exame => {
        totalExames += exame.total;
        
        const pendentes = exame.porStatus.PENDENTE || exame.porStatus.PENDENTE_LABORATORIO || 0;
        const finalizados = 
          (exame.porStatus.FINALIZADO || 0) + 
          (exame.porStatus.CONCLUIDO || 0) +
          (exame.porStatus.AGUARDANDO_RESULTADO || 0);
        
        totalExamesPendentes += pendentes;
        totalExamesFinalizados += finalizados;
      });

      const examesOrdenados = [...unidade.exames]
        .sort((a, b) => b.total - a.total)
        .slice(0, 10);

      summaries[unidade.unidade] = {
        totalExames,
        totalExamesFinalizados,
        totalExamesPendentes,
        percentualFinalizados: totalExames > 0 ? (totalExamesFinalizados / totalExames) * 100 : 0,
        examesMaisRealizados: examesOrdenados,
      };
    });

    return summaries;
  }, [statisticsData]);

  // Consolidar exames gerais para comparação
  // Corrigir a definição de consolidatedExames no useMemo
const consolidatedExames = useMemo(() => {
  if (!statisticsData?.porUnidade) return [];

  const examesMap = new Map<string, {
    nomeExame: string;
    codigoExame: string;
    total: number;
    porUnidade: Record<string, {
      total: number;
      finalizados: number;
      pendentes: number;
    }>;
  }>();

  statisticsData.porUnidade.forEach(unidade => {
    unidade.exames.forEach(exame => {
      const key = `${exame.codigoExame}-${exame.nomeExame}`;
      
      if (!examesMap.has(key)) {
        examesMap.set(key, {
          nomeExame: exame.nomeExame,
          codigoExame: exame.codigoExame,
          total: 0,
          porUnidade: {},
        });
      }

      const consolidado = examesMap.get(key)!;
      consolidado.total += exame.total;
      
      const pendentes = exame.porStatus.PENDENTE || exame.porStatus.PENDENTE_LABORATORIO || 0;
      const finalizados = 
        (exame.porStatus.FINALIZADO || 0) + 
        (exame.porStatus.CONCLUIDO || 0) +
        (exame.porStatus.AGUARDANDO_RESULTADO || 0);
      
      consolidado.porUnidade[unidade.unidade] = {
        total: exame.total,
        finalizados,
        pendentes,
      };
    });
  });

  // Converter Map para Array
  return Array.from(examesMap.values())
    .sort((a, b) => b.total - a.total);
}, [statisticsData]);

  // Unidades padrão
  const defaultUnits = ['RIO CLARO', 'CORDEIRÓPOLIS', 'ARARAS'];
  const activeUnits = useMemo(() => {
    if (!statisticsData?.porUnidade) return defaultUnits;
    const units = statisticsData.porUnidade.map(u => u.unidade);
    return [...new Set([...defaultUnits, ...units])];
  }, [statisticsData]);

  useEffect(() => {
    if (statisticsData?.generatedAt) {
      const date = new Date(statisticsData.generatedAt);
      setLastUpdate(date.toLocaleTimeString('pt-BR'));
    }
  }, [statisticsData]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refetch();
    setTimeout(() => setIsRefreshing(false), 500);
  };

  const toggleShowAllExams = (unitName: string) => {
    setShowAllExams(prev => ({
      ...prev,
      [unitName]: !prev[unitName]
    }));
  };

  const getStatusColor = (percentage: number) => {
    if (percentage >= 40) return 'text-green-600';
    if (percentage >= 20) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (error) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-red-50 to-white border border-red-200 rounded-2xl p-6 shadow-sm"
      >
        <div className="flex items-start gap-4">
          <div className="p-3 bg-red-100 rounded-xl">
            <AlertCircle className="h-6 w-6 text-red-600" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-red-800 mb-1">
              Erro ao carregar estatísticas
            </h3>
            <button
              onClick={handleRefresh}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors text-sm"
            >
              Tentar novamente
            </button>
          </div>
        </div>
      </motion.div>
    );
  }

  if (loading && !statisticsData) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200/80 p-6">
        <div className="animate-pulse space-y-6">
          <div className="flex justify-between">
            <div className="h-6 bg-gray-200 rounded w-1/4"></div>
            <div className="h-8 w-8 bg-gray-200 rounded-full"></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-40 bg-gray-200 rounded-xl"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <AnimatePresence>
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.4 }}
        className="space-y-4"
      >


        {/* KPI GERAIS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-8">
          {/* Atendimentos Totais */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-gradient-to-br from-[#44735E] to-[#2a4d3d] rounded-xl shadow-lg p-5 text-white"
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Users className="h-5 w-5 text-white/90" />
                  <p className="text-white/90 text-sm font-medium">
                    Total de Atendimentos
                  </p>
                </div>
                <p className="text-3xl font-bold">{statisticsData?.totaisGerais?.totalAgendamentos || 0}</p>
                <p className="text-white/70 text-xs mt-2">
                  {statisticsData?.porUnidade?.length || 0} unidades ativas
                </p>
              </div>
              <div className="w-12 h-12 bg-white/10 backdrop-blur-sm rounded-xl flex items-center justify-center">
                <TrendingUp className="h-6 w-6" />
              </div>
            </div>
          </motion.div>

          {/* Exames Realizados */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <p className="text-gray-700 text-sm font-medium">
                    Exames
                  </p>
                </div>
                <p className="text-3xl font-bold text-gray-900">
                  {statisticsData?.totaisGerais?.totalExamesRealizados || 0}
                </p>
                {statisticsData?.porUnidade && (
                  <p className="text-gray-600 text-xs mt-2">
                    {Object.values(unitSummaries).reduce((sum, s) => sum + s.totalExamesFinalizados, 0)} finalizados*
                  </p>
                )}
              </div>
            </div>
          </motion.div>
          

          {/* Tickets Emitidos */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <p className="text-gray-700 text-sm font-medium">
                    Tickets Emitidos
                  </p>
                </div>
                <p className="text-3xl font-bold text-gray-900">
                  {statisticsData?.totaisGerais?.totalTicketsEmitidos || 0}
                </p>
                {statisticsData?.porUnidade && (
                  <p className="text-gray-600 text-xs mt-2">
                    {statisticsData.porUnidade.reduce((sum, u) => 
                      sum + u.tickets.reduce((tSum, t) => tSum + t.preferencial, 0), 0
                    )} preferenciais
                  </p>
                )}
              </div>
            </div>
          </motion.div>

          {/* Cabeçalho */}
          <div className="flex lg:flex-row items-start lg:items-center justify-center">
            <Button
              onClick={handleRefresh}
              disabled={loading || isRefreshing}
              className="flex items-center gap-2 px-4 py-2.5 text-white rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium shadow-sm"
            >
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span>{isRefreshing ? 'Atualizando...' : 'Atualizar Dados'}</span>
            </Button>
          </div>
        </div>

        {/* STATUS GERAIS E TIPOS DE EXAME */}
        {statisticsData?.totaisGerais && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Status Consolidados */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden"
            >
              <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
                <div className="flex items-center gap-3">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      Status Atendimentos
                    </h3>
                    <p className="text-gray-600 text-sm">
                      {statisticsData.totaisGerais.totalAgendamentos} atendimentos
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-4">
                <div className="space-y-3">
                  {Object.entries(statisticsData.totaisGerais.atendimentosPorStatus)
                    .sort(([,a], [,b]) => b - a)
                    .map(([status, count]) => {
                      const percentage = (count / statisticsData.totaisGerais.totalAgendamentos) * 100;
                      return (
                        <div key={status} className="group">
                          <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-2">
                              <Activity className="h-4 w-4 text-gray-400" />
                              <span className="font-medium text-gray-900">{status}</span>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="text-sm text-gray-600">{count}</span>
                              <span className={`text-sm font-medium ${getStatusColor(percentage)}`}>
                                {percentage.toFixed(1)}%
                              </span>
                            </div>
                          </div>
                          <HorizontalProgressBar 
                            value={count} 
                            max={statisticsData.totaisGerais.totalAgendamentos} 
                            color="bg-blue-500"
                            showLabel={false}
                          />
                        </div>
                      );
                    })}
                </div>
              </div>
            </motion.div>

            {/* Tipos de Exame Consolidados */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden"
            >
              <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        Tipos de Exame Solicitados
                      </h3>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-4">
                <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
                  {Object.entries(statisticsData.totaisGerais.atendimentosPorTipoExame)
                    .sort(([,a], [,b]) => b - a)
                    .map(([tipo, count]) => {
                      const percentage = (count / statisticsData.totaisGerais.totalAgendamentos) * 100;
                      return (
                        <div key={tipo} className="group">
                          <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-2">
                              <Hash className="h-4 w-4 text-gray-400" />
                              <span className="font-medium text-gray-900 truncate">{tipo}</span>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="text-sm text-gray-600">{count}</span>
                              <span className={`text-sm font-medium ${getStatusColor(percentage)}`}>
                                {percentage.toFixed(1)}%
                              </span>
                            </div>
                          </div>
                          <HorizontalProgressBar 
                            value={count} 
                            max={statisticsData.totaisGerais.totalAgendamentos} 
                            color="bg-green-500"
                            showLabel={false}
                          />
                        </div>
                      );
                    })}
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {/* EXAMES POR UNIDADE (SEPARADO PARA CADA GESTOR) */}
        <div className="space-y-6">
          {activeUnits.map((unitName) => {
            const unitData = statisticsData?.porUnidade?.find(u => u.unidade === unitName);
            const hasData = !!unitData;
            const isExpanded = expandedUnit === unitName;
            const unitSummary = unitSummaries[unitName];
            const isExameUnitExpanded = expandedExameUnit === unitName;
            const showAllForUnit = showAllExams[unitName] || false;

            return (
              <motion.div
                key={unitName}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden"
              >
                {/* Cabeçalho da Unidade */}
                <div className="p-5 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
                  <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div>
                        <h2 className="text-xl font-bold text-gray-900">
                          {unitName}
                        </h2>
                        <div className="flex items-center gap-4 mt-1">
                          <div className="flex items-center gap-2">
                            <UsersIcon className="h-4 w-4 text-gray-500" />
                            <span className="text-lg font-bold text-[#44735E]">
                              {hasData ? unitData.totalAgendamentos : 0}
                            </span>
                            <span className="text-gray-600 text-sm">atendimentos</span>
                          </div>
                          {hasData && unitSummary && (
                            <div className="flex items-center gap-2">
                              <FileText className="h-4 w-4 text-gray-500" />
                              <span className="text-lg font-bold text-blue-600">
                                {unitSummary.totalExames}
                              </span>
                              <span className="text-gray-600 text-sm">exames</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    {hasData && (
                      <div className="flex items-center gap-3">
                        {unitSummary && (
                          <div className="text-right">
                            <div className={`text-lg font-bold ${getStatusColor(unitSummary.percentualFinalizados)}`}>
                              {unitSummary.percentualFinalizados.toFixed(1)}%
                            </div>
                            <div className="text-xs text-gray-500">conclusão</div>
                          </div>
                        )}
                        <button
                          onClick={() => setExpandedUnit(isExpanded ? null : unitName)}
                          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                          {isExpanded ? (
                            <ChevronUp className="h-5 w-5 text-gray-500" />
                          ) : (
                            <ChevronDown className="h-5 w-5 text-gray-500" />
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Detalhes da Unidade (Expandido) */}
                {hasData && isExpanded && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="p-5 space-y-6"
                  >
                    {/* Status e Tipos de Exame da Unidade */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {/* Status dos Atendimentos */}
                      <div>
                        <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                          <Activity className="h-4 w-4 text-blue-600" />
                          Status dos Atendimentos
                        </h4>
                        <div className="space-y-2">
                          {Object.entries(unitData.atendimentosPorStatus)
                            .sort(([,a], [,b]) => b - a)
                            .map(([status, count]) => (
                              <div key={status} className="flex items-center justify-between text-sm p-2 hover:bg-gray-50 rounded">
                                <span className="text-gray-600">{status}</span>
                                <div className="flex items-center gap-3">
                                  <span className="font-bold text-gray-900">{count}</span>
                                  <span className="text-xs text-gray-500">
                                    ({((count / unitData.totalAgendamentos) * 100).toFixed(1)}%)
                                  </span>
                                </div>
                              </div>
                            ))}
                        </div>
                      </div>

                      {/* Tipos de Exame da Unidade */}
                      <div>
                        <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                          <Layers className="h-4 w-4 text-green-600" />
                          Tipos de Exame ({Object.keys(unitData.atendimentosPorTipoExame).length})
                        </h4>
                        <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                          {Object.entries(unitData.atendimentosPorTipoExame)
                            .sort(([,a], [,b]) => b - a)
                            .map(([tipo, count]) => (
                              <div key={tipo} className="flex items-center justify-between text-sm p-2 hover:bg-gray-50 rounded">
                                <span className="text-gray-600 truncate">{tipo}</span>
                                <div className="flex items-center gap-3">
                                  <span className="font-bold text-gray-900">{count}</span>
                                  <span className="text-xs text-gray-500">
                                    ({((count / unitData.totalAgendamentos) * 100).toFixed(1)}%)
                                  </span>
                                </div>
                              </div>
                            ))}
                        </div>
                      </div>
                    </div>

                    {/* Tickets da Unidade */}
                    {/* <div>
                      <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                        <Ticket className="h-4 w-4 text-purple-600" />
                        Tickets da Unidade
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {unitData.tickets.map((ticket, idx) => {
                          const preferencialPercent = ticket.total > 0 ? (ticket.preferencial / ticket.total) * 100 : 0;
                          return (
                            <div key={idx} className="bg-gray-50 rounded-lg p-3">
                              <div className="flex items-center justify-between mb-2">
                                <span className="font-medium text-gray-900">{ticket.status}</span>
                                <span className="text-lg font-bold text-gray-900">{ticket.total}</span>
                              </div>
                              <div className="text-xs text-gray-600 mb-2">
                                {ticket.preferencial} preferenciais ({preferencialPercent.toFixed(0)}%)
                              </div>
                              <HorizontalProgressBar 
                                value={ticket.preferencial}
                                max={ticket.total}
                                color="bg-purple-500"
                                showLabel={false}
                              />
                            </div>
                          );
                        })}
                      </div>
                    </div> */}

                    {/* EXAMES DA UNIDADE (SEPARADO POR GESTOR) */}
                    <div className="border-t border-gray-200 pt-6">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900">
                              Exames de {unitName}
                            </h3>
                            <p className="text-gray-600 text-sm">
                              {unitData.exames.length} exames • {unitSummary?.totalExamesFinalizados} finalizados
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setExpandedExameUnit(isExameUnitExpanded ? null : unitName)}
                            className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900"
                          >
                            {isExameUnitExpanded ? (
                              <>
                                <ChevronUp className="h-4 w-4" />
                                Recolher
                              </>
                            ) : (
                              <>
                                <ChevronDown className="h-4 w-4" />
                                Expandir
                              </>
                            )}
                          </button>
                          {unitData.exames.length > 8 && (
                            <button
                              onClick={() => toggleShowAllExams(unitName)}
                              className="flex items-center gap-1 text-sm text-[#44735E] hover:text-[#356349]"
                            >
                              {showAllForUnit ? (
                                <>
                                  <EyeOff className="h-4 w-4" />
                                  Ver menos
                                </>
                              ) : (
                                <>
                                  <Eye className="h-4 w-4" />
                                  Ver todos
                                </>
                              )}
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Grid de Exames da Unidade */}
                      <div className={`grid grid-cols-1 ${showAllForUnit ? 'lg:grid-cols-3' : 'lg:grid-cols-4'} gap-4`}>
                        {(showAllForUnit ? unitData.exames : unitData.exames.slice(0, 8))
                          .sort((a, b) => b.total - a.total)
                          .map((exame) => {
                            const pendentes = exame.porStatus.PENDENTE || exame.porStatus.PENDENTE_LABORATORIO || 0;
                            const finalizados = 
                              (exame.porStatus.FINALIZADO || 0) + 
                              (exame.porStatus.CONCLUIDO || 0) +
                              (exame.porStatus.AGUARDANDO_RESULTADO || 0);
                            const total = exame.total;
                            const percentFinalizado = total > 0 ? (finalizados / total) * 100 : 0;

                            return (
                              <div 
                                key={`${unitName}-${exame.nomeExame}`}
                                className="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors border border-gray-200"
                              >
                                <div className="flex items-start justify-between mb-3">
                                  <div className="flex-1 min-w-0">
                                    <div className="font-semibold text-gray-900 truncate">
                                      {exame.nomeExame}
                                    </div>
                                  </div>
                                  <div className="text-right">
                                    <div className="text-xl font-bold text-gray-900">{total}</div>
                                    <div className="text-xs text-gray-500">total</div>
                                  </div>
                                </div>

                                {/* Status */}
                                <div className="flex gap-2 mb-3">
                                  {pendentes > 0 && (      
                                    <div className="flex items-center">
                                      <UnitExamStatusBadge status="PENDENTE" count={pendentes} />
                                      <span className="text-xs">Pendentes</span>
                                    </div>
                                  )}
                                  {finalizados > 0 && (
                                    <div className="flex items-center">
                                      <UnitExamStatusBadge status="FINALIZADO" count={finalizados} />
                                      <span className="text-xs">Finalizados</span>
                                    </div>
                                  )}
                                </div>

                                {/* Progresso */}
                                <div className="space-y-2">
                                  <div>
                                    <div className="flex justify-between text-xs text-gray-600 mb-1">
                                      <span>Conclusão</span>
                                      <span className="font-medium">{percentFinalizado.toFixed(1)}%</span>
                                    </div>
                                    <HorizontalProgressBar 
                                      value={finalizados}
                                      max={total}
                                      color={percentFinalizado >= 70 ? 'bg-green-500' : 'bg-yellow-500'}
                                      showLabel={false}
                                    />
                                  </div>
                                  
                                  {isExameUnitExpanded && (
                                    <div className="pt-2 border-t border-gray-200">
                                      <div className="text-xs text-gray-600">
                                        {Object.entries(exame.porStatus)
                                          .sort(([,a], [,b]) => b - a)
                                          .map(([status, count]) => (
                                            <div key={status} className="flex justify-between">
                                              <span>{status.replace(/_/g, ' ')}:</span>
                                              <span className="font-medium">{count}</span>
                                            </div>
                                          ))}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                      </div>

                      {!showAllForUnit && unitData.exames.length > 8 && (
                        <div className="mt-4 text-center">
                          <button
                            onClick={() => toggleShowAllExams(unitName)}
                            className="text-sm text-[#44735E] hover:text-[#356349] font-medium flex items-center justify-center gap-2 mx-auto"
                          >
                            <Eye className="h-4 w-4" />
                            Ver mais {unitData.exames.length - 8} exames desta unidade
                          </button>
                        </div>
                      )}

                      {/* Resumo dos Exames da Unidade */}
                      {unitSummary && (
                        <div className="mt-6 pt-6 border-t border-gray-200">
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div className="text-center">
                              <div className="text-2xl font-bold text-green-600">{unitSummary.totalExamesFinalizados}</div>
                              <div className="text-sm text-gray-600">Exames finalizados*</div>
                            </div>
                            <div className="text-center">
                              <div className="text-2xl font-bold text-yellow-600">{unitSummary.totalExamesPendentes}</div>
                              <div className="text-sm text-gray-600">Exames pendentes</div>
                            </div>
                            <div className="text-center">
                              <div className="text-2xl font-bold text-blue-600">{unitSummary.percentualFinalizados.toFixed(1)}%</div>
                              <div className="text-sm text-gray-600">Taxa de conclusão</div>
                            </div>
                          </div>
                          <div className="text-xs text-gray-500 text-center mt-2">
                            *Inclui exames finalizados e aguardando resultado
                          </div>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}

                {/* Sem Dados */}
                {!hasData && (
                  <div className="p-8 text-center">
                    <div className="inline-flex flex-col items-center gap-3">
                      <Calendar className="h-12 w-12 text-gray-300" />
                      <div>
                        <p className="text-gray-400 font-medium">
                          Unidade {unitName}
                        </p>
                        <p className="text-gray-400 text-sm mt-1">
                          Sem atendimentos registrados no período
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>

        {/* VISÃO COMPARATIVA DE EXAMES ENTRE UNIDADES */}
        {consolidatedExames.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden"
          >
            {/* <div className="p-5 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-br from-purple-600 to-pink-600 rounded-lg">
                  <ChartPie className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Visão Comparativa de Exames
                  </h3>
                  <p className="text-gray-600 text-sm">
                    Comparativo entre unidades para os principais exames
                  </p>
                </div>
              </div>
            </div> */}
            
            <div className="p-5">
              <div className="space-y-4">
                {/* {consolidatedExames.slice(0, 6).map((exame, idx) => (
                  <div key={idx} className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div className="font-semibold text-gray-900">{exame.nomeExame}</div>
                        <div className="flex items-center gap-2 mt-1">
                          <Hash className="h-3 w-3 text-gray-400" />
                          <span className="text-xs text-gray-500 font-mono">{exame.codigoExame}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xl font-bold text-gray-900">{exame.total}</div>
                        <div className="text-xs text-gray-500">total geral</div>
                      </div>
                    </div> */}

                    {/* Distribuição por Unidade */}
                    {/* <div className="space-y-2">
                      {Object.entries(exame.porUnidade)
                        .sort(([,a], [,b]) => b.total - a.total)
                        .map(([unidade, dados]) => {
                          const percentUnit = dados.total > 0 ? (dados.finalizados / dados.total) * 100 : 0;
                          return (
                            <div key={unidade} className="text-sm">
                              <div className="flex items-center justify-between mb-1">
                                <div className="flex items-center gap-2">
                                  <Building className="h-3 w-3 text-gray-400" />
                                  <span className="font-medium text-gray-900">{unidade}</span>
                                </div>
                                <div className="flex items-center gap-3">
                                  <span className="text-gray-600">{dados.total}</span>
                                  <span className={`text-xs font-medium ${getStatusColor(percentUnit)}`}>
                                    {percentUnit.toFixed(0)}%
                                  </span>
                                </div>
                              </div>
                              <HorizontalProgressBar 
                                value={dados.finalizados}
                                max={dados.total}
                                color="bg-gradient-to-r from-blue-500 to-purple-500"
                                showLabel={false}
                              />
                              <div className="flex justify-between text-xs text-gray-500 mt-1">
                                <span>{dados.finalizados} finalizados</span>
                                <span>{dados.pendentes} pendentes</span>
                              </div>
                            </div>
                          );
                        })}
                    </div> */}
                  {/* </div>
                ))} */}
              </div>
            </div>
          </motion.div>
        )}

      </motion.section>
    </AnimatePresence>
  );
}