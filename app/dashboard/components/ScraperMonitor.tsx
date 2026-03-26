"use client";

import React, { useEffect, useState, useRef } from "react";
import { motion } from "framer-motion";
import { io, Socket } from "socket.io-client";
import {
  Clock,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Search,
  Database,
} from "lucide-react";
import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Badge,
} from "@heroui/react";

import { WORKER_WS_URL, WORKER_SCRAPER_STATUS } from "@/config/constants";
import { WebsocketType } from "@/lib/websocket/enums/websocket.enum";

interface ProviderMetrics {
  provider: string;
  status: "Aguardando" | "Processando" | "Finalizado" | "Erro";
  lastProcessed?: string;
  countToday: number;
  analyzedToday: number; // ✨ Nova Propriedade
  receivedToday: number; // ✨ Nova Propriedade
  intervalMinutes: number;
}

const POLLING_INTERVAL_MS = 60000;
const WS_CONNECTION_TIMEOUT_MS = 10000;
const SCRAPER_METRICS_CACHE_KEY = "dashboard_scraper_metrics_cache_v1";
const SCRAPER_METRICS_CACHE_TTL_MS = 24 * 60 * 60 * 1000;

interface ScraperMetricsCache {
  updatedAt: string;
  metrics: ProviderMetrics[];
}

const isToday = (date: Date) => {
  const now = new Date();

  return (
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()
  );
};

const loadCachedMetrics = (): ScraperMetricsCache | null => {
  if (typeof window === "undefined") return null;

  try {
    const raw = localStorage.getItem(SCRAPER_METRICS_CACHE_KEY);

    if (!raw) return null;

    const parsed = JSON.parse(raw) as ScraperMetricsCache;

    if (!parsed?.updatedAt || !Array.isArray(parsed.metrics)) return null;

    const updatedAt = new Date(parsed.updatedAt);
    const isExpired =
      Number.isNaN(updatedAt.getTime()) ||
      Date.now() - updatedAt.getTime() > SCRAPER_METRICS_CACHE_TTL_MS;

    if (isExpired) {
      localStorage.removeItem(SCRAPER_METRICS_CACHE_KEY);

      return null;
    }

    return parsed;
  } catch {
    return null;
  }
};

const saveCachedMetrics = (metrics: ProviderMetrics[]) => {
  if (typeof window === "undefined") return;

  try {
    const payload: ScraperMetricsCache = {
      updatedAt: new Date().toISOString(),
      metrics,
    };

    localStorage.setItem(SCRAPER_METRICS_CACHE_KEY, JSON.stringify(payload));
  } catch {
    // No-op when storage is unavailable.
  }
};

const mergeProviderMetrics = (
  incoming: ProviderMetrics,
  cached?: ProviderMetrics,
): ProviderMetrics => {
  if (!cached) return incoming;

  const waitingForNextProcessing =
    incoming.status === "Aguardando" &&
    (incoming.analyzedToday || 0) === 0 &&
    (incoming.receivedToday || 0) === 0;

  const cachedLastProcessedDate = cached.lastProcessed
    ? new Date(cached.lastProcessed)
    : null;
  const canUseCachedCounters =
    waitingForNextProcessing &&
    !!cachedLastProcessedDate &&
    !Number.isNaN(cachedLastProcessedDate.getTime()) &&
    isToday(cachedLastProcessedDate);

  return {
    ...incoming,
    lastProcessed: incoming.lastProcessed || cached.lastProcessed,
    intervalMinutes: incoming.intervalMinutes || cached.intervalMinutes || 60,
    countToday:
      canUseCachedCounters && !incoming.countToday
        ? cached.countToday
        : incoming.countToday,
    analyzedToday:
      canUseCachedCounters && !incoming.analyzedToday
        ? cached.analyzedToday
        : incoming.analyzedToday,
    receivedToday:
      canUseCachedCounters && !incoming.receivedToday
        ? cached.receivedToday
        : incoming.receivedToday,
  };
};

const mergeIncomingWithCache = (
  incoming: ProviderMetrics[],
  cached: ProviderMetrics[],
) => {
  if (!incoming.length) return cached;

  const cachedByProvider = new Map(cached.map((item) => [item.provider, item]));
  const incomingByProvider = new Set(incoming.map((item) => item.provider));

  const merged = incoming.map((item) =>
    mergeProviderMetrics(item, cachedByProvider.get(item.provider)),
  );

  cached.forEach((cachedItem) => {
    if (!incomingByProvider.has(cachedItem.provider)) {
      merged.push(cachedItem);
    }
  });

  return merged.sort((a, b) => a.provider.localeCompare(b.provider));
};

export const ScraperMonitor: React.FC = () => {
  const [metrics, setMetrics] = useState<ProviderMetrics[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isPolling, setIsPolling] = useState(false);
  const [cachedSnapshotAt, setCachedSnapshotAt] = useState<string | null>(null);
  const [isShowingCachedSnapshot, setIsShowingCachedSnapshot] = useState(false);
  const [, setTick] = useState(0);
  const wsFailedRef = useRef(false);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isConnectedRef = useRef(false);

  const applyIncomingMetrics = (incomingData: ProviderMetrics[]) => {
    const cache = loadCachedMetrics();
    const merged = mergeIncomingWithCache(incomingData, cache?.metrics || []);

    setMetrics(merged);
    setCachedSnapshotAt(new Date().toISOString());
    setIsShowingCachedSnapshot(false);
    saveCachedMetrics(merged);
  };

  const fetchMetrics = async () => {
    try {
      const response = await fetch(WORKER_SCRAPER_STATUS);

      if (response.ok) {
        const data = (await response.json()) as ProviderMetrics[];

        applyIncomingMetrics(data);
      }
    } catch {
      // Silently fail - WebSocket will provide data if available
    }
  };

  useEffect(() => {
    const cache = loadCachedMetrics();

    if (cache?.metrics?.length) {
      const sortedData = [...cache.metrics].sort((a, b) =>
        a.provider.localeCompare(b.provider),
      );

      setMetrics(sortedData);
      setCachedSnapshotAt(cache.updatedAt);
      setIsShowingCachedSnapshot(true);
    }
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setTick((t) => t + 1);
    }, 30000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!WORKER_WS_URL) {
      wsFailedRef.current = true;
      setIsPolling(true);

      return;
    }

    const socket: Socket = io(WORKER_WS_URL, {
      auth: {
        type: WebsocketType.SCRAPER,
      },
      transports: ["websocket"],
      reconnection: true,
      timeout: WS_CONNECTION_TIMEOUT_MS,
    });

    const connectionTimeout = setTimeout(() => {
      if (!isConnectedRef.current && !wsFailedRef.current) {
        wsFailedRef.current = true;
        setIsPolling(true);
      }
    }, WS_CONNECTION_TIMEOUT_MS);

    socket.on("connect", () => {
      isConnectedRef.current = true;
      setIsConnected(true);
      clearTimeout(connectionTimeout);
    });

    socket.on("disconnect", () => {
      isConnectedRef.current = false;
      setIsConnected(false);
    });

    socket.on("SCRAPER_STATUS_UPDATE", (data: ProviderMetrics[]) => {
      applyIncomingMetrics(data);
    });

    socket.on("connect_error", () => {
      wsFailedRef.current = true;
      setIsPolling(true);
    });

    return () => {
      socket.disconnect();
      clearTimeout(connectionTimeout);
    };
  }, []);

  useEffect(() => {
    if (isPolling && !pollingIntervalRef.current) {
      fetchMetrics();
      pollingIntervalRef.current = setInterval(
        fetchMetrics,
        POLLING_INTERVAL_MS,
      );
    }

    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
    };
  }, [isPolling]);

  const getStatusConfig = (status: ProviderMetrics["status"]) => {
    switch (status) {
      case "Processando":
        return {
          color: "primary",
          icon: <RefreshCw className="h-4 w-4 animate-spin" />,
          dotClass: "bg-blue-500 animate-pulse",
        };
      case "Finalizado":
        return {
          color: "success",
          icon: <CheckCircle2 className="h-4 w-4" />,
          dotClass: "bg-green-500",
        };
      case "Erro":
        return {
          color: "danger",
          icon: <AlertCircle className="h-4 w-4" />,
          dotClass: "bg-red-500",
        };
      default:
        return {
          color: "default",
          icon: <Clock className="h-4 w-4" />,
          dotClass: "bg-gray-400",
        };
    }
  };

  const formatDate = (isoStr?: string) => {
    if (!isoStr) return "-";
    const date = new Date(isoStr);

    return (
      date.toLocaleDateString("pt-BR") +
      " " +
      date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
    );
  };

  const calculateMinutesRemaining = (
    lastProcessed?: string,
    intervalMinutes: number = 60,
  ) => {
    if (!lastProcessed) return null;
    const last = new Date(lastProcessed).getTime();

    if (Number.isNaN(last)) return null;
    const now = new Date().getTime();
    const elapsedMinutes = Math.floor((now - last) / 60000);
    const remaining = Math.max(0, intervalMinutes - elapsedMinutes);

    return remaining;
  };

  const calculateNextRunTime = (
    lastProcessed?: string,
    intervalMinutes: number = 60,
  ) => {
    if (!lastProcessed) return "-";
    const last = new Date(lastProcessed).getTime();

    if (Number.isNaN(last)) return "-";

    const nextRun = new Date(last + intervalMinutes * 60000);

    return nextRun.toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <motion.div
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden"
      initial={{ opacity: 0, y: 20 }}
    >
      <div className="p-5 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-[#44735E]/12 border border-[#44735E]/20">
            <Search className="h-5 w-5 text-[#44735E]" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              Coleta de Resultados
            </h3>
            <p className="text-sm text-gray-600 flex items-center gap-1">
              <span
                className={`w-2 h-2 rounded-full ${isConnected ? "bg-green-500" : isPolling ? "bg-yellow-500" : "bg-red-500"}`}
              />
              {isConnected
                ? "Monitoramento em tempo real"
                : isPolling
                  ? "Atualização automática (1min)"
                  : "Conectando..."}
            </p>
            {cachedSnapshotAt && (
              <p className="text-xs text-gray-500 mt-1">
                Ultima sincronizacao: {formatDate(cachedSnapshotAt)}
                {isShowingCachedSnapshot &&
                  " (exibindo ultimo processamento salvo)"}
              </p>
            )}
          </div>
        </div>
        {metrics.some((m) => m.status === "Processando") && (
          <Badge className="animate-pulse" color="primary" variant="flat">
            Ativo
          </Badge>
        )}
      </div>

      <div className="p-0 overflow-x-auto">
        <Table
          removeWrapper
          aria-label="Tabela de monitoramento de scraping"
          className="min-w-[600px]"
        >
          <TableHeader>
            <TableColumn className="bg-transparent text-gray-500 font-medium">
              PRESTADOR
            </TableColumn>
            <TableColumn className="bg-transparent text-gray-500 font-medium">
              STATUS
            </TableColumn>
            <TableColumn className="bg-transparent text-gray-500 font-medium">
              PROCESSADO
            </TableColumn>
            <TableColumn className="bg-transparent text-gray-500 font-medium">
              PRÓXIMO
            </TableColumn>
            <TableColumn className="bg-transparent text-gray-500 font-medium text-center">
              ANALISADOS
            </TableColumn>
            <TableColumn className="bg-transparent text-gray-500 font-medium text-center">
              RECEBIDOS
            </TableColumn>
          </TableHeader>
          <TableBody
            emptyContent={
              metrics.length === 0
                ? "Aguardando dados..."
                : "Nenhum dado disponível"
            }
          >
            {metrics.map((row) => {
              const config = getStatusConfig(row.status);
              const minutesRemaining = calculateMinutesRemaining(
                row.lastProcessed,
                row.intervalMinutes,
              );
              const nextRunTime = calculateNextRunTime(
                row.lastProcessed,
                row.intervalMinutes,
              );

              return (
                <TableRow
                  key={row.provider}
                  className="border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors"
                >
                  <TableCell className="py-4 font-semibold text-gray-800">
                    <div className="flex items-center gap-2">
                      <Database className="h-4 w-4 text-gray-400" />
                      {row.provider}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span
                        className={`w-3 h-3 rounded-full ${config.dotClass}`}
                      />
                      <span
                        className={`text-sm font-medium text-${config.color}`}
                      >
                        {row.status}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-gray-600 text-sm">
                    {formatDate(row.lastProcessed)}
                  </TableCell>
                  <TableCell className="text-gray-600 text-sm">
                    {minutesRemaining === null ? (
                      "-"
                    ) : (
                      <div className="leading-tight">
                        <div>{minutesRemaining} min</div>
                        <div className="text-xs text-gray-500">
                          as {nextRunTime}
                        </div>
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="text-center font-bold text-blue-600">
                    {row.analyzedToday || 0}
                  </TableCell>
                  <TableCell className="text-center font-bold text-[#44735E]">
                    {row.receivedToday || 0}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </motion.div>
  );
};
