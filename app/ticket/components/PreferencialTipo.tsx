// PreferencialTipo.tsx
import { Button } from "@heroui/button";
import { motion, AnimatePresence } from "framer-motion";
import { UserPlusIcon, ArrowLeft, CheckCircle } from "lucide-react";
import React, { useState } from "react";

import { COLOR_PALETTE, PREFERENCIAL_OPTIONS } from "@/config/constants";

// Animações corporativas mais elegantes
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      when: "beforeChildren",
      staggerChildren: 0.08,
      duration: 0.6,
      ease: [0.25, 0.1, 0.25, 1], // Cubic-bezier mais suave (ease-in-out)
    },
  },
  exit: {
    opacity: 0,
    transition: {
      when: "afterChildren",
      staggerChildren: 0.05,
      staggerDirection: -1,
      duration: 0.5,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: [0.25, 0.1, 0.25, 1],
    },
  },
  exit: {
    opacity: 0,
    y: -10,
    transition: {
      duration: 0.3,
    },
  },
};

const buttonHoverVariants = {
  initial: { scale: 1, boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1)" },
  hover: {
    scale: 1.02,
    boxShadow: "0 20px 30px -8px rgba(0, 0, 0, 0.15)",
    transition: {
      duration: 0.3,
      ease: [0.25, 0.1, 0.25, 1],
    },
  },
  tap: {
    scale: 0.98,
    boxShadow: "0 5px 15px -3px rgba(0, 0, 0, 0.1)",
    transition: {
      duration: 0.1,
    },
  },
};

const PreferencialTipo = ({
  onSelect,
  onBack,
}: {
  onSelect: (tipoPreferencial: string) => void;
  onBack: () => void;
}) => {
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hoveredOption, setHoveredOption] = useState<string | null>(null);

  const handleOptionClick = (option: string) => {
    setSelectedOption(option);
    setIsSubmitting(true);

    // Pequeno delay para mostrar feedback visual
    setTimeout(() => {
      onSelect(option);
      setIsSubmitting(false);
    }, 600); // Aumentado para uma transição mais suave
  };

  const getIconColor = (option: string) => {
    if (selectedOption === option) {
      return "text-white";
    }
    if (hoveredOption === option) {
      return "text-white";
    }

    return "text-white/90";
  };

  const getButtonBackground = (option: string) => {
    if (selectedOption === option) {
      return `linear-gradient(145deg, ${COLOR_PALETTE.primary}80 0%, ${COLOR_PALETTE.primary} 100%)`;
    }
    if (hoveredOption === option) {
      return `linear-gradient(145deg, ${COLOR_PALETTE.accent} 0%, ${COLOR_PALETTE.primary} 100%)`;
    }

    return `linear-gradient(145deg, ${COLOR_PALETTE.accent}80 0%, ${COLOR_PALETTE.primary}80 100%)`;
  };

  return (
    <motion.div
      animate="visible"
      className="w-full max-w-sm sm:max-w-2xl md:max-w-4xl mx-2"
      exit="exit"
      initial="hidden"
      variants={containerVariants}
    >
      <div
        className="p-6 md:p-8 lg:p-10 rounded-2xl shadow-xl border relative overflow-hidden backdrop-blur-sm"
        style={{
          backgroundColor: `${COLOR_PALETTE.background}CC`,
          borderColor: `${COLOR_PALETTE.primary}40`,
          backdropFilter: "blur(10px)",
        }}
      >
        {/* Gradiente de fundo elegante */}
        <div
          className="absolute inset-0 opacity-10"
          style={{
            background: `radial-gradient(circle at 50% 0%, ${COLOR_PALETTE.primary} 0%, transparent 60%),
                        radial-gradient(circle at 0% 100%, ${COLOR_PALETTE.accent} 0%, transparent 60%)`,
          }}
        />

        {/* Linhas decorativas sutis */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
        <div className="absolute bottom-0 right-0 w-full h-1 bg-gradient-to-r from-transparent via-primary/20 to-transparent rotate-180" />

        <motion.div
          className="text-center mb-8 md:mb-10 lg:mb-12 relative z-10"
          variants={itemVariants}
        >
          <motion.h2
            animate={{ opacity: 1, y: 0 }}
            className="text-2xl md:text-3xl lg:text-4xl font-light mb-3 tracking-tight"
            initial={{ opacity: 0, y: -10 }}
            style={{ color: COLOR_PALETTE.text }}
            transition={{ delay: 0.1, duration: 0.6 }}
          >
            Atendimento{" "}
            <span
              className="font-semibold"
              style={{ color: COLOR_PALETTE.primary }}
            >
              Preferencial
            </span>
          </motion.h2>
          <motion.p
            animate={{ opacity: 1 }}
            className="text-sm md:text-base lg:text-lg font-light"
            initial={{ opacity: 0 }}
            style={{ color: COLOR_PALETTE.gray }}
            transition={{ delay: 0.2, duration: 0.6 }}
          >
            Selecione uma das opções abaixo para continuar
          </motion.p>

          {/* Indicador de progresso sutil */}
          <motion.div
            animate={{ width: 80, opacity: 1 }}
            className="w-20 h-1 mx-auto mt-4 rounded-full overflow-hidden"
            initial={{ width: 0, opacity: 0 }}
            style={{ backgroundColor: `${COLOR_PALETTE.primary}20` }}
            transition={{ delay: 0.3, duration: 0.8 }}
          >
            <motion.div
              animate={{ width: "100%" }}
              className="h-full rounded-full"
              initial={{ width: "0%" }}
              style={{ backgroundColor: COLOR_PALETTE.primary }}
              transition={{ delay: 0.4, duration: 1, ease: "easeInOut" }}
            />
          </motion.div>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5 lg:gap-6 mb-8 md:mb-10 lg:mb-12 relative z-10">
          <AnimatePresence mode="wait">
            {PREFERENCIAL_OPTIONS.map((option, index) => (
              <motion.div
                key={option}
                className="flex"
                custom={index}
                variants={itemVariants}
                onHoverEnd={() => setHoveredOption(null)}
                onHoverStart={() => setHoveredOption(option)}
              >
                <motion.div
                  className="w-full"
                  initial="initial"
                  variants={buttonHoverVariants}
                  whileHover="hover"
                  whileTap="tap"
                >
                  <Button
                    className="flex flex-col items-center justify-center p-6 md:p-8 lg:p-10 h-40 sm:h-44 md:h-48 w-full text-base md:text-lg lg:text-xl font-medium text-white rounded-xl shadow-lg relative overflow-hidden group"
                    disabled={isSubmitting}
                    style={{
                      background: getButtonBackground(option),
                      backdropFilter: "blur(5px)",
                    }}
                    onClick={() => handleOptionClick(option)}
                  >
                    {/* Efeito de brilho suave no hover */}
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
                      initial={{ x: "-100%" }}
                      transition={{ duration: 0.8, ease: "easeInOut" }}
                      whileHover={{ x: "100%" }}
                    />

                    {/* Efeito de borda interna */}
                    <div className="absolute inset-0 rounded-xl border border-white/10" />

                    {/* Ícone com animação elegante */}
                    <motion.div
                      animate={{
                        scale:
                          selectedOption === option
                            ? 1
                            : hoveredOption === option
                              ? 1.05
                              : 1,
                        y: selectedOption === option ? -2 : 0,
                      }}
                      className="mb-4 relative"
                      transition={{ duration: 0.3 }}
                    >
                      <UserPlusIcon
                        className={`w-12 h-12 md:w-14 md:h-14 lg:w-16 lg:h-16 transition-all duration-500 ${getIconColor(option)}`}
                        strokeWidth={1.5}
                      />

                      {/* Indicador de seleção elegante */}
                      {selectedOption === option && (
                        <motion.div
                          animate={{ scale: 1, opacity: 1 }}
                          className="absolute -top-2 -right-2"
                          exit={{ scale: 0, opacity: 0 }}
                          initial={{ scale: 0, opacity: 0 }}
                        >
                          <div className="relative">
                            <motion.div
                              animate={{ scale: [1, 1.5, 1] }}
                              className="absolute inset-0 rounded-full"
                              style={{ backgroundColor: COLOR_PALETTE.primary }}
                              transition={{
                                duration: 1,
                                repeat: Infinity,
                                ease: "easeInOut",
                              }}
                            />
                            <CheckCircle className="w-6 h-6 text-white relative z-10" />
                          </div>
                        </motion.div>
                      )}
                    </motion.div>

                    {/* Título da opção */}
                    <motion.span
                      animate={{
                        scale: selectedOption === option ? 1.02 : 1,
                        y: selectedOption === option ? 1 : 0,
                      }}
                      className="text-center leading-tight font-medium relative z-10 px-2"
                      style={{ letterSpacing: "0.02em" }}
                    >
                      {option}
                    </motion.span>

                    {/* Descrição sutil */}
                    <motion.span
                      className="text-xs opacity-0 group-hover:opacity-70 transition-opacity duration-300 mt-1"
                      style={{ letterSpacing: "0.01em" }}
                    >
                      Clique para selecionar
                    </motion.span>

                    {/* Efeito de loading elegante quando selecionado */}
                    {selectedOption === option && isSubmitting && (
                      <motion.div
                        animate={{ opacity: 1, scale: 1 }}
                        className="absolute bottom-3 right-3"
                        exit={{ opacity: 0, scale: 0 }}
                        initial={{ opacity: 0, scale: 0 }}
                      >
                        <div className="relative">
                          <motion.div
                            animate={{ rotate: 360 }}
                            className="w-5 h-5 rounded-full border-2"
                            style={{
                              borderColor: `${COLOR_PALETTE.primary}40`,
                              borderTopColor: "white",
                            }}
                            transition={{
                              duration: 1,
                              repeat: Infinity,
                              ease: "linear",
                            }}
                          />
                        </div>
                      </motion.div>
                    )}
                  </Button>
                </motion.div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        <motion.div
          className="flex justify-center relative z-10"
          variants={itemVariants}
        >
          <motion.div
            transition={{ duration: 0.2 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Button
              className="px-8 py-4 rounded-xl text-sm md:text-base font-medium group transition-all duration-300 relative overflow-hidden"
              disabled={isSubmitting}
              style={{
                backgroundColor: "transparent",
                color: COLOR_PALETTE.primary,
                border: `1px solid ${COLOR_PALETTE.primary}40`,
              }}
              onClick={onBack}
            >
              {/* Efeito de hover no botão voltar */}
              <motion.div
                className="absolute inset-0"
                initial={{ opacity: 0 }}
                style={{ backgroundColor: COLOR_PALETTE.primary }}
                transition={{ duration: 0.3 }}
                whileHover={{ opacity: 0.05 }}
              />

              <div className="flex items-center relative z-10">
                <motion.div
                  animate={{ x: hoveredOption ? -2 : 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <ArrowLeft className="h-4 w-4 mr-2 transition-transform duration-300 group-hover:-translate-x-1" />
                </motion.div>
                Voltar
              </div>
            </Button>
          </motion.div>
        </motion.div>

        {/* Overlay de loading elegante */}
        <AnimatePresence>
          {isSubmitting && selectedOption && (
            <motion.div
              animate={{ opacity: 1 }}
              className="absolute inset-0 bg-black/20 backdrop-blur-md flex items-center justify-center rounded-2xl"
              exit={{ opacity: 0 }}
              initial={{ opacity: 0 }}
              transition={{ duration: 0.4 }}
            >
              <motion.div
                animate={{ scale: 1, opacity: 1 }}
                className="text-center p-6 rounded-2xl"
                exit={{ scale: 0.9, opacity: 0 }}
                initial={{ scale: 0.9, opacity: 0 }}
                style={{ backgroundColor: `${COLOR_PALETTE.background}CC` }}
                transition={{ duration: 0.3 }}
              >
                <div className="relative">
                  <motion.div
                    animate={{ rotate: 360 }}
                    className="w-16 h-16 rounded-full border-3 mx-auto mb-4"
                    style={{
                      borderColor: `${COLOR_PALETTE.primary}30`,
                      borderTopColor: COLOR_PALETTE.primary,
                    }}
                    transition={{
                      duration: 1.2,
                      repeat: Infinity,
                      ease: "linear",
                    }}
                  />
                  <motion.div
                    animate={{ opacity: [0, 1, 0] }}
                    className="absolute inset-0 flex items-center justify-center"
                    initial={{ opacity: 0 }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <UserPlusIcon
                      className="w-6 h-6"
                      strokeWidth={1.5}
                      style={{ color: COLOR_PALETTE.primary }}
                    />
                  </motion.div>
                </div>
                <motion.p
                  animate={{ opacity: [0.7, 1, 0.7] }}
                  className="font-medium text-sm"
                  style={{ color: COLOR_PALETTE.text }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                >
                  Processando sua solicitação...
                </motion.p>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

export default React.memo(PreferencialTipo);
