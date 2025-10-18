"use client"
import { useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"

import { Button } from "@heroui/button"
import { Card, CardBody, CardHeader } from "@heroui/card"
import { Badge } from "@heroui/badge"
import { Avatar } from "@heroui/avatar"
import { Progress } from "@heroui/progress"

import {
  ArrowLeft,
  Search,
  Building2,
  Clock,
  MapPin,
  FileText,
  User,
  Calendar,
  CheckCircle,
  AlertCircle,
  Eye,
  Download,
  Star,
} from "lucide-react"

import { pacientesMock, type Paciente } from "@/lib/employee"
import { getCurrentUser } from "@/lib/auth"

export default function ProntuariosPage() {
  const router = useRouter()
  const user = getCurrentUser()

  const [unidadeSelecionada, setUnidadeSelecionada] = useState("")
  const [statusSelecionado, setStatusSelecionado] = useState("")
  const [busca, setBusca] = useState("")
  const [modalLiberacao, setModalLiberacao] = useState<{ aberto: boolean; paciente: Paciente | null }>({
    aberto: false,
    paciente: null,
  })
  const [modalOrientacao, setModalOrientacao] = useState<{ aberto: boolean; paciente: Paciente | null }>({
    aberto: false,
    paciente: null,
  })
  const [observacaoLiberacao, setObservacaoLiberacao] = useState("")
  const [orientacaoTexto, setOrientacaoTexto] = useState("")

  // Filtro pacientes
  const pacientesProntuarios = useMemo(() => {
    return pacientesMock.filter((paciente) => {
      const temExameConcluido = paciente.examesDetalhados.some((exame) => exame.status === "CONCLUÍDO")
      if (!temExameConcluido || paciente.liberado) return false

      const matchUnidade = !unidadeSelecionada || paciente.unidade === unidadeSelecionada
      const matchStatus = !statusSelecionado || paciente.status === statusSelecionado
      const matchBusca =
        !busca ||
        paciente.nome?.toLowerCase().includes(busca.toLowerCase()) ||
        paciente.empresa?.toLowerCase().includes(busca.toLowerCase()) ||
        paciente.cpf?.includes(busca)

      return matchUnidade && matchStatus && matchBusca
    })
  }, [unidadeSelecionada, statusSelecionado, busca])

  const calcularProgresso = (exames: any[]) => {
    const concluidos = exames.filter((e) => e.status === "CONCLUÍDO").length
    return Math.round((concluidos / exames.length) * 100)
  }

  const getCardClass = (paciente: Paciente) => {
    let baseClass = "border-0 bg-white/95 backdrop-blur-sm shadow-sm hover:shadow-md transition-all duration-200 "
    if (paciente.preferencial) {
      baseClass += "ring-2 ring-orange-200 bg-gradient-to-r from-orange-50/50 to-white "
    }
    if (paciente.orientacoesMedicas) {
      baseClass += "ring-2 ring-blue-200 bg-gradient-to-r from-blue-50/30 to-white "
    }
    return baseClass
  }

  if (!user) {
    router.push("/")
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-secondary/20 to-accent/10">
      {/* Header */}
      <header className="bg-white/95 backdrop-blur-sm border-b border-border shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Button
                variant="light"
                size="sm"
                onClick={() => router.push("/dashboard")}
                className="text-muted-foreground hover:text-foreground"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar
              </Button>
              <Image
                src="/logo-medlink.png"
                alt="MedLink - Sistema Médico"
                width={160}
                height={64}
                className="h-12 w-auto"
              />
            </div>

            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <Avatar name={user.nome} className="h-8 w-8" />
                <div className="hidden sm:block">
                  <p className="text-sm font-medium text-foreground">{user.nome}</p>
                  <p className="text-xs text-muted-foreground">{user.especialidade}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Conteúdo principal */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Gestão de Prontuários</h1>
          <p className="text-muted-foreground">Pacientes com exames concluídos aguardando liberação</p>
        </div>

        {/* Filtros */}
        <Card className="border-0 bg-white/95 backdrop-blur-sm shadow-lg mb-6">
          <CardHeader className="pb-4">
            <h2 className="text-lg font-semibold flex items-center">
              <FileText className="h-5 w-5 mr-2 text-primary" />
              Filtros de Prontuários
            </h2>
          </CardHeader>
          <CardBody>
            {/* ... mantém selects e inputs como estão */}
          </CardBody>
        </Card>

        {/* Lista de pacientes */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-foreground">
            Prontuários Pendentes ({pacientesProntuarios.length})
          </h2>

          {/* Aqui segue igual seu mapeamento de pacientes, só trocando CardContent -> CardBody e AvatarFallback -> Avatar name */}
        </div>
      </main>
    </div>
  )
}
