"use client";

import { motion } from "framer-motion";
import { Database, Settings, Users, BarChart3 } from "lucide-react";
import { useState, useEffect } from "react";
import Image from "next/image";

// FEATURES — fora do componente (evita recriação)
const features = [
  {
    icon: Database,
    title: "Gestão Centralizada",
    description: "Todos os dados ocupacionais em um único sistema",
  },
  {
    icon: Users,
    title: "Controle de Acessos",
    description: "Permissões segmentadas por departamento",
  },
  {
    icon: BarChart3,
    title: "Relatórios Avançados",
    description: "Business Intelligence para tomada de decisão",
  },
  {
    icon: Settings,
    title: "Processos Otimizados",
    description: "Workflows automatizados e eficientes",
  },
];

export default function CMSO360Animation() {
  const [currentFeature, setCurrentFeature] = useState(0);

  // Timer mais leve (timeout ao invés de interval)
  useEffect(() => {
    const timer = setTimeout(() => {
      setCurrentFeature((prev) => (prev + 1) % features.length);
    }, 3000);
    return () => clearTimeout(timer);
  }, [currentFeature]);

  return (
    <div className="space-y-8">

      {/* Logo */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center"
      >
        <Image
          src="/images/logo.png"
          alt="CMSO 360 - Sistema Interno de Gestão"
          width={200}
          height={60}
          priority
          className="w-auto mx-auto"
        />
      </motion.div>

      {/* Área animada isolada */}
      <FeatureCarousel current={currentFeature} />

      {/* Indicadores */}
      <div className="flex justify-center space-x-2">
        {features.map((_, index) => (
          <motion.button
            key={index}
            onClick={() => setCurrentFeature(index)}
            className={`w-2 h-2 rounded-full transition-all duration-300 ${
              currentFeature === index ? "bg-[#104e35] w-6" : "bg-gray-300"
            }`}
            whileHover={{ scale: 1.15 }}
            whileTap={{ scale: 0.9 }}
          />
        ))}
      </div>

      {/* Rodapé */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.4 }}
        className="text-center"
      >
        <p className="text-sm text-gray-500">
          <span className="font-semibold text-[#104e35]">Versão Beta</span> • Última atualização: 10/2025
        </p>
      </motion.div>
    </div>
  );
}

function FeatureCarousel({ current }: { current: number }) {
  return (
    <div className="relative h-32">
      {features.map((feature, index) => {
        const Icon = feature.icon;

        return (
          <motion.div
            key={index}
            initial={{ opacity: 0, x: 15 }}
            animate={{
              opacity: current === index ? 1 : 0,
              x: current === index ? 0 : 15,
            }}
            transition={{ duration: 0.45 }}
            className={`absolute inset-0 flex items-center justify-center ${
              current === index ? "pointer-events-auto" : "pointer-events-none"
            }`}
          >
            <div className="text-center">
              <motion.div
                animate={{
                  scale: current === index ? 1 : 0.85,
                }}
                transition={{ duration: 0.45 }}
                className="w-16 h-16 bg-gradient-to-br from-[#104e35] to-[#a6ce39] rounded-full flex items-center justify-center mx-auto mb-3"
              >
                <Icon className="h-8 w-8 text-white" />
              </motion.div>

              <h3 className="font-semibold text-gray-800">{feature.title}</h3>
              <p className="text-sm text-gray-600 mt-1">{feature.description}</p>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
