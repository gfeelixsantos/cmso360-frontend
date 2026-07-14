"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Image } from "@heroui/react";
import { Monitor } from "lucide-react";
import { MuralItem } from "@/lib/mural/types";
import { SERVICES_KEY } from "@/config/constants";

export default function MuralPage() {
  const [murais, setMurais] = useState<MuralItem[]>([]);
  const [index, setIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [activated, setActivated] = useState(false);
  const [isLiberado, setIsLiberado] = useState(false);
  const [serialInput, setSerialInput] = useState("");
  const timerRef = useRef<NodeJS.Timeout>();

  const fetchMurais = useCallback(async () => {
    try {
      const res = await fetch("/api/mural/ativos");
      if (!res.ok) throw new Error("Erro ao buscar murais");
      const data = await res.json();
      if (Array.isArray(data)) {
        setMurais(data);
        setError(false);
      }
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem("mural_validate");
    if (saved === "true") {
      setIsLiberado(true);
      fetchMurais();
    }
  }, [fetchMurais]);

  useEffect(() => {
    if (!isLiberado) return;
    fetchMurais();
  }, [isLiberado, fetchMurais]);

  const validarAcesso = () => {
    if (serialInput === SERVICES_KEY) {
      setIsLiberado(true);
      localStorage.setItem("mural_validate", "true");
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

    const duration = 8000;

    timerRef.current = setTimeout(() => {
      setIndex((prev) => (prev + 1) % murais.length);
    }, duration);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
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
      <div className="fixed inset-0 flex items-center justify-center bg-black">
        <div className="w-12 h-12 border-4 border-white/30 border-t-white rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="fixed inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-gray-900 to-gray-800 text-white gap-4">
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
      <div className="fixed inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-gray-900 to-gray-800 text-white gap-4">
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

  const current = murais[index];
  const styles = current.STYLES || {};
  const fontFamily = styles.FONTFAMILY || "Inter";
  const bgColor = styles.BACKGROUNDCOLOR || "#1a1a2e";
  const textColor = styles.TEXTCOLOR || "#ffffff";
  const bodyTextColor = styles.BODYTEXTCOLOR || textColor;

  if (current.LAYOUTTYPE === 'FULL_IMAGE') {
    return (
      <div className="fixed inset-0 overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={current.id}
            animate={{ opacity: 1, scale: 1 }}
            className="absolute inset-0"
            exit={{ opacity: 0, scale: 1.05 }}
            initial={{ opacity: 0, scale: 1.05 }}
            transition={{ duration: 0.8, ease: "easeInOut" }}
          >
            <Image
              removeWrapper
              alt={current.TITLE || "Mural"}
              className="w-full h-full object-cover"
              src={current.IMAGEURL || ""}
              style={{ backgroundColor: bgColor }}
            />
            {current.TITLE && (
              <div
                className="absolute inset-x-0 bottom-0 p-8 pb-12"
                style={{
                  background: `linear-gradient(transparent, ${bgColor}cc)`,
                }}
              >
                <h1
                  className="text-5xl md:text-6xl font-bold text-center"
                  style={{
                    color: textColor,
                    fontFamily,
                  }}
                >
                  {current.TITLE}
                </h1>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 overflow-hidden"
      style={{ backgroundColor: bgColor }}
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={current.id}
          animate={{ opacity: 1, x: 0 }}
          className="absolute inset-0 flex flex-col lg:flex-row"
          exit={{ opacity: 0, x: -80 }}
          initial={{ opacity: 0, x: 80 }}
          transition={{ duration: 0.6, ease: "easeInOut" }}
        >
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
                className="text-lg md:text-xl lg:text-2xl xl:text-3xl leading-relaxed max-w-3xl"
                style={{ color: bodyTextColor, fontFamily }}
              >
                {current.BODYTEXT}
              </p>
            )}
          </div>

          {current.IMAGEURL && (
            <div className="flex-1 flex items-center justify-center">
              <div className="w-full h-full">
                <Image
                  removeWrapper
                  alt={current.TITLE || "Mural"}
                  className="w-full h-full object-cover"
                  src={current.IMAGEURL}
                />
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
