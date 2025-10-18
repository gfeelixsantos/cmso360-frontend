"use client"

import { useCallback, useEffect, useState } from "react"
import { Plus, Wifi, WifiOff, Users } from "lucide-react"
import { Button, Chip } from "@heroui/react"


import { EXAMES_LIST, SALAS_EXAMES, SALAS_RECEPCAO, UNIDADES_ATENDIMENTO } from "@/config/constants"
import { Scheduling } from "@/lib/scheduling/interface/scheduling"
import { Ticket } from "@/lib/ticket/ticket"
import AgendamentosList from "./main/AgendamentosList"

interface SidebarRecepcaoProps {
  unidadeSelecionada: string
  setUnidadeSelecionada: (value: string) => void
  salaSelecionada: string
  setSalaSelecionada: (value: string) => void
  statusSelecionado: string
  setStatusSelecionado: (value: string) => void
  conectado: boolean
  handleConectar: () => void
  agendadosFiltrados: Scheduling[];
  onLoading: boolean
  setTicketSelecionado: (ticket: Ticket | null) => void
  onHandleModal:(state:boolean) => void
  exameSelecionado: string
  onHandleExameSelecionado: (exame: string) => void
}

/* 🔹 Status Badge elegante */
const StatusBadge = ({ conectado }: { conectado: boolean }) => (
  <Chip
    size="sm"
    variant="flat"
    className={`font-semibold px-3 py-1 rounded-full shadow-sm ${
      conectado 
        ? "bg-gradient-to-r from-[#104e35] to-[#4CAF50] text-white" 
        : "bg-gray-100 text-gray-600 border border-gray-300"
    }`}
  >
    <span className="flex items-center gap-1.5">
      <span className={`w-2 h-2 rounded-full ${conectado ? "bg-lime-300" : "bg-gray-400"}`} />
      {conectado ? "Conectado" : "Desconectado"}
    </span>
  </Chip>
)

/* 🔹 SelectField com estilo do CMSO 360 */
const SelectField = ({
  id,
  label,
  value,
  options,
  onChange,
  conectado,
}: {
  id: string
  label: string
  value: string
  options: { label: string; value: string }[]
  onChange: (value: string) => void
  conectado: boolean
}) => (
  <div className="space-y-2">
    <label
      htmlFor={id}
      className="text-sm font-medium text-gray-700"
    >
      {label}
      {conectado && (
        <span className="text-xs text-gray-500 ml-1">(somente leitura)</span>
      )}
    </label>
    <div className="relative">
      <select
        id={id}
        aria-label={label}
        disabled={conectado}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full px-3 py-2.5 border rounded-xl text-sm shadow-sm focus:outline-none transition-colors appearance-none ${
          conectado 
            ? "bg-gray-100 border-gray-300 text-gray-400 cursor-not-allowed" 
            : "bg-white border-gray-300 text-gray-800 hover:border-[#104e35] focus:ring-2 focus:ring-[#4CAF50]"
        }`}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value} disabled={!opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
        <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </div>
    </div>
  </div>
)

/* 🔹 Botão de ação elegante */
const ActionButtonGroup = ({ onAddAtendimento }: { onAddAtendimento: () => void }) => (
  <div className="flex flex-col gap-2 mt-4">
    <Button
      onPress={onAddAtendimento}
      className="flex items-center justify-center gap-2 py-2.5 rounded-xl font-semibold shadow-md bg-gradient-to-r from-[#104e35] to-[#4CAF50] text-white hover:opacity-90 focus:ring-2 focus:ring-[#104e35]"
      aria-label="Iniciar atendimento do dia"
    >
      <Users className="h-4 w-4" />
      <span>Novo Atendimento</span>
      <Plus className="h-3 w-3 ml-auto" />
    </Button>
  </div>
)

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
}: SidebarRecepcaoProps) {

  const [salaOpcoes, setSalaOpcoes] = useState<string[]>([]);
  const [examesAtendimento, setExamesAtendimento] = useState<string[]>([])


  useEffect(() => {
    location.pathname.includes("atendimento") ? setSalaOpcoes(SALAS_EXAMES) : setSalaOpcoes(SALAS_RECEPCAO);
    setExamesAtendimento(Object.keys(EXAMES_LIST).sort((a,b) => a.localeCompare(b, "pt-BR")))
  },[])

  const handleAddAtendimento = useCallback(() => {
    setTicketSelecionado(null)
    onHandleModal(true)
  }, [setTicketSelecionado, onHandleModal])

  return (
    <aside
      role="complementary"
      aria-label="Painel lateral de filtros e controles"
      className="w-68 bg-gradient-to-b from-white via-gray-50 to-green-50 border-r border-gray-200 shadow-lg fixed h-screen overflow-y-auto transition-all"
    >
      <main className="p-5 pt-6">
        {/* Header */}
        <header className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-bold text-[#104e35]">
              Controles
            </h2>
            <StatusBadge conectado={conectado && !onLoading} />
          </div>
        </header>

        {/* Filtros */}
        <section className="space-y-4 mb-6">
          <SelectField
            id="unidade"
            label="Unidade"
            value={unidadeSelecionada}
            conectado={conectado}
            onChange={setUnidadeSelecionada}
            options={[
              { label: "Selecione uma unidade", value: "" },
              ...UNIDADES_ATENDIMENTO.map((u) => ({ label: u, value: u })),
            ]}
          />

          <SelectField
            id="sala"
            label="Sala"
            value={salaSelecionada}
            conectado={conectado}
            onChange={setSalaSelecionada}
            options={[
              { label: "Selecione uma sala", value: "" },
              ...salaOpcoes.map((s) => ({ label: s, value: s })),
            ]}
          />

          {(location.pathname.includes("atendimento")) && (
            <SelectField
              id="exames"
              label="Exames"
              value={exameSelecionado}
              conectado={conectado}
              onChange={onHandleExameSelecionado}
              options={[
                { label: "Selecione um exame", value: "" },
                ...examesAtendimento.map((s) => ({ label: s, value: s })),
              ]}
            />
          )}
        </section>

        {/* Botão Conectar */}
        <div className="mb-6">
          <Button
            onPress={handleConectar}
            aria-pressed={conectado}
            isLoading={onLoading}
            className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl font-semibold shadow-md transition-all ${
              conectado
                ? "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
                : "bg-gradient-to-r from-[#104e35] to-[#4CAF50] text-white hover:opacity-90"
            }`}
            disabled={onLoading}
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

        {/* Botões de Ação */}
        {conectado && location.pathname.includes("recepcao") && (
          <ActionButtonGroup onAddAtendimento={handleAddAtendimento} />
        )}

        {/* Agendamentos */}
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
        <footer className="mt-10 pt-4 border-t border-gray-200">
          <p className="text-xs text-gray-500 text-center font-medium">
            Sistema <span className="text-[#104e35] font-bold">CMSO 360°</span>
          </p>
        </footer>
      </main>
    </aside>
  )
}
