

import { TicketActionType, TicketStatus } from "@/lib/ticket/ticket";
import { useState, useCallback } from "react";
import { Socket } from "socket.io-client";




export interface BaseEntity {
  id?: number;
  status?: TicketStatus;
  usuarioResponsavel?: string; // quem fez a ação
}

export interface EntityManager<T extends BaseEntity> {
  entities: T[];
  addOrUpdate: (entity: T) => void;
  setAll: (entities: T[]) => void;
  remove: (id: number) => void;
  clear: () => void;
  getById: (id: number) => T | undefined;
  getAll: () => T[];

  // workflow integrado com WS
  executarAcao: (
    ticketId: number,
    action: TicketActionType,
    unidade:string,
    socket: Socket,
    sala?: string,
    user?: string,
    funcionario?: string,
    exame?: string,
    mongoId?: string
  ) => void;
}

export function useEntityManager<T extends BaseEntity>(
  initialEntities: T[] = []
): EntityManager<T> {
  const [entities, setEntities] = useState<T[]>(initialEntities);

  const addOrUpdate = useCallback((entity: T) => {
    setEntities(prev => {
      const index = prev.findIndex(e => e.id === entity.id);
      if (index !== -1) {
        const updated = [...prev];
        updated[index] = { ...prev[index], ...entity };
        return updated;
      }
      return [...prev, entity];
    });
  }, []);

  const setAll = useCallback((newEntities: T[]) => {
    setEntities(newEntities);
  }, []);

  const remove = useCallback((id: number) => {
    setEntities(prev => prev.filter(entity => entity.id !== id));
  }, []);

  const clear = useCallback(() => {
    setEntities([]);
  }, []);

  const getById = useCallback(
    (id: number) => entities.find(entity => entity.id === id),
    [entities]
  );
  const getAll = useCallback(() => {
    return entities;
  }, [entities])

  /**
   * Envia ação para o servidor e aguarda confirmação.
   * O backend deve responder com TICKET_ACTION_CONFIRMED ou TICKET_ACTION_ERROR.
   */
  const executarAcao = (
    ticketId: number,
    action: TicketActionType,
    unidade:string,
    socket: Socket,
    sala = "",
    user = "",
    funcionario = "",
    exame = "",
    mongoId = ""
  ) => {
    if (!socket?.connected) {
      alert("Não conectado ao servidor WebSocket");
      return;
    }

    socket.emit("ticket_action", { ticketId,  action, unidade, sala, user, funcionario, exame});
  };

  return {
    entities,
    addOrUpdate,
    setAll,
    remove,
    clear,
    getById,
    getAll,
    executarAcao,
  };
}
