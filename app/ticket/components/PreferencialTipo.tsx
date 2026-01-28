// PreferencialTipo.tsx
import { COLOR_PALETTE, PREFERENCIAL_OPTIONS } from "@/config/constants";
import { Button } from "@heroui/button";
import { motion, AnimatePresence } from "framer-motion";
import { UserPlusIcon, ArrowLeft } from "lucide-react";
import React, { useState } from "react";

// Componente para seleção do tipo preferencial
const PreferencialTipo = ({
  onSelect,
  onBack,
}: {
  onSelect: (tipoPreferencial: string) => void;
  onBack: () => void;
}) => {
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleOptionClick = (option: string) => {
    setSelectedOption(option);
    setIsSubmitting(true);
    
    // Pequeno delay para mostrar feedback visual
    setTimeout(() => {
      onSelect(option);
      setIsSubmitting(false);
    }, 400);
  };

  const getIconColor = (option: string) => {
    if (selectedOption === option) {
      return "text-white";
    }
    return "text-white/90";
  };

  const getButtonBackground = (option: string) => {
    if (selectedOption === option) {
      return `linear-gradient(135deg, ${COLOR_PALETTE.dark} 0%, ${COLOR_PALETTE.primary} 100%)`;
    }
    return `linear-gradient(135deg, ${COLOR_PALETTE.accent} 0%, #7a9c8a 100%)`;
  };

  return (
    <motion.div
      animate={{ 
        opacity: 1, 
        scale: 1,
        transition: {
          duration: 0.5,
          ease: [0.43, 0.13, 0.23, 0.96] // Curva easing mais suave
        }
      }}
      className="w-full max-w-sm sm:max-w-2xl md:max-w-4xl mx-2"
      exit={{ 
        opacity: 0, 
        scale: 0.95,
        transition: {
          duration: 0.4,
          ease: "easeInOut"
        }
      }}
      initial={{ 
        opacity: 0, 
        scale: 0.95,
        y: 20
      }}
      transition={{
        duration: 0.5,
        ease: [0.43, 0.13, 0.23, 0.96]
      }}
    >
      <div
        className="p-4 md:p-6 lg:p-8 rounded-2xl shadow-lg border relative overflow-hidden"
        style={{
          backgroundColor: COLOR_PALETTE.background,
          borderColor: COLOR_PALETTE.primary,
        }}
      >
        {/* Background decorativo sutil */}
        <div 
          className="absolute inset-0 opacity-5"
          style={{
            background: `radial-gradient(circle at 30% 20%, ${COLOR_PALETTE.primary} 0%, transparent 50%)`
          }}
        />

        <motion.div
          animate={{ 
            opacity: 1,
            y: 0
          }}
          className="text-center mb-6 md:mb-8 lg:mb-10 relative z-10"
          initial={{ 
            opacity: 0,
            y: -20
          }}
          transition={{ 
            delay: 0.1,
            duration: 0.4,
            ease: "easeOut"
          }}
        >
          <h2
            className="text-xl md:text-2xl lg:text-3xl font-bold mb-2"
            style={{ color: COLOR_PALETTE.text }}
          >
            Selecione o tipo preferencial
          </h2>
          <p
            className="text-xs md:text-sm lg:text-base"
            style={{ color: COLOR_PALETTE.gray }}
          >
            Escolha abaixo a opção que melhor se aplica
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4 lg:gap-6 mb-6 md:mb-8 lg:mb-10 relative z-10">
          <AnimatePresence>
            {PREFERENCIAL_OPTIONS.map((option, index) => (
              <motion.div
                key={option}
                animate={{ 
                  opacity: 1, 
                  scale: 1,
                  y: 0
                }}
                className="flex"
                exit={{ 
                  opacity: 0,
                  scale: 0.9,
                  transition: {
                    duration: 0.2
                  }
                }}
                initial={{ 
                  opacity: 0, 
                  scale: 0.9,
                  y: 20
                }}
                transition={{ 
                  duration: 0.4,
                  delay: index * 0.05,
                  ease: "backOut"
                }}
                whileHover={{ 
                  scale: 1.03,
                  transition: {
                    duration: 0.2,
                    ease: "easeOut"
                  }
                }}
                whileTap={{ 
                  scale: 0.97,
                  transition: {
                    duration: 0.1
                  }
                }}
              >
                <Button
                  className="flex flex-col items-center justify-center p-4 md:p-6 lg:p-8 h-32 sm:h-36 md:h-40 w-full text-sm md:text-base lg:text-lg font-bold text-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 relative overflow-hidden group"
                  disabled={isSubmitting}
                  style={{
                    background: getButtonBackground(option),
                  }}
                  onClick={() => handleOptionClick(option)}
                >
                  {/* Efeito de overlay no hover */}
                  <div className="absolute inset-0 bg-white/0 group-hover:bg-white/10 transition-all duration-300" />
                  
                  {/* Efeito de brilho na seleção */}
                  {selectedOption === option && (
                    <motion.div
                      animate={{
                        scale: [1, 1.2, 1],
                        opacity: [0.3, 0.1, 0]
                      }}
                      className="absolute inset-0 bg-white/30 rounded-2xl"
                      initial={false}
                      transition={{
                        duration: 0.6,
                        ease: "easeOut"
                      }}
                    />
                  )}

                  <motion.div
                    animate={{ 
                      scale: selectedOption === option ? 1.1 : 1,
                      rotate: selectedOption === option ? [0, 5, -5, 0] : 0
                    }}
                    className="mb-3 relative"
                    transition={{
                      duration: 0.3,
                      ease: "easeOut"
                    }}
                  >
                    <UserPlusIcon 
                      className={`w-10 h-10 md:w-12 md:h-12 lg:w-14 lg:h-14 transition-all duration-300 ${getIconColor(option)}`}
                    />
                    
                    {/* Indicador de seleção */}
                    {selectedOption === option && (
                      <motion.div
                        animate={{
                          scale: [0, 1],
                          opacity: [0, 1]
                        }}
                        className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-white flex items-center justify-center"
                        initial={false}
                        transition={{
                          duration: 0.3,
                          ease: "easeOut"
                        }}
                      >
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLOR_PALETTE.primary }} />
                      </motion.div>
                    )}
                  </motion.div>
                  
                  <motion.span
                    animate={{
                      scale: selectedOption === option ? 1.05 : 1
                    }}
                    className="text-center leading-tight text-xs md:text-sm lg:text-base relative z-10 transition-all duration-300"
                  >
                    {option}
                  </motion.span>

                  {/* Efeito de loading quando selecionado */}
                  {selectedOption === option && isSubmitting && (
                    <motion.div
                      animate={{
                        rotate: 360
                      }}
                      className="absolute bottom-4 right-4 w-6 h-6 rounded-full border-2 border-white/30 border-t-white"
                      transition={{
                        duration: 1,
                        repeat: Infinity,
                        ease: "linear"
                      }}
                    />
                  )}
                </Button>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        <motion.div
          animate={{ 
            opacity: 1,
            y: 0
          }}
          className="flex justify-center relative z-10"
          initial={{ 
            opacity: 0,
            y: 20
          }}
          transition={{ 
            delay: 0.3,
            duration: 0.4,
            ease: "easeOut"
          }}
        >
          <Button
            className="px-6 py-3 md:px-8 md:py-4 rounded-xl border text-sm md:text-base font-bold group transition-all duration-300"
            disabled={isSubmitting}
            style={{
              backgroundColor: COLOR_PALETTE.primary,
              color: "white",
              borderColor: COLOR_PALETTE.accent,
            }}
            onClick={onBack}
          >
            <motion.div
              animate={{
                x: [0, -3, 0]
              }}
              className="flex items-center"
              transition={{
                duration: 2,
                repeat: Infinity,
                repeatType: "reverse"
              }}
            >
              <ArrowLeft className="h-4 w-4 mr-2 group-hover:-translate-x-1 transition-transform duration-300" />
              Voltar
            </motion.div>
          </Button>
        </motion.div>

        {/* Feedback de loading */}
        <AnimatePresence>
          {isSubmitting && selectedOption && (
            <motion.div
              animate={{ 
                opacity: 1,
                scale: 1
              }}
              className="absolute inset-0 bg-black/10 backdrop-blur-[1px] flex items-center justify-center rounded-2xl"
              exit={{ 
                opacity: 0,
                scale: 0.9
              }}
              initial={{ 
                opacity: 0,
                scale: 0.9
              }}
              transition={{
                duration: 0.3
              }}
            >
              <motion.div
                animate={{
                  scale: [1, 1.1, 1],
                  opacity: [0.7, 1, 0.7]
                }}
                className="text-center p-4"
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              >
                <div className="w-12 h-12 rounded-full border-4 border-white/30 border-t-white mx-auto mb-2" />
                <p 
                  className="text-white font-semibold"
                  style={{ textShadow: '0 2px 4px rgba(0,0,0,0.3)' }}
                >
                  Processando...
                </p>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

export default React.memo(PreferencialTipo);