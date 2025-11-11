"use client";

import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import io, { Socket } from "socket.io-client";
import { AnimatePresence, motion } from "framer-motion";
import { Clock, DoorOpen, History, Info, Loader2, Monitor, UsersRound, Volume2, VolumeX } from "lucide-react";
import { EventType, onEvent } from "@/lib/websocket/events/events";
import { WebsocketType } from "@/lib/websocket/enums/websocket.enum";
import { PainelCall } from "@/lib/painel/interfaces/paniel.interface";
import { Ticket } from "@/lib/ticket/ticket";
import { NEST_URL, NEXT_WS_URL, SERVICES_KEY, UNIDADES_ATENDIMENTO } from "@/config/constants";

// Paleta de cores
const COLOR_PALETTE = {
  primary: "#44735e",
  secondary: "#b8d864",
  light: "#f8fcf9",
  white: "#ffffff",
  lightGray: "#f0f5f2",
  border: "#e1e9e4",
  text: "#2a4a3a",
  textLight: "#6b7f76",
  accent: "#5a8c7a",
  dark: "#1a2a1f",
};

// Configurações
const IDLE_CONFIG = {
  tempoInatividadeMinutos: 1,
  duracaoIdleSegundos: 15,
};

const DIVULGACAO_CONFIG = {
  tempoExibicaoItem: 8,
  items: [
    {
      id: 1,
      tipo: "imagem",
      src: "/images/dramed.png",
      titulo: "Novembro Azul",
      subtitulo: "Mês de combate ao câncer de próstata",
      conteudo: [
        "Cuide da sua saúde, a prevenção é o melhor caminho contra o câncer de próstata.",
      ]
    },
    {
      id: 2,
      tipo: "imagem",
      src: "/images/rioclaro.jpg",
      titulo: "Rio Claro",
      subtitulo: "Matriz",
      conteudo: [
        "Atuando há mais de 20 anos",
        "Infraestrutura completa",
        "Gestão SST completa",
      ]
    },
    {
      id: 3,
      tipo: "imagem",
      src: "/images/cordeirópolis.jpg",
      titulo: "Cordeirópolis",
      subtitulo: "Filial",
      conteudo: [
        "Exames radiológicos",
        "Atendimento Rio Claro e região",
        "Ultrassonografia",
      ]
    },
    {
      id: 4,
      tipo: "imagem",
      src: "/images/araras.jpg",
      titulo: "Araras",
      subtitulo: "Filial",
      conteudo: [
        "Exames Ocupacionais",
        "Excelente localização",
      ]
    }
  ]
};

interface PainelSocket {
  type: WebsocketType.PAINEL;
  unidade: string | null;
}

let socket: Socket;

// Configurações de timing - confortável para clínica de saúde ocupacional
const DELAY_ENTRE_CHAMADAS_MS = 5500; // 3 segundos entre chamadas diferentes (tempo para pessoa processar e se deslocar)
const DELAY_ENTRE_CICLOS_MS = 9000; // 8 segundos antes de recomeçar o ciclo (tempo para deslocamento)

// Backgrounds por tipo de exame
const examesBackground: Record<string, string> = {
  "RAIO X": `linear-gradient(135deg, ${COLOR_PALETTE.primary}15 0%, ${COLOR_PALETTE.accent}25 100%)`,
  "ATENDIMENTO": `linear-gradient(135deg, ${COLOR_PALETTE.accent}15 0%, ${COLOR_PALETTE.secondary}25 100%)`,
  "ODONTO": `linear-gradient(135deg, ${COLOR_PALETTE.dark}15 0%, ${COLOR_PALETTE.primary}25 100%)`,
  "ACUIDADE": `linear-gradient(135deg, #C6B10015 0%, #d4c23025 100%)`,
  "AUDIOMETRIA": `linear-gradient(135deg, #6B950B15 0%, #8bb82a25 100%)`,
  "CLINICO": `linear-gradient(135deg, #BC311215 0%, #d45a3d25 100%)`,
  "ECG": `linear-gradient(135deg, #4E211E15 0%, #6b3a3425 100%)`,
  "EEG": `linear-gradient(135deg, #17843A15 0%, #2da85225 100%)`,
  "ESPIROMETRIA": `linear-gradient(135deg, #835cb915 0%, #9a7ac925 100%)`,
  "ATENDIMENTO2": `linear-gradient(135deg, ${COLOR_PALETTE.primary}15 0%, ${COLOR_PALETTE.secondary}25 100%)`,
};

// Cores por tipo de exame
const examesColors: Record<string, { primary: string; secondary: string; text: string }> = {
  "Acuidade Visual": { primary: "#C6B100", secondary: "#C6B10020", text: COLOR_PALETTE.dark },
  "Audiometria": { primary: "#6B950B", secondary: "#6B950B20", text: COLOR_PALETTE.white },
  "Exame Clínico": { primary: "#BC3112", secondary: "#BC311220", text: COLOR_PALETTE.white },
  "Dinamometria": { primary: "#4B90BF", secondary: "#4B90BF20", text: COLOR_PALETTE.white },
  "ECG": { primary: "#4E211E", secondary: "#4E211E20", text: COLOR_PALETTE.white },
  "EEG": { primary: "#17843A", secondary: "#17843A20", text: COLOR_PALETTE.white },
  "Espirometria": { primary: "#835cb9", secondary: "#835cb920", text: COLOR_PALETTE.white },
  "ATENDIMENTO": { primary: "#09008a", secondary: "#09008a20", text: COLOR_PALETTE.white },
  "Laboratório": { primary: "#BB6101", secondary: "#BB610120", text: COLOR_PALETTE.white },
  "Psicossocial": { primary: "#310966", secondary: "#31096620", text: COLOR_PALETTE.white },
  "Raio-X": { primary: "#8F8E92", secondary: "#8F8E9220", text: COLOR_PALETTE.dark },
  "Triagem": { primary: "#0f97ff", secondary: "#0f97ff20", text: COLOR_PALETTE.white },
  "Ultrassom": { primary: "#2a9d8f", secondary: "#2a9d8f20", text: COLOR_PALETTE.white },
};

// Componente CounterCard otimizado com memo
const CounterCard = ({ label, value }: { label: string; value: number }) => (
  <div 
    className="rounded-2xl px-4 py-3 shadow-sm border min-w-[120px] backdrop-blur-sm"
    style={{
      backgroundColor: COLOR_PALETTE.white,
      borderColor: COLOR_PALETTE.border,
      boxShadow: '0 2px 12px rgba(68, 115, 94, 0.08)',
    }}
  >
    <div 
      className="text-3xl font-black leading-none tracking-tight text-center"
      style={{ color: COLOR_PALETTE.primary }}
    >
      {value}
    </div>
    <div 
      className="mt-1 text-xs uppercase tracking-widest font-semibold text-center"
      style={{ color: COLOR_PALETTE.textLight }}
    >
      {label}
    </div>
  </div>
);

// Componente PreviousCallCard otimizado
const PreviousCallCard = ({ c }: { c: PainelCall }) => {
  const bgColor = useMemo(() => 
    examesBackground[c.exame ?? "ATENDIMENTO"] || examesBackground["BALCAO"],
    [c.exame]
  );
  
  const colors = useMemo(() => 
    examesColors[c.exame ?? "ATENDIMENTO"] || examesColors["RAIO X"],
    [c.exame]
  );
  
  return (
    <motion.div
      whileHover={{ y: -2, scale: 1.02 }}
      className="rounded-xl p-4 flex-1 min-w-0 shadow-sm border backdrop-blur-sm"
      style={{
        background: bgColor,
        borderColor: COLOR_PALETTE.border,
        color: COLOR_PALETTE.text,
        boxShadow: '0 2px 8px rgba(68, 115, 94, 0.05)',
      }}
    >
      <div 
        className="text-2xl font-bold truncate" 
        style={{ color: colors.primary }}
      >
        {c.name != "" ? c.name : c.ticket}
      </div>
      <div 
        className="mt-2 inline-flex items-center gap-2 font-bold text-xl rounded-full px-3 py-1"
        style={{ 
          backgroundColor: colors.primary, 
          color: colors.text 
        }}
      >
        <span className="truncate">{c.sala}</span>
        <span className="w-2 h-2 rounded-full bg-current animate-pulse" />
        {c.exame ?? "ATENDIMENTO"}
      </div>
    </motion.div>
  );
};

// Componente IdleScreen
interface IdleProps {
  unidadeSelecionada: string
}

const IdleScreen = ({ unidadeSelecionada }: IdleProps) => {
  const [itemAtual, setItemAtual] = useState(0);
  const timeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    const rotacionarItens = () => {
      setItemAtual((prev) => 
        prev === DIVULGACAO_CONFIG.items.length - 1 ? 0 : prev + 1
      );
    };

    timeoutRef.current = setTimeout(
      rotacionarItens, 
      DIVULGACAO_CONFIG.tempoExibicaoItem * 1000
    );

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [itemAtual]);

  const item = DIVULGACAO_CONFIG.items[itemAtual];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 1 }}
      className="fixed inset-0 z-50 flex flex-col lg:flex-row bg-white overflow-hidden"
    >
      <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-10 flex gap-2">
        {DIVULGACAO_CONFIG.items.map((_, index) => (
          <div
            key={index}
            className={`w-3 h-3 rounded-full transition-all duration-300 ${
              index === itemAtual 
                ? 'bg-white scale-125' 
                : 'bg-white/50'
            }`}
          />
        ))}
      </div>

      <div className="flex-1 flex items-center justify-center p-4 lg:p-8 bg-gradient-to-br from-gray-50 to-gray-100">
        <motion.div
          key={item.id}
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.8 }}
          className="w-full h-full max-w-4xl max-h-4xl rounded-3xl overflow-hidden shadow-2xl bg-white"
        >
          {item.tipo === "video" ? (
            <video
              src={item.src}
              autoPlay={true}
              muted
              loop
              className="w-full h-full object-cover"
            />
          ) : (
            <img 
              src={item.src}
              alt={item.titulo}
              className="w-full h-full object-cover"
            />
          )}
        </motion.div>
      </div>

      <div className="flex-1 flex items-center justify-center p-6 lg:p-12 bg-gradient-to-br from-green-600 to-green-950">
        <motion.div
          key={`content-${item.id}`}
          initial={{ x: 50, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.8 }}
          className="text-white max-w-2xl w-full"
        >
          <motion.h1
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="text-4xl lg:text-6xl font-black mb-4 leading-tight"
          >
            {item.titulo}
          </motion.h1>

          {item.subtitulo && (
            <motion.p
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.6 }}
              className="text-xl lg:text-2xl font-light mb-8 text-blue-200"
            >
              {item.subtitulo}
            </motion.p>
          )}

          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.6 }}
            className="space-y-4"
          >
            {Array.isArray(item.conteudo) ? (
              <ul className="space-y-3">
                {item.conteudo.map((linha, index) => (
                  <motion.li
                    key={index}
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.8 + index * 0.1, duration: 0.5 }}
                    className="flex items-start gap-3 text-lg"
                  >
                    <div className="w-2 h-2 bg-orange-400 rounded-full mt-3 flex-shrink-0" />
                    <span className="leading-relaxed text-xl">{linha}</span>
                  </motion.li>
                ))}
              </ul>
            ) : (
              <motion.p
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.8, duration: 0.5 }}
                className="text-xl leading-relaxed"
              >
                {item.conteudo}
              </motion.p>
            )}
          </motion.div>

          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 1.2, duration: 0.5 }}
            className="mt-8 pt-6 border-t border-white/20"
          >
            <div className="flex items-center justify-between text-sm text-white/70">
              <span>{new Date().getFullYear()} • CMSO</span>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </motion.div>
  );
};

// Modal de ativação de áudio
const AudioActivationModal = ({ onActivate }: { onActivate: () => void }) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
  >
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className="bg-white rounded-2xl p-8 max-w-md mx-4 shadow-2xl"
      style={{
        borderColor: COLOR_PALETTE.border,
      }}
    >
      <div className="text-center">
        <div 
          className="w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center"
          style={{ 
            backgroundColor: COLOR_PALETTE.primary,
            backgroundImage: 'linear-gradient(135deg, #44735e 0%, #5a8c7a 100%)'
          }}
        >
          <Volume2 className="text-white" size={24} />
        </div>
        
        <h2 
          className="text-2xl font-bold mb-4"
          style={{ color: COLOR_PALETTE.primary }}
        >
          Ativação de Áudio
        </h2>
        
        <p 
          className="text-gray-600 mb-6"
          style={{ color: COLOR_PALETTE.textLight }}
        >
          Para uma melhor experiência, ative o áudio do painel. Clique no botão abaixo para liberar a reprodução de sons.
        </p>
        
        <button
          id="activateButton"
          onClick={onActivate}
          className="w-full rounded-xl px-6 py-4 font-bold text-white transition-all hover:shadow-lg transform hover:scale-[1.02]"
          style={{ 
            background: `linear-gradient(135deg, ${COLOR_PALETTE.primary} 0%, ${COLOR_PALETTE.accent} 100%)`,
            boxShadow: '0 4px 14px rgba(68, 115, 94, 0.3)',
          }}
        >
          <Volume2 className="inline mr-2" size={20} /> ATIVAR ÁUDIO
        </button>
        
        <button
          onClick={onActivate}
          className="w-full mt-3 text-sm text-gray-500 hover:text-gray-700 transition-colors"
          style={{ color: COLOR_PALETTE.textLight }}
        >
          Pular e continuar sem áudio
        </button>
      </div>
    </motion.div>
  </motion.div>
);

export default function PainelPage() {
  const [chamadaAtual, setChamadaAtual] = useState<PainelCall>();
  const [anteriores, setAnteriores] = useState<PainelCall[]>([]);
  const [hora, setHora] = useState<string>("");
  const [dataCompleta, setDataCompleta] = useState<string>("");

  const [serialInput, setSerialInput] = useState("");
  const [unidadeSelecionada, setUnidadeSelecionada] = useState<string>("");
  const [isLiberado, setIsLiberado] = useState(false);
  const [audioHabilitado, setAudioHabilitado] = useState(false);
  const [showAudioModal, setShowAudioModal] = useState(false);

  // Pré-carregamento de áudios
  const audioPoolRef = useRef<Map<string, HTMLAudioElement>>(new Map());

  const [isIdle, setIsIdle] = useState(false);
  const [showPainel, setShowPainel] = useState(true);

  const [ativas, setAtivas] = useState<PainelCall[]>([]);
  const [espera, setEspera] = useState<PainelCall[]>([]);

  const ativasRef = useRef<PainelCall[]>([]);
  const esperaRef = useRef<PainelCall[]>([]);
  const loopRodando = useRef<boolean>(false);
  const cancelLoop = useRef<boolean>(false);

  const ultimaChamadaRef = useRef<number>(Date.now());
  const idleTimeoutRef = useRef<NodeJS.Timeout>();
  const returnTimeoutRef = useRef<NodeJS.Timeout>();

  const containerRef = useRef<HTMLDivElement>(null);

  // Função para obter data/hora no fuso horário de Brasília (UTC-3)
  const getDataHoraBrasilia = useCallback(() => {
    const now = new Date();
    
    // Opções para horário de Brasília
    const horaOptions: Intl.DateTimeFormatOptions = {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      timeZone: "America/Sao_Paulo",
      hour12: false
    };
    
    const dataOptions: Intl.DateTimeFormatOptions = {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      timeZone: "America/Sao_Paulo"
    };
    
    const horaFormatada = now.toLocaleTimeString("pt-BR", horaOptions);
    const dataFormatada = now.toLocaleDateString("pt-BR", dataOptions);
    
    return { horaFormatada, dataFormatada };
  }, []);

  // Pré-carregar áudio de chamada na inicialização
  useEffect(() => {
    // Removido pré-carregamento do som de atenção
    return () => {
      // Limpeza ao desmontar
      audioPoolRef.current.forEach(audio => {
        audio.pause();
        audio.src = '';
      });
      audioPoolRef.current.clear();
    };
  }, [isLiberado]);

  // Função otimizada para pré-carregar áudio
  const preloadAudio = useCallback((url: string): HTMLAudioElement => {
    if (audioPoolRef.current.has(url)) {
      return audioPoolRef.current.get(url)!;
    }
    
    const audio = new Audio(`${NEST_URL}${url}`);
    audio.preload = "auto";
    audio.load();
    audioPoolRef.current.set(url, audio);
    
    return audio;
  }, []);

  const ativarAudio = async () => {
    try {
      setShowAudioModal(true);
    } catch (error) {
      console.log('Falha na ativação automática de áudio:', error);
    }
  };

  useEffect(() => {
    const enterFullscreen = () => {
      if (containerRef.current && !document.fullscreenElement) {
        containerRef.current.requestFullscreen().catch(err => {
          console.log('Erro ao entrar em tela cheia:', err);
        });
      }
    };

    if (isLiberado) {
      setTimeout(enterFullscreen, 1500);
      setTimeout(ativarAudio, 1000);
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F11') {
        e.preventDefault();
        enterFullscreen();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isLiberado]);

  // Sistema Idle
  const iniciarIdle = useCallback(() => {
    if (isIdle) return;
    setShowPainel(false);
    
    setTimeout(() => {
      setIsIdle(true);
    }, 800);

    returnTimeoutRef.current = setTimeout(() => {
      retornarAoPainel();
    }, IDLE_CONFIG.duracaoIdleSegundos * 1000);
  }, [isIdle]);

  const retornarAoPainel = useCallback(() => {
    if (!isIdle) return;

    if (returnTimeoutRef.current) {
      clearTimeout(returnTimeoutRef.current);
    }

    setIsIdle(false);
    
    setTimeout(() => {
      setShowPainel(true);
      resetarIdleTimer();
    }, 800);
  }, [isIdle]);

  const resetarIdleTimer = useCallback(() => {
    ultimaChamadaRef.current = Date.now();
    
    if (idleTimeoutRef.current) {
      clearTimeout(idleTimeoutRef.current);
    }

    if (isLiberado) {
      idleTimeoutRef.current = setTimeout(() => {
        const tempoInativo = Date.now() - ultimaChamadaRef.current;
        const tempoMinimo = IDLE_CONFIG.tempoInatividadeMinutos * 60 * 1000;
        
        if (tempoInativo >= tempoMinimo && !ativas.length && !espera.length) {
          iniciarIdle();
        } else {
          resetarIdleTimer();
        }
      }, 60000);
    }
  }, [isLiberado, ativas.length, espera.length, iniciarIdle]);

  const atualizarUltimaChamada = useCallback(() => {
    ultimaChamadaRef.current = Date.now();
    if (isIdle) {
      retornarAoPainel();
    } else {
      resetarIdleTimer();
    }
  }, [isIdle, retornarAoPainel, resetarIdleTimer]);

  const setAtivasSync = useCallback((updater: (prev: PainelCall[]) => PainelCall[]) => {
    setAtivas((prev) => {
      const next = updater(prev);
      ativasRef.current = next;
      return next;
    });
  }, []);
  
  const setEsperaSync = useCallback((updater: (prev: PainelCall[]) => PainelCall[]) => {
    setEspera((prev) => {
      const next = updater(prev);
      esperaRef.current = next;
      return next;
    });
  }, []);

  function validarAcesso() {
    if (serialInput.trim() === SERVICES_KEY && unidadeSelecionada) {
      setIsLiberado(true);
      localStorage.setItem("painel_validate", unidadeSelecionada);
    } else {
      alert("Chave inválida ou unidade não selecionada!");
    }
  }
  
  useEffect(() => {
    const unidadeSalva = localStorage.getItem("painel_validate");
    if (unidadeSalva) {
      setUnidadeSelecionada(unidadeSalva);
      setIsLiberado(true);
    }
  }, []);

  // Atualizar data/hora com fuso horário de Brasília
  useEffect(() => {
    const atualizar = () => {
      const { horaFormatada, dataFormatada } = getDataHoraBrasilia();
      setHora(horaFormatada);
      setDataCompleta(dataFormatada);
    };
    
    atualizar();
    const t = setInterval(atualizar, 1000);
    return () => clearInterval(t);
  }, [getDataHoraBrasilia]);

  // Função otimizada para tocar áudio - SEM toque de atenção, apenas o nome
  const tocarAudioDaChamada = useCallback((call: PainelCall): Promise<void> => 
    new Promise<void>((resolve) => {
      // Atualizar UI imediatamente
      setChamadaAtual(call);
      setAnteriores((prev) => [call, ...prev].slice(0, 3));
      atualizarUltimaChamada();

      if (!audioHabilitado) {
        // Tempo mínimo de exibição quando áudio está desabilitado
        setTimeout(() => resolve(), 5000);
        return;
      }

      const tocarAudio = async () => {
        try {
          // Criar novo áudio para cada chamada (evita conflitos)
          const audioChamada = new Audio(`${NEST_URL}${call.audio}`);
          audioChamada.preload = "auto";
          
          // Aguardar carregamento do áudio
          await new Promise<void>((res, rej) => {
            audioChamada.onloadeddata = () => res();
            audioChamada.onerror = () => rej(new Error('Erro ao carregar áudio'));
            
            // Fallback se não carregar
            setTimeout(() => rej(new Error('Timeout ao carregar áudio')), 5000);
          });
          
          // Tocar o áudio
          await audioChamada.play().catch((error) => {
            console.error('Erro ao tocar áudio:', error);
          });
          
          // Aguardar o áudio terminar completamente
          await new Promise<void>((res) => {
            const onEndHandler = () => {
              audioChamada.removeEventListener('ended', onEndHandler);
              res();
            };
            
            audioChamada.addEventListener('ended', onEndHandler);
            
            // Fallback baseado na duração do áudio + margem de segurança
            const duracao = audioChamada.duration || 5;
            setTimeout(() => res(), (duracao + 1) * 1000);
          });
          
          // Pausa adicional após o áudio terminar (tempo para pessoa processar e reagir)
          await new Promise(res => setTimeout(res, 2000));
          
          resolve();
          
        } catch (error) {
          console.error('Erro ao tocar áudio da chamada:', error);
          // Mesmo com erro, aguardar um tempo mínimo antes de continuar
          setTimeout(() => resolve(), 5000);
        }
      };
      
      tocarAudio();
    }), [audioHabilitado, atualizarUltimaChamada]);

  const wait = (ms: number) => new Promise((res) => setTimeout(res, ms));

  // Loop principal otimizado
  const iniciarLoop = useCallback(async () => {
    if (loopRodando.current) return;
    loopRodando.current = true;
    cancelLoop.current = false;

    while (!cancelLoop.current) {
      const lista = ativasRef.current;
      if (lista.length > 0) {
        for (const call of [...lista]) {
          if (!ativasRef.current.some((c) => c.id === call.id)) continue;
          await tocarAudioDaChamada(call);
          await wait(DELAY_ENTRE_CHAMADAS_MS);
          if (cancelLoop.current) break;
        }
        await wait(DELAY_ENTRE_CICLOS_MS);
      } else {
        await wait(2000);
      }
    }

    loopRodando.current = false;
  }, [tocarAudioDaChamada]);

  useEffect(() => {
    if (ativas.length > 0) iniciarLoop();
  }, [ativas, iniciarLoop]);

  // Socket otimizado
  useEffect(() => {
    if (!isLiberado) return;

    const painel: PainelSocket = { type: WebsocketType.PAINEL, unidade: unidadeSelecionada };
    socket = io(NEXT_WS_URL || "http://localhost:3333", {
      auth: painel,
      transports: ["websocket"],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    });

    onEvent<EventType.CONNECTION_REQUEST>(socket, EventType.CONNECTION_REQUEST, (msg) => {
      console.log("Conectado ao WebSocket:", msg);
      resetarIdleTimer();
    });

    onEvent<EventType.PAINEL_CALL>(socket, EventType.PAINEL_CALL, (call: PainelCall) => {
      const jaExiste = ativasRef.current.some((c) => c.id === call.id) || esperaRef.current.some((c) => c.id === call.id);
      if (jaExiste) return;
      
      // 🚀 PRÉ-CARREGAR ÁUDIO IMEDIATAMENTE quando recebe a chamada
      if (call.audio && audioHabilitado) {
        const audioPreload = new Audio(`${NEST_URL}${call.audio}`);
        audioPreload.preload = "auto";
        audioPreload.load(); // Força o carregamento imediato
        audioPoolRef.current.set(call.id.toString(), audioPreload);
        
        console.log(`✅ Áudio pré-carregado para chamada ${call.id}`);
      }
      
      if (ativasRef.current.length < 3) {
        setAtivasSync((prev) => [...prev, call]);
      } else {
        setEsperaSync((prev) => [...prev, call]);
      }
    });

    onEvent<EventType.TICKET_UPDATED>(socket, EventType.TICKET_UPDATED, (ticket: Ticket) => {
      let liberouVaga = false;
      setAtivasSync((prev) => {
        const next = prev.filter((c) => c.id !== ticket.id);
        liberouVaga = next.length < prev.length;
        return next;
      });
      setEsperaSync((prev) => prev.filter((c) => c.id !== ticket.id));
      
      if (liberouVaga && esperaRef.current.length > 0) {
        const [proxima, ...resto] = esperaRef.current;
        setEsperaSync(() => resto);
        setAtivasSync((prev) => [...prev, proxima]);
        
        // Pré-carregar áudio da próxima chamada
        if (proxima.audio) {
          preloadAudio(proxima.audio);
        }
      }
    });

    return () => {
      try {
        socket?.disconnect();
        cancelLoop.current = true;
        loopRodando.current = false;
      } catch {}
      cancelLoop.current = true;
      
      if (idleTimeoutRef.current) clearTimeout(idleTimeoutRef.current);
      if (returnTimeoutRef.current) clearTimeout(returnTimeoutRef.current);
      
      // Limpar pool de áudios
      audioPoolRef.current.forEach(audio => {
        audio.pause();
        audio.src = '';
      });
      audioPoolRef.current.clear();
    };
  }, [isLiberado, unidadeSelecionada, resetarIdleTimer, setAtivasSync, setEsperaSync, preloadAudio]);

  // Otimizar cores com useMemo
  const currentExamColors = useMemo(() => 
    chamadaAtual ? 
      examesColors[chamadaAtual.exame ?? "ATENDIMENTO"] : 
      { primary: COLOR_PALETTE.primary, secondary: `${COLOR_PALETTE.primary}20`, text: COLOR_PALETTE.white },
    [chamadaAtual]
  );

  const bgExam = useMemo(() => 
    chamadaAtual ? 
      examesBackground[chamadaAtual.exame] || examesBackground["ATENDIMENTO"] : 
      `linear-gradient(135deg, ${COLOR_PALETTE.primary}08 0%, ${COLOR_PALETTE.accent}08 100%)`,
    [chamadaAtual]
  );

  if (!isLiberado) {
    return (
      <div 
        ref={containerRef}
        className="min-h-screen w-full flex items-center justify-center p-4"
        style={{ 
          backgroundColor: COLOR_PALETTE.light,
          backgroundImage: 'linear-gradient(135deg, #f8fcf9 0%, #f0f5f2 100%)'
        }}
      >
        <div 
          className="w-full max-w-md rounded-2xl p-8 shadow-lg border"
          style={{ 
            backgroundColor: COLOR_PALETTE.white,
            borderColor: COLOR_PALETTE.border,
            boxShadow: '0 8px 32px rgba(68, 115, 94, 0.1)',
          }}
        >
          <div className="space-y-6">
            <div className="text-center">
              <div 
                className="w-20 h-20 mx-auto mb-4 rounded-2xl flex items-center justify-center shadow-sm"
                style={{ 
                  backgroundColor: COLOR_PALETTE.primary,
                  backgroundImage: 'linear-gradient(135deg, #44735e 0%, #5a8c7a 100%)'
                }}
              >
                <Monitor className="text-white" size={32} />
              </div>
              <h1 
                className="text-2xl font-bold"
                style={{ color: COLOR_PALETTE.primary }}
              >
                Painel de Chamadas
              </h1>
              <p style={{ color: COLOR_PALETTE.textLight }} className="mt-2">
                Acesso restrito ao pessoal autorizado
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label style={{ color: COLOR_PALETTE.text }} className="text-sm font-semibold">Chave de Acesso</label>
                <input
                  type="password"
                  value={serialInput}
                  onChange={(e) => setSerialInput(e.target.value)}
                  className="w-full rounded-xl border px-4 py-3 focus:outline-none focus:ring-2 focus:ring-offset-1 mt-1 text-lg transition-all"
                  placeholder="Digite a chave..."
                  autoFocus
                  style={{ 
                    borderColor: COLOR_PALETTE.border,
                    color: COLOR_PALETTE.text,
                    backgroundColor: COLOR_PALETTE.lightGray,
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = COLOR_PALETTE.primary;
                    e.target.style.boxShadow = `0 0 0 3px ${COLOR_PALETTE.primary}20`;
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = COLOR_PALETTE.border;
                    e.target.style.boxShadow = 'none';
                  }}
                />
              </div>

              <div>
                <label style={{ color: COLOR_PALETTE.text }} className="text-sm font-semibold">Unidade</label>
                <select
                  onChange={(e) => setUnidadeSelecionada(e.target.value)}
                  className="w-full rounded-xl border px-4 py-3 focus:outline-none focus:ring-2 focus:ring-offset-1 mt-1 transition-all"
                  defaultValue=""
                  style={{ 
                    borderColor: COLOR_PALETTE.border,
                    color: COLOR_PALETTE.text,
                    backgroundColor: COLOR_PALETTE.lightGray,
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = COLOR_PALETTE.primary;
                    e.target.style.boxShadow = `0 0 0 3px ${COLOR_PALETTE.primary}20`;
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = COLOR_PALETTE.border;
                    e.target.style.boxShadow = 'none';
                  }}
                >
                  <option value="" disabled>Selecione a unidade</option>
                  {UNIDADES_ATENDIMENTO.map((u) => (
                    <option key={u} value={u}>{u}</option>
                  ))}
                </select>
              </div>

              <button
                onClick={validarAcesso}
                className="w-full rounded-xl px-6 py-4 font-bold text-white mt-4 transition-all hover:shadow-lg transform hover:scale-[1.02]"
                style={{ 
                  background: `linear-gradient(135deg, ${COLOR_PALETTE.primary} 0%, ${COLOR_PALETTE.accent} 100%)`,
                  boxShadow: '0 4px 14px rgba(68, 115, 94, 0.3)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow = '0 6px 20px rgba(68, 115, 94, 0.4)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = '0 4px 14px rgba(68, 115, 94, 0.3)';
                }}
              >
                <Monitor className="inline mr-2" size={20} /> ACESSAR PAINEL
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div 
      ref={containerRef}
      className="min-h-screen w-full flex flex-col overflow-hidden relative"
      style={{ 
        backgroundColor: COLOR_PALETTE.light,
        backgroundImage: 'linear-gradient(135deg, #f8fcf9 0%, #f0f5f2 100%)'
      }}
    >
      <AnimatePresence>
        {showAudioModal && (
          <AudioActivationModal onActivate={() => {
            setAudioHabilitado(true);
            setShowAudioModal(false);
          }} />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isIdle && <IdleScreen unidadeSelecionada={unidadeSelecionada} />}
      </AnimatePresence>

      <AnimatePresence>
        {showPainel && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.05 }}
            transition={{ duration: 0.8 }}
            className="flex-1 flex flex-col"
          >
            <header 
              className="w-full border-b py-2 px-4 lg:px-6 backdrop-blur-sm"
              style={{ 
                backgroundColor: COLOR_PALETTE.white,
                borderColor: COLOR_PALETTE.border,
                boxShadow: '0 1px 3px rgba(68, 115, 94, 0.05)',
              }}
            >
              <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 items-center gap-4">
                <div className="flex items-center gap-4 justify-center md:justify-start">
                  <div 
                    className="rounded-2xl p-3 shadow-sm border"
                    style={{
                      backgroundColor: COLOR_PALETTE.primary,
                      borderColor: COLOR_PALETTE.accent,
                      backgroundImage: 'linear-gradient(135deg, #44735e 0%, #5a8c7a 100%)'
                    }}
                  >
                    <Monitor className="text-white" size={28} />
                  </div>
                  <div>
                    <div style={{ color: COLOR_PALETTE.textLight }} className="text-sm uppercase tracking-wide font-semibold">Unidade</div>
                    <div 
                      className="text-xl font-bold"
                      style={{ color: COLOR_PALETTE.text }}
                    >
                      {unidadeSelecionada}
                    </div>
                  </div>
                </div>

                <div className="text-center order-first md:order-none">
                  <div 
                    className="text-lg font-semibold"
                    style={{ color: COLOR_PALETTE.text }}
                  >
                    {dataCompleta}
                  </div>
                  <div 
                    className="text-3xl font-black tabular-nums flex items-center justify-center gap-3 mt-1"
                    style={{ color: COLOR_PALETTE.primary }}
                  >
                    <Clock size={24} /> {hora}
                  </div>
                </div>

                <div className="flex justify-center md:justify-end gap-4">
                  <CounterCard label="Chamando" value={ativas.length} />
                  <CounterCard label="Aguardando" value={espera.length} />
                </div>
              </div>
            </header>

            <main className="flex-1 flex flex-col px-2 sm:px-4 py-4 max-w-7xl mx-auto w-full">
              <section className="flex-1 flex items-center justify-center mb-4 sm:mb-6">
                <AnimatePresence mode="wait">
                  {chamadaAtual ? (
                    <motion.div
                      key={chamadaAtual.id}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      transition={{ duration: 0.3 }}
                      className="w-full max-w-6xl rounded-2xl p-6 lg:p-8 xl:p-12 shadow-lg border text-center backdrop-blur-sm mx-2"
                      style={{
                        background: bgExam,
                        borderColor: COLOR_PALETTE.border,
                        color: COLOR_PALETTE.text,
                        boxShadow: '0 8px 32px rgba(68, 115, 94, 0.1)',
                      }}
                    >
                      <motion.div
                        initial={{ scale: 0.95, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: 0.05 }}
                        className="mb-6 lg:mb-8"
                      >
                        <div 
                          className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-black mb-4 uppercase tracking-wider"
                          style={{ color: currentExamColors.primary ?? "darkblue" }}
                        >
                          {chamadaAtual.name != "" ? chamadaAtual.name : chamadaAtual.ticket}
                        </div>
                      </motion.div>

                      <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-1 mb-2 lg:mb-4">
                        <motion.div
                          initial={{ y: 10, opacity: 0 }}
                          animate={{ y: 0, opacity: 1 }}
                          transition={{ delay: 0.1 }}
                          className="flex items-center gap-3 text-2xl sm:text-3xl lg:text-4xl xl:text-6xl font-black px-4 sm:px-6 py-2 sm:py-3 rounded-full border"
                          style={{
                            backgroundColor: currentExamColors.primary,
                            color: currentExamColors.text,
                            borderColor: currentExamColors.primary,
                          }}
                        >
                          <span>{chamadaAtual.sala}</span>
                        </motion.div>

                        <motion.div
                          initial={{ y: 10, opacity: 0 }}
                          animate={{ y: 0, opacity: 1 }}
                          transition={{ delay: 0.15 }}
                          className="text-2xl sm:text-3xl lg:text-4xl xl:text-6xl font-black px-4 sm:px-6 py-2 rounded-full border-2"
                          style={{ 
                            borderColor: currentExamColors.primary,
                            color: currentExamColors.primary,
                            backgroundColor: currentExamColors.secondary,
                          }}
                        >
                          <span>{chamadaAtual.exame ?? "ATENDIMENTO"}</span>
                        </motion.div>
                      </div>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="aguardando"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-center mx-4"
                    >
                      <Loader2 
                        className="animate-spin mx-auto mb-4 sm:mb-6" 
                        size={48} 
                        style={{ color: COLOR_PALETTE.primary }}
                      />
                      <h2 
                        className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-3 sm:mb-4"
                        style={{ color: COLOR_PALETTE.text }}
                      >
                        AGUARDANDO CHAMADAS
                      </h2>
                    </motion.div>
                  )}
                </AnimatePresence>
              </section>

              <section className="mt-auto px-2 w-full">
                <div 
                  className="flex items-center gap-3 text-lg sm:text-xl font-bold mb-3 sm:mb-4"
                  style={{ color: COLOR_PALETTE.text }}
                >
                  <History size={18} style={{ color: COLOR_PALETTE.primary }} />
                  <span>ÚLTIMAS CHAMADAS</span>
                </div>

                <div className="w-full">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4 w-full">
                    {anteriores.length === 0 ? (
                      <div 
                        className="col-span-3 text-base sm:text-lg italic py-6 sm:py-8 text-center w-full rounded-xl border"
                        style={{ 
                          color: COLOR_PALETTE.textLight,
                          borderColor: COLOR_PALETTE.border,
                          backgroundColor: COLOR_PALETTE.white
                        }}
                      >
                        Nenhuma chamada recente
                      </div>
                    ) : (
                      anteriores.slice(0, 3).map((c, idx) => (
                        <PreviousCallCard key={`${c.id}-${idx}`} c={c} />
                      ))
                    )}
                  </div>
                </div>
              </section>
            </main>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}