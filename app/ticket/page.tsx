"use client";

import { useState, useEffect } from "react";
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
  WrenchScrewdriverIcon,
  ClockIcon,
  CalendarIcon,
  BuildingLibraryIcon,
  CheckBadgeIcon,
  ExclamationTriangleIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { Ticket, TicketEmitedDto, TicketGroups, TicketStatus, TicketTypes } from "@/lib/ticket/ticket";
import { WebsocketType } from "@/lib/websocket/enums/websocket.enum";
import { NEST_TICKETS_URL, SERVICES_KEY, UNIDADES_ATENDIMENTO } from "@/config/constants";

// Paleta de cores baseada no logo
const COLOR_PALETTE = {
  primary: "#44735e",      // Verde principal
  secondary: "#b8d864",    // Verde claro/amarelado
  accent: "#5a8c7a",       // Verde médio
  light: "#e8f4e3",        // Verde muito claro
  dark: "#2a4a3a",         // Verde escuro
  background: "#f5f9f7",   // Fundo claro
  text: "#1a2a1f",         // Texto escuro
  gray: "#6b7f76",         // Cinza esverdeado
};

// Componente Header com informações institucionais - Nova paleta
const Header = ({ unidade }: { unidade?: string }) => {
  const [currentTime, setCurrentTime] = useState(new Date());
  
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    
    return () => clearInterval(timer);
  }, []);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('pt-BR', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  return (
    <header 
      className="w-full text-white p-4 md:p-6 rounded-t-2xl shadow-lg"
      style={{ 
        background: `linear-gradient(135deg, ${COLOR_PALETTE.primary} 0%, ${COLOR_PALETTE.dark} 100%)` 
      }}
    >
      <div className="container mx-auto flex flex-col md:flex-row justify-between items-center">
        <div className="flex items-center mb-4 md:mb-0">
          {/* <img
            src="/images/cmso_icone.png"
            alt="Logo"
            className="w-12 md:w-16 h-auto"
          /> */}
          <div>
            <h1 className="text-xl md:text-2xl font-bold">CMSO</h1>
            <p style={{ color: COLOR_PALETTE.secondary }} className="text-sm">Sistema de Atendimento</p>
          </div>
        </div>
        
        <div className="text-center md:text-right">
          {unidade && (
            <div className="flex items-center justify-center md:justify-end mb-2">
              <MapPinIcon 
                className="h-5 w-5 mr-2" 
                style={{ color: COLOR_PALETTE.secondary }}
              />
              <span 
                className="font-semibold"
                style={{ color: COLOR_PALETTE.light }}
              >
                {unidade}
              </span>
            </div>
          )}
          
          <div className="flex flex-col sm:flex-row items-center justify-center md:justify-end gap-3 md:gap-4">
            <div className="flex items-center">
              <CalendarIcon 
                className="h-5 w-5 mr-2" 
                style={{ color: COLOR_PALETTE.secondary }}
              />
              <span className="text-sm md:text-base">{formatDate(currentTime)}</span>
            </div>
            
            <div className="flex items-center">
              <ClockIcon 
                className="h-5 w-5 mr-2" 
                style={{ color: COLOR_PALETTE.secondary }}
              />
              <span className="font-mono text-lg md:text-xl">{formatTime(currentTime)}</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

// Componente para a tela de autenticação e conexão - Nova paleta
const InitialScreen = ({ onConnect }: { onConnect: (unidade: string) => void }) => {
  const [serial, setSerial] = useState("");
  const [unidade, setUnidade] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleConnect = async () => {
    setError("");
    if (serial !== SERVICES_KEY) {
      setError("Código de acesso inválido.");
      return;
    }
    if (!unidade) {
      setError("Selecione uma unidade.");
      return;
    }

    setIsLoading(true);
    try {
      setTimeout(() => {
        onConnect(unidade);
      }, 1000);
    } catch (err) {
      setError("Não foi possível conectar ao servidor. Tente novamente.");
      setIsLoading(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="w-full max-w-lg rounded-2xl shadow-xl overflow-hidden border"
      style={{ 
        backgroundColor: COLOR_PALETTE.background,
        borderColor: COLOR_PALETTE.primary 
      }}
    >
      <div 
        className="p-4 md:p-6 text-center"
        style={{ 
          background: `linear-gradient(135deg, ${COLOR_PALETTE.primary} 0%, ${COLOR_PALETTE.accent} 100%)` 
        }}
      >
        <h2 className="text-xl md:text-2xl font-bold text-white">Acesso ao Totem</h2>
        <p style={{ color: COLOR_PALETTE.light }} className="mt-1">Informe as credenciais para continuar</p>
      </div>
      
      <div className="p-6 md:p-8 space-y-6">
        <div className="relative">
          <KeyIcon 
            className="absolute left-3 top-1/2 -translate-y-1/2 w-6 h-6"
            style={{ color: COLOR_PALETTE.primary }}
          />
          <input
            type="password"
            placeholder="Informe o código serial"
            value={serial}
            onChange={(e) => setSerial(e.target.value)}
            className="w-full pl-12 pr-4 py-4 rounded-xl border text-lg placeholder-gray-500 focus:ring-2 focus:border-transparent transition-all"
            style={{ 
              backgroundColor: 'white',
              borderColor: COLOR_PALETTE.gray,
              color: COLOR_PALETTE.text,
              focusRingColor: COLOR_PALETTE.primary
            }}
          />
        </div>

        <div className="relative">
          <MapPinIcon 
            className="absolute left-3 top-1/2 -translate-y-1/2 w-6 h-6"
            style={{ color: COLOR_PALETTE.primary }}
          />
          <select
            value={unidade}
            onChange={(e) => setUnidade(e.target.value)}
            className="w-full pl-12 pr-4 py-4 rounded-xl border text-lg appearance-none focus:ring-2 focus:border-transparent transition-all"
            style={{ 
              backgroundColor: 'white',
              borderColor: COLOR_PALETTE.gray,
              color: COLOR_PALETTE.text,
              focusRingColor: COLOR_PALETTE.primary
            }}
          >
            <option value="" disabled>Selecione a unidade</option>
            {UNIDADES_ATENDIMENTO.map((u) => (
              <option key={u} value={u}>{u}</option>
            ))}
          </select>
        </div>

        {error && (
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center font-medium p-3 rounded-lg"
            style={{ 
              backgroundColor: '#fed7d7',
              color: '#c53030'
            }}
          >
            {error}
          </motion.p>
        )}
      </div>
      
      <div className="px-6 md:px-8 pb-6 md:pb-8">
        <Button
          onClick={handleConnect}
          disabled={isLoading}
          className="w-full py-4 text-lg font-bold text-white rounded-xl transition-all duration-300 flex items-center justify-center shadow-lg"
          style={{ 
            background: isLoading 
              ? COLOR_PALETTE.gray 
              : `linear-gradient(135deg, ${COLOR_PALETTE.primary} 0%, ${COLOR_PALETTE.accent} 100%)`
          }}
        >
          {isLoading ? (
            <>
              <ArrowPathIcon className="w-6 h-6 animate-spin mr-2" />
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

// Componente para exibir mensagens de feedback em tela cheia - Nova paleta
const FullScreenFeedback = ({ type, message, ticketNumber, onClose }: { 
  type: 'success' | 'error', 
  message: string,
  ticketNumber?: string,
  onClose: () => void 
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
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ 
        backgroundColor: type === 'success' ? COLOR_PALETTE.light : '#fed7d7'
      }}
    >
      <div 
        className="relative w-full max-w-2xl md:max-w-4xl p-6 md:p-8 rounded-3xl shadow-2xl text-center text-white"
        style={{ 
          background: type === 'success' ? successGradient : errorGradient
        }}
      >
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full hover:bg-white/20 transition-colors"
        >
          <XMarkIcon className="h-6 w-6 md:h-8 md:w-8" />
        </button>
        
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 100 }}
          className="mb-4 md:mb-6"
        >
          {type === 'success' ? (
            <CheckBadgeIcon className="h-20 w-20 md:h-32 md:w-32 mx-auto" style={{ color: COLOR_PALETTE.secondary }} />
          ) : (
            <ExclamationTriangleIcon className="h-20 w-20 md:h-32 md:w-32 mx-auto text-red-200" />
          )}
        </motion.div>
        
        <motion.h2 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-2xl md:text-4xl font-bold mb-4 md:mb-6"
        >
          {type === 'success' ? 'SENHA EMITIDA COM SUCESSO!' : 'ERRO NA EMISSÃO'}
        </motion.h2>
        
        {ticketNumber && (
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.6, type: "spring", stiffness: 100 }}
            className="bg-white/20 p-4 md:p-6 rounded-2xl mb-4 md:mb-6"
          >
            <p className="text-lg md:text-2xl mb-2">Sua senha é:</p>
            <p className="text-4xl md:text-7xl font-bold tracking-wider">{ticketNumber}</p>
          </motion.div>
        )}
        
        <motion.p 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="text-lg md:text-xl mb-6 md:mb-8"
        >
          {message}
        </motion.p>
        
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 1 }}
        >
          <Button
            onClick={onClose}
            className="px-6 py-3 md:px-8 md:py-4 text-lg font-bold rounded-xl bg-white/20 hover:bg-white/30 border border-white/30"
          >
            Fechar
          </Button>
        </motion.div>
        
        {/* Contador regressivo */}
        <motion.div 
          initial={{ width: 0 }}
          animate={{ width: '100%' }}
          transition={{ duration: 5, ease: "linear" }}
          className="absolute bottom-0 left-0 h-1 bg-white/30 rounded-b-3xl"
        />
      </div>
    </motion.div>
  );
};

// Componente para a tela principal de opções de ticket - Nova paleta
const TicketOptionsScreen = ({ unidadeSelecionada }: { unidadeSelecionada: string }) => {
  const [subOptions, setSubOptions] = useState<TicketTypes[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ 
    type: 'success' | 'error', 
    message: string, 
    ticketNumber?: string 
  } | null>(null);

  const emitirTicket = async (tipo: TicketTypes) => {
    setIsLoading(true);
    const ticketPrefix = tipo === "NORMAL" ? "" : tipo[0];
    
    const ticket: TicketEmitedDto = {
      emissao: new Date(),
      numero: 0,
      prefixo: ticketPrefix,
      preferencial: [TicketTypes.PREFERENCIAL].includes(tipo),
      status: TicketStatus.AGUARDANDO,
      type: WebsocketType.TICKET,
      unidade: unidadeSelecionada,
      grupo: TicketGroups.RECEPCAO
    };

    try {
      const response = await fetch(NEST_TICKETS_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
        },
        body: JSON.stringify(ticket),
      });

      if (!response.ok) {
        throw new Error("Erro ao emitir o ticket.");
      }

      const ticketResponse: Ticket = await response.json()
      const formattedTicket = `${ticketPrefix}${ticketResponse.numero}`;

      setFeedback({
        type: 'success',
        message: 'Aguarde ser chamado pelo funcionário responsável.',
        ticketNumber: formattedTicket
      });
      
      console.log("Ticket emitido:", ticketResponse);
    } catch (error) {
      console.error("Erro na emissão do ticket:", error);
      
      setFeedback({
        type: 'error',
        message: "Não foi possível emitir a senha. Por favor, tente novamente ou procure um funcionário."
      });
    } finally {
      setIsLoading(false);
      setSubOptions(null);
    }
  };

  const handleTicketOption = (tipo: TicketTypes) => {
    if (tipo === TicketTypes.ATENDIMENTO) {
      setSubOptions([TicketTypes.NORMAL, TicketTypes.WHIRLPOOL, TicketTypes.MAJOPAR]);
    } else {
      emitirTicket(tipo);
    }
  };

  const getIcon = (tipo: TicketTypes) => {
    switch (tipo) {
      case TicketTypes.ATENDIMENTO:
        return <QueueListIcon className="w-10 h-10 md:w-12 md:h-12" />;
      case TicketTypes.PREFERENCIAL:
        return <UserPlusIcon className="w-10 h-10 md:w-12 md:h-12" />;
      case TicketTypes.RETIRADA_EXAMES:
        return <ClipboardDocumentCheckIcon className="w-10 h-10 md:w-12 md:h-12" />;
      case TicketTypes.WHIRLPOOL:
        return <BuildingOfficeIcon className="w-10 h-10 md:w-12 md:h-12" />;
      case TicketTypes.MAJOPAR:
        return <WrenchScrewdriverIcon className="w-10 h-10 md:w-12 md:h-12" />;
      default:
        return <UserIcon className="w-10 h-10 md:w-12 md:h-12" />;
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
      case TicketTypes.MAJOPAR:
        return `linear-gradient(135deg, ${COLOR_PALETTE.dark} 0%, ${COLOR_PALETTE.primary} 100%)`;
      default:
        return `linear-gradient(135deg, ${COLOR_PALETTE.primary} 0%, ${COLOR_PALETTE.accent} 100%)`;
    }
  };

  const mainButtons = [
    { type: TicketTypes.ATENDIMENTO, label: "ATENDIMENTO" },
    { type: TicketTypes.PREFERENCIAL, label: "PREFERENCIAL" },
    { type: TicketTypes.RETIRADA_EXAMES, label: "REPETIÇÃO/RETIRADA DE EXAMES" },
  ];

  const subButtons = subOptions?.map((type) => ({
    type,
    label: type === TicketTypes.NORMAL ? "ATENDIMENTO GERAL" : type,
  }));

  const buttonsToRender = subOptions ? subButtons : mainButtons;

  return (
    <div className="w-full max-w-4xl md:max-w-6xl">
      <Header unidade={unidadeSelecionada} />
      
      <div 
        className="p-4 md:p-8 rounded-b-2xl shadow-lg border"
        style={{ 
          backgroundColor: COLOR_PALETTE.background,
          borderColor: COLOR_PALETTE.primary 
        }}
      >
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-center mb-6 md:mb-10"
        >
          <h2 
            className="text-2xl md:text-3xl font-bold mb-2"
            style={{ color: COLOR_PALETTE.text }}
          >
            Selecione o tipo de atendimento
          </h2>
          <p style={{ color: COLOR_PALETTE.gray }} className="text-sm md:text-base">
            Escolha abaixo a opção que melhor atende sua necessidade
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-6 md:mb-8">
          <AnimatePresence mode="wait">
            {buttonsToRender?.map(({ type, label }) => (
              <motion.div
                key={type}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.3 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="flex"
              >
                <Button
                  onClick={() => handleTicketOption(type as TicketTypes)}
                  disabled={isLoading}
                  className="flex flex-col items-center justify-center p-4 md:p-6 h-40 md:h-48 w-full text-lg md:text-xl font-bold text-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300"
                  style={{ background: getButtonColor(type as TicketTypes) }}
                >
                  <motion.div
                    initial={{ scale: 0.8 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 300 }}
                  >
                    {getIcon(type as TicketTypes)}
                  </motion.div>
                  <span className="mt-3 md:mt-4 text-center leading-tight text-sm md:text-base">{label}</span>
                </Button>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {subOptions && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex justify-center"
          >
            <Button 
              onClick={() => setSubOptions(null)} 
              className="px-6 py-3 rounded-xl border"
              style={{ 
                backgroundColor: COLOR_PALETTE.primary,
                color: 'white',
                borderColor: COLOR_PALETTE.accent
              }}
            >
              Voltar
            </Button>
          </motion.div>
        )}

        <AnimatePresence>
          {feedback && (
            <FullScreenFeedback 
              type={feedback.type} 
              message={feedback.message}
              ticketNumber={feedback.ticketNumber}
              onClose={() => setFeedback(null)} 
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

// Página Principal (Home) - Nova paleta
export default function Home() {
  const [unidadeSelecionada, setUnidadeSelecionada] = useState<string | null>(null);

  const handleConnect = (unidade: string) => {
    setUnidadeSelecionada(unidade);
  };

  return (
    <div 
      className="min-h-screen flex flex-col items-center justify-center p-4 md:p-8"
      style={{ 
        background: `linear-gradient(135deg, ${COLOR_PALETTE.background} 0%, #e8f4e3 100%)` 
      }}
    >
      <AnimatePresence mode="wait">
        {unidadeSelecionada ? (
          <motion.div
            key="ticket-screen"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.3 }}
            className="w-full"
          >
            <TicketOptionsScreen unidadeSelecionada={unidadeSelecionada} />
          </motion.div>
        ) : (
          <motion.div
            key="initial-screen"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.3 }}
            className="w-full flex justify-center"
          >
            <InitialScreen onConnect={handleConnect} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Footer */}
      <motion.footer 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="mt-6 md:mt-8 text-center text-xs md:text-sm"
        style={{ color: COLOR_PALETTE.gray }}
      >
        <p>Centro Médico de Saúde Ocupacional</p>
        <p>© {new Date().getFullYear()} - Todos os direitos reservados</p>
      </motion.footer>
    </div>
  );
}