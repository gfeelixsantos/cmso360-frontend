"use client";

import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import io, { Socket } from "socket.io-client";
import { AnimatePresence, motion } from "framer-motion";
import {
  Clock,
  History,
  Loader2,
  Monitor,
  Settings,
  Volume2,
  VolumeX,
} from "lucide-react";

import {
  NEST_URL,
  NEXT_WS_URL,
  SERVICES_KEY,
  UNIDADES_ATENDIMENTO,
} from "@/config/constants";

type PainelCall = {
  id: number;
  name?: string;
  sala: string;
  ticket: string;
  exame: string;
  audio?: string;
  socketId?: string;
  unidade: string;
};

// Configurações do painel
const PAINEL_CONFIG = {
  tempoChamada: 2500,
  timerVideo: 10000,
  qtdChamadas: 1,
  qtdFilaPainel: 5,
  tempoInatividadeMinutos: 1,
  duracaoIdleSegundos: 15,
  welcomeMessage: "Bem-vindo ao Centro Médico de Saúde Ocupacional.",
  audioUrls: {
    bemvindo: "/audio/bemvindo.mp3",
    notificacao: "/audio/painel3.mp3",
  },
};

// Configurações do Idle Screen
const IDLE_CONFIG = {
  tempoInatividadeMinutos: 2,
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
      ],
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
      ],
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
      ],
    },
    {
      id: 4,
      tipo: "imagem",
      src: "/images/araras.jpg",
      titulo: "Araras",
      subtitulo: "Filial",
      conteudo: ["Exames Ocupacionais", "Excelente localização"],
    },
  ],
};

const examesColors: Record<string, { primary: string; text: string }> = {
  "Acuidade Visual": { primary: "#C6B100", text: "#ffffff" },
  Audiometria: { primary: "#6B950B", text: "#ffffff" },
  "Exame Clínico": { primary: "#BC3112", text: "#ffffff" },
  Dinamometria: { primary: "#4B90BF", text: "#ffffff" },
  ECG: { primary: "#4E211E", text: "#ffffff" },
  EEG: { primary: "#17843A", text: "#ffffff" },
  Espirometria: { primary: "#835cb9", text: "#ffffff" },
  ATENDIMENTO: { primary: "#09008a", text: "#ffffff" },
  Laboratório: { primary: "#BB6101", text: "#ffffff" },
  Psicossocial: { primary: "#310966", text: "#ffffff" },
  "Raio-X": { primary: "#8F8E92", text: "#1a1a1a" },
  Triagem: { primary: "#0f97ff", text: "#ffffff" },
  Ultrassom: { primary: "#2a9d8f", text: "#ffffff" },
};

const COLOR_PALETTE = {
  primary: "#44735e",
  accent: "#5a8c7a",
  light: "#f8fcf9",
  white: "#ffffff",
  lightGray: "#f0f5f2",
  border: "#e1e9e4",
  text: "#2a4a3a",
  textLight: "#6b7f76",
  dark: "#1a2a1f",
};

const diaSemana = (date: Date): string => {
  const dias = [
    "Domingo",
    "Segunda-feira",
    "Terça-feira",
    "Quarta-feira",
    "Quinta-feira",
    "Sexta-feira",
    "Sábado",
  ];

  return dias[date.getDay()];
};

const mesAtual = (date: Date): string => {
  const meses = [
    "Janeiro",
    "Fevereiro",
    "Março",
    "Abril",
    "Maio",
    "Junho",
    "Julho",
    "Agosto",
    "Setembro",
    "Outubro",
    "Novembro",
    "Dezembro",
  ];

  return meses[date.getMonth()];
};

// Componentes responsivos
const CounterCard = ({ label, value }: { label: string; value: number }) => (
  <div
    className="rounded-2xl px-3 sm:px-4 py-2 sm:py-3 shadow-sm border min-w-[80px] sm:min-w-[100px] lg:min-w-[120px] backdrop-blur-sm"
    style={{
      backgroundColor: COLOR_PALETTE.white,
      borderColor: COLOR_PALETTE.border,
      boxShadow: "0 2px 12px rgba(68, 115, 94, 0.08)",
    }}
  >
    <div
      className="text-xl sm:text-2xl lg:text-3xl font-black leading-none tracking-tight text-center"
      style={{ color: COLOR_PALETTE.primary }}
    >
      {value}
    </div>
    <div
      className="mt-1 text-xs sm:text-xs lg:text-sm uppercase tracking-wider font-semibold text-center truncate px-1"
      style={{ color: COLOR_PALETTE.textLight }}
    >
      {label}
    </div>
  </div>
);

const PreviousCallCard = ({ c }: { c: PainelCall }) => {
  const colors = useMemo(
    () => examesColors[c.exame] || examesColors["Raio-X"],
    [c.exame],
  );

  return (
    <motion.div
      className="rounded-xl p-3 sm:p-4 flex-1 min-w-0 shadow-sm border backdrop-blur-sm"
      style={{
        backgroundColor: colors.primary + "20",
        borderColor: colors.primary,
        color: COLOR_PALETTE.text,
        boxShadow: "0 2px 8px rgba(68, 115, 94, 0.05)",
      }}
      whileHover={{ y: -2, scale: 1.02 }}
    >
      <div
        className="text-lg sm:text-xl lg:text-2xl font-bold truncate"
        style={{ color: colors.primary }}
      >
        {c.name ? c.name : `SENHA ${c.ticket}`}
      </div>
      <div
        className="mt-2 inline-flex items-center gap-2 font-bold text-base sm:text-lg lg:text-xl rounded-full px-3 py-1"
        style={{
          backgroundColor: colors.primary,
          color: colors.text,
        }}
      >
        <span className="truncate">{c.sala}</span>
        <span className="w-2 h-2 rounded-full bg-current animate-pulse" />
        <span className="truncate">{c.exame}</span>
      </div>
    </motion.div>
  );
};

// Modal de Ativação de Áudio
const AudioActivationModal = ({ onActivate }: { onActivate: () => void }) => (
  <motion.div
    animate={{ opacity: 1 }}
    className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
    initial={{ opacity: 0 }}
  >
    <motion.div
      animate={{ scale: 1, opacity: 1 }}
      className="bg-white rounded-2xl p-6 sm:p-8 w-full max-w-md mx-auto shadow-2xl"
      initial={{ scale: 0.8, opacity: 0 }}
      style={{
        borderColor: COLOR_PALETTE.border,
      }}
    >
      <div className="text-center">
        <div
          className="w-14 h-14 sm:w-16 sm:h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center"
          style={{
            backgroundColor: COLOR_PALETTE.primary,
            backgroundImage:
              "linear-gradient(135deg, #44735e 0%, #5a8c7a 100%)",
          }}
        >
          <Volume2 className="text-white" size={24} />
        </div>

        <h2
          className="text-xl sm:text-2xl font-bold mb-4"
          style={{ color: COLOR_PALETTE.primary }}
        >
          Ativação de Áudio
        </h2>

        <p
          className="text-sm sm:text-base text-gray-600 mb-6"
          style={{ color: COLOR_PALETTE.textLight }}
        >
          Para uma melhor experiência, ative o áudio do painel. Clique no botão
          abaixo para liberar a reprodução de sons.
        </p>

        <button
          className="w-full rounded-xl px-4 sm:px-6 py-3 sm:py-4 font-bold text-white transition-all hover:shadow-lg transform hover:scale-[1.02] text-sm sm:text-base"
          style={{
            background: `linear-gradient(135deg, ${COLOR_PALETTE.primary} 0%, ${COLOR_PALETTE.accent} 100%)`,
            boxShadow: "0 4px 14px rgba(68, 115, 94, 0.3)",
          }}
          onClick={onActivate}
        >
          <Volume2 className="inline mr-2" size={20} /> ATIVAR ÁUDIO
        </button>

        <button
          className="w-full mt-3 text-xs sm:text-sm text-gray-500 hover:text-gray-700 transition-colors"
          style={{ color: COLOR_PALETTE.textLight }}
          onClick={onActivate}
        >
          Pular e continuar sem áudio
        </button>
      </div>
    </motion.div>
  </motion.div>
);

// Idle Screen com conteúdo de divulgação
interface IdleProps {
  unidadeSelecionada: string;
}

const IdleScreen = ({ unidadeSelecionada }: IdleProps) => {
  const [itemAtual, setItemAtual] = useState(0);
  const timeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    const rotacionarItens = () => {
      setItemAtual((prev) =>
        prev === DIVULGACAO_CONFIG.items.length - 1 ? 0 : prev + 1,
      );
    };

    timeoutRef.current = setTimeout(
      rotacionarItens,
      DIVULGACAO_CONFIG.tempoExibicaoItem * 1000,
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
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-50 flex flex-col lg:flex-row bg-white overflow-hidden"
      exit={{ opacity: 0 }}
      initial={{ opacity: 0 }}
      transition={{ duration: 1 }}
    >
      <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-10 flex gap-2">
        {DIVULGACAO_CONFIG.items.map((_, index) => (
          <div
            key={index}
            className={`w-2 h-2 sm:w-3 sm:h-3 rounded-full transition-all duration-300 ${
              index === itemAtual ? "bg-white scale-125" : "bg-white/50"
            }`}
          />
        ))}
      </div>

      <div className="flex-1 flex items-center justify-center p-4 lg:p-8 bg-gradient-to-br from-gray-50 to-gray-100">
        <motion.div
          key={item.id}
          animate={{ scale: 1, opacity: 1 }}
          className="w-full h-full max-w-4xl max-h-4xl rounded-3xl overflow-hidden shadow-2xl bg-white"
          initial={{ scale: 0.9, opacity: 0 }}
          transition={{ duration: 0.8 }}
        >
          {item.tipo === "video" ? (
            <video
              loop
              muted
              autoPlay={true}
              className="w-full h-full object-cover"
              src={item.src}
            />
          ) : (
            <img
              alt={item.titulo}
              className="w-full h-full object-cover"
              src={item.src}
            />
          )}
        </motion.div>
      </div>

      <div className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8 xl:p-12 bg-gradient-to-br from-green-600 to-green-950">
        <motion.div
          key={`content-${item.id}`}
          animate={{ x: 0, opacity: 1 }}
          className="text-white max-w-2xl w-full"
          initial={{ x: 50, opacity: 0 }}
          transition={{ duration: 0.8 }}
        >
          <motion.h1
            animate={{ y: 0, opacity: 1 }}
            className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl 2xl:text-6xl font-black mb-4 leading-tight"
            initial={{ y: 30, opacity: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
          >
            {item.titulo}
          </motion.h1>

          {item.subtitulo && (
            <motion.p
              animate={{ y: 0, opacity: 1 }}
              className="text-base sm:text-lg lg:text-xl xl:text-2xl font-light mb-4 sm:mb-6 lg:mb-8 text-blue-200"
              initial={{ y: 20, opacity: 0 }}
              transition={{ delay: 0.4, duration: 0.6 }}
            >
              {item.subtitulo}
            </motion.p>
          )}

          <motion.div
            animate={{ y: 0, opacity: 1 }}
            className="space-y-3 sm:space-y-4"
            initial={{ y: 20, opacity: 0 }}
            transition={{ delay: 0.6, duration: 0.6 }}
          >
            {Array.isArray(item.conteudo) ? (
              <ul className="space-y-2 sm:space-y-3">
                {item.conteudo.map((linha, index) => (
                  <motion.li
                    key={index}
                    animate={{ x: 0, opacity: 1 }}
                    className="flex items-start gap-2 sm:gap-3 text-sm sm:text-base lg:text-lg"
                    initial={{ x: -20, opacity: 0 }}
                    transition={{ delay: 0.8 + index * 0.1, duration: 0.5 }}
                  >
                    <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-orange-400 rounded-full mt-2 sm:mt-3 flex-shrink-0" />
                    <span className="leading-relaxed text-sm sm:text-base lg:text-lg xl:text-xl">
                      {linha}
                    </span>
                  </motion.li>
                ))}
              </ul>
            ) : (
              <motion.p
                animate={{ x: 0, opacity: 1 }}
                className="text-sm sm:text-base lg:text-lg xl:text-xl leading-relaxed"
                initial={{ x: -20, opacity: 0 }}
                transition={{ delay: 0.8, duration: 0.5 }}
              >
                {item.conteudo}
              </motion.p>
            )}
          </motion.div>

          <motion.div
            animate={{ scale: 1, opacity: 1 }}
            className="mt-6 sm:mt-8 pt-4 sm:pt-6 border-t border-white/20"
            initial={{ scale: 0, opacity: 0 }}
            transition={{ delay: 1.2, duration: 0.5 }}
          >
            <div className="flex flex-col sm:flex-row items-center justify-between text-xs sm:text-sm text-white/70 gap-2">
              <span>{new Date().getFullYear()} • CMSO</span>
              <span className="truncate">{unidadeSelecionada}</span>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </motion.div>
  );
};

// Modal de Configurações
const ConfigModal = ({
  isOpen,
  onClose,
  audioHabilitado,
  setAudioHabilitado,
  unidadeSelecionada,
  onUnidadeChange,
}: {
  isOpen: boolean;
  onClose: () => void;
  audioHabilitado: boolean;
  setAudioHabilitado: (value: boolean) => void;
  unidadeSelecionada: string;
  onUnidadeChange: (value: string) => void;
}) => {
  if (!isOpen) return null;

  return (
    <motion.div
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm p-4"
      exit={{ opacity: 0 }}
      initial={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white rounded-2xl p-4 sm:p-6 w-full max-w-md mx-auto shadow-xl"
        exit={{ scale: 0.9, opacity: 0 }}
        initial={{ scale: 0.9, opacity: 0 }}
        style={{
          borderColor: COLOR_PALETTE.border,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2
          className="text-xl sm:text-2xl font-bold mb-4"
          style={{ color: COLOR_PALETTE.primary }}
        >
          Configurações do Painel
        </h2>

        <div className="space-y-4">
          <div>
            <label
              className="block text-sm font-medium mb-2"
              style={{ color: COLOR_PALETTE.text }}
            >
              Unidade
            </label>
            <select
              className="w-full rounded-xl border px-3 sm:px-4 py-2 sm:py-3 focus:outline-none focus:ring-2 focus:ring-offset-1 transition-all text-sm sm:text-base"
              style={{
                borderColor: COLOR_PALETTE.border,
                color: COLOR_PALETTE.text,
                backgroundColor: COLOR_PALETTE.lightGray,
              }}
              value={unidadeSelecionada}
              onChange={(e) => onUnidadeChange(e.target.value)}
            >
              {UNIDADES_ATENDIMENTO.map((unidade) => (
                <option key={unidade} value={unidade}>
                  {unidade}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm sm:text-base" style={{ color: COLOR_PALETTE.text }}>
              Áudio
            </span>
            <button
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                audioHabilitado ? "bg-green-500" : "bg-gray-300"
              }`}
              onClick={() => setAudioHabilitado(!audioHabilitado)}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  audioHabilitado ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
          </div>

          <div
            className="flex items-center gap-2 text-xs sm:text-sm"
            style={{ color: COLOR_PALETTE.textLight }}
          >
            {audioHabilitado ? <Volume2 size={16} /> : <VolumeX size={16} />}
            {audioHabilitado ? "Áudio ativado" : "Áudio desativado"}
          </div>
        </div>

        <div className="flex gap-2 sm:gap-3 mt-6">
          <button
            className="flex-1 rounded-xl px-3 sm:px-4 py-2 sm:py-3 font-semibold transition-all border text-sm sm:text-base"
            style={{
              borderColor: COLOR_PALETTE.border,
              color: COLOR_PALETTE.text,
              backgroundColor: COLOR_PALETTE.lightGray,
            }}
            onClick={onClose}
          >
            Fechar
          </button>
          <button
            className="flex-1 rounded-xl px-3 sm:px-4 py-2 sm:py-3 font-semibold text-white transition-all text-sm sm:text-base"
            style={{
              backgroundColor: COLOR_PALETTE.primary,
            }}
            onClick={() => {
              localStorage.setItem("painel_validate", unidadeSelecionada);
              onClose();
            }}
          >
            Salvar
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

// Socket como variável global fora do componente
let socket: Socket | null = null;

export default function PainelPage() {
  const [chamadaAtual, setChamadaAtual] = useState<PainelCall>();
  const [anteriores, setAnteriores] = useState<PainelCall[]>([]);
  const [hora, setHora] = useState<string>("");
  const [dataCompleta, setDataCompleta] = useState<string>("");

  const [ativas, setAtivas] = useState<PainelCall[]>([]);
  const [espera, setEspera] = useState<PainelCall[]>([]);

  const ativasRef = useRef<PainelCall[]>([]);
  const esperaRef = useRef<PainelCall[]>([]);
  const loopRodando = useRef<boolean>(false);
  const cancelLoop = useRef<boolean>(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const audioPoolRef = useRef<Map<string, HTMLAudioElement>>(new Map());

  const [isLiberado, setIsLiberado] = useState(false);
  const [audioHabilitado, setAudioHabilitado] = useState(false);
  const [unidadeSelecionada, setUnidadeSelecionada] = useState<string>("");
  const [showConfig, setShowConfig] = useState(false);
  const [showAudioModal, setShowAudioModal] = useState(false);

  // Estados para controle do idle
  const [isIdle, setIsIdle] = useState(false);
  const [showPainel, setShowPainel] = useState(true);
  const ultimaChamadaRef = useRef<number>(Date.now());
  const idleTimeoutRef = useRef<NodeJS.Timeout>();
  const returnTimeoutRef = useRef<NodeJS.Timeout>();

  // Ref para controlar se o socket já foi inicializado
  const socketInitializedRef = useRef(false);

  const atualizaData = useCallback(() => {
    const now = new Date();
    const dia = diaSemana(now);
    const data = now.getDate();
    const mes = mesAtual(now);
    const ano = now.getFullYear();
    const tempo = now.toLocaleTimeString("pt-br").slice(0, 5);

    setDataCompleta(`${dia}, ${data} de ${mes}, ${ano}`);
    setHora(tempo);
  }, []);

  useEffect(() => {
    atualizaData();
    const t = setInterval(atualizaData, 60000);

    return () => clearInterval(t);
  }, [atualizaData]);

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

  const setAtivasSync = useCallback(
    (updater: (prev: PainelCall[]) => PainelCall[]) => {
      setAtivas((prev) => {
        const next = updater(prev);

        ativasRef.current = next;

        return next;
      });
    },
    [],
  );

  const setEsperaSync = useCallback(
    (updater: (prev: PainelCall[]) => PainelCall[]) => {
      setEspera((prev) => {
        const next = updater(prev);

        esperaRef.current = next;

        return next;
      });
    },
    [],
  );

  const tocarSomNotificacao = useCallback(() => {
    if (!audioHabilitado) return;
    try {
      const notificacaoUrl = `${NEST_URL}${PAINEL_CONFIG.audioUrls.notificacao}`;
      const audio = new Audio(PAINEL_CONFIG.audioUrls.notificacao);

      audio
        .play()
        .catch(() => console.log("Som de notificação não disponível"));
    } catch (e) {
      console.log("Erro ao tocar notificação:", e);
    }
  }, [audioHabilitado]);

  const tocarAudioDaChamada = useCallback(
    (call: PainelCall): Promise<void> =>
      new Promise<void>((resolve) => {
        tocarSomNotificacao();
        setChamadaAtual(call);
        console.log("Chamada recebida:", call);
        setAnteriores((prev) => {
          const nova = [call, ...prev];

          return nova.slice(0, 4);
        });
        atualizarUltimaChamada();

        if (!audioHabilitado || !call.audio) {
          setTimeout(() => resolve(), PAINEL_CONFIG.tempoChamada);

          return;
        }

        const executar = async () => {
          try {
            console.log("URL do áudio:", `${NEST_URL}${call.audio}`);
            const audio = new Audio(`${NEST_URL}${call.audio}`);

            audio.preload = "auto";

            await new Promise<void>((res, rej) => {
              let carregado = false;

              audio.oncanplaythrough = () => {
                carregado = true;
                res();
              };
              audio.onerror = () => rej(new Error("Erro ao carregar áudio"));
              setTimeout(() => {
                if (!carregado) rej(new Error("Timeout ao carregar áudio"));
              }, 2000);
            });

            await audio.play();

            await new Promise<void>((res) => {
              const onEnd = () => {
                audio.removeEventListener("ended", onEnd);
                res();
              };

              audio.addEventListener("ended", onEnd);
            });

            await new Promise((r) => setTimeout(r, 2000));
            resolve();
          } catch (err) {
            console.error("Erro no áudio:", err);
            setTimeout(() => resolve(), 2000);
          }
        };

        executar();
      }),
    [audioHabilitado, tocarSomNotificacao, atualizarUltimaChamada],
  );

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
          if (!cancelLoop.current) {
            await new Promise((r) => setTimeout(r, 3000));
          }
          if (cancelLoop.current) break;
        }
        await new Promise((r) => setTimeout(r, 2000));
      } else {
        await new Promise((r) => setTimeout(r, 2000));
      }
    }

    loopRodando.current = false;
  }, [tocarAudioDaChamada]);

  useEffect(() => {
    if (ativas.length > 0) iniciarLoop();
  }, [ativas, iniciarLoop]);

  // Ativar modal de áudio após liberação
  useEffect(() => {
    if (isLiberado) {
      setTimeout(() => {
        setShowAudioModal(true);
      }, 1000);
    }
  }, [isLiberado]);

  // Inicializar idle timer
  useEffect(() => {
    if (isLiberado) {
      resetarIdleTimer();
    }

    return () => {
      if (idleTimeoutRef.current) clearTimeout(idleTimeoutRef.current);
      if (returnTimeoutRef.current) clearTimeout(returnTimeoutRef.current);
    };
  }, [isLiberado, resetarIdleTimer]);

  // Inicialização do WebSocket - UMA VEZ APENAS
  useEffect(() => {
    if (!isLiberado || !unidadeSelecionada || socketInitializedRef.current)
      return;

    console.log("🔄 Inicializando conexão WebSocket...");
    socketInitializedRef.current = true;

    socket = io(NEXT_WS_URL, {
      auth: {
        type: "PAINEL",
        unidade: unidadeSelecionada,
      },
      transports: ["websocket"],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    });

    socket.on("connect", () => {
      console.log("✅ Conectado ao WebSocket - ID:", socket?.id);
      socket?.emit("painel disponível", socket?.id);
      resetarIdleTimer();
    });

    socket.on("disconnect", (reason) => {
      console.log("❌ Desconectado do WebSocket:", reason);
    });

    socket.on("connect_error", (error) => {
      console.error("❌ Erro de conexão WebSocket:", error);
    });

    socket.on("chamar funcionario", (call: PainelCall) => {
      console.log("📞 Chamada recebida via WebSocket:", call);

      const jaExiste =
        ativasRef.current.some((c) => c.id === call.id) ||
        esperaRef.current.some((c) => c.id === call.id);

      if (jaExiste) {
        console.log("🔄 Chamada já existe, ignorando...");

        return;
      }

      if (ativasRef.current.length < PAINEL_CONFIG.qtdFilaPainel) {
        console.log("➕ Adicionando chamada às ativas");
        setAtivasSync((prev) => [...prev, call]);
      } else {
        console.log("⏳ Adicionando chamada à espera");
        setEsperaSync((prev) => [...prev, call]);
      }
    });

    socket.on("atendimento finalizado", (call: PainelCall) => {
      console.log("✅ Atendimento finalizado:", call);
      let liberouVaga = false;

      setAtivasSync((prev) => {
        const next = prev.filter((c) => c.id !== call.id);

        liberouVaga = next.length < prev.length;

        return next;
      });
      setEsperaSync((prev) => prev.filter((c) => c.id !== call.id));

      if (liberouVaga && esperaRef.current.length > 0) {
        const [proxima, ...resto] = esperaRef.current;

        console.log("🔄 Promovendo chamada da espera:", proxima);
        setEsperaSync(() => resto);
        setAtivasSync((prev) => [...prev, proxima]);
      }
    });

    socket.on("funcionario em atendimento", (call: PainelCall) => {
      console.log("👨‍⚕️ Funcionário em atendimento:", call);
      setAtivasSync((prev) => prev.filter((c) => c.id !== call.id));
      setEsperaSync((prev) => prev.filter((c) => c.id !== call.id));
    });

    socket.on("atendimento retornado", (call: PainelCall) => {
      console.log("🔄 Atendimento retornado:", call);
      setAtivasSync((prev) => prev.filter((c) => c.id !== call.id));
      setEsperaSync((prev) => prev.filter((c) => c.id !== call.id));
    });

    socket.on("pagina fechada", (socketId: string) => {
      console.log("🚪 Página fechada:", socketId);
      setAtivasSync((prev) => prev.filter((c) => c.socketId !== socketId));
      setEsperaSync((prev) => prev.filter((c) => c.socketId !== socketId));
    });

    const handleBeforeUnload = () => {
      console.log("🔌 Desconectando WebSocket antes de fechar...");
      socket?.emit("painel desconectado", socket?.id);
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      console.log("🧹 Limpando WebSocket...");
      window.removeEventListener("beforeunload", handleBeforeUnload);

      // Não desconecta o socket aqui para manter a conexão
      cancelLoop.current = true;
      loopRodando.current = false;

      audioPoolRef.current.forEach((audio) => {
        audio.pause();
        audio.src = "";
      });
      audioPoolRef.current.clear();
    };
  }, [
    isLiberado,
    unidadeSelecionada,
    setAtivasSync,
    setEsperaSync,
    resetarIdleTimer,
  ]);

  // Tocar áudio de boas-vindas
  useEffect(() => {
    if (!isLiberado) return;

    const inicializarPainel = async () => {
      try {
        if (audioHabilitado) {
          const bemVindo = new Audio(PAINEL_CONFIG.audioUrls.bemvindo);

          await bemVindo.play().catch(() => {
            console.log("Áudio de boas-vindas não disponível");
          });
        }
      } catch (e) {
        console.log("Erro ao tocar boas-vindas:", e);
      }
    };

    inicializarPainel();
  }, [isLiberado, audioHabilitado]);

  const validarAcesso = (serial: string, unidade: string) => {
    if (serial === SERVICES_KEY && unidade) {
      setUnidadeSelecionada(unidade);
      setIsLiberado(true);
      localStorage.setItem("painel_validate", unidade);
    } else {
      alert("Chave inválida ou unidade não selecionada!");
    }
  };

  useEffect(() => {
    const unidadeSalva = localStorage.getItem("painel_validate");

    if (unidadeSalva) {
      setUnidadeSelecionada(unidadeSalva);
      setIsLiberado(true);
    }
  }, []);

  const currentExamColors = useMemo(
    () =>
      chamadaAtual
        ? examesColors[chamadaAtual.exame] || examesColors["Raio-X"]
        : { primary: COLOR_PALETTE.primary, text: COLOR_PALETTE.white },
    [chamadaAtual],
  );

  const handleUnidadeChange = (novaUnidade: string) => {
    setUnidadeSelecionada(novaUnidade);
    // Recarregar a página para reinicializar a conexão com a nova unidade
    window.location.reload();
  };

  // Verificar se deve exibir idle
  const deveExibirIdle = isIdle;

  if (!isLiberado) {
    return (
      <div
        className="min-h-screen w-full flex items-center justify-center p-4"
        style={{
          backgroundColor: COLOR_PALETTE.light,
          backgroundImage: `linear-gradient(135deg, ${COLOR_PALETTE.light} 0%, ${COLOR_PALETTE.lightGray} 100%)`,
        }}
      >
        <div
          className="w-full max-w-md rounded-2xl p-6 sm:p-8 shadow-lg border"
          style={{
            backgroundColor: COLOR_PALETTE.white,
            borderColor: COLOR_PALETTE.border,
            boxShadow: "0 8px 32px rgba(68, 115, 94, 0.1)",
          }}
        >
          <div className="space-y-6">
            <div className="text-center">
              <div
                className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-4 rounded-2xl flex items-center justify-center shadow-sm"
                style={{
                  backgroundColor: COLOR_PALETTE.primary,
                  backgroundImage: `linear-gradient(135deg, ${COLOR_PALETTE.primary} 0%, ${COLOR_PALETTE.accent} 100%)`,
                }}
              >
                <Monitor className="text-white" size={28} />
              </div>
              <h1
                className="text-xl sm:text-2xl font-bold"
                style={{ color: COLOR_PALETTE.primary }}
              >
                Painel de Chamadas
              </h1>
              <p className="mt-2 text-sm sm:text-base" style={{ color: COLOR_PALETTE.textLight }}>
                Acesso restrito ao pessoal autorizado
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label
                  className="text-sm font-semibold"
                  style={{ color: COLOR_PALETTE.text }}
                >
                  Chave de Acesso
                </label>
                <input
                  autoFocus
                  className="w-full rounded-xl border px-3 sm:px-4 py-2 sm:py-3 focus:outline-none focus:ring-2 focus:ring-offset-1 mt-1 text-base sm:text-lg transition-all"
                  id="serialInput"
                  placeholder="Digite a chave..."
                  style={{
                    borderColor: COLOR_PALETTE.border,
                    color: COLOR_PALETTE.text,
                    backgroundColor: COLOR_PALETTE.lightGray,
                  }}
                  type="password"
                />
              </div>

              <div>
                <label
                  className="text-sm font-semibold"
                  style={{ color: COLOR_PALETTE.text }}
                >
                  Unidade
                </label>
                <select
                  className="w-full rounded-xl border px-3 sm:px-4 py-2 sm:py-3 focus:outline-none focus:ring-2 focus:ring-offset-1 mt-1 transition-all text-sm sm:text-base"
                  defaultValue=""
                  id="unidadeSelect"
                  style={{
                    borderColor: COLOR_PALETTE.border,
                    color: COLOR_PALETTE.text,
                    backgroundColor: COLOR_PALETTE.lightGray,
                  }}
                >
                  <option disabled value="">
                    Selecione a unidade
                  </option>
                  {UNIDADES_ATENDIMENTO.map((unidade) => (
                    <option key={unidade} value={unidade}>
                      {unidade}
                    </option>
                  ))}
                </select>
              </div>

              <button
                className="w-full rounded-xl px-4 sm:px-6 py-3 sm:py-4 font-bold text-white mt-4 transition-all hover:shadow-lg transform hover:scale-[1.02] text-sm sm:text-base"
                style={{
                  background: `linear-gradient(135deg, ${COLOR_PALETTE.primary} 0%, ${COLOR_PALETTE.accent} 100%)`,
                  boxShadow: "0 4px 14px rgba(68, 115, 94, 0.3)",
                }}
                onClick={() => {
                  const serial =
                    (document.getElementById("serialInput") as HTMLInputElement)
                      ?.value || "";
                  const unidade =
                    (
                      document.getElementById(
                        "unidadeSelect",
                      ) as HTMLSelectElement
                    )?.value || "";

                  validarAcesso(serial, unidade);
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
        backgroundImage: `linear-gradient(135deg, ${COLOR_PALETTE.light} 0%, ${COLOR_PALETTE.lightGray} 100%)`,
      }}
    >
      {/* Modal de Ativação de Áudio */}
      <AnimatePresence>
        {showAudioModal && (
          <AudioActivationModal
            onActivate={() => {
              setAudioHabilitado(true);
              setShowAudioModal(false);
            }}
          />
        )}
      </AnimatePresence>

      {/* Botão de Configurações Flutuante */}
      <motion.button
        animate={{ scale: 1, opacity: 1 }}
        className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-40 rounded-full p-3 sm:p-4 shadow-lg border transition-all"
        initial={{ scale: 0, opacity: 0 }}
        style={{
          backgroundColor: COLOR_PALETTE.white,
          borderColor: COLOR_PALETTE.border,
          color: COLOR_PALETTE.primary,
          boxShadow: "0 4px 20px rgba(68, 115, 94, 0.2)",
        }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setShowConfig(true)}
      >
        <Settings size={20} />
      </motion.button>

      {/* Modal de Configurações */}
      <ConfigModal
        audioHabilitado={audioHabilitado}
        isOpen={showConfig}
        setAudioHabilitado={setAudioHabilitado}
        unidadeSelecionada={unidadeSelecionada}
        onClose={() => setShowConfig(false)}
        onUnidadeChange={handleUnidadeChange}
      />

      {/* Idle Screen */}
      <AnimatePresence>
        {deveExibirIdle && (
          <IdleScreen unidadeSelecionada={unidadeSelecionada} />
        )}
      </AnimatePresence>

      {/* Painel Principal */}
      <AnimatePresence>
        {showPainel && !deveExibirIdle && (
          <motion.div
            animate={{ opacity: 1, scale: 1 }}
            className="flex-1 flex flex-col min-h-0"
            exit={{ opacity: 0, scale: 1.05 }}
            initial={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.8 }}
          >
            <header
              className="w-full border-b py-2 px-2 sm:px-4 lg:px-6 backdrop-blur-sm shrink-0"
              style={{
                backgroundColor: COLOR_PALETTE.white,
                borderColor: COLOR_PALETTE.border,
                boxShadow: "0 1px 3px rgba(68, 115, 94, 0.05)",
              }}
            >
              <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-3 items-center gap-2 sm:gap-4">
                <div className="flex items-center gap-2 sm:gap-4 justify-center sm:justify-start order-2 sm:order-1">
                  <div
                    className="rounded-2xl p-2 sm:p-3 shadow-sm border"
                    style={{
                      backgroundColor: COLOR_PALETTE.primary,
                      borderColor: COLOR_PALETTE.accent,
                      backgroundImage: `linear-gradient(135deg, ${COLOR_PALETTE.primary} 0%, ${COLOR_PALETTE.accent} 100%)`,
                    }}
                  >
                    <Monitor className="text-white" size={24} />
                  </div>
                  <div>
                    <div
                      className="text-xs sm:text-sm uppercase tracking-wide font-semibold"
                      style={{ color: COLOR_PALETTE.textLight }}
                    >
                      Unidade
                    </div>
                    <div
                      className="text-base sm:text-xl font-bold truncate max-w-[150px] sm:max-w-none"
                      style={{ color: COLOR_PALETTE.text }}
                    >
                      {unidadeSelecionada}
                    </div>
                  </div>
                </div>

                <div className="text-center order-1 sm:order-2">
                  <div
                    className="text-sm sm:text-base lg:text-lg font-semibold"
                    style={{ color: COLOR_PALETTE.text }}
                  >
                    {dataCompleta}
                  </div>
                  <div
                    className="text-2xl sm:text-3xl lg:text-4xl font-black tabular-nums flex items-center justify-center gap-2 sm:gap-3 mt-1"
                    style={{ color: COLOR_PALETTE.primary }}
                  >
                    <Clock size={20} /> {hora}
                  </div>
                </div>

                <div className="flex justify-center sm:justify-end gap-2 sm:gap-4 order-3">
                  <CounterCard label="Chamando" value={ativas.length} />
                  <CounterCard label="Aguardando" value={espera.length} />
                </div>
              </div>
            </header>

            <main className="flex-1 flex flex-col px-1 sm:px-2 lg:px-4 py-2 sm:py-4 max-w-7xl mx-auto w-full min-h-0">
              <section className="flex-1 flex items-center justify-center mb-2 sm:mb-4 lg:mb-6 min-h-0">
                <AnimatePresence mode="wait">
                  {chamadaAtual ? (
                    <motion.div
                      key={chamadaAtual.id}
                      animate={{ opacity: 1, scale: 1 }}
                      className="w-full max-w-6xl rounded-2xl p-4 sm:p-6 lg:p-8 xl:p-12 shadow-lg border text-center backdrop-blur-sm mx-1 sm:mx-2"
                      exit={{ opacity: 0, scale: 0.9 }}
                      initial={{ opacity: 0, scale: 0.9 }}
                      style={{
                        backgroundColor: currentExamColors.primary + "15",
                        borderColor: COLOR_PALETTE.border,
                        color: COLOR_PALETTE.text,
                        boxShadow: "0 8px 32px rgba(68, 115, 94, 0.1)",
                      }}
                      transition={{ duration: 0.3 }}
                    >
                      <motion.div
                        animate={{ scale: 1, opacity: 1 }}
                        className="mb-4 sm:mb-6 lg:mb-8"
                        initial={{ scale: 0.95, opacity: 0 }}
                        transition={{ delay: 0.05 }}
                      >
                        <div
                          className={
                            chamadaAtual.name
                              ? "text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl 2xl:text-8xl font-black mb-2 sm:mb-4 uppercase tracking-wider break-words"
                              : "text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl 2xl:text-9xl font-black mb-2 sm:mb-4 uppercase tracking-wider"
                          }
                          style={{ color: currentExamColors.primary }}
                        >
                          {chamadaAtual.name || chamadaAtual.ticket}
                        </div>
                      </motion.div>

                      <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-4 mb-2 lg:mb-4">
                        <motion.div
                          animate={{ y: 0, opacity: 1 }}
                          className="flex items-center gap-2 sm:gap-3 text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl 2xl:text-6xl font-black px-3 sm:px-4 md:px-6 py-1 sm:py-2 md:py-3 rounded-full border"
                          initial={{ y: 10, opacity: 0 }}
                          style={{
                            backgroundColor: currentExamColors.primary,
                            color: currentExamColors.text,
                            borderColor: currentExamColors.primary,
                          }}
                          transition={{ delay: 0.1 }}
                        >
                          <span>{chamadaAtual.sala}</span>
                        </motion.div>

                        <motion.div
                          animate={{ y: 0, opacity: 1 }}
                          className="text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl 2xl:text-6xl font-black px-3 sm:px-4 md:px-6 py-1 sm:py-2 rounded-full border-2 text-center"
                          initial={{ y: 10, opacity: 0 }}
                          style={{
                            borderColor: currentExamColors.primary,
                            color: currentExamColors.primary,
                            backgroundColor: currentExamColors.primary + "20",
                          }}
                          transition={{ delay: 0.15 }}
                        >
                          <span className="break-words">
                            {chamadaAtual.exame || "ATENDIMENTO"}
                          </span>
                        </motion.div>
                      </div>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="aguardando"
                      animate={{ opacity: 1 }}
                      className="text-center mx-2 sm:mx-4"
                      initial={{ opacity: 0 }}
                    >
                      <Loader2
                        className="animate-spin mx-auto mb-3 sm:mb-4 lg:mb-6"
                        size={32}
                        style={{ color: COLOR_PALETTE.primary }}
                      />
                      <h2
                        className="text-xl sm:text-2xl lg:text-3xl xl:text-4xl font-bold mb-2 sm:mb-3 lg:mb-4"
                        style={{ color: COLOR_PALETTE.text }}
                      >
                        AGUARDANDO CHAMADAS
                      </h2>
                    </motion.div>
                  )}
                </AnimatePresence>
              </section>

              <section className="mt-auto px-1 sm:px-2 w-full shrink-0">
                <div
                  className="flex items-center gap-2 sm:gap-3 text-base sm:text-lg lg:text-xl font-bold mb-2 sm:mb-3 lg:mb-4"
                  style={{ color: COLOR_PALETTE.text }}
                >
                  <History size={18} style={{ color: COLOR_PALETTE.primary }} />
                  <span className="truncate">CHAMADAS ANTERIORES</span>
                </div>

                <div className="w-full">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 sm:gap-3 lg:gap-4 w-full">
                    {anteriores.length === 0 ? (
                      <div
                        className="col-span-2 text-sm sm:text-base lg:text-lg italic py-4 sm:py-6 lg:py-8 text-center w-full rounded-xl border"
                        style={{
                          color: COLOR_PALETTE.textLight,
                          borderColor: COLOR_PALETTE.border,
                          backgroundColor: COLOR_PALETTE.white,
                        }}
                      >
                        Nenhuma chamada recente
                      </div>
                    ) : (
                      anteriores
                        .slice(0, 2)
                        .map((c, idx) => (
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