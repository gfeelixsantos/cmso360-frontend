"use client";

import { useCallback, useEffect, useRef, useState, createContext, useContext } from "react";

import { getCurrentUser } from "@/lib/utils";
import { IUserInfo } from "@/lib/user/interfaces/IUser";
import { WebsocketType } from "@/lib/websocket/enums/websocket.enum";
import { useSocket } from "@/lib/websocket/hooks/useSocket";
import { GedBatchStatusPayload } from "@/lib/websocket/events/events";
import { addNotification, clearAllNotifications } from "@/lib/notification-store";
import { CustomEventMap } from "@/lib/websocket/events/events";

interface GedBatchSocketContextValue {
  registerHandlers: (handlers: Partial<CustomEventMap>) => (() => void) | undefined;
}

const GedBatchSocketContext = createContext<GedBatchSocketContextValue>({
  registerHandlers: () => undefined,
});

export const useGedBatchSocket = () => useContext(GedBatchSocketContext);

export function GedBatchSocketProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<IUserInfo | null>(null);
  const { socket, connect, disconnect, registerHandlers } = useSocket({ showLifecycleToasts: false });
  const handlersRef = useRef<(() => void) | null>(null);

  // Detecta login/logout (sessionStorage não emite eventos na mesma aba)
  useEffect(() => {
    const check = () => {
      const current = getCurrentUser();
      setUser((prev) => {
        if (prev === null && current === null) return prev;
        if (prev !== null && current !== null && prev.codigo === current.codigo) return prev;
        return current;
      });
    };
    check();
    const interval = setInterval(check, 2000);
    return () => clearInterval(interval);
  }, []);

  // Conecta/desconecta socket quando usuário muda
  useEffect(() => {
    if (!user) {
      handlersRef.current?.();
      handlersRef.current = null;
      disconnect();
      clearAllNotifications();
      return;
    }
    connect({
      type: WebsocketType.GED_BATCH,
      nome: user.nome,
      id: user.codigo,
    });
  }, [user, connect, disconnect]);

  // Registra handlers para eventos GED batch
  const handleBatchStatus = useCallback((payload: GedBatchStatusPayload) => {
    const dedupeKey = `ged-batch:${payload.jobId}:${payload.status}`;

    if (payload.status === "completed") {
      addNotification({
        title: "Lote concluído",
        message: "O download em lote foi processado com sucesso.",
        type: "success",
        source: "GED Batch",
        category: "ged-batch",
        dedupeKey,
        actionUrl: payload.result?.zipUrl,
        actionLabel: "Baixar ZIP",
      });
    } else if (payload.status === "partial") {
      addNotification({
        title: "Lote concluído com pendências",
        message: `${payload.succeededFuncionarios} de ${payload.totalFuncionarios} prontuário(s) gerados.`,
        type: "warning",
        source: "GED Batch",
        category: "ged-batch",
        dedupeKey,
        actionUrl: payload.result?.zipUrl,
        actionLabel: "Baixar ZIP",
      });
    } else if (payload.status === "failed") {
      addNotification({
        title: "Lote falhou",
        message: "Nenhum prontuário pôde ser gerado.",
        type: "error",
        source: "GED Batch",
        category: "ged-batch",
        dedupeKey,
      });
    }
  }, []);

  useEffect(() => {
    handlersRef.current?.();
    handlersRef.current = null;

    if (!socket) return;

    const unsub = registerHandlers({
      "ged-batch:status": handleBatchStatus as never,
    });
    handlersRef.current = unsub;
  }, [socket, registerHandlers, handleBatchStatus]);

  return (
    <GedBatchSocketContext.Provider value={{ registerHandlers }}>
      {children}
    </GedBatchSocketContext.Provider>
  );
}
