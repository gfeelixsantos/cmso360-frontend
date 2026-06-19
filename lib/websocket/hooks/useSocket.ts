"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";
import { addToast } from "@heroui/react";

import { IUserWebsocket } from "@/lib/user/interfaces/IUser";
import { CustomEventMap } from "@/lib/websocket/events/events";
import { getDynamicNestUrl } from "@/config/constants";

type SocketState = "disconnected" | "connecting" | "connected" | "reconnecting";

export function useSocket() {
  const socketRef = useRef<Socket | null>(null);
  const [state, setState] = useState<SocketState>("disconnected");
  const stateRef = useRef<SocketState>("disconnected");
  const wasEverConnectedRef = useRef(false);
  const reconnectToastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const handlersRef = useRef<Partial<CustomEventMap>>({});
  const hasRegisteredSocketHandlersRef = useRef(false);

  const connected = state === "connected";
  const isReconnecting = state === "reconnecting";

  const updateState = useCallback((newState: SocketState) => {
    stateRef.current = newState;
    setState(newState);
  }, []);

  const registerSocketHandlers = useCallback((s: Socket) => {
    if (hasRegisteredSocketHandlersRef.current) return;

    s.on("connect", () => {
      const prevState = stateRef.current;

      if (prevState === "reconnecting") {
        updateState("connected");
      } else {
        updateState("connected");
        wasEverConnectedRef.current = true;
        addToast({
          title: "Conectado",
          description: "Conexão estabelecida com o servidor.",
          severity: "success",
          color: "foreground",
          variant: "flat",
        });
      }

      if (reconnectToastTimerRef.current) {
        clearTimeout(reconnectToastTimerRef.current);
        reconnectToastTimerRef.current = null;
      }
    });

    s.on("disconnect", (reason: string) => {
      if (reason === "io client disconnect") {
        updateState("disconnected");
        wasEverConnectedRef.current = false;
        return;
      }

      if (stateRef.current === "connected") {
        updateState("reconnecting");

        reconnectToastTimerRef.current = setTimeout(() => {
          if (stateRef.current === "reconnecting") {
            addToast({
              title: "Reconectando...",
              description: "Tentando restabelecer conexão",
              severity: "warning",
              color: "foreground",
              variant: "flat",
            });
          }
        }, 2000);
      }
    });

    s.on("connect_error", () => {
      if (stateRef.current === "connecting") {
        updateState("disconnected");
        addToast({
          title: "Erro de conexão",
          description: "Não foi possível conectar ao servidor",
          severity: "danger",
          color: "foreground",
          variant: "flat",
        });
      }
    });

    s.on("reconnect_failed", () => {
      updateState("disconnected");
      wasEverConnectedRef.current = false;

      if (reconnectToastTimerRef.current) {
        clearTimeout(reconnectToastTimerRef.current);
        reconnectToastTimerRef.current = null;
      }

      addToast({
        title: "Falha na reconexão",
        description:
          "Não foi possível restabelecer a conexão após múltiplas tentativas.",
        severity: "danger",
        color: "foreground",
        variant: "flat",
      });
    });

    hasRegisteredSocketHandlersRef.current = true;
  }, [updateState]);

  const connect = useCallback(
    (auth: IUserWebsocket) => {
      if (socketRef.current) {
        try {
          socketRef.current.removeAllListeners();
          socketRef.current.disconnect();
        } catch {}
        socketRef.current = null;
      }

      hasRegisteredSocketHandlersRef.current = false;
      wasEverConnectedRef.current = false;
      updateState("connecting");

      const s = io(getDynamicNestUrl(), {
        auth,
        transports: ["websocket"],
        reconnection: true,
        reconnectionAttempts: Infinity,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        timeout: 20000,
        forceNew: false,
        upgrade: false,
        rememberUpgrade: true,
      });

      socketRef.current = s;

      registerSocketHandlers(s);

      const savedHandlers = handlersRef.current;

      if (Object.keys(savedHandlers).length > 0) {
        Object.entries(savedHandlers).forEach(([event, fn]) => {
          if (fn) {
            s.off(event as any);
            s.on(event as any, fn as any);
          }
        });
      }
    },
    [registerSocketHandlers, updateState],
  );

  const disconnect = useCallback(() => {
    if (reconnectToastTimerRef.current) {
      clearTimeout(reconnectToastTimerRef.current);
      reconnectToastTimerRef.current = null;
    }

    if (socketRef.current) {
      try {
        socketRef.current.removeAllListeners();
        socketRef.current.disconnect();
      } catch {}
      socketRef.current = null;
    }

    hasRegisteredSocketHandlersRef.current = false;
    wasEverConnectedRef.current = false;
    updateState("disconnected");
  }, [updateState]);

  const registerHandlers = useCallback(
    (handlers: Partial<CustomEventMap>) => {
      handlersRef.current = { ...handlers };

      if (socketRef.current) {
        Object.entries(handlers).forEach(([event, fn]) => {
          if (!fn) return;
          socketRef.current!.off(event as any);
          socketRef.current!.on(event as any, fn as any);
        });
      }

      return () => {
        if (socketRef.current) {
          Object.entries(handlers).forEach(([event, fn]) => {
            if (!fn) return;
            try {
              socketRef.current!.off(event as any, fn as any);
            } catch {}
          });
        }

        handlersRef.current = {};
      };
    },
    [],
  );

  useEffect(() => {
    return () => {
      if (reconnectToastTimerRef.current) {
        clearTimeout(reconnectToastTimerRef.current);
      }

      if (socketRef.current) {
        try {
          socketRef.current.removeAllListeners();
          socketRef.current.disconnect();
        } catch {}
        socketRef.current = null;
      }
    };
  }, []);

  return {
    socket: socketRef.current,
    connected,
    isReconnecting,
    connect,
    disconnect,
    registerHandlers,
  };
}
