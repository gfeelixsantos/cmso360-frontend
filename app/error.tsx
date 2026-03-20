"use client";

import { useEffect } from "react";
import { motion } from "framer-motion";
import { Button, Card, CardBody, CardHeader, Divider } from "@heroui/react";
import { RefreshCw, Home, AlertCircle, ChevronDown } from "lucide-react";
import Link from "next/link";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    /* eslint-disable no-console */
    console.error(error);
  }, [error]);

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-background px-6 py-24 sm:py-32 lg:px-8">
      {/* Background Decorative Elements */}
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(45%_45%_at_50%_50%,rgba(var(--heroui-danger-rgb),0.03)_0%,transparent_100%)]" />
      <div className="absolute right-1/2 bottom-1/2 -z-10 h-[400px] w-[400px] translate-x-1/2 translate-y-1/2 rounded-full bg-danger/5 blur-[120px]" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-lg text-center"
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
            className="flex items-center justify-center w-20 h-20 rounded-2xl bg-danger/10 text-danger"
          >
            <AlertCircle className="w-10 h-10" />
          </motion.div>
        </div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-base font-semibold text-danger"
        >
          Ops! Algo deu errado
        </motion.p>

        <motion.h1
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mt-4 text-3xl font-bold tracking-tight text-foreground sm:text-4xl"
        >
          Erro Inesperado
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-6 text-base leading-7 text-muted-foreground mx-auto"
        >
          Lamentamos o inconveniente. Ocorreu um erro ao processar sua solicitação.
        </motion.p>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <Button
            onPress={() => reset()}
            color="primary"
            variant="solid"
            size="lg"
            startContent={<RefreshCw className="w-4 h-4" />}
            className="font-medium shadow-lg shadow-primary/20 w-full sm:w-auto"
          >
            Tentar Novamente
          </Button>

          <Button
            as={Link}
            href="/"
            variant="flat"
            size="lg"
            startContent={<Home className="w-4 h-4" />}
            className="font-medium w-full sm:w-auto"
          >
            Página Inicial
          </Button>
        </motion.div>

        {process.env.NODE_ENV === "development" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="mt-12 text-left"
          >
            <Card className="bg-muted/50 border-none shadow-none">
              <CardBody className="py-2">
                <details className="group">
                  <summary className="flex cursor-pointer list-none items-center justify-between py-2 text-xs font-semibold text-muted-foreground transition-colors group-open:text-foreground">
                    <span>Detalhes do Erro (Desenvolvimento)</span>
                    <ChevronDown className="h-4 w-4 transition-transform group-open:rotate-180" />
                  </summary>
                  <pre className="mt-2 overflow-auto text-[10px] leading-relaxed text-danger/80 p-3 bg-background/50 rounded-lg border border-danger/10">
                    {error.message || "Sem mensagem de erro disponível"}
                    {error.stack && `\n\nStack Trace:\n${error.stack}`}
                  </pre>
                </details>
              </CardBody>
            </Card>
          </motion.div>
        )}
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.5 }}
        transition={{ delay: 1 }}
        className="absolute bottom-8 text-xs text-muted-foreground"
      >
        ID do Erro: {error.digest || "N/A"}
      </motion.div>
    </div>
  );
}

