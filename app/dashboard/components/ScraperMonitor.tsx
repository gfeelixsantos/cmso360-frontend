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

export const ScraperMonitor: React.FC = () => {
  const [metrics, setMetrics] = useState<ProviderMetrics[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isPolling, setIsPolling] = useState(false);
  const [, setTick] = useState(0);
  const wsFailedRef = useRef(false);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isConnectedRef = useRef(false);

  const fetchMetrics = async () => {
    try {
      const response = await fetch(WORKER_SCRAPER_STATUS);

      if (response.ok) {
        const data = await response.json();
        const sortedData = [...data].sort((a, b) =>
          a.provider.localeCompare(b.provider),
        );

        setMetrics(sortedData);
      }
    } catch {
      // Silently fail - WebSocket will provide data if available
    }
  };

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
      const sortedData = [...data].sort((a, b) =>
        a.provider.localeCompare(b.provider),
      );

      setMetrics(sortedData);
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
    if (!lastProcessed) return 0;
    const last = new Date(lastProcessed).getTime();
    const now = new Date().getTime();
    const elapsedMinutes = Math.floor((now - last) / 60000);
    const remaining = Math.max(0, intervalMinutes - elapsedMinutes);

    return remaining;
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
                    {minutesRemaining} min
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
