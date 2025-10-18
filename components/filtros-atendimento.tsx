"use client"
import { Card, Button, Select, Input, Badge } from "@heroui/react"

import { MapPin, Activity, Stethoscope, Search, DoorOpen, Wifi, WifiOff, Users, Clock, CheckCircle } from "lucide-react"

interface FiltrosAtendimentoProps {
  onUnidadeChange: (unidade: string) => void
  onStatusChange: (status: string) => void
  onTipoExameChange: (tipo: string) => void
  onSalaChange: (sala: string) => void
  onBuscaChange: (busca: string) => void
  onConectar: () => void
  conectado: boolean
  unidadeSelecionada: string
  statusSelecionado: string
  tipoExameSelecionado: string
  salaSelecionada: string
  busca: string
  estatisticas: {
    aguardando: number
    emAtendimento: number
    finalizados: number
    total: number
  }
  tipoTela: "atendimento" | "recepcao"
}

const tiposExame = [
  "Exame Clínico",
  "Audiometria",
  "Acuidade Visual",
  "Eletrocardiograma (ECG)",
  "Eletroencefalograma (EEG)",
  "Laboratório",
  "Dinamometria",
  "Triagem",
  "Avaliação Psicossocial",
  "Espirometria",
]

const salas = [
  "SALA 1","SALA 2","SALA 3","SALA 4","SALA 5","SALA 6","SALA 6-A","SALA 6-B","SALA 6-C",
  "SALA 7","SALA 8","SALA 9","SALA 10","SALA 11","SALA 12"
]

export default function FiltrosAtendimento({
  onUnidadeChange,
  onStatusChange,
  onTipoExameChange,
  onSalaChange,
  onBuscaChange,
  onConectar,
  conectado,
  unidadeSelecionada,
  statusSelecionado,
  tipoExameSelecionado,
  salaSelecionada,
  busca,
  estatisticas,
  tipoTela,
}: FiltrosAtendimentoProps) {
  const filtrosAtivos = [
    unidadeSelecionada && { label: `Unidade: ${unidadeSelecionada}`, value: unidadeSelecionada },
    statusSelecionado && { label: `Status: ${statusSelecionado}`, value: statusSelecionado },
    tipoExameSelecionado && { label: `Exame: ${tipoExameSelecionado}`, value: tipoExameSelecionado },
    salaSelecionada && { label: `Sala: ${salaSelecionada}`, value: salaSelecionada },
    busca && { label: `Busca: ${busca}`, value: busca },
  ].filter(Boolean)

  return (
    <div className="space-y-6">
      {/* Filtros Principais */}
      <Card className="p-6 border-0 bg-white/95 backdrop-blur-sm shadow-lg">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {/* Unidade */}
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <MapPin className="h-4 w-4 text-primary" />
              <label className="text-sm font-medium text-foreground">Unidade</label>
            </div>
            <Select
              value={unidadeSelecionada || "Todas as unidades"}
              onChange={onUnidadeChange}
              options={[
                "Todas as unidades",
                "Araras",
                "Cordeirópolis",
                "Rio Claro"
              ]}
            />
            <p className="text-xs text-muted-foreground">Filtre por localização</p>
          </div>

          {/* Status */}
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Activity className="h-4 w-4 text-accent" />
              <label className="text-sm font-medium text-foreground">Status</label>
            </div>
            <Select
              value={statusSelecionado || "Todos os status"}
              onChange={onStatusChange}
              options={[
                "Todos os status",
                "Aguardando",
                "Em Atendimento",
                "Finalizado",
                ...(tipoTela === "recepcao" ? ["Em Chamada"] : [])
              ]}
            />
            <p className="text-xs text-muted-foreground">Status atual do paciente</p>
          </div>

          {/* Tipo de Exame */}
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Stethoscope className="h-4 w-4 text-secondary-foreground" />
              <label className="text-sm font-medium text-foreground">Tipo de Exame</label>
            </div>
            <Select
              value={tipoExameSelecionado || "Todos os exames"}
              onChange={onTipoExameChange}
              options={["Todos os exames", ...tiposExame]}
            />
            <p className="text-xs text-muted-foreground">Especialidade médica</p>
          </div>

          {/* Sala */}
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <DoorOpen className="h-4 w-4 text-orange-600" />
              <label className="text-sm font-medium text-foreground">Sala</label>
            </div>
            <Select
              value={salaSelecionada || "Todas as salas"}
              onChange={onSalaChange}
              options={["Todas as salas", ...salas]}
            />
            <p className="text-xs text-muted-foreground">Local de atendimento</p>
          </div>
        </div>

        {/* Busca e Conectar */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome, CPF ou telefone..."
              value={busca}
              onChange={(e) => onBuscaChange(e.target.value)}
              className="pl-10 bg-white border-border"
            />
          </div>
          <Button
            onClick={onConectar}
            disabled={!salaSelecionada}
            className={`px-6 ${conectado ? "bg-green-600 hover:bg-green-700" : "bg-primary hover:bg-primary/90"}`}
          >
            {conectado ? (
              <>
                <Wifi className="h-4 w-4 mr-2" />
                Conectado
              </>
            ) : (
              <>
                <WifiOff className="h-4 w-4 mr-2" />
                Conectar
              </>
            )}
          </Button>
        </div>

        {/* Filtros Ativos */}
        {filtrosAtivos.length > 0 && (
          <div className="mt-4 pt-4 border-t border-border">
            <div className="flex items-center space-x-2 mb-2">
              <span className="text-sm font-medium text-foreground">Filtros ativos:</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {filtrosAtivos.map((filtro, index) => (
                <Badge key={index} variant="secondary" className="bg-primary/10 text-primary">
                  {filtro.label}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </Card>

      {/* Estatísticas */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4 border-0 bg-white/95 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Aguardando</p>
              <p className="text-2xl font-bold text-orange-600">{estatisticas.aguardando}</p>
            </div>
            <Clock className="h-8 w-8 text-orange-600" />
          </div>
        </Card>

        <Card className="p-4 border-0 bg-white/95 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Em Atendimento</p>
              <p className="text-2xl font-bold text-blue-600">{estatisticas.emAtendimento}</p>
            </div>
            <Activity className="h-8 w-8 text-blue-600" />
          </div>
        </Card>

        <Card className="p-4 border-0 bg-white/95 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Finalizados</p>
              <p className="text-2xl font-bold text-green-600">{estatisticas.finalizados}</p>
            </div>
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
        </Card>

        <Card className="p-4 border-0 bg-white/95 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total</p>
              <p className="text-2xl font-bold text-foreground">{estatisticas.total}</p>
            </div>
            <Users className="h-8 w-8 text-primary" />
          </div>
        </Card>
      </div>
    </div>
  )
}
