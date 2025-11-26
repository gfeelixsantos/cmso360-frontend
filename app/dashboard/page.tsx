"use client"

import { useEffect, useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { Users, Stethoscope, UserCircle, Calendar, FileText, CheckCircle, Clock, Eye, ChartNoAxesCombined } from "lucide-react"
import { IUserInfo } from "@/lib/user/interfaces/IUser"
import { getCurrentUser, logout } from "@/lib/utils"
import { HeaderApp } from "@/components/shared/HeaderApp"
import { Scheduling } from "@/lib/scheduling/interface/scheduling"
import { AtendimentoStatus, ExamStatus } from "@/lib/scheduling/enum/scheduling.enum"
import CmsoLoading from "@/components/shared/CmsoLoading"
import { NEST_DASHBOARD } from "@/config/constants"

// Interfaces
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
  totalGeral: number
  agendados: number
  atendimento: number
  aguardandoResultados: number
  aguardandoAvaliacaoMedica: number
}

// Componentes
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
    </section>
  </motion.section>
)

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
        <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-[#44735E] text-white shadow-lg">
          {icon}
        </div>
      </div>
    </div>
  </article>
)

// Componente Principal CORRIGIDO
export default function DashboardPage() {
  const router = useRouter()
  
  const [user, setUser] = useState<IUserInfo | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [dashboardStats, setDashboardStats] = useState<DashboardStats|null>(null)


  useEffect(() => {
    const initDashboard = async () => {
      const currentUser = getCurrentUser()

      if (!currentUser) {
        setIsLoading(false)
        router.push("/")
        return
      }

      setUser(currentUser)
      
   
      try {

        const res = await fetch(NEST_DASHBOARD)
        
        if (!res.ok) throw new Error("Erro ao buscar atendimentos")
        
        const responseStats: DashboardStats = await res.json()
        console.log("Dashboard Stats:", responseStats)
        setDashboardStats(responseStats)
        
      } catch (err) {
        console.error("Erro ao carregar atendimentos:", err)
        // ✅ Define array vazio em caso de erro
        setDashboardStats(null)
      } finally {
        setIsLoading(false)
      }
    }

    initDashboard()
  }, [router])



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
      value: dashboardStats?.totalGeral, 
      icon: <FileText className="h-6 w-6" />,
      description: "Até dia atual"
    },
    { 
      title: "Atendimentos Hoje", 
      value: dashboardStats?.agendados, 
      icon: <Calendar className="h-6 w-6" />,
      description: "Todas as unidades",
      trend: { value: "+12%", isPositive: true }
    },
    { 
      title: "Aguardando Liberação", 
      value: `${dashboardStats?.aguardandoAvaliacaoMedica}`, 
      icon: <CheckCircle className="h-6 w-6" />,
      description: "Para avaliação médica"
    },
    { 
      title: "Aguardando Resultados", 
      value: dashboardStats?.aguardandoResultados, 
      icon: <Clock className="h-6 w-6" />,
      description: "Para finalização de exames"
    },
  ]

  // ✅ FIX 4: Mostrar loading até carregar tudo
  if (isLoading || !user) {
    return <CmsoLoading />
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <HeaderApp onLogout={() => { logout(); router.push("/"); }} children={null} />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6" aria-label="Dashboard principal">
        <WelcomeSection name={user.nome} />
        
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
                value={stat.value !== undefined ? stat.value.toString() : "N/A"}
                icon={stat.icon}
                index={index}
                description={stat.description}
                trend={stat.trend}
              />
            ))}
          </div>
        </section>

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