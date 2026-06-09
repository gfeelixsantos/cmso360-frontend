"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";
import {
  Button,
  Card,
  CardBody,
  CardHeader,
  Input,
  Slider,
  Spinner,
} from "@heroui/react";
import {
  Camera,
  CameraOff,
  Copy,
  Link2,
  Mic,
  MicOff,
  PhoneOff,
  ShieldCheck,
  Video,
  Volume2,
} from "lucide-react";
import { addToast } from "@heroui/react";

import {
  emitEvent,
  EventType,
  onEvent,
  TeleatendimentoCallStatusPayload,
  TeleatendimentoChatPayload,
  TeleatendimentoSessionSyncPayload,
  TeleatendimentoSignalPayload,
} from "@/lib/websocket/events/events";
import { WebsocketType } from "@/lib/websocket/enums/websocket.enum";
import {
  NEST_FACIAL_SESSION,
  NEST_TELEATENDIMENTO_INVITE,
  NEST_TELEATENDIMENTO_SESSION,
  resolveTeleatendimentoWsUrl,
} from "@/config/constants";
import { TeleatendimentoWebRtcClient } from "@/lib/teleatendimento/webrtc-client";
import {
  TeleatendimentoChatMessage,
  listChatMessages,
  saveChatMessage,
} from "@/lib/teleatendimento/chat-storage";

type Props = {
  role: "PROFESSIONAL" | "EMPLOYEE";
  sessionId?: string;
  inviteToken?: string;
};

type SessionView = TeleatendimentoSessionSyncPayload & {
  schedulingId: string;
  unidade?: string;
  sala?: string;
  exame?: string;
  inviteUrl?: string;
  professionalUrl?: string;
  employee: TeleatendimentoSessionSyncPayload["employee"] & {
    id?: string;
    companyCode?: string;
    prontuarioCode?: string;
    examType?: string;
  };
  professional: TeleatendimentoSessionSyncPayload["professional"] & {
    id?: string;
  };
};

const describeMediaError = (error: unknown) => {
  if (error instanceof DOMException) {
    if (error.name === "NotAllowedError" || error.name === "PermissionDeniedError") {
      return "Camera ou microfone sem permissao. Libere o acesso no navegador e tente novamente.";
    }

    if (error.name === "NotFoundError" || error.name === "DevicesNotFoundError") {
      return "Nenhuma camera ou microfone compativel foi encontrado neste dispositivo.";
    }
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Nao foi possivel preparar camera e microfone.";
};

export default function TeleatendimentoWindow({
  role,
  sessionId,
  inviteToken,
}: Props) {
  const [session, setSession] = useState<SessionView | null>(null);
  const [loading, setLoading] = useState(true);
  const [joinLoading, setJoinLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState("Aguardando inicio da chamada.");
  const [chatInput, setChatInput] = useState("");
  const [messages, setMessages] = useState<TeleatendimentoChatMessage[]>([]);
  const [micEnabled, setMicEnabled] = useState(true);
  const [cameraEnabled, setCameraEnabled] = useState(true);
  const [remoteVolume, setRemoteVolume] = useState(80);
  const [inviteUrl, setInviteUrl] = useState("");
  const [facialLink, setFacialLink] = useState("");
  const [socketConnected, setSocketConnected] = useState(false);

  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const webRtcRef = useRef<TeleatendimentoWebRtcClient | null>(null);
  const offerStartedRef = useRef(false);

  const title = useMemo(
    () =>
      role === "PROFESSIONAL"
        ? "Sala do Profissional"
        : "Entrada do Funcionario",
    [role],
  );

  const employeeExamLabel =
    session?.exame || session?.employee.examType || "Teleatendimento";
  const employeeMetaLabel = [
    session?.employee.prontuarioCode
      ? `Prontuario ${session.employee.prontuarioCode}`
      : "",
    session?.employee.companyCode
      ? `Empresa ${session.employee.companyCode}`
      : "",
  ]
    .filter(Boolean)
    .join(" • ");
  const canSendChat = Boolean(socketRef.current && socketConnected && session);
  const socketUrl = useMemo(() => resolveTeleatendimentoWsUrl(), []);
  const joinButtonLabel = socketConnected
    ? "Conectado"
    : joinLoading
      ? "Entrando..."
      : "Preparar dispositivos e entrar";
  const joinHint = socketConnected
    ? "Audio, video e chat liberados nesta sessao."
    : "Permita camera e microfone para entrar na sala e liberar o chat.";

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        setLoading(true);
        const url =
          role === "PROFESSIONAL"
            ? `${NEST_TELEATENDIMENTO_SESSION}/${sessionId}`
            : `${NEST_TELEATENDIMENTO_INVITE}${inviteToken}`;
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error("Nao foi possivel carregar a sessao de teleatendimento.");
        }

        const data = await response.json();
        if (!cancelled) {
          setSession(data);
          setInviteUrl(
            role === "PROFESSIONAL" ? data?.inviteUrl || "" : window.location.href,
          );
        }

        if (!cancelled && data?.sessionId) {
          const stored = await listChatMessages(data.sessionId);
          setMessages(stored);
        }
      } catch (error) {
        if (!cancelled) {
          setStatusMessage(
            error instanceof Error ? error.message : "Erro ao abrir a videochamada.",
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [inviteToken, role, sessionId]);

  useEffect(() => {
    if (remoteVideoRef.current) {
      remoteVideoRef.current.volume = remoteVolume / 100;
    }
  }, [remoteVolume]);

  useEffect(() => {
    return () => {
      socketRef.current?.disconnect();
      webRtcRef.current?.destroy();
    };
  }, []);

  const appendMessage = async (message: TeleatendimentoChatMessage) => {
    setMessages((prev) => {
      if (prev.some((item) => item.messageId === message.messageId)) {
        return prev;
      }
      return [...prev, message].sort((a, b) => a.sentAt.localeCompare(b.sentAt));
    });
    await saveChatMessage(message);
  };

  const connectCall = async () => {
    if (!session) return;
    if (socketRef.current) return;

    setJoinLoading(true);

    try {
      const webRtc = new TeleatendimentoWebRtcClient(
        {
          onRemoteStream: (stream) => {
            if (remoteVideoRef.current) {
              remoteVideoRef.current.srcObject = stream;
            }
          },
          onConnectionStateChange: (state) => {
            setStatusMessage(`Estado da conexao: ${state}`);
          },
          onIceConnectionStateChange: (state) => {
            if (state === "connected") {
              setStatusMessage("Videochamada conectada.");
            }
          },
        },
        (payload) =>
          emitEvent(socketRef.current as any, EventType.TELEATENDIMENTO_OFFER, {
            sessionId: session.sessionId,
            payload,
          }),
        (payload) =>
          emitEvent(socketRef.current as any, EventType.TELEATENDIMENTO_ANSWER, {
            sessionId: session.sessionId,
            payload,
          }),
        (payload) =>
          emitEvent(
            socketRef.current as any,
            EventType.TELEATENDIMENTO_ICE_CANDIDATE,
            {
              sessionId: session.sessionId,
              payload,
            },
          ),
      );

      const stream = await webRtc.ensureLocalStream();
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      const socket = io(socketUrl, {
        auth: {
          unidade: session.unidade || "",
          sala: session.sala || "",
          nome:
            role === "PROFESSIONAL"
              ? session.professional.name
              : session.employee.name,
          type: WebsocketType.TELEATENDIMENTO,
        },
        transports: ["websocket"],
        upgrade: false,
        forceNew: true,
      });

      webRtcRef.current = webRtc;
      socketRef.current = socket;

      socket.on("connect", () => {
        setSocketConnected(true);
        setStatusMessage("Sala pronta. Aguardando o outro participante entrar.");
        emitEvent(socket as any, EventType.TELEATENDIMENTO_JOIN, {
          role,
          sessionId: role === "PROFESSIONAL" ? session.sessionId : undefined,
          inviteToken: role === "EMPLOYEE" ? inviteToken : undefined,
        });
      });

      socket.on("connect_error", (error) => {
        const message =
          error instanceof Error
            ? error.message
            : "Nao foi possivel conectar ao backend da videochamada.";
        setSocketConnected(false);
        setStatusMessage(message);
        socket.disconnect();
        socketRef.current = null;
        webRtcRef.current?.destroy();
        webRtcRef.current = null;
      });

      socket.on("disconnect", () => {
        setSocketConnected(false);
      });

      onEvent(
        socket as any,
        EventType.TELEATENDIMENTO_SESSION_SYNC,
        async (payload: TeleatendimentoSessionSyncPayload) => {
          setSession((prev) =>
            prev
              ? {
                  ...prev,
                  ...payload,
                }
              : (payload as SessionView),
          );

          if (
            role === "PROFESSIONAL" &&
            payload.professional.connected &&
            payload.employee.connected &&
            !offerStartedRef.current
          ) {
            offerStartedRef.current = true;
            await webRtc.createOffer();
          }
        },
      );

      onEvent(
        socket as any,
        EventType.TELEATENDIMENTO_CALL_STATUS,
        (payload: TeleatendimentoCallStatusPayload) => {
          setStatusMessage(payload.message);
          if (payload.status === "ended" || payload.status === "expired") {
            offerStartedRef.current = false;
          }
        },
      );

      onEvent(
        socket as any,
        EventType.TELEATENDIMENTO_OFFER,
        async (payload: TeleatendimentoSignalPayload) => {
          await webRtc.handleOffer(payload.payload);
        },
      );

      onEvent(
        socket as any,
        EventType.TELEATENDIMENTO_ANSWER,
        async (payload: TeleatendimentoSignalPayload) => {
          await webRtc.handleAnswer(payload.payload);
        },
      );

      onEvent(
        socket as any,
        EventType.TELEATENDIMENTO_ICE_CANDIDATE,
        async (payload: TeleatendimentoSignalPayload) => {
          await webRtc.handleIceCandidate(payload.payload);
        },
      );

      onEvent(
        socket as any,
        EventType.TELEATENDIMENTO_CHAT_MESSAGE,
        async (payload: TeleatendimentoChatPayload) => {
          await appendMessage(payload);
        },
      );
    } catch (error) {
      const message =
        error instanceof DOMException
          ? describeMediaError(error)
          : error instanceof Error
            ? error.message
            : "Nao foi possivel iniciar a videochamada.";

      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      webRtcRef.current?.destroy();
      webRtcRef.current = null;
      setSocketConnected(false);
      setStatusMessage(message);
    } finally {
      setJoinLoading(false);
    }
  };

  const sendChat = async () => {
    if (!chatInput.trim() || !socketRef.current || !socketConnected || !session) {
      setStatusMessage("O chat so fica disponivel quando a conexao em tempo real estiver ativa.");
      return;
    }

    const message: TeleatendimentoChatMessage = {
      sessionId: session.sessionId,
      messageId: `${Date.now()}_${Math.random().toString(36).slice(2)}`,
      authorRole: role,
      authorName:
        role === "PROFESSIONAL"
          ? session.professional.name
          : session.employee.name,
      text: chatInput.trim(),
      sentAt: new Date().toISOString(),
    };

    await appendMessage(message);
    emitEvent(
      socketRef.current as any,
      EventType.TELEATENDIMENTO_CHAT_MESSAGE,
      message,
    );
    setChatInput("");
  };

  const toggleMic = () => {
    const next = !micEnabled;
    setMicEnabled(next);
    webRtcRef.current?.setAudioEnabled(next);
  };

  const toggleCamera = () => {
    const next = !cameraEnabled;
    setCameraEnabled(next);
    webRtcRef.current?.setVideoEnabled(next);
  };

  const copyValue = async (value: string, label: string) => {
    if (!value) return;
    await navigator.clipboard.writeText(value);
    addToast({
      title: "Copiado",
      description: `${label} copiado para a area de transferencia.`,
      severity: "success",
      color: "foreground",
      variant: "flat",
    });
  };

  const requestFacial = async () => {
    if (role !== "PROFESSIONAL" || !session) return;

    try {
      const response = await fetch(NEST_FACIAL_SESSION, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          schedulingId: session.schedulingId,
          funcionarioId: session.employee.id,
          signerName: session.employee.name,
        }),
      });

      if (!response.ok) {
        throw new Error("Nao foi possivel iniciar a autenticacao facial.");
      }

      const data = await response.json();
      setFacialLink(data.signatureLink || "");
      addToast({
        title: "Link facial gerado",
        description: "Compartilhe o link de autenticacao facial com o funcionario.",
        severity: "success",
        color: "foreground",
        variant: "flat",
      });
    } catch (error) {
      addToast({
        title: "Falha ao gerar link facial",
        description:
          error instanceof Error
            ? error.message
            : "Erro ao gerar o link da autenticacao facial.",
        severity: "danger",
        color: "foreground",
        variant: "flat",
      });
    }
  };

  const endSession = async () => {
    if (!session) return;

    if (socketRef.current) {
      emitEvent(socketRef.current as any, EventType.TELEATENDIMENTO_END, {
        sessionId: session.sessionId,
      });
    }

    try {
      await fetch(`${NEST_TELEATENDIMENTO_SESSION}/${session.sessionId}/end`, {
        method: "POST",
      });
    } catch {}

    socketRef.current?.disconnect();
    socketRef.current = null;
    webRtcRef.current?.destroy();
    webRtcRef.current = null;
    setSocketConnected(false);
    setStatusMessage("Sessao encerrada.");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f4faf6] flex items-center justify-center">
        <Spinner color="success" size="lg" />
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-[#f4faf6] flex items-center justify-center p-8">
        <Card className="max-w-xl w-full border border-rose-200">
          <CardBody className="p-6 text-center text-rose-700">
            {statusMessage}
          </CardBody>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f4faf6] p-6">
      <div className="mx-auto max-w-7xl space-y-4">
        <Card className="border border-emerald-100 shadow-sm">
          <CardHeader className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="space-y-3">
              <div>
                <h1 className="text-xl font-semibold text-[#114e34]">{title}</h1>
                <p className="text-sm text-gray-600">
                  Sessao vinculada ao atendimento selecionado. Outro funcionario exige nova sala.
                </p>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <div className="rounded-2xl border border-emerald-100 bg-emerald-50/70 p-3">
                  <div className="text-xs font-semibold uppercase tracking-wide text-emerald-800">
                    Profissional
                  </div>
                  <div className="mt-2 text-sm font-semibold text-[#114e34]">
                    {session.professional.name || "Profissional nao identificado"}
                  </div>
                  <div className="mt-1 text-xs text-gray-600">
                    {session.professional.connected ? "Conectado" : "Aguardando entrada"}
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                  <div className="text-xs font-semibold uppercase tracking-wide text-slate-700">
                    Funcionario
                  </div>
                  <div className="mt-2 text-sm font-semibold text-slate-900">
                    {session.employee.name}
                  </div>
                  <div className="mt-1 text-xs text-gray-600">{employeeExamLabel}</div>
                  {employeeMetaLabel ? (
                    <div className="mt-1 text-[11px] text-gray-500">{employeeMetaLabel}</div>
                  ) : null}
                  <div className="mt-1 text-xs text-gray-600">
                    {session.employee.connected ? "Conectado" : "Aguardando entrada"}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              {role === "PROFESSIONAL" && inviteUrl ? (
                <Button
                  color="success"
                  size="sm"
                  startContent={<Copy className="h-4 w-4" />}
                  variant="flat"
                  onPress={() => copyValue(inviteUrl, "Link do funcionario")}
                >
                  Copiar link
                </Button>
              ) : null}
              {role === "PROFESSIONAL" ? (
                <Button
                  color="success"
                  size="sm"
                  startContent={<ShieldCheck className="h-4 w-4" />}
                  variant="flat"
                  onPress={requestFacial}
                >
                  Solicitar facial
                </Button>
              ) : null}
              <Button
                color="danger"
                size="sm"
                startContent={<PhoneOff className="h-4 w-4" />}
                variant="flat"
                onPress={endSession}
              >
                Encerrar
              </Button>
            </div>
          </CardHeader>
        </Card>

        <div className="grid gap-4 lg:grid-cols-[1.6fr_0.8fr]">
          <Card className="border border-emerald-100 shadow-sm">
            <CardBody className="p-4 space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-2xl overflow-hidden bg-black aspect-video relative">
                  <video
                    ref={localVideoRef}
                    autoPlay
                    className="h-full w-full object-cover"
                    muted
                    playsInline
                  />
                  <span className="absolute left-3 top-3 rounded-full bg-black/70 px-2 py-1 text-xs text-white">
                    Seu video
                  </span>
                </div>
                <div className="rounded-2xl overflow-hidden bg-black aspect-video relative">
                  <video
                    ref={remoteVideoRef}
                    autoPlay
                    className="h-full w-full object-cover"
                    playsInline
                  />
                  <span className="absolute left-3 top-3 rounded-full bg-black/70 px-2 py-1 text-xs text-white">
                    Participante remoto
                  </span>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <Button
                  color={micEnabled ? "success" : "danger"}
                  size="sm"
                  startContent={
                    micEnabled ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />
                  }
                  variant="flat"
                  onPress={toggleMic}
                >
                  {micEnabled ? "Microfone ligado" : "Microfone desligado"}
                </Button>
                <Button
                  color={cameraEnabled ? "success" : "danger"}
                  size="sm"
                  startContent={
                    cameraEnabled ? (
                      <Camera className="h-4 w-4" />
                    ) : (
                      <CameraOff className="h-4 w-4" />
                    )
                  }
                  variant="flat"
                  onPress={toggleCamera}
                >
                  {cameraEnabled ? "Camera ligada" : "Camera desligada"}
                </Button>
                <div className="min-w-[240px] flex items-center gap-3">
                  <Volume2 className="h-4 w-4 text-gray-500" />
                  <Slider
                    aria-label="Volume remoto"
                    className="max-w-xs"
                    color="success"
                    defaultValue={80}
                    maxValue={100}
                    minValue={0}
                    value={remoteVolume}
                    onChange={(value) => setRemoteVolume(Number(value))}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  {!socketConnected ? (
                    <Button
                      color="success"
                      isLoading={joinLoading}
                      size="md"
                      startContent={!joinLoading ? <Video className="h-4 w-4" /> : null}
                      variant="solid"
                      onPress={connectCall}
                    >
                      {joinButtonLabel}
                    </Button>
                  ) : (
                    <Button color="success" size="md" variant="flat">
                      {joinButtonLabel}
                    </Button>
                  )}
                  <span className="text-xs text-gray-500">{joinHint}</span>
                </div>
              </div>

              <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-3 text-sm text-emerald-900">
                {statusMessage}
              </div>

              {facialLink ? (
                <div className="rounded-xl border border-sky-100 bg-sky-50 p-3 text-sm text-sky-900 space-y-2">
                  <div className="font-medium">Link da autenticacao facial</div>
                  <div className="break-all">{facialLink}</div>
                  <div className="flex gap-2">
                    <Button
                      color="primary"
                      size="sm"
                      startContent={<Copy className="h-4 w-4" />}
                      variant="flat"
                      onPress={() => copyValue(facialLink, "Link facial")}
                    >
                      Copiar
                    </Button>
                    <Button
                      color="primary"
                      size="sm"
                      startContent={<Link2 className="h-4 w-4" />}
                      variant="flat"
                      onPress={() => window.open(facialLink, "_blank", "noopener,noreferrer")}
                    >
                      Abrir
                    </Button>
                  </div>
                </div>
              ) : null}
            </CardBody>
          </Card>

          <Card className="border border-emerald-100 shadow-sm">
            <CardBody className="p-4 space-y-4">
              <div>
                <h2 className="text-base font-semibold text-[#114e34]">Chat</h2>
                <p className="text-xs text-gray-500">
                  Historico local desta sessao no navegador.
                </p>
              </div>

              <div className="h-[420px] overflow-y-auto rounded-xl border border-gray-200 bg-white p-3 space-y-2">
                {messages.length === 0 ? (
                  <p className="text-sm text-gray-400">Nenhuma mensagem enviada ainda.</p>
                ) : (
                  messages.map((message) => (
                    <div
                      key={message.messageId}
                      className={`rounded-xl px-3 py-2 text-sm ${
                        message.authorRole === role
                          ? "bg-emerald-50 border border-emerald-200"
                          : "bg-gray-50 border border-gray-200"
                      }`}
                    >
                      <div className="font-medium text-gray-700">{message.authorName}</div>
                      <div className="text-gray-800">{message.text}</div>
                      <div className="mt-1 text-[11px] text-gray-400">
                        {new Date(message.sentAt).toLocaleString("pt-BR")}
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="flex gap-2">
                <Input
                  isDisabled={!canSendChat}
                  placeholder="Digite uma mensagem"
                  value={chatInput}
                  onChange={(event) => setChatInput(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      void sendChat();
                    }
                  }}
                />
                <Button color="success" isDisabled={!canSendChat} onPress={() => void sendChat()}>
                  Enviar
                </Button>
              </div>
              {!canSendChat ? (
                <p className="text-xs text-amber-700">
                  O chat sera liberado quando a conexao em tempo real com o backend estiver ativa.
                </p>
              ) : null}
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}
