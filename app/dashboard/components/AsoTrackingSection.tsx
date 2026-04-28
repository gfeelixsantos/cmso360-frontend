"use client";

import { motion } from "framer-motion";
import {
  FileText,
  Clock,
  AlertCircle,
  CheckCircle,
  CheckCircle2,
  FileCheck,
  PenTool,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { useState } from "react";

import { useAsoTracking, AsoPendingItem } from "@/hooks/useAsoTracking";

// 🎨 Constantes de design
const COLORS = {
  primary: "#44735E",
  success: "#10b981",
  warning: "#f59e0b",
  danger: "#ef4444",
  info: "#3b82f6",
  gray: "#6b7280",
};

// 🏷️ Labels de etapas
const ETAPA_LABELS: Record<string, string> = {
  PENDENTE: "Aguardando Geração",
  PDF_GERADO: "PDF Digitalizado",
  ASSINATURA: "Assinando Digitalmente",
  ERRO: "Erro no Processo",
  FINALIZADO: "Concluído",
  DESCONHECIDO: "Desconhecido",
  NA_FILA_AGUARDANDO: "Na Fila de Processamento",
  GERACAO: "Geração",
  NAO_APLICAVEL: "Não Aplicável",
};

// 🏷️ Labels de status
const STATUS_LABELS: Record<string, string> = {
  NA_FILA: "Na Fila",
  PENDENTE: "Pendente",
  PROCESSANDO: "Gerando PDF",
  DIGITALIZADA: "Aguardando Assinatura",
  LIBERADO: "ASO Liberado",
  FALHA: "Erro",
  NAO_APLICAVEL: "Não Aplicável",
};

// 🎨 Badge de status - Cores harmonizadas com padrão da página de relatório
const StatusBadge = ({ status, etapa }: { status: string; etapa: string }) => {
  const getStatusConfig = () => {
    switch (status) {
      case "LIBERADO":
      case "FINALIZADO":
        return {
          bg: "bg-emerald-100",
          border: "border-emerald-200",
          text: "text-emerald-700",
          icon: CheckCircle,
          label: "Concluído",
        };
      case "FALHA":
      case "ERRO":
        return {
          bg: "bg-red-100",
          border: "border-red-200",
          text: "text-red-700",
          icon: AlertTriangle,
          label: "Erro",
        };
      case "PROCESSANDO":
      case "ASSINATURA":
        return {
          bg: "bg-blue-100",
          border: "border-blue-200",
          text: "text-blue-700",
          icon: PenTool,
          label: "Assinando",
        };
      case "DIGITALIZADA":
      case "PDF_GERADO":
        return {
          bg: "bg-amber-100",
          border: "border-amber-200",
          text: "text-amber-700",
          icon: FileCheck,
          label: "PDF Digitalizado",
        };
      case "NA_FILA":
        return {
          bg: "bg-violet-100",
          border: "border-violet-200",
          text: "text-violet-700",
          icon: Clock,
          label: "Na Fila",
        };
      case "NAO_APLICAVEL":
        return {
          bg: "bg-slate-100",
          border: "border-slate-200",
          text: "text-slate-600",
          icon: CheckCircle2,
          label: "Não Aplicável",
        };
      case "PENDENTE":
        return {
          bg: "bg-orange-100",
          border: "border-orange-200",
          text: "text-orange-700",
          icon: Clock,
          label: "Pendente",
        };
      default:
        return {
          bg: "bg-gray-100",
          border: "border-gray-200",
          text: "text-gray-700",
          icon: Clock,
          label: STATUS_LABELS[status] || "Pendente",
        };
    }
  };

  const config = getStatusConfig();
  const Icon = config.icon;

  return (
    <div
      className={`flex items-center gap-1.5 px-2 py-1 text-xs rounded-full ${config.bg} border ${config.border}`}
    >
      <Icon className={`h-3 w-3 ${config.text}`} />
      <span className={`font-medium ${config.text}`}>{config.label}</span>
    </div>
  );
};

// 📋 Card de item ASO - Layout compacto com todas as informações
const AsoItemCard = ({ item, index }: { item: AsoPendingItem; index: number }) => {
  return (
    <motion.div
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-md transition-all"
      initial={{ opacity: 0, y: 10 }}
      transition={{ delay: index * 0.05 }}
    >
      <div className="p-3">
        {/* Linha 1: Nome, Empresa, Tipo, Data, Parecer, Status */}
        <div className="flex items-center justify-between gap-3">
          {/* Esquerda: Nome, Empresa, Tipo, Data, Parecer */}
          <div className="min-w-0 flex-1">
            <h4 className="font-semibold text-gray-900 truncate text-sm">
              {item.nomeFuncionario}
            </h4>
            <div className="flex items-center gap-2 text-xs text-gray-600 flex-wrap">
              <span className="truncate">{item.nomeEmpresa}</span>
              <span className="truncate">{item.tipoExame}</span>
              <span className="text-gray-500">{item.dataAgendamento}</span>
              {item.parecer && (
                <span className="text-gray-600">{item.parecer.replace(/_/g, ' ')}</span>
              )}
            </div>
          </div>

          {/* Direita: Status */}
          <div className="flex items-center gap-3 shrink-0">
            <StatusBadge etapa={item.etapa} status={item.status} />
          </div>
        </div>

        {/* Linha 2: Detalhes compactos */}
        <div className="mt-2 pt-2 border-t border-gray-100">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-gray-600">
            <span><strong className="text-gray-700">Unidade:</strong> {item.unidadeAtendimento || "N/A"}</span>
            <span><strong className="text-gray-700">Etapa:</strong> {ETAPA_LABELS[item.etapa] || item.etapa}</span>
            <span><strong className="text-gray-700">Tempo:</strong> {item.tempoNaEtapa}</span>
            <span><strong className="text-gray-700">Assinatura:</strong> {item.assinaturaProvider}</span>
            <span><strong className="text-gray-700">Médico:</strong> {item.nomeMedico || "N/A"}</span>
            {item.fonte === "FILA_AZURE" && (
              <span className="px-1.5 py-0.5 bg-purple-100 text-purple-700 rounded text-[10px] font-medium">
                🔄 Fila Azure
              </span>
            )}
          </div>

          {/* Erro (se houver) */}
          {item.error && (
            <div className="mt-2 flex items-start gap-1.5 text-[11px] text-red-600">
              <AlertTriangle className="h-3 w-3 shrink-0 mt-0.5" />
              <span className="truncate">{item.error}</span>
            </div>
          )}

          {/* Link Ver ASO (se houver URL) */}
          {item.url && (
            <div className="mt-2 flex justify-end">
              <a
                className="text-[11px] text-[#44735E] hover:text-[#2a4d3d] font-medium flex items-center gap-1"
                href={item.url}
                rel="noopener noreferrer"
                target="_blank"
              >
                <FileText className="h-3 w-3" />
                Ver ASO
              </a>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

// 🚀 Componente principal
export function AsoTrackingSection() {
  const { data, loading, error, refetch } = useAsoTracking({
    autoRefresh: true,
    refreshInterval: 30000,
    limit: 100,
  });

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refetch();
    setTimeout(() => setIsRefreshing(false), 500);
  };

  // Estado de erro
  if (error) {
    return (
      <motion.div
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-red-50 to-white border border-red-200 rounded-2xl p-6 shadow-sm"
        initial={{ opacity: 0, y: 20 }}
      >
        <div className="flex items-start gap-4">
          <div className="p-3 bg-red-100 rounded-xl">
            <AlertCircle className="h-6 w-6 text-red-600" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-red-800 mb-1">
              Erro ao carregar acompanhamento de ASOs
            </h3>
            <p className="text-sm text-red-600 mb-3">{error.message}</p>
            <button
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg transition-colors"
              onClick={handleRefresh}
            >
              Tentar novamente
            </button>
          </div>
        </div>
      </motion.div>
    );
  }

  // Estado de loading
  if (loading && !data) {
    return (
      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div className="h-6 bg-gray-200 rounded w-48 animate-pulse" />
          <div className="h-8 bg-gray-200 rounded w-24 animate-pulse" />
        </div>
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-16 bg-gray-100 rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  // Ordenar items alfabeticamente por nome do funcionário
  const items = [...(data?.items || [])].sort((a, b) =>
    a.nomeFuncionario.localeCompare(b.nomeFuncionario, 'pt-BR', { sensitivity: 'base' })
  );
  const total = data?.total || 0;

  return (
    <motion.div
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden"
      initial={{ opacity: 0, y: 20 }}
      transition={{ duration: 0.4 }}
    >
      {/* Header clicável - Layout corporativo */}
      <div
        className="px-5 py-4 border-b border-gray-200 bg-[#B8D864]/20 cursor-pointer hover:bg-[#B8D864]/25 hover:shadow-md transition-all duration-200"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors">
              {isExpanded ? (
                <ChevronUp className="h-6 w-6 text-[#44735E]" />
              ) : (
                <ChevronDown className="h-6 w-6 text-[#44735E]" />
              )}
            </div>
            <div>
              <h3 className="text-base font-semibold text-gray-800 tracking-tight">
                Liberação de ASOs
                {data?.janelaDias && (
                  <span className="ml-2 text-xs font-normal text-gray-500">
                    (últimos {data.janelaDias} dias)
                  </span>
                )}
              </h3>
              <p className="text-xs text-gray-600">
                {total} registro{total !== 1 ? "s" : ""}
                {data?.stats && (
                  <span className="ml-2">
                    {data.stats.naFila > 0 && (
                      <span className="text-gray-400 font-medium">• {data.stats.naFila} na fila </span>
                    )}
                    {data.stats.pendentes > 0 && (
                      <span className="text-gray-400 font-medium">• {data.stats.pendentes} pendentes </span>
                    )}
                    {data.stats.processando > 0 && (
                      <span className="text-gray-400 font-medium">• {data.stats.processando} processando </span>
                    )}
                    {data.stats.digitalizadas > 0 && (
                      <span className="text-gray-400 font-medium">• {data.stats.digitalizadas} assinatura </span>
                    )}
                    {data.stats.falhas > 0 && (
                      <span className="text-gray-400 font-medium">• {data.stats.falhas} erro </span>
                    )}
                    {data.stats.semAso > 0 && (
                      <span className="text-gray-400 font-medium">• {data.stats.semAso} não aplicável </span>
                    )}
                  </span>
                )}
                {data?.lastUpdate && (
                  <span className="ml-2 text-gray-400">
                    • Atualizado {" "}
                    {new Date(data.lastUpdate).toLocaleTimeString("pt-BR")}
                  </span>
                )}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Lista de ASOs - apenas quando expandido */}
      {isExpanded && (
        <motion.div
          animate={{ opacity: 1, height: "auto" }}
          className="p-5"
          exit={{ opacity: 0, height: 0 }}
          initial={{ opacity: 0, height: 0 }}
        >
          {items.length === 0 ? (
            <div className="text-center py-8">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <h4 className="text-base font-medium text-gray-900 mb-1">
                Nenhum ASO em processamento
              </h4>
              <p className="text-xs text-gray-500">
                Todos os ASOs foram processados ou não há atendimentos finalizados aguardando liberação.
              </p>
            </div>
          ) : (
            <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
              {items.map((item, index) => (
                <AsoItemCard index={index} item={item} key={item.schedulingId} />
              ))}

              {items.length >= 100 && (
                <div className="text-center pt-3 pb-1">
                  <p className="text-xs text-gray-500">
                    Exibindo os {items.length} ASOs mais recentes (limite: 100)
                  </p>
                </div>
              )}
            </div>
          )}
        </motion.div>
      )}

    </motion.div>
  );
}
