// events.ts
import { Socket } from "socket.io-client";

import { PainelCall } from "@/lib/painel/interfaces/paniel.interface";
import { PreparationRequestModel, Ticket } from "@/lib/ticket/ticket";
import {
  Scheduling,
  SchedulingChange,
} from "@/lib/scheduling/interface/scheduling";

enum EventType {
  // Ticket
  CONNECTION_REQUEST = "CONNECTION_REQUEST",
  TICKET_EMITED = "TICKET_EMITED",
  TICKET_UPDATED = "TICKET_UPDATED",
  TICKET_ACTION_SUCCESS = "TICKET_ACTION_SUCCESS",
  TICKET_ERROR = "TICKET_ERROR",
  TICKET_INFO = "TICKET_INFO",

  // Schedule
  UPDATE_SCHEDULE = "UPDATE_SCHEDULE",
  UPDATE_RECORD = "UPDATE_RECORD",

  // Preparo
  PREPARATION_REQUEST = "PREPARATION_REQUEST",

  // Painel
  PAINEL_CALL = "PAINEL_CALL",
  PAINEL_TICKETS = "PAINEL_TICKETS_TO_CALL",
}

// Mapeamento de eventos para seus payloads
interface EventPayloadMap {
  [EventType.CONNECTION_REQUEST]: Scheduling[];
  [EventType.TICKET_EMITED]: Ticket;
  [EventType.TICKET_UPDATED]: Ticket;
  [EventType.TICKET_ACTION_SUCCESS]: Ticket;
  [EventType.TICKET_ERROR]: string;
  [EventType.TICKET_INFO]: string;
  [EventType.PAINEL_CALL]: PainelCall;
  [EventType.PAINEL_TICKETS]: PainelCall[];
  [EventType.UPDATE_SCHEDULE]: SchedulingChange;
  [EventType.UPDATE_RECORD]: SchedulingChange;
  [EventType.PREPARATION_REQUEST]: PreparationRequestModel;
}

// Estender os tipos do Socket.IO para eventos personalizados
interface CustomEventMap {
  [EventType.CONNECTION_REQUEST]: (payload: String) => void;
  [EventType.TICKET_EMITED]: (payload: Ticket) => void;
  [EventType.TICKET_UPDATED]: (payload: Ticket) => void;
  [EventType.TICKET_ACTION_SUCCESS]: (payload: Ticket) => void;
  [EventType.TICKET_ERROR]: (payload: string) => void;
  [EventType.TICKET_INFO]: (payload: string) => void;
  [EventType.PAINEL_CALL]: (payload: PainelCall) => void;
  [EventType.PAINEL_TICKETS]: (payload: PainelCall[]) => void;
  [EventType.UPDATE_SCHEDULE]: (payload: SchedulingChange) => void;
  [EventType.UPDATE_RECORD]: (payload: SchedulingChange) => void;
  [EventType.PREPARATION_REQUEST]: (payload: PreparationRequestModel) => void;
}

// Função genérica para emitir eventos tipados
function emitEvent<T extends EventType>(
  socket: Socket<CustomEventMap>,
  event: T,
  payload: EventPayloadMap[T],
) {
  socket.emit(event, ...([payload] as Parameters<CustomEventMap[T]>));
}

// Função genérica para ouvir eventos tipados
function onEvent<T extends EventType>(
  socket: Socket<CustomEventMap>,
  event: T,
  callback: (payload: EventPayloadMap[T]) => void,
) {
  socket.on(event, callback as any); // Type assertion para compatibilidade
}

export { EventType, emitEvent, onEvent };
export type { EventPayloadMap, CustomEventMap };
