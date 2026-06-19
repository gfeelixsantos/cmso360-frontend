import { useCallback, useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";

import { NEXT_WS_URL } from "@/config/constants";
import {
  type GedBatchJob,
  getBatchJobStatus,
  isJobActive,
  isJobTerminal,
} from "@/lib/ged-batch-client";
import {
  EventType,
  type GedBatchStatusPayload,
  type GedBatchProgressPayload,
} from "@/lib/websocket/events/events";
import { WebsocketType } from "@/lib/websocket/enums/websocket.enum";

const WS_CONNECTION_TIMEOUT_MS = 10_000;
const POLLING_INTERVAL_MS = 5_000;
const RECONCILIATION_INTERVAL_MS = 5 * 60_000;

interface UseGedBatchSocketOptions {
  jobId: string | null;
  onStatusChange?: (job: GedBatchJob) => void;
  onProgress?: (payload: GedBatchProgressPayload) => void;
  onCompleted?: (job: GedBatchJob) => void;
  onFailed?: (job: GedBatchJob) => void;
  enabled?: boolean;
}

interface UseGedBatchSocketReturn {
  job: GedBatchJob | null;
  isConnected: boolean;
  isPolling: boolean;
  setJob: (job: GedBatchJob | null) => void;
}

export function useGedBatchSocket({
  jobId,
  onStatusChange,
  onProgress,
  onCompleted,
  onFailed,
  enabled = true,
}: UseGedBatchSocketOptions): UseGedBatchSocketReturn {
  const [job, setJob] = useState<GedBatchJob | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isPolling, setIsPolling] = useState(false);

  const socketRef = useRef<Socket | null>(null);
  const wsFailedRef = useRef(false);
  const isConnectedRef = useRef(false);
  const pollingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const handledTerminalRef = useRef(new Set<string>());

  const onStatusChangeRef = useRef(onStatusChange);
  const onProgressRef = useRef(onProgress);
  const onCompletedRef = useRef(onCompleted);
  const onFailedRef = useRef(onFailed);

  onStatusChangeRef.current = onStatusChange;
  onProgressRef.current = onProgress;
  onCompletedRef.current = onCompleted;
  onFailedRef.current = onFailed;

  const stopPolling = useCallback(() => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
    setIsPolling(false);
  }, []);

  const handleTerminalJob = useCallback((terminalJob: GedBatchJob) => {
    const key = `${terminalJob.id}:${terminalJob.status}`;
    if (handledTerminalRef.current.has(key)) return;
    handledTerminalRef.current.add(key);

    if (terminalJob.status === "completed" || terminalJob.status === "partial") {
      onCompletedRef.current?.(terminalJob);
    } else {
      onFailedRef.current?.(terminalJob);
    }
  }, []);

  const fetchJobStatus = useCallback(
    async (targetJobId: string) => {
      try {
        const fetched = await getBatchJobStatus(targetJobId);
        setJob(fetched);
        onStatusChangeRef.current?.(fetched);

        if (isJobTerminal(fetched.status)) {
          stopPolling();
          handleTerminalJob(fetched);
        }
      } catch {
        // Silent fail — WebSocket will provide data if available
      }
    },
    [stopPolling, handleTerminalJob],
  );

  const startPolling = useCallback(
    (targetJobId: string) => {
      stopPolling();
      setIsPolling(true);

      void fetchJobStatus(targetJobId);
      pollingIntervalRef.current = setInterval(
        () => fetchJobStatus(targetJobId),
        POLLING_INTERVAL_MS,
      );
    },
    [fetchJobStatus, stopPolling],
  );

  // Socket.IO connection
  useEffect(() => {
    if (!enabled || !jobId || !NEXT_WS_URL) {
      wsFailedRef.current = true;
      return;
    }

    const socket: Socket = io(NEXT_WS_URL, {
      auth: { type: WebsocketType.GED_BATCH },
      transports: ["websocket"],
      reconnection: true,
      timeout: WS_CONNECTION_TIMEOUT_MS,
    });

    socketRef.current = socket;

    const connectionTimeout = setTimeout(() => {
      if (!isConnectedRef.current && !wsFailedRef.current) {
        wsFailedRef.current = true;
        startPolling(jobId);
      }
    }, WS_CONNECTION_TIMEOUT_MS);

    socket.on("connect", () => {
      wsFailedRef.current = false;
      isConnectedRef.current = true;
      setIsConnected(true);
      setIsPolling(false);
      stopPolling();
      clearTimeout(connectionTimeout);

      // Fetch latest status on connect
      void fetchJobStatus(jobId);
    });

    socket.on("disconnect", () => {
      isConnectedRef.current = false;
      setIsConnected(false);
      setIsPolling(true);
    });

    socket.on(EventType.GED_BATCH_STATUS, (payload: GedBatchStatusPayload) => {
      if (payload.jobId !== jobId) return;

      setJob((prev) => {
        const updated: GedBatchJob = {
          ...(prev || { id: payload.jobId } as GedBatchJob),
          id: payload.jobId,
          status: payload.status,
          totalFuncionarios: payload.totalFuncionarios,
          processedFuncionarios: payload.processedFuncionarios,
          succeededFuncionarios: payload.succeededFuncionarios,
          failedFuncionarios: payload.failedFuncionarios,
          result: payload.result,
          updatedAt: payload.updatedAt,
        };

        onStatusChangeRef.current?.(updated);

        if (isJobTerminal(updated.status)) {
          handleTerminalJob(updated);
        }

        return updated;
      });
    });

    socket.on(EventType.GED_BATCH_PROGRESS, (payload: GedBatchProgressPayload) => {
      if (payload.jobId !== jobId) return;

      onProgressRef.current?.(payload);

      setJob((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          processedFuncionarios: payload.processedFuncionarios,
          updatedAt: payload.updatedAt,
          items: prev.items.map((item) =>
            item.codigoProntuario === payload.itemCodigoProntuario
              ? { ...item, status: payload.itemStatus, error: payload.error }
              : item,
          ),
        };
      });
    });

    socket.on("connect_error", () => {
      wsFailedRef.current = true;
      if (!isPolling) {
        startPolling(jobId);
      }
    });

    return () => {
      clearTimeout(connectionTimeout);
      socket.disconnect();
      socketRef.current = null;
      isConnectedRef.current = false;
      setIsConnected(false);
    };
  }, [enabled, jobId]);

  // Fallback to polling when WS fails
  useEffect(() => {
    if (wsFailedRef.current && jobId && !pollingIntervalRef.current) {
      startPolling(jobId);
    }

    return () => {
      // Cleanup handled by stopPolling
    };
  }, [jobId, startPolling]);

  // Periodic reconciliation even when connected via WS
  useEffect(() => {
    if (!isConnected || !jobId) return;

    const interval = setInterval(
      () => fetchJobStatus(jobId),
      RECONCILIATION_INTERVAL_MS,
    );

    return () => clearInterval(interval);
  }, [isConnected, jobId, fetchJobStatus]);

  // Cleanup polling on unmount
  useEffect(() => {
    return () => stopPolling();
  }, [stopPolling]);

  return {
    job,
    isConnected,
    isPolling,
    setJob,
  };
}
