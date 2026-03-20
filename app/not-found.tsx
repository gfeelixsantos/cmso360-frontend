"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@heroui/react";
import { Home, ArrowLeft, Search } from "lucide-react";

export default function NotFound() {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-background px-6 py-24 sm:py-32 lg:px-8">
      {/* Background Decorative Elements */}
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(45%_45%_at_50%_50%,rgba(var(--heroui-primary-rgb),0.05)_0%,transparent_100%)]" />
      <div className="absolute left-1/2 top-1/2 -z-10 h-[400px] w-[400px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/5 blur-[120px]" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center"
      >
        <div className="flex justify-center mb-8">
          <motion.div
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ 
              type: "spring",
              stiffness: 260,
              damping: 20,
              delay: 0.2 
            }}
            className="relative"
          >
            <div className="absolute inset-0 animate-ping rounded-full bg-primary/20" />
            <div className="relative flex items-center justify-center w-24 h-24 rounded-2xl bg-primary/10 text-primary">
              <Search className="w-12 h-12" />
            </div>
          </motion.div>
        </div>

        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-base font-semibold text-primary"
        >
          404 - Página não encontrada
        </motion.p>
        
        <motion.h1 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mt-4 text-3xl font-bold tracking-tight text-foreground sm:text-5xl"
        >
          Ops! Onde estamos?
        </motion.h1>
        
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-6 text-base leading-7 text-muted-foreground max-w-md mx-auto"
        >
          Lamentamos, mas não conseguimos encontrar a página que você está procurando. 
          Pode ser que o endereço tenha mudado ou a página tenha sido removida.
        </motion.p>

        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <Button
            as={Link}
            href="/"
            color="primary"
            variant="solid"
            size="lg"
            startContent={<Home className="w-4 h-4" />}
            className="font-medium shadow-lg shadow-primary/20 w-full sm:w-auto"
          >
            Voltar ao Início
          </Button>
          
          <Button
            as="button"
            onClick={() => window.history.back()}
            variant="flat"
            size="lg"
            startContent={<ArrowLeft className="w-4 h-4" />}
            className="font-medium w-full sm:w-auto"
          >
            Voltar Página
          </Button>
        </motion.div>
      </motion.div>

      {/* Subtle bottom text or links */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.5 }}
        transition={{ delay: 1 }}
        className="absolute bottom-8 text-xs text-muted-foreground"
      >
        © {new Date().getFullYear()} CMSO 360 - Sistema Médico Integrado
      </motion.div>
    </div>
  );
}
