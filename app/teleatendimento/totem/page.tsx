"use client";

import React, { useState, useEffect, useRef, Suspense } from "react";
import Image from "next/image";
import {
  Card,
  CardBody,
  Input,
  Button,
  Spinner,
  addToast,
} from "@heroui/react";
import { User, Video } from "lucide-react";
import { useSocket } from "@/lib/websocket/hooks/useSocket";
import { EventType } from "@/lib/websocket/events/events";
import { WebsocketType } from "@/lib/websocket/enums/websocket.enum";
import TeleatendimentoPanel from "@/app/teleatendimento/components/TeleatendimentoPanel";
import { useSearchParams } from "next/navigation";

const formatCPF = (value: string) => {
  const digits = value.replace(/\D/g, "");
  return digits
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d{1,2})/, "$1-$2")
    .slice(0, 14);
};

const validateCPF = (cpf: string) => {
  const digits = cpf.replace(/\D/g, "");
  if (digits.length !== 11) return false;
  if (/^(\d)\1+$/.test(digits)) return false;

  let sum = 0;
  let remainder;

  for (let i = 1; i <= 9; i++) {
    sum += parseInt(digits.substring(i - 1, i)) * (11 - i);
  }
  remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(digits.substring(9, 10))) return false;

  sum = 0;
  for (let i = 1; i <= 10; i++) {
    sum += parseInt(digits.substring(i - 1, i)) * (12 - i);
  }
  remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(digits.substring(10, 11))) return false;

  return true;
};

function TotemContent() {
  const [cpf, setCpf] = useState("");
  const [status, setStatus] = useState<"idle" | "connecting" | "waiting" | "in_call">("idle");
  const [waitingMessage, setWaitingMessage] = useState("");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [inviteToken, setInviteToken] = useState<string | null>(null);
  const [sessionSummary, setSessionSummary] = useState<{ professional?: { name?: string } } | null>(null);

  const { socket, connected, connect, disconnect, registerHandlers } = useSocket();
  const socketRef = useRef<any>(null);
  const searchParams = useSearchParams();
  const unidade = searchParams.get("unidade");
  const sala = searchParams.get("sala");
  const exame = searchParams.get("exame");

  useEffect(() => {
    socketRef.current = socket;
  }, [socket]);

  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  useEffect(() => {
    const unregister = registerHandlers({
      [EventType.TELEATENDIMENTO_VIRTUAL_WAITING_ROOM_STATUS]: (payload: { status: string; message: string; schedulingId?: string }) => {
        if (payload.status === "waiting") {
          setStatus("waiting");
          setWaitingMessage(payload.message || "Aguardando profissional...");
          addToast({
            title: "Sala de Espera Virtual",
            description: payload.message,
            severity: "success",
            color: "foreground",
            variant: "flat",
          });
        } else if (payload.status === "error") {
          setStatus("idle");
          addToast({
            title: "Erro",
            description: payload.message || "Não foi possível entrar na sala de espera.",
            severity: "danger",
            color: "foreground",
            variant: "flat",
          });
          disconnect();
        }
      },
      [EventType.TELEATENDIMENTO_PULL_TO_CALL]: (payload: { sessionId: string; inviteToken?: string }) => {
        if (payload.sessionId) {
          setSessionId(payload.sessionId);
          if (payload.inviteToken) {
            setInviteToken(payload.inviteToken);
          }
          setSessionSummary(null);
          setStatus("in_call");
          addToast({
            title: "Chamada Iniciada",
            description: "O profissional iniciou a videochamada.",
            severity: "success",
            color: "foreground",
            variant: "flat",
          });
        }
      },
    } as any);

    return () => unregister();
  }, [registerHandlers, disconnect]);

  useEffect(() => {
    if (connected && status === "connecting" && socketRef.current) {
      const cpfDigits = cpf.replace(/\D/g, "");
      socketRef.current.emit(EventType.TELEATENDIMENTO_JOIN_VIRTUAL_WAITING_ROOM, {
        cpf: cpfDigits,
        unidade: unidade || undefined,
        sala: sala || undefined,
        exame: exame || undefined,
      });
    }
  }, [connected, status, cpf, unidade, sala, exame]);

  useEffect(() => {
    if (status !== "in_call" || !sessionId) return;

    let cancelled = false;

    const loadSessionSummary = async () => {
      try {
        const route = inviteToken
          ? `/api/teleatendimento/invite/${inviteToken}`
          : `/api/teleatendimento/session/${sessionId}`;
        const response = await fetch(route);
        if (!response.ok) return;
        const data = await response.json();
        if (!cancelled) {
          setSessionSummary(data);
        }
      } catch (error) {
        console.warn("Could not load teleatendimento session summary:", error);
      }
    };

    void loadSessionSummary();

    return () => {
      cancelled = true;
    };
  }, [status, sessionId, inviteToken]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateCPF(cpf)) {
      addToast({
        title: "CPF Inválido",
        description: "Verifique o número digitado e tente novamente.",
        severity: "warning",
        color: "foreground",
        variant: "flat",
      });
      return;
    }

    setStatus("connecting");
    connect({
      unidade: unidade || "",
      sala: sala || "",
      exame: exame || "",
      nome: `Totem_${cpf.replace(/\D/g, "")}`,
      type: WebsocketType.TELEATENDIMENTO,
    });
  };

  const handleCpfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCpf(formatCPF(e.target.value));
  };

  if (status === "in_call" && sessionId) {
    return (
      <TeleatendimentoPanel
        role="EMPLOYEE"
        layout="full"
        sessionId={sessionId}
        inviteToken={inviteToken || undefined}
        headerNote={sessionSummary?.professional?.name ? `Médico: ${sessionSummary.professional.name}` : undefined}
        onEndSession={() => {
          disconnect();
          setStatus("idle");
          setSessionId(null);
          setInviteToken(null);
          setCpf("");
        }}
      />
    );
  }

  return (
    <div className="min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top,_rgba(16,185,129,0.16),_transparent_34%),linear-gradient(180deg,_#f5fbf8_0%,_#e7f6ef_48%,_#f8fbfa_100%)] px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto flex min-h-[calc(100vh-3rem)] w-full max-w-6xl items-center">
        <div className="grid w-full gap-6 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="relative overflow-hidden rounded-[2rem] border border-white/70 bg-[#0f5132] p-8 text-white shadow-[0_24px_80px_rgba(15,81,50,0.22)]">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(255,255,255,0.16),_transparent_30%),radial-gradient(circle_at_bottom_left,_rgba(16,185,129,0.24),_transparent_32%)]" />
            <div className="relative z-10 flex h-full flex-col justify-between gap-8">
              <div className="flex items-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/95 shadow-lg">
                  <Image
                    src="/images/logo.png"
                    alt="CMSO360"
                    width={48}
                    height={48}
                    className="h-10 w-10 object-contain"
                  />
                </div>
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-emerald-100/75">
                    CMSO360
                  </p>
                  <h1 className="text-2xl font-semibold leading-tight text-white sm:text-3xl">
                    Centro Médico de Saúde Ocupacional
                  </h1>
                </div>
              </div>

              <div className="max-w-xl space-y-4">
                <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-sm font-medium text-emerald-50 backdrop-blur">
                  <Video className="h-4 w-4" />
                  Telemedicina integrada ao CMSO360
                </div>
                <p className="text-sm leading-6 text-emerald-50/85 sm:text-base">
                  A experiência do cliente fica mais consistente quando a tela de acesso repete a
                  identidade da aplicação, com o mesmo nome, logo e paleta visual.
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur">
                  <p className="text-[11px] uppercase tracking-[0.18em] text-emerald-100/70">
                    Fluxo
                  </p>
                  <p className="mt-1 text-sm font-semibold text-white">
                    Sala de espera e videochamada
                  </p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur">
                  <p className="text-[11px] uppercase tracking-[0.18em] text-emerald-100/70">
                    Identidade
                  </p>
                  <p className="mt-1 text-sm font-semibold text-white">
                    Cores e marca da aplicação
                  </p>
                </div>
              </div>

              {unidade && sala ? (
                <div className="flex flex-col gap-2">
                  <div className="inline-flex w-fit items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm font-semibold text-white backdrop-blur">
                    <span className="text-emerald-100/75">Local:</span>
                    <span>
                      {unidade} • {sala}
                    </span>
                  </div>
                  {exame ? (
                    <div className="inline-flex w-fit items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-medium text-emerald-50/85 backdrop-blur">
                      <span className="text-emerald-100/75">Exame:</span>
                      <span>{exame}</span>
                    </div>
                  ) : null}
                </div>
              ) : null}
            </div>
          </div>

          <Card className="overflow-hidden border border-emerald-100/80 bg-white/96 shadow-[0_24px_70px_rgba(15,81,50,0.12)] backdrop-blur">
            <CardBody className="p-0">
              <div className="border-b border-emerald-100 bg-gradient-to-r from-emerald-50 to-white px-6 py-5 sm:px-8">
                <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-emerald-700">
                  Entrada do cliente
                </p>
                <h2 className="mt-1 text-xl font-semibold text-[#114e34]">
                  Acesso ao atendimento online
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Informe seu CPF para entrar na sala de espera virtual.
                </p>
              </div>

              <div className="p-6 sm:p-8">
                {status === "idle" && (
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                      <label htmlFor="cpf" className="mb-2 block text-sm font-medium text-slate-700">
                        Digite seu CPF para iniciar
                      </label>
                      <Input
                        id="cpf"
                        type="text"
                        value={cpf}
                        onChange={handleCpfChange}
                        placeholder="000.000.000-00"
                        maxLength={14}
                        size="lg"
                        startContent={<User className="w-5 h-5 text-gray-400" />}
                        classNames={{
                          base: "shadow-sm",
                          inputWrapper:
                            "border-emerald-100 bg-white data-[hover=true]:border-emerald-300 group-data-[focus=true]:border-emerald-500",
                          input: "text-lg tracking-wider text-slate-900",
                        }}
                        autoFocus
                      />
                    </div>
                    <Button
                      type="submit"
                      className="h-14 w-full bg-gradient-to-r from-emerald-600 to-emerald-500 text-lg font-medium text-white shadow-lg shadow-emerald-200 transition-all hover:from-emerald-700 hover:to-emerald-600"
                      isDisabled={cpf.replace(/\D/g, "").length !== 11}
                    >
                      Acessar Sala de Espera
                    </Button>
                  </form>
                )}

                {status === "connecting" && (
                  <div className="flex flex-col items-center justify-center py-10 space-y-4">
                    <Spinner color="success" size="lg" />
                    <p className="animate-pulse font-medium text-emerald-800">
                      Conectando ao sistema...
                    </p>
                  </div>
                )}

                {status === "waiting" && (
                  <div className="flex flex-col items-center justify-center py-8 space-y-6 text-center">
                    <div className="relative">
                      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-emerald-50 ring-8 ring-emerald-100/60">
                        <User className="h-10 w-10 text-emerald-600" />
                      </div>
                      <span className="absolute bottom-0 right-0 h-5 w-5 rounded-full border-2 border-white bg-yellow-400" />
                    </div>
                    <div>
                      <h3 className="mb-2 text-xl font-bold text-[#114e34]">Você está na fila</h3>
                      <p className="text-sm text-slate-600">{waitingMessage}</p>
                    </div>
                    <div className="w-full max-w-xs rounded-2xl border border-emerald-100 bg-emerald-50/70 p-4">
                      <p className="text-xs font-medium text-emerald-700">
                        Por favor, aguarde. O médico iniciará a chamada em instantes.
                      </p>
                    </div>
                    <Button
                      variant="light"
                      color="danger"
                      className="mt-4"
                      onPress={() => {
                        disconnect();
                        setStatus("idle");
                        setCpf("");
                      }}
                    >
                      Cancelar Espera
                    </Button>
                  </div>
                )}
              </div>
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default function TotemPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-emerald-50 to-teal-100">
          <Spinner color="success" size="lg" />
        </div>
      }
    >
      <TotemContent />
    </Suspense>
  );
}
