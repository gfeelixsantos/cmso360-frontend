"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { motion } from "framer-motion"
import { Users, Stethoscope, UserCircle, LogOut, Activity, Calendar, FileText, ArrowRight } from "lucide-react"
import { IUserInfo } from "@/lib/user/interfaces/IUser"
import { getCurrentUser, logout } from "@/lib/utils"
import { HeaderApp } from "@/components/shared/HeaderApp"

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
    <h1 id="welcome-title" className="text-3xl font-bold text-gray-900 tracking-tight">
      Bem-vindo, <span className="text-[#B8D864]">{name.split(" ")[0]} {name.split(" ")[1]}</span>
    </h1>
    <p className="text-lg text-gray-600 mt-2">Acesse as funcionalidades do sistema abaixo</p>
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
      <div className="flex items-center justify-center space-x-4 text-sm text-gray-600 mb-4">
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

// Componente StatsCard simplificado - focado em consulta de dados
const StatsCard: React.FC<StatsCardProps> = ({ title, value, icon, index }) => (
  <article
    className="bg-white rounded-2xl shadow-sm border border-gray-200/80 overflow-hidden"
    role="region"
    aria-labelledby={`stat-title-${index}`}
  >
    <div className="p-6">
      <div className="flex items-center justify-between">
        <div>
          <p id={`stat-title-${index}`} className="text-sm font-medium text-gray-600 mb-1">
            {title}
          </p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
        </div>
        <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-gradient-to-br from-[#104e35] to-[#a6ce39] text-white shadow-lg">
          {icon}
        </div>
      </div>
    </div>
  </article>
)

// Componente Principal
export default function DashboardPage() {
  const [user, setUser] = useState<IUserInfo | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const currentUser = getCurrentUser()
    if (!currentUser) {
      router.push("/")
    } else {
      setUser(currentUser)
      setTimeout(() => setIsLoading(false), 1000)
    }
  }, [router])

  const handleLogout = () => {
    logout()
    router.push("/")
  }

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

  if (isLoading) {
    return (
      <main className="min-h-screen bg-white flex items-center justify-center" aria-label="Carregando dashboard">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col items-center"
        >
          <Image
            src="/images/logo.png"
            alt="CMSO 360°"
            width={160}
            height={64}
            className="h-16 w-auto mb-4"
            priority
          />
          <div className="w-32 h-1 bg-gray-200 rounded-full overflow-hidden">
            <motion.div
              className="h-1 bg-gradient-to-r from-[#104e35] to-[#a6ce39] rounded-full"
              initial={{ width: 0 }}
              animate={{ width: "100%" }}
              transition={{ duration: 1.2, ease: "easeInOut" }}
            />
          </div>
          <p className="text-gray-600 text-sm mt-4">Carregando seu dashboard...</p>
        </motion.div>
      </main>
    )
  }

  const menuItems = [
    {
      title: "Sala de Atendimento",
      description: "",
      icon: <Stethoscope className="h-6 w-6" />,
      path: "/atendimento",
      subItems: [
        { icon: <Activity className="h-3 w-3" />, text: "Consultas" },
        { icon: <Calendar className="h-3 w-3" />, text: "Agendamentos" },
      ],
    },
    {
      title: "Recepção",
      description: "",
      icon: <Users className="h-6 w-6" />,
      path: "/recepcao",
      subItems: [
        { icon: <Users className="h-3 w-3" />, text: "Funcionários" },
        { icon: <FileText className="h-3 w-3" />, text: "Atendimentos" },
      ],
    },
    {
      title: "Relatórios",
      description: "",
      icon: <UserCircle className="h-6 w-6" />,
      path: "/conta",
      subItems: [
        { icon: <UserCircle className="h-3 w-3" />, text: "Perfil" },
        { icon: <Activity className="h-3 w-3" />, text: "Atividades" },
      ],
    },
    {
      title: "Prontuários Eletrônicos",
      description: "",
      icon: <FileText className="h-6 w-6" />,
      path: "/prontuarios",
      subItems: [
        { icon: <FileText className="h-3 w-3" />, text: "Documentos" },
        { icon: <Activity className="h-3 w-3" />, text: "Liberação" },
      ],
    },
  ]

  const stats = [
    { 
      title: "Consultas Hoje", 
      value: "12", 
      icon: <Calendar className="h-6 w-6" />
    },
    { 
      title: "Pendentes Liberação", 
      value: "15", 
      icon: <Users className="h-6 w-6" />
    },
    { 
      title: "Prontuários", 
      value: "342", 
      icon: <FileText className="h-6 w-6" />
    },
    { 
      title: "Eficiência", 
      value: "89%", 
      icon: <Activity className="h-6 w-6" />
    },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <HeaderApp user={user} onLogout={handleLogout} children />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10" aria-label="Dashboard principal">
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

        {/* Seção de Estatísticas */}
        <section className="mt-8" aria-labelledby="stats-title">
          <motion.h2 
            id="stats-title" 
            className="text-2xl font-semibold text-gray-800 flex items-center mb-6"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.8 }}
          >
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#104e35] to-[#a6ce39] flex items-center justify-center mr-3">
              <Activity className="h-4 w-4 text-white" />
            </div>
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
              />
            ))}
          </div>
        </section>

        {/* Footer do Dashboard */}
        <motion.footer 
          className="mt-12 pt-8 border-t border-gray-200 text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 1.0 }}
        >
          <p className="text-sm text-gray-600">
            Sistema CMSO 360° • {new Date().getFullYear()}
          </p>
        </motion.footer>
      </main>
    </div>
  )
}