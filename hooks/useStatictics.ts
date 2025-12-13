import { NEST_SCHEDULINGS_STATISTICS } from '@/config/constants';
import { useState, useEffect, useCallback } from 'react';

interface AtendimentoPorUnidade {
  unidade: string;
  totalAtendimentos: number;
  porcentagem: number;
}

interface StatisticsData {
  totalGeral: number;
  porUnidade: AtendimentoPorUnidade[];
  dataReferencia: Date;
  generatedAt: Date;
  source: 'cache' | 'database';
  processingTimeMs?: number;
}

interface UseStatisticsOptions {
  unidade?: string;
  data?: string;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

export function useStatistics({
  unidade,
  data,
  autoRefresh = false,
  refreshInterval = 300000, // 5 minutos
}: UseStatisticsOptions = {}) {
  const [statistics, setStatistics] = useState<StatisticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchStatistics = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (unidade) params.append('unidade', unidade);
      if (data) params.append('data', data);

      const url = `${NEST_SCHEDULINGS_STATISTICS}${params.toString() ? `?${params.toString()}` : ''}`;
      console.log(url)
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`Erro HTTP: ${response.status}`);
      }

      const result = await response.json();
      setStatistics(result);
    } catch (err) {
      setError(err as Error);
      console.error('Erro ao buscar estatísticas:', err);
    } finally {
      setLoading(false);
    }
  }, [unidade, data]);

  useEffect(() => {
    fetchStatistics();
  }, [fetchStatistics]);

  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(fetchStatistics, refreshInterval);
    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, fetchStatistics]);

  return { data: statistics, loading, error, refetch: fetchStatistics };
}