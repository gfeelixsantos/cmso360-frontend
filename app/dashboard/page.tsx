"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { Users, Stethoscope, UserCircle, Calendar, FileText,  CheckCircle, Clock, Eye, ChartNoAxesCombined } from "lucide-react"
import { IUserInfo } from "@/lib/user/interfaces/IUser"
import { getCurrentUser, logout } from "@/lib/utils"
import { HeaderApp } from "@/components/shared/HeaderApp"
import { Scheduling } from "@/lib/scheduling/interface/scheduling"
import { AtendimentoStatus, ExamStatus } from "@/lib/scheduling/enum/scheduling.enum"
import { useAppData } from "../context/AppDataContext"
import CmsoLoading from "@/components/shared/CmsoLoading"
import { Alert, Link } from "@heroui/react"

// Interfaces para tipagem robusta
interface MenuCardProps {
  title: string
  description: string
  icon: React.ReactNode
  path: string
  subItems: { icon: React.ReactNode; text: string }[]
  onPress: () => void
  index: number
}

interface StatsCardProps {
  title: string
  value: string
  icon: React.ReactNode
  index: number
  description?: string
  trend?: {
    value: string
    isPositive: boolean
  }
}



interface DashboardStats {
  totalProntuarios: number
  agendados: number
  emAtendimento: number
  aguardandoResultados: number
  aguardandoAvaliacaoMedica: number
  finalizados: number
  consultasHoje: number
  avaliacaoMedica: number
  examesPendentes: number
  totalClinico: number
}

// Componente WelcomeSection atualizado
const WelcomeSection: React.FC<{ name: string }> = ({ name }) => (
  <motion.section
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5 }}
    className="mb-10"
    aria-labelledby="welcome-title"
  >
    <section className="flex justify-between">
      <div>
        <h1 id="welcome-title" className="text-3xl font-bold text-gray-900 tracking-tight">
          Bem-vindo, <span>{name.split(" ")[0]} {name.split(" ")[1]}</span>
        </h1>
        <p className="text-lg text-gray-600 mt-2">Acesse as funcionalidades do sistema abaixo</p>
      </div>
      <div>
        <Alert
          color="success"
          variant="faded"
        >
          <p className="font-bold">Nosso novo sistema de atendimento!</p>
          <p>Estamos em fase de testes, sugestões e melhorias serão bem vindas</p>
          <Link href="https://forms.gle/Yk34nUL6654x9MNC6" target="_blank">Formulário de sugestões</Link>
        </Alert>
      </div>
    </section>
  </motion.section>
)

// Componente MenuCard
const MenuCard: React.FC<MenuCardProps> = ({ title, description, icon, subItems, onPress, index }) => (
  <motion.article
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5, delay: index * 0.1 }}
    className="group bg-white rounded-xl shadow-sm hover:shadow-xl transition-all duration-300 cursor-pointer border border-gray-200"
    role="button"
    tabIndex={0}
    onClick={onPress}
    onKeyDown={(e) => e.key === "Enter" && onPress()}
    aria-label={`Acessar ${title}`}
  >
    <header className="text-center p-6" aria-labelledby={`card-title-${index}`}>
      <motion.div
        whileHover={{ scale: 1.1 }}
        className="mx-auto w-16 h-16 rounded-full flex items-center justify-center bg-gray-50 mb-4"
      >
        {icon}
      </motion.div>
      <h3 id={`card-title-${index}`} className="text-xl font-semibold text-gray-900">
        {title}
      </h3>
      <p className="text-gray-600 text-sm">{description}</p>
    </header>
    <div className="p-6">
      <div className="flex items-center justify-center space-x-4 text-sm text-gray-600">
        {subItems.map((item, i) => (
          <div key={i} className="flex items-center" aria-label={item.text}>
            {item.icon}
            <span>{item.text}</span>
          </div>
        ))}
      </div>
      <button
        className="w-full px-4 py-2 bg-[#44735E] text-white rounded-md hover:bg-[#B8D864] focus:outline-none focus:ring-2 focus:ring-[#3dbdb9] focus:ring-offset-2 transition-colors"
        aria-label={`Acessar ${title}`}
      >
        Acessar
      </button>
    </div>
  </motion.article>
)

// Componente StatsCard atualizado
const StatsCard: React.FC<StatsCardProps> = ({ title, value, icon, index, description, trend }) => (
  <article
    className="bg-white rounded-2xl shadow-sm border border-gray-200/80 overflow-hidden"
    role="region"
    aria-labelledby={`stat-title-${index}`}
  >
    <div className="p-6">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p id={`stat-title-${index}`} className="text-sm font-medium text-gray-600 mb-1">
            {title}
          </p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          {description && (
            <p className="text-xs text-gray-500 mt-1">{description}</p>
          )}
        </div>
        <div className="w-12 h-12 rounded-xl flex items-center justify-center  bg-[#44735E] text-white shadow-lg">
          {icon}
        </div>
      </div>
    </div>
  </article>
)



// Componente Principal
export default function DashboardPage() {
  const { data } = useAppData();
  const appAtendimentos: Scheduling[] = data?.atendimentos ?? [];
  const [user, setUser] = useState<IUserInfo | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [atendimentos, setAtendimentos] = useState<Scheduling[] | null>(null)
  const [dashboardStats, setDashboardStats] = useState<DashboardStats>({
    totalProntuarios: 0,
    agendados: 0,
    emAtendimento: 0,
    aguardandoResultados: 0,
    aguardandoAvaliacaoMedica: 0,
    finalizados: 0,
    consultasHoje: 0,
    avaliacaoMedica: 0,
    examesPendentes: 0,
    totalClinico: 0
  })
  const router = useRouter()

  useEffect(() => {
    const currentUser = getCurrentUser();
    if (!currentUser) {
      router.push("/");
    } else {
      setUser(currentUser);
      setIsLoading(false);
    }
  }, []);


  useEffect(() => {
    // Agora só usamos a variável appAtendimentos, sem chamar hook aqui
    if (appAtendimentos?.length) {
      setAtendimentos(appAtendimentos);

      setDashboardStats({
        totalProntuarios: appAtendimentos.filter(item => new Date(item.DATAAGENDAMENTO_DATE) <= new Date()).length ?? 0,
        agendados: appAtendimentos.filter(item => item.ATENDIMENTOSTATUS === AtendimentoStatus.AGENDADO).length ?? 0,
        emAtendimento: appAtendimentos.filter(item => item.ATENDIMENTOSTATUS === AtendimentoStatus.EM_ATENDIMENTO).length ?? 0,
        aguardandoResultados: appAtendimentos.filter(item => item.ATENDIMENTOSTATUS === AtendimentoStatus.AGUARDANDO_RESULTADOS).length ?? 0,
        aguardandoAvaliacaoMedica: appAtendimentos.filter(item => item.ATENDIMENTOSTATUS === AtendimentoStatus.AGUARDANDO_AVALIACAO_MEDICA).length ?? 0,
        finalizados: appAtendimentos.filter(item => item.ATENDIMENTOSTATUS === AtendimentoStatus.FINALIZADO).length ?? 0,
        consultasHoje: appAtendimentos.filter(item => item.DATAAGENDAMENTO === new Date().toLocaleDateString("pt-br")).length ?? 0,
        avaliacaoMedica: appAtendimentos.filter(item => item.ATENDIMENTOSTATUS === AtendimentoStatus.AGUARDANDO_AVALIACAO_MEDICA).length ?? 0,
        examesPendentes: appAtendimentos.reduce((pvalue, cvalue) => pvalue += cvalue.EXAMES.filter(e => e.status === ExamStatus.AGUARDANDO_RESULTADO).length, 0),
        totalClinico: appAtendimentos.reduce((pvalue, cvalue) => pvalue += cvalue.EXAMES.filter(e => e.grupo === "clinico").length, 0),
      });
    }
  }, [appAtendimentos, router,]); // <-- adicionamos appAtendimentos como dependência




  if (!user) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center" aria-label="Carregando">
        <div className="relative">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-[#104e35]/20 border-t-[#104e35]"></div>
          <div className="absolute inset-0 rounded-full animate-ping h-16 w-16 border-4 border-[#104e35]/30 opacity-20"></div>
        </div>
      </main>
    )
  }

  if (true) {
    <CmsoLoading />
  }

  const menuItems = [
    {
      title: "Atendimento",
      description: "Exames",
      icon: <Stethoscope className="h-6 w-6" />,
      path: "/atendimento",
      subItems: [],
    },
    {
      title: "Recepção",
      description: "Atendimento",
      icon: <Users className="h-6 w-6" />,
      path: "/recepcao",
      subItems: [],
    },
    {
      title: "Relatórios",
      description: "Consultas",
      icon: <ChartNoAxesCombined className="h-6 w-6" />,
      path: "/relatorio",
      subItems: [],
    },
    {
      title: "Prontuários",
      description: "Resultados",
      icon: <FileText className="h-6 w-6" />,
      path: "/prontuarios",
      subItems: [],
    },
  ]

  const stats = [
    { 
      title: "Total Prontuários", 
      value: dashboardStats.totalProntuarios.toLocaleString(), 
      icon: <FileText className="h-6 w-6" />,
      description: "Prontuários até dia atual"
    },
    { 
      title: "Consultas Hoje", 
      value: dashboardStats.consultasHoje.toString(), 
      icon: <Calendar className="h-6 w-6" />,
      description: "Atendimentos agendados",
      trend: { value: "+12%", isPositive: true }
    },
    { 
      title: "Aguardando Liberação", 
      value: `${dashboardStats.avaliacaoMedica}`, 
      icon: <CheckCircle className="h-6 w-6" />,
      description: "Em avaliação médica"
    },
    { 
      title: "Aguardando resultados", 
      value: dashboardStats.examesPendentes.toString(), 
      icon: <Clock className="h-6 w-6" />,
      description: "Exames complementares"
    },
  ]

  const statusStats = [
    {
      title: "Em Atendimento",
      value: dashboardStats.emAtendimento.toString(),
      icon: <Clock className="h-5 w-5" />,
      color: "bg-yellow-100 text-yellow-600"
    },
    {
      title: "Finalizados",
      value: dashboardStats.finalizados.toString(),
      icon: <CheckCircle className="h-5 w-5" />,
      color: "bg-green-100 text-green-600"
    },
    {
      title: "Clínico",
      value: dashboardStats.aguardandoResultados.toString(),
      icon: <UserCircle className="h-5 w-5" />,
      color: ""
    },
    {
      title: "Audiometria",
      value: dashboardStats.aguardandoAvaliacaoMedica.toString(),
      icon: <UserCircle className="h-5 w-5" />,
      color: ""
    },
    {
      title: "Acuidade Visual",
      value: dashboardStats.aguardandoAvaliacaoMedica.toString(),
      icon: <UserCircle className="h-5 w-5" />,
      color: ""
    },
    {
      title: "Laboratório",
      value: dashboardStats.aguardandoAvaliacaoMedica.toString(),
      icon: <UserCircle className="h-5 w-5" />,
      color: ""
    },
    {
      title: "Espirometria",
      value: dashboardStats.aguardandoAvaliacaoMedica.toString(),
      icon: <UserCircle className="h-5 w-5" />,
      color: ""
    },
    {
      title: "Raio-X",
      value: dashboardStats.aguardandoAvaliacaoMedica.toString(),
      icon: <UserCircle className="h-5 w-5" />,
      color: ""
    },
    {
      title: "ECG",
      value: dashboardStats.aguardandoAvaliacaoMedica.toString(),
      icon: <UserCircle className="h-5 w-5" />,
      color: ""
    },
    {
      title: "EEG",
      value: dashboardStats.aguardandoAvaliacaoMedica.toString(),
      icon: <UserCircle className="h-5 w-5" />,
      color: ""
    },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <HeaderApp onLogout={() => { logout(); router.push("/"); }} children={null} />
        

      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6" aria-label="Dashboard principal">
        <WelcomeSection name={user.nome} />
        
        {/* Seção de Módulos */}
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8" aria-label="Menu de funcionalidades">
          {menuItems.map((item, index) => (
            <MenuCard
              key={item.title}
              title={item.title}
              description={item.description}
              icon={item.icon}
              path={item.path}
              subItems={item.subItems}
              onPress={() => router.push(item.path)}
              index={index}
            />
          ))}
        </section>

        {/* Seção de Estatísticas Principais */}
        <section className="mt-8" aria-labelledby="stats-title">
          <motion.h2 
            id="stats-title" 
            className="text-xl font-semibold text-gray-800 flex items-center mb-6"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.8 }}
          >
            Visão Geral do Sistema
          </motion.h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {stats.map((stat, index) => (
              <StatsCard
                key={stat.title}
                title={stat.title}
                value={stat.value}
                icon={stat.icon}
                index={index}
                description={stat.description}
                trend={stat.trend}
              />
            ))}
          </div>
        </section>

        {/* Seção de Status dos Atendimentos
        <section className="mt-8" aria-labelledby="status-title">
          <motion.h2 
            id="status-title" 
            className="text-xl font-semibold text-gray-800 flex items-center mb-6"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 1.0 }}
          >
            Status dos Atendimentos
          </motion.h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {statusStats.map((stat, index) => (
              <motion.div
                key={stat.title}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 1.2 + index * 0.1 }}
                className="bg-white rounded-xl p-4 shadow-sm border border-gray-200"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                    <p className="text-sm text-gray-600">{stat.title}</p>
                  </div>
                  <div className={`p-2 rounded-lg ${stat.color}`}>
                    {stat.icon}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </section> */}

        {/* Footer do Dashboard */}
        <motion.footer 
          className="mt-12 pt-8 border-t border-gray-200 text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 1.5 }}
        >
          <p className="text-sm text-gray-600">
            Centro Médico de Saúde Ocupacional • {new Date().getFullYear()}
          </p>
        </motion.footer>
      </main>
    </div>
  )
}