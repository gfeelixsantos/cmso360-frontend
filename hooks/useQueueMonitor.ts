import { useState, useEffect, useCallback, useRef } from "react";

import {
  NEST_AZURE_QUEUES_STATS,
  NEST_AZURE_QUEUE_PEEK,
} from "@/config/constants";
import { getCurrentUser } from "@/lib/utils";

export interface QueueStat {
  name: string;
  approximateMessagesCount: number;
}

export interface QueueStatsResponse {
  queues: QueueStat[];
  totalMessages: number;
  timestamp: string;
}

export interface QueuePeekMessage {
  messageId: string;
  insertedOn: string;
  expiresOn: string;
  dequeueCount: number;
  payload: Record<string, unknown> | null;
}

export interface QueuePeekResponse {
  queueName: string;
  messages: QueuePeekMessage[];
  count: number;
  timestamp: string;
}

export interface QueueWorkerInfo {
  consumer: string;
  concurrency: number;
  visibilitySeconds: number;
  description: string;
  label: string;
}

export const QUEUE_WORKER_MAP: Record<string, QueueWorkerInfo> = {
  "resultados-exames": {
    label: "Resultados de Exames",
    consumer: "cmso360-worker (PDF Worker)",
    concurrency: 3,
    visibilitySeconds: 600,
    description: "Geração de PDF de exames laboratoriais",
  },
  email: {
    label: "Email",
    consumer: "cmso360-worker (Email Worker)",
    concurrency: 5,
    visibilitySeconds: 600,
    description: "Envio de emails (ASO, notificações)",
  },
  socged: {
    label: "SOCGED",
    consumer: "Backend + cmso360-worker",
    concurrency: 1,
    visibilitySeconds: 300,
    description: "Upload de documentos para o SOCGED",
  },
  "aso-processing": {
    label: "ASO Processing",
    consumer: "cmso360-aso-generate (Puppeteer)",
    concurrency: 1,
    visibilitySeconds: 900,
    description: "Geração de ASO via Puppeteer",
  },
  "aso-enriquecimento": {
    label: "ASO Enriquecimento",
    consumer: "cmso360-worker (Enrichment)",
    concurrency: 1,
    visibilitySeconds: 600,
    description: "Assinatura digital e validação de ASOs",
  },
  "exames-enriquecimento": {
    label: "Exames Enriquecimento",
    consumer: "cmso360-worker (Enrichment)",
    concurrency: 1,
    visibilitySeconds: 600,
    description: "Assinatura digital de exames",
  },
  "google-drive-upload": {
    label: "Google Drive Upload",
    consumer: "Backend (desabilitado)",
    concurrency: 1,
    visibilitySeconds: 300,
    description: "Upload de ASOs para Google Drive",
  },
  "resultado-exame-soc": {
    label: "Resultado Exame SOC",
    consumer: "Backend (SOC Service)",
    concurrency: 1,
    visibilitySeconds: 300,
    description: "Processamento de audiometria via SOC",
  },
  "ged-batch": {
    label: "GED Batch",
    consumer: "cmso360-worker (GED Batch)",
    concurrency: 1,
    visibilitySeconds: 600,
    description: "Download em lote de prontuários (ZIP)",
  },
  "email-falhas": {
    label: "Email (Falhas)",
    consumer: "Sem Consumidor (DLQ)",
    concurrency: 0,
    visibilitySeconds: 0,
    description: "Emails que falharam após várias tentativas",
  },
  "ged-batch-falhas": {
    label: "GED Batch (Falhas)",
    consumer: "Sem Consumidor (DLQ)",
    concurrency: 0,
    visibilitySeconds: 0,
    description: "GED Batch que falharam após várias tentativas",
  },
  "aso-enriquecimento-falhas": {
    label: "ASO Enriquecimento (Falhas)",
    consumer: "Sem Consumidor (DLQ)",
    concurrency: 0,
    visibilitySeconds: 0,
    description: "ASOs que falharam ao assinar após várias tentativas",
  },
  "exames-enriquecimento-falhas": {
    label: "Exames Enriquecimento (Falhas)",
    consumer: "Sem Consumidor (DLQ)",
    concurrency: 0,
    visibilitySeconds: 0,
    description: "Exames que falharam ao assinar após várias tentativas",
  },
};

interface UseQueueMonitorOptions {
  autoRefresh?: boolean;
  refreshInterval?: number;
}

export function useQueueMonitor({
  autoRefresh = true,
  refreshInterval = 15000,
}: UseQueueMonitorOptions = {}) {
  const [data, setData] = useState<QueueStatsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const hasDataRef = useRef(false);

  const fetchStats = useCallback(async () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      if (!hasDataRef.current) {
        setIsLoading(true);
      } else {
        setIsRefreshing(true);
      }
      setError(null);

      const currentUser = getCurrentUser();
      const headers: Record<string, string> = {};
      if (currentUser) {
        headers["x-auth-user"] = JSON.stringify(currentUser);
      }

      const response = await fetch(NEST_AZURE_QUEUES_STATS, {
        signal: controller.signal,
        headers,
      });

      if (!response.ok) {
        throw new Error(`Erro HTTP: ${response.status}`);
      }

      const result = (await response.json()) as QueueStatsResponse;
      hasDataRef.current = true;
      setData(result);
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") {
        return;
      }
      setError(err as Error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [fetchStats]);

  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(fetchStats, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, fetchStats]);

  return {
    data,
    loading: isLoading,
    isRefreshing,
    error,
    refetch: fetchStats,
  };
}

export function useQueuePeek(queueName: string | null) {
  const [data, setData] = useState<QueuePeekResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const fetchPeek = useCallback(async () => {
    if (!queueName) {
      setData(null);
      return;
    }

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      setIsLoading(true);
      setError(null);

      const currentUser = getCurrentUser();
      const headers: Record<string, string> = {};
      if (currentUser) {
        headers["x-auth-user"] = JSON.stringify(currentUser);
      }

      const response = await fetch(
        `${NEST_AZURE_QUEUE_PEEK}/${encodeURIComponent(queueName)}/peek?limit=10`,
        {
          signal: controller.signal,
          headers,
        },
      );

      if (!response.ok) {
        throw new Error(`Erro HTTP: ${response.status}`);
      }

      const result = (await response.json()) as QueuePeekResponse;
      setData(result);
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") {
        return;
      }
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  }, [queueName]);

  useEffect(() => {
    fetchPeek();

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [fetchPeek]);

  return {
    data,
    loading: isLoading,
    error,
    refetch: fetchPeek,
  };
}
