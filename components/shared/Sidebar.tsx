"use client";

import { useCallback, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Plus, Wifi, WifiOff, Users } from "lucide-react";
import { Button } from "@heroui/react";

import AgendamentosList from "../../app/recepcao/components/AgendamentosList";

import { StatusBadge } from "./StatusBadge";

import {
  EXAMES_LIST,
  SALAS_EXAMES,
  SALAS_RECEPCAO,
  UNIDADES_ATENDIMENTO,
} from "@/config/constants";
import { Scheduling } from "@/lib/scheduling/interface/scheduling";
import { Ticket } from "@/lib/ticket/ticket";

interface SidebarRecepcaoProps {
  unidadeSelecionada: string;
  setUnidadeSelecionada: (value: string) => void;
  salaSelecionada: string;
  setSalaSelecionada: (value: string) => void;
  statusSelecionado: string;
  setStatusSelecionado: (value: string) => void;
  conectado: boolean;
  handleConectar: () => void;
  agendadosFiltrados: Scheduling[];
  onLoading: boolean;
  setTicketSelecionado: (ticket: Ticket | null) => void;
  onHandleModal: (state: boolean) => void;
  exameSelecionado: string;
  onHandleExameSelecionado: (exame: string) => void;
  pscStatusElement?: React.ReactNode;
  pscAuthButtonElement?: React.ReactNode;
  isReconnecting?: boolean;
}

/* SelectField CMSO */
const SelectField = ({
  id,
  label,
  value,
  options,
  onChange,
  conectado,
}: {
  id: string;
  label: string;
  value: string;
  options: { label: string; value: string }[];
  onChange: (value: string) => void;
  conectado: boolean;
}) => (
  <div className="space-y-2">
    <label className="text-sm font-medium text-gray-700" htmlFor={id}>
      {label}
      {conectado && (
        <span className="text-xs text-gray-500 ml-1">(somente leitura)</span>
      )}
    </label>

    <div className="relative">
      <select
        aria-label={label}
        className={`w-full px-3 py-2.5 border rounded-xl text-sm shadow-sm focus:outline-none transition-colors appearance-none ${
          conectado
            ? "bg-gray-100 border-gray-300 text-gray-400 cursor-not-allowed"
            : "bg-white border-gray-300 text-gray-800 hover:border-[#104e35] focus:ring-2 focus:ring-[#4CAF50]"
        }`}
        disabled={conectado}
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>

      <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
        <svg
          className="w-4 h-4 text-gray-500"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            d="M19 9l-7 7-7-7"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
          />
        </svg>
      </div>
    </div>
  </div>
);

/* Botão Novo Atendimento */
const ActionButtonGroup = ({
  onAddAtendimento,
}: {
  onAddAtendimento: () => void;
}) => (
  <div className="flex flex-col gap-2 mt-4">
    <Button
      aria-label="Iniciar atendimento do dia"
      className="flex items-center justify-center gap-2 py-2.5 rounded-xl font-semibold shadow-md bg-gradient-to-r from-[#104e35] to-[#4CAF50] text-white hover:opacity-90 focus:ring-2 focus:ring-[#104e35]"
      onPress={onAddAtendimento}
    >
      <Users className="h-4 w-4" />
      <span>Novo Atendimento</span>
      <Plus className="h-3 w-3 ml-auto" />
    </Button>
  </div>
);

export function SidebarRecepcao({
  unidadeSelecionada,
  setUnidadeSelecionada,
  salaSelecionada,
  setSalaSelecionada,
  conectado,
  handleConectar,
  agendadosFiltrados,
  onLoading,
  setTicketSelecionado,
  onHandleModal,
  exameSelecionado,
  onHandleExameSelecionado,
  pscStatusElement,
  isReconnecting = false,
  pscAuthButtonElement,
}: SidebarRecepcaoProps) {
  const pathname = usePathname();
  const [salaOpcoes, setSalaOpcoes] = useState<string[]>(SALAS_RECEPCAO);
  const [examesAtendimento, setExamesAtendimento] = useState<string[]>([]);

  /* Atualiza opções de sala + lista de exames */
  useEffect(() => {
    if (!pathname) return;

    const isAtendimento = pathname.includes("atendimento");

    setSalaOpcoes(isAtendimento ? SALAS_EXAMES : SALAS_RECEPCAO);

    setExamesAtendimento(
      Object.keys(EXAMES_LIST).sort((a, b) => a.localeCompare(b, "pt-BR")),
    );
  }, [pathname]);

  const handleAddAtendimento = useCallback(() => {
    setTicketSelecionado(null);
    onHandleModal(true);
  }, [setTicketSelecionado, onHandleModal]);

  return (
    <aside
      aria-label="Painel lateral de filtros e controles"
      className="w-68 bg-gradient-to-b from-white via-gray-50 to-green-50 border-r border-gray-200 shadow-lg h-full overflow-y-auto transition-all relative"
      role="complementary"
    >
      <main className="p-5 pt-6">
        {/* Header */}
        <header className="mb-6">
          <h2 className="text-lg font-bold text-[#104e35] mb-4">Controles</h2>

          <div className="flex flex-col gap-3">
            <div className="grid grid-cols-[85px_minmax(0,1fr)] items-center gap-x-2">
              <span className="text-sm font-medium text-gray-700 text-left">
                Servidor:
              </span>
              <div className="justify-self-end w-[150px]">
                <StatusBadge
                  className="!w-full justify-center"
                  color={
                    conectado && !onLoading
                      ? isReconnecting
                        ? "yellow"
                        : "green"
                      : "gray"
                  }
                  icon={
                    conectado && !onLoading && isReconnecting ? (
                      <div className="w-3 h-3 border-2 border-amber-300 border-t-amber-700 rounded-full animate-spin" />
                    ) : !conectado ? (
                      <WifiOff className="w-3 h-3" />
                    ) : undefined
                  }
                  label={
                    conectado && !onLoading
                      ? isReconnecting
                        ? "Reconectando..."
                        : "Conectado"
                      : "Desconectado"
                  }
                />
              </div>
            </div>

            {pscStatusElement && (
              <div className="grid grid-cols-[85px_minmax(0,1fr)] items-center gap-x-2">
                <span className="text-sm font-medium text-gray-700 text-left pt-1">
                  Assinatura:
                </span>
                <div className="justify-self-end w-[150px]">
                  {pscStatusElement}
                </div>
              </div>
            )}
          </div>
        </header>

        {/* Botão Autenticar Assinatura - abaixo da seção Assinatura */}
        {pscAuthButtonElement && (
          <div className="mb-4 w-full px-5">
            {pscAuthButtonElement}
          </div>
        )}

        {/* Filtros */}
        <section className="space-y-4 mb-6">
          {/* Unidade */}
          <SelectField
            conectado={conectado}
            id="unidade"
            label="Unidade"
            options={[
              { label: "Selecione uma unidade", value: "" },
              ...UNIDADES_ATENDIMENTO.map((u) => ({ label: u, value: u })),
            ]}
            value={unidadeSelecionada}
            onChange={setUnidadeSelecionada}
          />

          {/* Sala */}
          <SelectField
            conectado={conectado}
            id="sala"
            label="Sala"
            options={[
              { label: "Selecione uma sala", value: "" },
              ...salaOpcoes.map((s) => ({ label: s, value: s })),
            ]}
            value={salaSelecionada}
            onChange={setSalaSelecionada}
          />

          {/* Exames - aparece só no atendimento */}
          {pathname && pathname.includes("atendimento") && (
            <SelectField
              conectado={conectado}
              id="exames"
              label="Exames"
              options={[
                { label: "Selecione um exame", value: "" },
                ...examesAtendimento.map((s) => ({ label: s, value: s })),
              ]}
              value={exameSelecionado}
              onChange={(value) => {
                console.log("Sidebar selecionou exame:", value);
                onHandleExameSelecionado(value);
              }}
            />
          )}
        </section>

        {/* Botão Conectar */}
        <div className="mb-6">
          <Button
            aria-pressed={conectado}
            className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl font-semibold shadow-md transition-all ${
              conectado
                ? "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
                : "bg-gradient-to-r from-[#104e35] to-[#4CAF50] text-white hover:opacity-90"
            }`}
            disabled={onLoading}
            isLoading={onLoading}
            onPress={() => !onLoading && handleConectar()}
          >
            {onLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Conectando...
              </>
            ) : conectado ? (
              <>
                <WifiOff className="w-4 h-4" />
                Desconectar
              </>
            ) : (
              <>
                <Wifi className="w-4 h-4" />
                Conectar
              </>
            )}
          </Button>
        </div>

        {/* Botão Novo Atendimento - só na recepção */}
        {conectado && pathname?.includes("recepcao") && (
          <ActionButtonGroup onAddAtendimento={handleAddAtendimento} />
        )}

        {/* Lista de Agendamentos */}
        {conectado && (
          <aside aria-label="Lista de agendamentos" className="mt-6">
            <AgendamentosList
              agendadosFiltrados={agendadosFiltrados}
              conectado={conectado}
              unidadeSelecionada={unidadeSelecionada}
            />
          </aside>
        )}

        {/* Footer */}
        <footer className="mt-10 pt-4 border-t border-gray-200 mb-8">
          <p className="text-xs text-gray-500 text-center font-medium">
            Sistema <span className="text-[#104e35] font-bold">CMSO 360°</span>
          </p>
        </footer>
      </main>
    </aside>
  );
}
