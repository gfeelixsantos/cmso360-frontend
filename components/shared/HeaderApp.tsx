import { IUserInfo } from "@/lib/user/interfaces/IUser"
import { Link } from "@heroui/react"
import { motion, AnimatePresence } from "framer-motion"
import { LogOut, User, Settings, ChevronDown, Bell } from "lucide-react"
import Image from "next/image"
import { useState, useRef, useEffect } from "react"

interface HeaderProps {
  user: IUserInfo
  onLogout: () => void;
  children: React.ReactNode;
}

// Funções utilitárias
const getInitials = (nome: string) =>
  nome
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)

const getSpecialtyColor = (especialidade: string) => {
  const colorMap: Record<string, string> = {
    "MEDICO": "bg-blue-100 text-blue-700 border-blue-200",
    "ENFERMAGEM": "bg-green-100 text-green-700 border-green-200",
    "FONOAUDIOLOGA": "bg-purple-100 text-purple-700 border-purple-200",
    "RECEPÇÃO": "bg-orange-100 text-orange-700 border-orange-200"
  }
  
  return colorMap[especialidade] || "bg-gray-100 text-gray-700 border-gray-200"
}

// Componente Header atualizado
export const HeaderApp: React.FC<HeaderProps> = ({ user, onLogout, children }) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Fechar dropdown ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  return (
    <>
      <motion.header
        initial={{ y: -80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="bg-white/95 backdrop-blur-md border-b border-gray-100 shadow-sm sticky top-0 z-40"
        role="banner"
      >
        <div className="mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <Link 
              href="/dashboard" 
              className="flex items-center gap-2 transition-transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-lg p-1"
              aria-label="Ir para o dashboard"
            >
              <Image
                src="/images/logo.png"
                alt="MedLink - Sistema Médico"
                width={180}
                height={54}
                className="h-12 w-auto"
                priority
              />
            </Link>

            {children && children}

            {/* User info + notifications + logout */}
            <div className="flex items-center gap-3">
              {/* Notificações */}
              <button 
                className="relative p-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
                aria-label="Notificações"
              >
                <Bell className="h-5 w-5" />
                <span className="absolute top-1 right-1 flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                </span>
              </button>

              {/* User profile with dropdown */}
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="flex items-center gap-2 p-2 rounded-xl hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
                  aria-expanded={isDropdownOpen}
                  aria-haspopup="true"
                  aria-label="Abrir menu do usuário"
                >
                  {/* Avatar */}
                  <div
                    className="h-10 w-10 rounded-full bg-gradient-to-br from-[#3EAFE1] to-[#395467] 
                             flex items-center justify-center text-white font-semibold shadow-md"
                    aria-hidden="true"
                  >
                    {getInitials(user.nome)}
                  </div>

                  {/* Nome + perfil (visível em telas médias para cima) */}
                  <div className="hidden md:block text-left">
                    <p className="text-sm font-semibold text-gray-900 truncate max-w-[120px]">
                      {user.nome}
                    </p>
                    <p
                      className={`text-xs px-2 py-0.5 rounded-full font-medium text-center border shadow-sm ${getSpecialtyColor(
                        user.perfil
                      )}`}
                    >
                      {user.perfil}
                    </p>
                  </div>

                  <ChevronDown 
                    className={`h-4 w-4 text-gray-500 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} 
                    aria-hidden="true"
                  />
                </button>

                {/* Dropdown menu */}
                <AnimatePresence>
                  {isDropdownOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.2 }}
                      className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg py-2 border border-gray-200 z-50"
                      role="menu"
                      aria-orientation="vertical"
                    >
                      <div className="px-4 py-2 border-b border-gray-100">
                        <p className="text-sm font-medium text-gray-900">{user.nome}</p>
                      </div>
                      
                      <button
                        onClick={() => {
                          setIsDropdownOpen(false)
                          onLogout()
                        }}
                        className="flex w-full items-center px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                        role="menuitem"
                      >
                        <LogOut className="h-4 w-4 mr-3" />
                        Sair
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </div>
      </motion.header>
    </>
  )
}