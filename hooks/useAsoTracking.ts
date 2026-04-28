import { useState, useEffect, useCallback } from "react";

import { NEST_SCHEDULINGS_ASO_PENDING } from "@/config/constants";

export interface AsoPendingItem {
  schedulingId: string;
  nomeFuncionario: string;
  nomeEmpresa: string;
  tipoExame: string;
  dataAgendamento: string;
  unidadeAtendimento: string;
  status: "PENDENTE" | "PROCESSANDO" | "DIGITALIZADA" | "FALHA" | "LIBERADO" | "NA_FILA" | "NAO_APLICAVEL";
  etapa:
    | "GERACAO"
    | "PDF_GERADO"
    | "ASSINATURA"
    | "ERRO"
    | "FINALIZADO"
    | "DESCONHECIDO"
    | "NA_FILA_AGUARDANDO"
    | "NAO_APLICAVEL";
  progresso: number;
  assinaturaProvider: "DIGITALIZADA" | "PSC" | "BRYKMS" | "N/A";
  nomeMedico: string;
  updatedAt: string | null;
  tempoNaEtapa: string;
  error: string | null;
  url: string | null;
  fonte?: "MONGODB" | "FILA_AZURE";
  parecer?: string | null;
}

export interface AsoPendingStats {
  naFila: number;
  pendentes: number;
  processando: number;
  digitalizadas: number;
  liberados: number;
  falhas: number;
  semAso: number;
}

export interface AsoPendingResponse {
  total: number;
  totalNaFila?: number;
  janelaDias?: number;
  stats?: AsoPendingStats;
  items: AsoPendingItem[];
  lastUpdate: string;
}

interface UseAsoTrackingOptions {
  unidade?: string;
  limit?: number;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

export function useAsoTracking({
  unidade,
  limit = 100,
  autoRefresh = true,
  refreshInterval = 30000, // 30 segundos
}: UseAsoTrackingOptions = {}) {
  const [data, setData] = useState<AsoPendingResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchAsoPending = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();

      if (unidade) params.append("unidade", unidade);
      if (limit) params.append("limit", limit.toString());

      const url = `${NEST_SCHEDULINGS_ASO_PENDING}${params.toString() ? `?${params.toString()}` : ""}`;

      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`Erro HTTP: ${response.status}`);
      }

      const result = await response.json();

      setData(result);
    } catch (err) {
      setError(err as Error);
      // Log removido - erro já está no state
    } finally {
      setLoading(false);
    }
  }, [unidade, limit]);

  useEffect(() => {
    fetchAsoPending();
  }, [fetchAsoPending]);

  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(fetchAsoPending, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, fetchAsoPending]);

  return { data, loading, error, refetch: fetchAsoPending };
}
