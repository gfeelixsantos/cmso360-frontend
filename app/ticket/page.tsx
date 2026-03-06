// ticket.ts - VERSÃO CORRIGIDA PARA PREENCHER TELA
"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@heroui/react";
import {
  KeyIcon,
  MapPinIcon,
  UserIcon,
  UserPlusIcon,
  ClipboardDocumentCheckIcon,
  ArrowPathIcon,
  QueueListIcon,
  BuildingOfficeIcon,
  ClockIcon,
  CalendarIcon,
  XMarkIcon,
  ArrowsPointingOutIcon,
} from "@heroicons/react/24/outline";

import PreferencialTipo from "./components/PreferencialTipo";

import {
  Ticket,
  TicketEmitedDto,
  TicketGroups,
  TicketStatus,
  TicketTypes,
} from "@/lib/ticket/ticket";
import { WebsocketType } from "@/lib/websocket/enums/websocket.enum";
import {
  COLOR_PALETTE,
  NEST_TICKETS_URL,
  SERVICES_KEY,
  UNIDADES_ATENDIMENTO,
} from "@/config/constants";

// Interface para dados de autenticação salvos
interface AuthData {
  serial: string;
  unidade: string;
  timestamp: number;
}

// Hook para fullscreen
const useFullscreen = () => {
  const [isFullscreen, setIsFullscreen] = useState(false);

  const enterFullscreen = useCallback(() => {
    const docElement = document.documentElement as any;

    try {
      if (docElement.requestFullscreen) {
        docElement.requestFullscreen().catch(() => {
          console.log("Fullscreen não suportado ou bloqueado pelo navegador");
        });
      } else if (docElement.mozRequestFullScreen) {
        docElement.mozRequestFullScreen();
      } else if (docElement.webkitRequestFullscreen) {
        docElement.webkitRequestFullscreen();
      } else if (docElement.msRequestFullscreen) {
        docElement.msRequestFullscreen();
      }
    } catch (error) {
      console.log("Erro ao tentar entrar em fullscreen:", error);
    }
  }, []);

  const exitFullscreen = useCallback(() => {
    const doc = document as any;

    if (doc.exitFullscreen) {
      doc.exitFullscreen();
    } else if (doc.mozCancelFullScreen) {
      doc.mozCancelFullScreen();
    } else if (doc.webkitExitFullscreen) {
      doc.webkitExitFullscreen();
    } else if (doc.msExitFullscreen) {
      doc.msExitFullscreen();
    }
  }, []);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    document.addEventListener("webkitfullscreenchange", handleFullscreenChange);
    document.addEventListener("mozfullscreenchange", handleFullscreenChange);
    document.addEventListener("MSFullscreenChange", handleFullscreenChange);

    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      document.removeEventListener(
        "webkitfullscreenchange",
        handleFullscreenChange,
      );
      document.removeEventListener(
        "mozfullscreenchange",
        handleFullscreenChange,
      );
      document.removeEventListener(
        "MSFullscreenChange",
        handleFullscreenChange,
      );
    };
  }, []);

  return { isFullscreen, enterFullscreen, exitFullscreen };
};

// Hook para gerenciamento de autenticação no localStorage
const useAuthStorage = () => {
  const AUTH_STORAGE_KEY = "ticket_auth_data";
  const STORAGE_EXPIRY_MS = 24 * 60 * 60 * 1000; // 24 horas

  const saveAuthData = (serial: string, unidade: string) => {
    const authData: AuthData = {
      serial,
      unidade,
      timestamp: Date.now(),
    };

    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(authData));
  };

  const getAuthData = (): AuthData | null => {
    try {
      const stored = localStorage.getItem(AUTH_STORAGE_KEY);

      if (!stored) return null;

      const authData: AuthData = JSON.parse(stored);
      const isExpired = Date.now() - authData.timestamp > STORAGE_EXPIRY_MS;

      if (isExpired) {
        localStorage.removeItem(AUTH_STORAGE_KEY);

        return null;
      }

      return authData;
    } catch {
      return null;
    }
  };

  const clearAuthData = () => {
    localStorage.removeItem(AUTH_STORAGE_KEY);
  };

  return { saveAuthData, getAuthData, clearAuthData };
};

// Hook para horário do Brasil
const useBrazilTime = () => {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const updateTime = () => {
      setCurrentTime(new Date());
    };

    updateTime();
    const timer = setInterval(updateTime, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      timeZone: "America/Sao_Paulo",
    });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("pt-BR", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      timeZone: "America/Sao_Paulo",
    });
  };

  return { currentTime, formatTime, formatDate };
};

// Componente Header com informações institucionais
const Header = ({ unidade }: { unidade?: string }) => {
  const { currentTime, formatTime, formatDate } = useBrazilTime();

  return (
    <header
      className="w-full text-white p-3 md:p-4 rounded-t-2xl shadow-lg"
      style={{
        background: `linear-gradient(135deg, ${COLOR_PALETTE.primary} 0%, ${COLOR_PALETTE.dark} 100%)`,
      }}
    >
      <div className="container mx-auto flex flex-col md:flex-row justify-between items-center gap-2 md:gap-3">
        <div className="flex items-center">
          <div className="text-center md:text-left">
            {unidade && (
              <div className="flex items-center justify-start">
                <MapPinIcon
                  className="h-5 w-5 md:h-6 md:w-6 mr-2"
                  style={{ color: COLOR_PALETTE.secondary }}
                />
                <span
                  className="font-bold text-base md:text-lg lg:text-xl"
                  style={{ color: COLOR_PALETTE.light }}
                >
                  CMSO {unidade}
                </span>
              </div>
            )}
            <p
              className="text-sm md:text-base"
              style={{ color: COLOR_PALETTE.secondary }}
            >
              Sistema de Atendimento
            </p>
          </div>
        </div>

        <div className="text-center md:text-right flex-1">
          <div className="flex flex-col md:flex-row items-center justify-center md:justify-end gap-1 md:gap-3">
            <div className="flex items-center">
              <CalendarIcon
                className="h-4 w-4 md:h-5 md:w-5 mr-2"
                style={{ color: COLOR_PALETTE.secondary }}
              />
              <span className="text-sm md:text-base">
                {formatDate(currentTime)}
              </span>
            </div>

            <div className="flex items-center">
              <ClockIcon
                className="h-4 w-4 md:h-5 md:w-5 mr-2"
                style={{ color: COLOR_PALETTE.secondary }}
              />
              <span className="font-mono text-lg md:text-xl lg:text-2xl font-bold">
                {formatTime(currentTime)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

// Componente para a tela de autenticação e conexão
const InitialScreen = ({
  onConnect,
}: {
  onConnect: (unidade: string) => void;
}) => {
  const [serial, setSerial] = useState("");
  const [unidade, setUnidade] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { saveAuthData, getAuthData } = useAuthStorage();

  // Carregar credenciais salvas ao montar o componente
  useEffect(() => {
    const savedAuth = getAuthData();

    if (savedAuth) {
      setSerial(savedAuth.serial);
      setUnidade(savedAuth.unidade);
    }
  }, [getAuthData]);

  const handleConnect = async () => {
    setError("");

    if (serial !== SERVICES_KEY) {
      setError("Código de acesso inválido.");

      return;
    }

    if (!unidade) {
      setError("Selecione a unidade.");

      return;
    }

    setIsLoading(true);
    try {
      // Salvar credenciais no localStorage
      saveAuthData(serial, unidade);

      setTimeout(() => {
        onConnect(unidade);
      }, 1000);
    } catch (err) {
      setError("Não foi possível conectar ao servidor. Tente novamente.");
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleConnect();
    }
  };

  return (
    <motion.div
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-md sm:max-w-lg md:max-w-xl lg:max-w-2xl rounded-2xl shadow-xl overflow-hidden border"
      initial={{ opacity: 0, y: 20 }}
      style={{
        backgroundColor: COLOR_PALETTE.background,
        borderColor: COLOR_PALETTE.primary,
      }}
      transition={{ duration: 0.5 }}
    >
      <div
        className="p-5 md:p-6 text-center"
        style={{
          background: `linear-gradient(135deg, ${COLOR_PALETTE.primary} 0%, ${COLOR_PALETTE.accent} 100%)`,
        }}
      >
        <h2 className="text-xl md:text-2xl font-bold text-white">
          Acesso ao Totem
        </h2>
        <p
          className="mt-2 text-base md:text-lg"
          style={{ color: COLOR_PALETTE.light }}
        >
          Informe as credenciais para continuar
        </p>
      </div>

      <div className="p-6 md:p-8 space-y-4 md:space-y-5">
        <div className="relative">
          <KeyIcon
            className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 md:w-6 md:h-6"
            style={{ color: COLOR_PALETTE.primary }}
          />
          <input
            className="w-full pl-12 pr-4 py-4 md:py-5 rounded-xl border text-lg placeholder-gray-500 focus:ring-2 focus:border-transparent transition-all"
            placeholder="Informe o código serial"
            style={{
              backgroundColor: "white",
              borderColor: COLOR_PALETTE.gray,
              color: COLOR_PALETTE.text,
            }}
            type="password"
            value={serial}
            onChange={(e) => setSerial(e.target.value)}
            onKeyPress={handleKeyPress}
          />
        </div>

        <div className="relative">
          <MapPinIcon
            className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 md:w-6 md:h-6"
            style={{ color: COLOR_PALETTE.primary }}
          />
          <select
            className="w-full pl-12 pr-4 py-4 md:py-5 rounded-xl border text-lg appearance-none focus:ring-2 focus:border-transparent transition-all"
            style={{
              backgroundColor: "white",
              borderColor: COLOR_PALETTE.gray,
              color: COLOR_PALETTE.text,
            }}
            value={unidade}
            onChange={(e) => setUnidade(e.target.value)}
            onKeyPress={handleKeyPress}
          >
            <option disabled value="">
              Selecione a unidade
            </option>
            {UNIDADES_ATENDIMENTO.map((u) => (
              <option key={u} value={u}>
                {u}
              </option>
            ))}
          </select>
        </div>

        {error && (
          <motion.p
            animate={{ opacity: 1 }}
            className="text-center font-medium p-3 rounded-lg text-base"
            initial={{ opacity: 0 }}
            style={{
              backgroundColor: "#fed7d7",
              color: "#c53030",
            }}
          >
            {error}
          </motion.p>
        )}
      </div>

      <div className="px-6 md:px-8 pb-6 md:pb-8">
        <Button
          className="w-full py-4 md:py-5 text-lg font-bold text-white rounded-xl transition-all duration-300 flex items-center justify-center shadow-lg hover:shadow-xl"
          disabled={isLoading}
          style={{
            background: isLoading
              ? COLOR_PALETTE.gray
              : `linear-gradient(135deg, ${COLOR_PALETTE.primary} 0%, ${COLOR_PALETTE.accent} 100%)`,
          }}
          onClick={handleConnect}
        >
          {isLoading ? (
            <>
              <ArrowPathIcon className="w-5 h-5 md:w-6 md:h-6 animate-spin mr-3" />
              Conectando...
            </>
          ) : (
            "Conectar Totem"
          )}
        </Button>
      </div>
    </motion.div>
  );
};

// Componente para exibir mensagens de feedback em tela cheia
const FullScreenFeedback = ({
  type,
  message,
  ticketNumber,
  onClose,
}: {
  type: "success" | "error";
  message: string;
  ticketNumber?: string;
  onClose: () => void;
}) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 5000);

    return () => clearTimeout(timer);
  }, [onClose]);

  const successGradient = `linear-gradient(135deg, ${COLOR_PALETTE.primary} 0%, ${COLOR_PALETTE.accent} 100%)`;
  const errorGradient = `linear-gradient(135deg, #e53e3e 0%, #c53030 100%)`;

  return (
    <motion.div
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      exit={{ opacity: 0 }}
      initial={{ opacity: 0 }}
      style={{
        backgroundColor: type === "success" ? COLOR_PALETTE.light : "#fed7d7",
      }}
    >
      <div
        className="relative w-full max-w-lg sm:max-w-xl md:max-w-2xl lg:max-w-3xl p-6 md:p-8 rounded-3xl shadow-2xl text-center text-white"
        style={{
          background: type === "success" ? successGradient : errorGradient,
        }}
      >
        <button
          className="absolute top-4 right-4 p-2 rounded-full hover:bg-white/20 transition-colors"
          onClick={onClose}
        >
          <XMarkIcon className="h-6 w-6 md:h-8 md:w-8" />
        </button>

        <motion.h2
          animate={{ y: 0, opacity: 1 }}
          className="text-2xl md:text-3xl lg:text-4xl font-bold mb-4 md:mb-6"
          initial={{ y: 20, opacity: 0 }}
          transition={{ delay: 0.4 }}
        >
          {type === "success"
            ? "SENHA EMITIDA COM SUCESSO!"
            : "ERRO NA EMISSÃO"}
        </motion.h2>

        {ticketNumber && (
          <motion.div
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white/20 p-4 md:p-6 rounded-2xl mb-4 md:mb-6"
            initial={{ scale: 0.8, opacity: 0 }}
            transition={{ delay: 0.6, type: "spring", stiffness: 100 }}
          >
            <p className="text-lg md:text-xl mb-2">Sua senha é:</p>
            <p className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-wider">
              {ticketNumber}
            </p>
          </motion.div>
        )}

        <motion.p
          animate={{ y: 0, opacity: 1 }}
          className="text-lg md:text-xl mb-6 md:mb-8"
          initial={{ y: 20, opacity: 0 }}
          transition={{ delay: 0.8 }}
        >
          {message}
        </motion.p>

        <motion.div
          animate={{ y: 0, opacity: 1 }}
          initial={{ y: 20, opacity: 0 }}
          transition={{ delay: 1 }}
        >
          <Button
            className="px-6 py-3 md:px-8 md:py-4 text-lg font-bold rounded-xl bg-white/20 hover:bg-white/30 border border-white/30"
            onClick={onClose}
          >
            Fechar
          </Button>
        </motion.div>

        {/* Contador regressivo */}
        <motion.div
          animate={{ width: "100%" }}
          className="absolute bottom-0 left-0 h-2 bg-white/30 rounded-b-3xl"
          initial={{ width: 0 }}
          transition={{ duration: 3, ease: "linear" }}
        />
      </div>
    </motion.div>
  );
};

// Botão para ativar/desativar fullscreen
const FullscreenToggle = ({
  isFullscreen,
  onToggle,
}: {
  isFullscreen: boolean;
  onToggle: () => void;
}) => (
  <Button
    className="fixed top-4 right-4 z-40 p-2 rounded-full bg-white/20 hover:bg-white/30 border border-white/30 backdrop-blur-sm shadow-lg"
    size="sm"
    onClick={onToggle}
  >
    <ArrowsPointingOutIcon className="h-5 w-5 text-white" />
  </Button>
);

// Componente para a tela principal de opções de ticket - OTIMIZADO PARA PREENCHER TELA
const TicketOptionsScreen = ({
  unidadeSelecionada,
}: {
  unidadeSelecionada: string;
}) => {
  const [subOptions, setSubOptions] = useState<TicketTypes[] | null>(null);
  const [showPreferencialTypes, setShowPreferencialTypes] = useState(false);
  const [selectedPreferencialType, setSelectedPreferencialType] = useState<
    string | null
  >(null);
  const [isLoading, setIsLoading] = useState(false);
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
    ticketNumber?: string;
  } | null>(null);
  const { isFullscreen, enterFullscreen, exitFullscreen } = useFullscreen();

  // Sugerir fullscreen após um breve delay, mas não forçar
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!isFullscreen) {
        console.log(
          "Modo tela cheia disponível - clique no botão no canto superior direito",
        );
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [isFullscreen]);

  const handleFullscreenToggle = () => {
    if (isFullscreen) {
      exitFullscreen();
    } else {
      enterFullscreen();
    }
  };

  // Memoização da função de emissão de ticket para performance
  const emitirTicket = async (tipo: TicketTypes, tipoPreferencial?: string) => {
    if (isLoading) return;

    setIsLoading(true);
    const ticketPrefix = tipo === "NORMAL" ? "" : tipo[0];

    const ticket: TicketEmitedDto = {
      emissao: new Date(),
      numero: 0,
      prefixo: ticketPrefix,
      preferencial: [TicketTypes.PREFERENCIAL].includes(tipo),
      preferencialTipo: tipoPreferencial || undefined,
      status: TicketStatus.AGUARDANDO,
      type: WebsocketType.TICKET,
      unidade: unidadeSelecionada,
      grupo: TicketGroups.RECEPCAO,
    };

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const response = await fetch(NEST_TICKETS_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(ticket),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error("Erro ao emitir o ticket.");
      }

      const ticketResponse: Ticket = await response.json();
      const formattedTicket = `${ticketPrefix}${ticketResponse.numero}`;

      setFeedback({
        type: "success",
        message: `Aguarde ser chamado.${tipoPreferencial ? ` (${tipoPreferencial})` : ""}`,
        ticketNumber: formattedTicket,
      });

      setSelectedPreferencialType(null);
    } catch (error) {
      console.error("Erro na emissão do ticket:", error);

      setFeedback({
        type: "error",
        message:
          "Não foi possível emitir a senha. Por favor, tente novamente ou procure um funcionário.",
      });
    } finally {
      setIsLoading(false);
      setSubOptions(null);
      setShowPreferencialTypes(false);
    }
  };

  const handleTicketOption = (tipo: TicketTypes) => {
    if (tipo === TicketTypes.ATENDIMENTO) {
      setSubOptions([TicketTypes.NORMAL, TicketTypes.WHIRLPOOL]);
    } else if (tipo === TicketTypes.PREFERENCIAL) {
      setShowPreferencialTypes(true);
    } else {
      emitirTicket(tipo);
    }
  };

  const handlePreferencialTypeSelect = (tipoPreferencial: string) => {
    setSelectedPreferencialType(tipoPreferencial);
    emitirTicket(TicketTypes.PREFERENCIAL, tipoPreferencial);
  };

  const handleBackFromPreferencial = () => {
    setShowPreferencialTypes(false);
    setSelectedPreferencialType(null);
  };

  const getIcon = (tipo: TicketTypes) => {
    const iconClass = "w-10 h-10 md:w-12 md:h-12 lg:w-14 lg:h-14";

    switch (tipo) {
      case TicketTypes.ATENDIMENTO:
        return <QueueListIcon className={iconClass} />;
      case TicketTypes.PREFERENCIAL:
        return <UserPlusIcon className={iconClass} />;
      case TicketTypes.RETIRADA_EXAMES:
        return <ClipboardDocumentCheckIcon className={iconClass} />;
      case TicketTypes.WHIRLPOOL:
        return <BuildingOfficeIcon className={iconClass} />;
      default:
        return <UserIcon className={iconClass} />;
    }
  };

  const getButtonColor = (tipo: TicketTypes) => {
    switch (tipo) {
      case TicketTypes.PREFERENCIAL:
        return `linear-gradient(135deg, ${COLOR_PALETTE.accent} 0%, #7a9c8a 100%)`;
      case TicketTypes.RETIRADA_EXAMES:
        return `linear-gradient(135deg, #5a8c7a 0%, ${COLOR_PALETTE.accent} 100%)`;
      case TicketTypes.WHIRLPOOL:
        return `linear-gradient(135deg, #6b7f76 0%, ${COLOR_PALETTE.gray} 100%)`;
      default:
        return `linear-gradient(135deg, ${COLOR_PALETTE.primary} 0%, ${COLOR_PALETTE.accent} 100%)`;
    }
  };

  const mainButtons = [
    { type: TicketTypes.ATENDIMENTO, label: "ATENDIMENTO" },
    { type: TicketTypes.PREFERENCIAL, label: "PREFERENCIAL" },
    {
      type: TicketTypes.RETIRADA_EXAMES,
      label: "REPETIÇÃO/RETIRADA EXAME",
    },
  ];

  const subButtons = subOptions?.map((type) => ({
    type,
    label: type === TicketTypes.NORMAL ? "ATENDIMENTO GERAL" : type,
  }));

  const buttonsToRender = subOptions ? subButtons : mainButtons;

  if (showPreferencialTypes) {
    return (
      <div className="w-full flex justify-center">
        <PreferencialTipo
          onBack={handleBackFromPreferencial}
          onSelect={handlePreferencialTypeSelect}
        />
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl md:max-w-5xl lg:max-w-6xl xl:max-w-7xl mx-auto px-2 sm:px-4 relative">
      {/* Botão de toggle para fullscreen */}
      <FullscreenToggle
        isFullscreen={isFullscreen}
        onToggle={handleFullscreenToggle}
      />

      <Header unidade={unidadeSelecionada} />

      <div
        className="p-4 md:p-6 lg:p-8 rounded-b-2xl shadow-lg border"
        style={{
          backgroundColor: COLOR_PALETTE.background,
          borderColor: COLOR_PALETTE.primary,
        }}
      >
        <motion.div
          animate={{ opacity: 1 }}
          className="text-center mb-6 md:mb-8 lg:mb-10"
          initial={{ opacity: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h2
            className="text-2xl md:text-3xl lg:text-4xl font-bold mb-2 md:mb-3"
            style={{ color: COLOR_PALETTE.text }}
          >
            Selecione o tipo de atendimento
          </h2>
          <p
            className="text-base md:text-lg"
            style={{ color: COLOR_PALETTE.gray }}
          >
            Escolha abaixo uma opção de atendimento
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 lg:gap-8 mb-6 md:mb-8 lg:mb-10">
          <AnimatePresence mode="wait">
            {buttonsToRender?.map(({ type, label }) => (
              <motion.div
                key={type}
                animate={{ opacity: 1, scale: 1 }}
                className="flex"
                exit={{ opacity: 0, scale: 0.9 }}
                initial={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.3 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button
                  className="flex flex-col items-center justify-center p-4 md:p-5 lg:p-6 h-40 md:h-48 lg:h-56 w-full text-lg md:text-xl lg:text-2xl font-bold text-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300"
                  disabled={isLoading}
                  style={{ background: getButtonColor(type as TicketTypes) }}
                  onClick={() => handleTicketOption(type as TicketTypes)}
                >
                  <motion.div
                    animate={{ scale: 1 }}
                    className="mb-3 md:mb-4"
                    initial={{ scale: 0.8 }}
                    transition={{ type: "spring", stiffness: 300 }}
                  >
                    {getIcon(type as TicketTypes)}
                  </motion.div>
                  <span className="text-center leading-tight px-2">
                    {label}
                  </span>
                </Button>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {subOptions && (
          <motion.div
            animate={{ opacity: 1 }}
            className="flex justify-center"
            initial={{ opacity: 0 }}
          >
            <Button
              className="px-6 py-3 md:px-8 md:py-4 rounded-xl border text-lg md:text-xl"
              style={{
                backgroundColor: COLOR_PALETTE.primary,
                color: "white",
                borderColor: COLOR_PALETTE.accent,
              }}
              onClick={() => setSubOptions(null)}
            >
              Voltar
            </Button>
          </motion.div>
        )}

        <AnimatePresence>
          {feedback && (
            <FullScreenFeedback
              message={feedback.message}
              ticketNumber={feedback.ticketNumber}
              type={feedback.type}
              onClose={() => setFeedback(null)}
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

// Página Principal (Home) - PREENCHE TELA COMPLETA
export default function Home() {
  const [unidadeSelecionada, setUnidadeSelecionada] = useState<string | null>(
    null,
  );
  const { getAuthData } = useAuthStorage();

  useEffect(() => {
    const savedAuth = getAuthData();

    if (savedAuth && savedAuth.serial === SERVICES_KEY) {
      setUnidadeSelecionada(savedAuth.unidade);
    }
  }, [getAuthData]);

  const handleConnect = (unidade: string) => {
    setUnidadeSelecionada(unidade);
  };

  return (
    <div
      className="min-h-screen w-full flex flex-col items-center justify-center p-2 sm:p-4 md:p-6"
      style={{
        background: `linear-gradient(135deg, ${COLOR_PALETTE.background} 0%, #e8f4e3 100%)`,
      }}
    >
      <AnimatePresence mode="wait">
        {unidadeSelecionada ? (
          <motion.div
            key="ticket-screen"
            animate={{ opacity: 1, scale: 1 }}
            className="w-full flex-1 flex items-center justify-center"
            exit={{ opacity: 0, scale: 0.9 }}
            initial={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.3 }}
          >
            <TicketOptionsScreen unidadeSelecionada={unidadeSelecionada} />
          </motion.div>
        ) : (
          <motion.div
            key="initial-screen"
            animate={{ opacity: 1, scale: 1 }}
            className="w-full flex-1 flex items-center justify-center"
            exit={{ opacity: 0, scale: 0.9 }}
            initial={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.3 }}
          >
            <InitialScreen onConnect={handleConnect} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Footer */}
      <motion.footer
        animate={{ opacity: 1 }}
        className="mt-4 md:mt-6 text-center text-sm md:text-base py-2"
        initial={{ opacity: 0 }}
        style={{ color: COLOR_PALETTE.gray }}
        transition={{ delay: 0.5 }}
      >
        <p>Centro Médico de Saúde Ocupacional</p>
        <p>© {new Date().getFullYear()} - Todos os direitos reservados</p>
      </motion.footer>
    </div>
  );
}
