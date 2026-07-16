"use client";

import { useEffect, useState, useCallback, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Image } from "@heroui/react";
import { Monitor, Sun, CloudRain, Cloud, CloudLightning, Wind, Thermometer, Droplets, Calendar } from "lucide-react";
import { MuralItem } from "@/lib/mural/types";
import { SERVICES_KEY, NEXT_WS_URL } from "@/config/constants";
import { io } from "socket.io-client";

export default function MuralPage() {
  return (
    <Suspense fallback={null}>
      <MuralContent />
    </Suspense>
  );
}

function MuralContent() {
  const searchParams = useSearchParams();
  const isPreview = searchParams.get("preview") === "true";

  const [murais, setMurais] = useState<MuralItem[]>([]);
  const [index, setIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [activated, setActivated] = useState(false);
  const [isLiberado, setIsLiberado] = useState(false);
  const [serialInput, setSerialInput] = useState("");
  const [unidade, setUnidade] = useState("RIO CLARO");
  const [weatherData, setWeatherData] = useState<any>(null);
  const timerRef = useRef<NodeJS.Timeout>();
  const videoRef = useRef<HTMLVideoElement>(null);

  const fetchWeather = useCallback(async (city: string) => {
    try {
      const res = await fetch(`/api/weather?city=${encodeURIComponent(city)}`);
      if (!res.ok) throw new Error("Erro ao buscar clima");
      const data = await res.json();
      if (data && data.results) {
        setWeatherData(data.results);
      }
    } catch (err) {
      console.error("Falha ao buscar clima:", err);
    }
  }, []);

  const fetchMurais = useCallback(async () => {
    try {
      const res = await fetch(`/api/mural/ativos?t=${Date.now()}`);
      if (!res.ok) throw new Error("Erro ao buscar murais");
      const data = await res.json();
      if (Array.isArray(data)) {
        // Injetar o slide de clima virtual ao final da lista
        const weatherSlide: MuralItem = {
          id: "virtual_weather",
          LAYOUTTYPE: "WEATHER",
          TITLE: "Previsão do Tempo",
          ACTIVE: true,
          STYLES: {
            BACKGROUNDCOLOR: "#0e2340",
            TEXTCOLOR: "#ffffff",
          },
          CREATEDAT: new Date().toISOString(),
          UPDATEDAT: new Date().toISOString(),
        };
        setMurais([...data, weatherSlide]);
        setError(false);
      }
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isPreview) {
      setIsLiberado(true);
      setActivated(true);
      fetchMurais();
      fetchWeather("RIO CLARO");
      return;
    }
    const saved = localStorage.getItem("mural_validate");
    const savedUnidade = localStorage.getItem("mural_unidade") || "RIO CLARO";
    setUnidade(savedUnidade);
    if (saved === "true") {
      setIsLiberado(true);
      fetchMurais();
      fetchWeather(savedUnidade);
    }
  }, [fetchMurais, fetchWeather, isPreview]);

  useEffect(() => {
    if (!isLiberado) return;
    fetchMurais();

    // Conexão WebSocket para atualização em tempo real
    const socket = io(NEXT_WS_URL, {
      auth: {
        type: "MURAL",
      },
      transports: ["websocket"],
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000,
    });

    socket.on("connect", () => {
      console.log("Mural conectado ao WebSocket, sincronizando dados...");
      fetchMurais();
    });

    socket.on("mural_alterado", () => {
      console.log("Mural alterado detectado via WS, atualizando lista...");
      fetchMurais();
    });

    return () => {
      socket.disconnect();
    };
  }, [isLiberado, fetchMurais]);

  useEffect(() => {
    if (!isLiberado || !unidade) return;

    // Buscar clima a cada 15 minutos
    const interval = setInterval(() => {
      fetchWeather(unidade);
    }, 15 * 60 * 1000);

    return () => clearInterval(interval);
  }, [isLiberado, unidade, fetchWeather]);

  const validarAcesso = () => {
    if (serialInput === SERVICES_KEY) {
      setIsLiberado(true);
      localStorage.setItem("mural_validate", "true");
      localStorage.setItem("mural_unidade", unidade);
      fetchWeather(unidade);
    } else {
      alert("Chave inválida!");
    }
  };

  const handleActivate = () => {
    const el = document.documentElement;
    if (el.requestFullscreen) {
      el.requestFullscreen();
    } else if ((el as any).webkitRequestFullscreen) {
      (el as any).webkitRequestFullscreen();
    } else if ((el as any).msRequestFullscreen) {
      (el as any).msRequestFullscreen();
    }
    setActivated(true);
  };

  useEffect(() => {
    if (murais.length === 0) return;

    const current = murais[index];
    if (current && current.LAYOUTTYPE === "VIDEO") {
      // Para vídeos, deixamos o onEnded do elemento HTML5 controlar o fluxo.
      // Adicionamos um timeout de fallback longo (60s) para segurança contra travamentos.
      timerRef.current = setTimeout(() => {
        setIndex((prev) => (prev + 1) % murais.length);
      }, 60000);

      return () => {
        if (timerRef.current) clearTimeout(timerRef.current);
      };
    }

    const duration = 12000;

    timerRef.current = setTimeout(() => {
      setIndex((prev) => (prev + 1) % murais.length);
    }, duration);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [index, murais]);

  useEffect(() => {
    if (murais.length === 0) return;
    const current = murais[index];
    if (current && current.LAYOUTTYPE === "VIDEO" && videoRef.current) {
      // Forçar recarregamento do source do vídeo para garantir o player atualizado
      videoRef.current.load();
      // Tentar reproduzir
      videoRef.current.play().catch((err) => {
        console.warn("Autoplay bloqueado pelo navegador. Tentando reproduzir com áudio desativado (mutado)...", err);
        if (videoRef.current) {
          videoRef.current.muted = true;
          videoRef.current.play().catch((e) => console.error("Falha ao reproduzir mutado:", e));
        }
      });
    }
  }, [index, murais]);

  if (!isLiberado) {
    return (
      <div
        className="fixed inset-0 flex flex-col items-center justify-center p-4"
        style={{ backgroundColor: "#1a1a2e" }}
      >
        <div className="w-full max-w-sm space-y-6">
          <div className="text-center">
            <div className="w-14 h-14 mx-auto mb-4 rounded-2xl flex items-center justify-center bg-white/10">
              <Monitor className="text-white" size={24} />
            </div>
            <h1 className="text-xl font-bold text-white">Mural Digital</h1>
            <p className="mt-1 text-sm text-white/50">Acesso restrito</p>
          </div>
          <div className="space-y-4">
            <select
              className="w-full rounded-xl border border-white/20 px-4 py-3 text-sm text-white bg-[#1a1a2e] focus:outline-none focus:ring-2 focus:ring-white/30 transition-all cursor-pointer"
              value={unidade}
              onChange={(e) => setUnidade(e.target.value)}
            >
              <option value="RIO CLARO">Rio Claro</option>
              <option value="CORDEIRÓPOLIS">Cordeirópolis</option>
              <option value="ARARAS">Araras</option>
            </select>
            <input
              className="w-full rounded-xl border border-white/20 px-4 py-3 text-sm text-white bg-white/5 focus:outline-none focus:ring-2 focus:ring-white/30 placeholder-white/30 transition-all"
              placeholder="Digite a chave de acesso..."
              type="password"
              value={serialInput}
              onChange={(e) => setSerialInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") validarAcesso(); }}
            />
            <button
              className="w-full rounded-xl px-4 py-3 font-semibold text-sm text-white bg-white/10 hover:bg-white/20 transition-all"
              onClick={validarAcesso}
            >
              Liberar Acesso
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!activated) {
    return (
      <div
        className="fixed inset-0 flex flex-col items-center justify-center gap-6 cursor-pointer select-none"
        style={{ backgroundColor: "#1a1a2e" }}
        onClick={handleActivate}
      >
        <div className="w-16 h-16 rounded-2xl bg-white/10 flex items-center justify-center">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
            <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" />
          </svg>
        </div>
        <span className="text-white text-xl font-semibold">Clique para ativar tela cheia</span>
      </div>
    );
  }

  if (loading) {
    return (
      <div className={isPreview ? "w-full h-full flex items-center justify-center bg-black" : "fixed inset-0 flex items-center justify-center bg-black"}>
        <div className="w-12 h-12 border-4 border-white/30 border-t-white rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className={isPreview ? "w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-gray-900 to-gray-800 text-white gap-4" : "fixed inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-gray-900 to-gray-800 text-white gap-4"}>
        <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
        </div>
        <span className="text-lg font-semibold">Falha ao carregar murais</span>
        <button
          className="px-6 py-2 rounded-xl bg-white/10 hover:bg-white/20 transition-colors text-sm font-medium"
          onClick={() => { setLoading(true); setError(false); fetchMurais(); }}
        >
          Tentar novamente
        </button>
      </div>
    );
  }

  if (murais.length === 0) {
    return (
      <div className={isPreview ? "w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-gray-900 to-gray-800 text-white gap-4" : "fixed inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-gray-900 to-gray-800 text-white gap-4"}>
        <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
            <line x1="3" y1="9" x2="21" y2="9" />
            <line x1="9" y1="21" x2="9" y2="9" />
          </svg>
        </div>
        <span className="text-lg font-semibold">Nenhum mural ativo no momento</span>
      </div>
    );
  }

  const current = murais[index] || murais[0];
  if (!current) return null;
  const styles = current.STYLES || {};
  const fontFamily = styles.FONTFAMILY || "Inter";
  const bgColor = styles.BACKGROUNDCOLOR || "#1a1a2e";
  const textColor = styles.TEXTCOLOR || "#ffffff";
  const bodyTextColor = styles.BODYTEXTCOLOR || textColor;

  return (
    <div
      className={isPreview ? "w-full h-full overflow-hidden" : "fixed inset-0 h-screen w-screen overflow-hidden"}
      style={{ backgroundColor: bgColor }}
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={current.id}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          className="absolute inset-0"
          exit={{ opacity: 0, x: -40, scale: 0.98 }}
          initial={{ opacity: 0, x: 40, scale: 0.98 }}
          transition={{ duration: 0.5, ease: "easeInOut" }}
        >
          {current.LAYOUTTYPE === "FULL_IMAGE" ? (
            <div className="w-full h-full relative">
              {current.IMAGEURL && (
                <img
                  alt={current.TITLE || "Mural"}
                  className="w-full h-full object-cover"
                  src={current.IMAGEURL}
                  style={{ backgroundColor: bgColor }}
                />
              )}
            </div>
          ) : current.LAYOUTTYPE === "VIDEO" ? (
            <div className="w-full h-full relative">
              {current.IMAGEURL && (
                <video
                  ref={videoRef}
                  src={current.IMAGEURL}
                  autoPlay
                  playsInline
                  muted={styles.VIDEOMUTED ?? true}
                  onEnded={() => {
                    if (timerRef.current) clearTimeout(timerRef.current);
                    setIndex((prev) => (prev + 1) % murais.length);
                  }}
                  className="w-full h-full object-cover"
                  style={{ backgroundColor: bgColor }}
                />
              )}
            </div>
          ) : current.LAYOUTTYPE === "WEATHER" ? (
            <div className="w-full h-full flex flex-col justify-between p-12 bg-gradient-to-br from-[#0c3e25] via-[#135133] to-[#0a2918] text-white">
              {/* Header */}
              <div className="flex justify-between items-center border-b border-white/10 pb-6">
                <div>
                  <h1 className="text-4xl font-extrabold tracking-wider text-white/95">PREVISÃO DO TEMPO</h1>
                  <p className="text-xl text-[#a2d43e] font-semibold">CMSO — Unidade {unidade}</p>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold tracking-tight">
                    {new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                  </div>
                  <div className="text-base text-white/60">
                    {new Date().toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" })}
                  </div>
                </div>
              </div>

              {/* Main Content */}
              {weatherData ? (
                <div className="flex-1 grid grid-cols-1 lg:grid-cols-5 gap-12 items-center py-8">
                  {/* Left: Temp atual & Info */}
                  <div className="lg:col-span-3 flex flex-col justify-center space-y-8">
                    <div className="flex items-center gap-10">
                      {/* Icon switcher */}
                      <div className="w-28 h-28 rounded-3xl bg-white/5 flex items-center justify-center text-yellow-400">
                        {weatherData.condition_slug === "rain" || weatherData.condition_slug === "storm" ? (
                          <CloudRain size={72} className="text-blue-300 animate-pulse" />
                        ) : weatherData.condition_slug === "cloud" || weatherData.condition_slug === "cloudly" ? (
                          <Cloud size={72} className="text-gray-200 animate-pulse" />
                        ) : (
                          <Sun size={72} className="text-[#a2d43e] animate-pulse" />
                        )}
                      </div>
                      <div>
                        <div className="text-9xl font-black tracking-tighter flex items-start">
                          {weatherData.temp}
                          <span className="text-5xl font-normal text-white/70">°C</span>
                        </div>
                        <div className="text-3xl font-bold capitalize text-white/90">
                          {weatherData.description}
                        </div>
                      </div>
                    </div>

                    {/* Extra specs (Aumentado para melhor leitura) */}
                    <div className="grid grid-cols-2 gap-6 w-full max-w-lg bg-white/5 p-6 rounded-3xl border border-white/10">
                      <div className="flex items-center gap-4">
                        <Droplets className="text-[#a2d43e]" size={32} />
                        <div>
                          <div className="text-sm text-white/60">Umidade</div>
                          <div className="text-2xl font-black">{weatherData.humidity}%</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <Wind className="text-[#a2d43e]" size={32} />
                        <div>
                          <div className="text-sm text-white/60">Vento</div>
                          <div className="text-2xl font-black">{weatherData.wind_speedy}</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right: Próximos 3 dias (Aumentado para melhor leitura) */}
                  <div className="lg:col-span-2 flex flex-col justify-center space-y-6">
                    <h2 className="text-2xl font-black tracking-wider text-[#a2d43e] flex items-center gap-3">
                      <Calendar size={24} />
                      PREVISÃO
                    </h2>
                    <div className="space-y-4">
                      {weatherData.forecast && weatherData.forecast.slice(1, 4).map((day: any, i: number) => (
                        <div key={i} className="flex justify-between items-center bg-white/5 hover:bg-white/10 transition-colors p-6 rounded-2xl border border-white/5">
                          <div>
                            <div className="font-extrabold text-lg capitalize">{day.weekday} ({day.date})</div>
                            <div className="text-base text-white/60">{day.description}</div>
                          </div>
                          <div className="text-right flex flex-col items-end">
                            <div className="text-xl font-black text-red-300">{day.max}° <span className="text-xs text-white/50 font-normal">MÁX</span></div>
                            <div className="text-base font-bold text-blue-300">{day.min}° <span className="text-xs text-white/50 font-normal">MÍN</span></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex-1 flex items-center justify-center">
                  <div className="flex flex-col items-center gap-3 text-white/60">
                    <Thermometer className="animate-bounce text-[#a2d43e]" size={56} />
                    <span className="text-lg">Carregando previsão do tempo...</span>
                  </div>
                </div>
              )}

              {/* Footer */}
              <div className="text-center border-t border-white/10 pt-4 text-xs text-white/30 font-medium">
                CMSO Ocupacional · Todos os direitos reservados
              </div>
            </div>
          ) : (
            <div className="w-full h-full flex flex-col lg:flex-row">
              <div className="flex-1 flex flex-col justify-center p-8 md:p-12 lg:p-16 xl:p-24">
                {current.TITLE && (
                  <h1
                    className="text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold mb-6 leading-tight"
                    style={{ color: textColor, fontFamily }}
                  >
                    {current.TITLE}
                  </h1>
                )}
                {current.BODYTEXT && (
                  <p
                    className="text-lg md:text-xl lg:text-2xl xl:text-3xl leading-relaxed max-w-[80%] whitespace-pre-line"
                    style={{ color: bodyTextColor, fontFamily }}
                  >
                    {current.BODYTEXT}
                  </p>
                )}
              </div>

              {current.IMAGEURL && (
                <div className="flex-1 overflow-hidden">
                  <img
                    alt={current.TITLE || "Mural"}
                    className="w-full h-full object-cover"
                    src={current.IMAGEURL}
                  />
                </div>
              )}
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
