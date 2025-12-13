"use client";

import { useStatistics } from "@/hooks/useStatictics";
import { motion } from "framer-motion";
import { Building2, TrendingUp, RefreshCw } from "lucide-react";
import { useEffect } from "react";


export function StatisticsSection() {
  const { data, loading, error, refetch } = useStatistics({
    autoRefresh: true,
    refreshInterval: 300000, // 5 minutos
  });

  useEffect(() => {
    console.log(data)
  }, [data])

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-4">
        <p className="text-red-800 text-sm">Erro ao carregar estatísticas</p>
        <button
          onClick={refetch}
          className="mt-2 text-red-600 hover:text-red-700 text-sm underline"
        >
          Tentar novamente
        </button>
      </div>
    );
  }

  if (loading && !data) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200/80 p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-1/3"></div>
          <div className="h-8 bg-gray-200 rounded w-1/2"></div>
          <div className="space-y-2">
            <div className="h-3 bg-gray-200 rounded"></div>
            <div className="h-3 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.6 }}
      className="mt-8"
    >
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-800 flex items-center">
          <Building2 className="mr-2 h-5 w-5" />
          Atendimentos por Unidade - Hoje
        </h2>
        <button
          onClick={refetch}
          className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          title="Atualizar"
        >
          <RefreshCw className="h-4 w-4 text-gray-600" />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Card Total Geral */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
          className="bg-gradient-to-br from-[#44735E] to-[#356349] rounded-2xl shadow-lg p-6 text-white col-span-1 md:col-span-2 lg:col-span-1"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm font-medium mb-2">
                Total de Atendimentos Hoje
              </p>
              <p className="text-4xl font-bold">{data?.totalGeral || 0}</p>
              <div className="flex items-center gap-2 mt-3">
                <span className={`text-xs px-2 py-1 rounded ${
                  data?.source === 'cache' 
                    ? 'bg-white/20 text-white' 
                    : 'bg-white/30 text-white'
                }`}>
                  {data?.source === 'cache' ? '⚡ Cache' : '🔄 Database'}
                </span>
                {data?.processingTimeMs && (
                  <span className="text-xs text-green-100">
                    {data.processingTimeMs}ms
                  </span>
                )}
              </div>
            </div>
            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
              <TrendingUp className="h-8 w-8" />
            </div>
          </div>
        </motion.div>

        {/* Cards por Unidade */}
        {data?.porUnidade.map((unidade, index) => (
          <motion.div
            key={unidade.unidade}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
            className="bg-white rounded-2xl shadow-sm border border-gray-200/80 p-6 hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600 mb-1">
                  {unidade.unidade}
                </p>
                <p className="text-3xl font-bold text-gray-900">
                  {unidade.totalAtendimentos}
                </p>
              </div>
              <div className="w-12 h-12 bg-[#44735E] rounded-xl flex items-center justify-center text-white shadow-sm">
                <Building2 className="h-6 w-6" />
              </div>
            </div>

            {/* Barra de Progresso */}
            <div className="mt-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs text-gray-500">
                  {/* {unidade.porcentagem.toFixed(1) ?? 0.00 }% do total */}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${unidade.porcentagem}%` }}
                  transition={{ duration: 0.8, delay: index * 0.1 }}
                  className="bg-gradient-to-r from-[#44735E] to-[#B8D864] h-2 rounded-full"
                />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {data && (
        <p className="text-xs text-gray-500 mt-4 text-right">
          Última atualização: {new Date(data.generatedAt).toLocaleTimeString('pt-BR')} • 
          Data referência: {new Date(data.dataReferencia).toLocaleDateString('pt-BR')}
        </p>
      )}
    </motion.section>
  );
}