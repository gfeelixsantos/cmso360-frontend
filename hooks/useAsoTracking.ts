import { useState, useEffect, useCallback, useRef } from "react";

import {
  NEST_SCHEDULINGS_ASO_PENDING,
  NEST_SCHEDULINGS_ASO_REQUEUE,
} from "@/config/constants";

export type AsoPanelGroup = "EM_ANDAMENTO" | "CONCLUIDO" | "NAO_APLICAVEL";

export type AsoPanelDisplayStatus =
  | "AGUARDANDO_ENVIO"
  | "NA_FILA_DO_GERADOR"
  | "EM_GERACAO"
  | "SEGUINDO_AUTOMATICAMENTE"
  | "PRECISA_DE_INTERVENCAO"
  | "COM_FALHA"
  | "ASO_LIBERADO"
  | "NAO_APLICAVEL";

export interface AsoPanelProjection {
  group: AsoPanelGroup;
  displayStatus: AsoPanelDisplayStatus;
  displayReason: string;
  nextExpectedAction: string;
  willAutoProgress: boolean;
  needsManualAction: boolean;
}

export interface AsoPendingItem {
  schedulingId: string;
  nomeFuncionario: string;
  nomeEmpresa: string;
  tipoExame: string;
  dataAgendamento: string;
  unidadeAtendimento: string;
  status:
    | "PENDENTE"
    | "PROCESSANDO"
    | "DIGITALIZADA"
    | "AGUARDANDO_AUTENTICACAO"
    | "FALHA"
    | "LIBERADO"
    | "NA_FILA"
    | "NAO_APLICAVEL";
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
  validacaoUrl?: string | null;
  emailSent?: boolean;
  signatureStatus?: string | null;
  retryPending?: boolean;
  nextRetryAt?: string | null;
  retryCount?: number | null;
  origem?: string;
  fonte?: "MONGODB" | "FILA_AZURE";
  parecer?: string | null;
  panel?: AsoPanelProjection;
}

export interface AsoPendingStats {
  naFilaDoGerador: number;
  aguardandoEnvio: number;
  emGeracao: number;
  seguindoAutomaticamente: number;
  precisaIntervencao: number;
  comFalha: number;
}

export interface AsoPendingResponse {
  total: number;
  totalItems?: number;
  totalPages?: number;
  page?: number;
  limit?: number;
  totalNaFila?: number;
  janelaDias?: number;
  stats?: AsoPendingStats;
  items: AsoPendingItem[];
  lastUpdate: string;
}

interface UseAsoTrackingOptions {
  unidade?: string;
  limit?: number;
  page?: number;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

const LEGACY_STATUS_TO_PANEL_STATUS: Partial<
  Record<AsoPendingItem["status"], AsoPanelDisplayStatus>
> = {
  NA_FILA: "NA_FILA_DO_GERADOR",
  PENDENTE: "AGUARDANDO_ENVIO",
  PROCESSANDO: "SEGUINDO_AUTOMATICAMENTE",
  DIGITALIZADA: "SEGUINDO_AUTOMATICAMENTE",
  AGUARDANDO_AUTENTICACAO: "PRECISA_DE_INTERVENCAO",
  FALHA: "COM_FALHA",
  LIBERADO: "ASO_LIBERADO",
  NAO_APLICAVEL: "NAO_APLICAVEL",
};

const LEGACY_ETAPA_TO_PANEL_STATUS: Partial<
  Record<AsoPendingItem["etapa"], AsoPanelDisplayStatus>
> = {
  GERACAO: "AGUARDANDO_ENVIO",
  PDF_GERADO: "SEGUINDO_AUTOMATICAMENTE",
  ASSINATURA: "SEGUINDO_AUTOMATICAMENTE",
  FINALIZADO: "ASO_LIBERADO",
  NA_FILA_AGUARDANDO: "NA_FILA_DO_GERADOR",
  NAO_APLICAVEL: "NAO_APLICAVEL",
};

function inferLegacyPanel(item: AsoPendingItem): AsoPanelProjection {
  if (item.status === "NAO_APLICAVEL" || item.etapa === "NAO_APLICAVEL") {
    return {
      group: "NAO_APLICAVEL",
      displayStatus: "NAO_APLICAVEL",
      displayReason:
        "Parecer médico concluído fora do fluxo automático de liberação de ASO.",
      nextExpectedAction: "Nenhuma ação adicional esperada neste fluxo.",
      willAutoProgress: false,
      needsManualAction: false,
    };
  }

  if (item.status === "LIBERADO") {
    return {
      group: "CONCLUIDO",
      displayStatus: "ASO_LIBERADO",
      displayReason: "ASO concluído e liberado para entrega.",
      nextExpectedAction: "Nenhuma ação adicional esperada.",
      willAutoProgress: false,
      needsManualAction: false,
    };
  }

  if (item.status === "AGUARDANDO_AUTENTICACAO") {
    return {
      group: "EM_ANDAMENTO",
      displayStatus: "PRECISA_DE_INTERVENCAO",
      displayReason:
        "O ASO aguarda autenticação da assinatura digital para continuar.",
      nextExpectedAction:
        "Assim que a autenticação estiver disponível, o fluxo poderá continuar.",
      willAutoProgress: false,
      needsManualAction: true,
    };
  }

  if (item.status === "FALHA" || item.etapa === "ERRO") {
    return {
      group: "EM_ANDAMENTO",
      displayStatus: "COM_FALHA",
      displayReason:
        item.error || "O fluxo do ASO registrou falha e não avançará sozinho.",
      nextExpectedAction:
        "Este caso precisa de análise para definir a próxima ação.",
      willAutoProgress: false,
      needsManualAction: true,
    };
  }

  const displayStatus =
    LEGACY_ETAPA_TO_PANEL_STATUS[item.etapa] ||
    LEGACY_STATUS_TO_PANEL_STATUS[item.status] ||
    "SEGUINDO_AUTOMATICAMENTE";

  if (displayStatus === "NA_FILA_DO_GERADOR") {
    return {
      group: "EM_ANDAMENTO",
      displayStatus,
      displayReason:
        "O ASO está na fila do gerador e ainda não iniciou a geração.",
      nextExpectedAction:
        "Assim que chegar a vez deste atendimento, o gerador iniciará o processamento.",
      willAutoProgress: true,
      needsManualAction: false,
    };
  }

  if (displayStatus === "AGUARDANDO_ENVIO") {
    return {
      group: "EM_ANDAMENTO",
      displayStatus,
      displayReason:
        "O ASO ainda não foi enviado ao gerador para iniciar o processamento.",
      nextExpectedAction:
        "O sistema ainda precisa encaminhar este atendimento para o gerador.",
      willAutoProgress: true,
      needsManualAction: false,
    };
  }

  if (displayStatus === "EM_GERACAO") {
    return {
      group: "EM_ANDAMENTO",
      displayStatus,
      displayReason:
        "O ASO já foi enviado ao gerador e está em geração neste momento.",
      nextExpectedAction:
        "A próxima evolução esperada é a conclusão da geração do PDF.",
      willAutoProgress: true,
      needsManualAction: false,
    };
  }

  return {
    group: "EM_ANDAMENTO",
    displayStatus:
      displayStatus === "PRECISA_DE_INTERVENCAO"
        ? "PRECISA_DE_INTERVENCAO"
        : displayStatus === "COM_FALHA"
          ? "COM_FALHA"
          : "SEGUINDO_AUTOMATICAMENTE",
    displayReason:
      displayStatus === "PRECISA_DE_INTERVENCAO"
        ? item.error ||
          "O ASO aguarda autenticação da assinatura digital para continuar."
        : displayStatus === "COM_FALHA"
          ? item.error ||
            "O fluxo do ASO registrou falha e não avançará sozinho."
          : "O ASO já foi gerado e aguarda o avanço da assinatura digital.",
    nextExpectedAction:
      displayStatus === "PRECISA_DE_INTERVENCAO"
        ? "Assim que a autenticação estiver disponível, o fluxo poderá continuar."
        : displayStatus === "COM_FALHA"
          ? "Este caso precisa de análise para definir a próxima ação."
          : "A próxima evolução esperada é o processamento da assinatura digital.",
    willAutoProgress:
      displayStatus !== "PRECISA_DE_INTERVENCAO" &&
      displayStatus !== "COM_FALHA",
    needsManualAction:
      displayStatus === "PRECISA_DE_INTERVENCAO" ||
      displayStatus === "COM_FALHA",
  };
}

function normalizeAsoPendingItem(item: AsoPendingItem): AsoPendingItem {
  return {
    ...item,
    panel: item.panel || inferLegacyPanel(item),
  };
}

export function useAsoTracking({
  unidade,
  limit = 100,
  page = 1,
  autoRefresh = true,
  refreshInterval = 30000,
}: UseAsoTrackingOptions = {}) {
  const [data, setData] = useState<AsoPendingResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const hasDataRef = useRef(false);

  const fetchAsoPending = useCallback(async () => {
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

      const params = new URLSearchParams();

      if (unidade) params.append("unidade", unidade);
      if (limit) params.append("limit", limit.toString());
      if (page > 1) params.append("page", page.toString());

      const url = `${NEST_SCHEDULINGS_ASO_PENDING}${params.toString() ? `?${params.toString()}` : ""}`;

      const response = await fetch(url, { signal: controller.signal });

      if (!response.ok) {
        throw new Error(`Erro HTTP: ${response.status}`);
      }

      const result = (await response.json()) as AsoPendingResponse;

      hasDataRef.current = true;
      setData({
        ...result,
        items: Array.isArray(result.items)
          ? result.items.map(normalizeAsoPendingItem)
          : [],
      });
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") {
        return;
      }
      setError(err as Error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [unidade, limit, page]);

  useEffect(() => {
    fetchAsoPending();

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [fetchAsoPending]);

  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(fetchAsoPending, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, fetchAsoPending]);

  return {
    data,
    loading: isLoading,
    isRefreshing,
    error,
    refetch: fetchAsoPending,
  };
}

import { getCurrentUser } from "@/lib/utils";

export async function requeueAso(schedulingId: string): Promise<boolean> {
  const currentUser = getCurrentUser();
  
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  
  if (currentUser) {
    headers["x-auth-user"] = JSON.stringify(currentUser);
  }

  const response = await fetch(NEST_SCHEDULINGS_ASO_REQUEUE, {
    method: "POST",
    headers,
    body: JSON.stringify({ schedulingId }),
  });

  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({ message: "Erro desconhecido" }));
    throw new Error(error.message || `Erro HTTP: ${response.status}`);
  }

  return true;
}
