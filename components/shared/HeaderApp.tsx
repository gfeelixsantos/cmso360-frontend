import { IUserInfo } from "@/lib/user/interfaces/IUser"
import { getCurrentUser } from "@/lib/utils"
import { Link } from "@heroui/react"
import { motion, AnimatePresence } from "framer-motion"
import { LogOut, User, Settings, ChevronDown, Bell, AlertCircle, CheckCircle } from "lucide-react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { useState, useRef, useEffect } from "react"

interface Notification {
  id: string
  title: string
  message: string
  type: "info" | "warning" | "success"
  date: string
  read: boolean
}
// Componente de Notificações
const NotificationsPanel: React.FC<{
  notifications: Notification[]
  isOpen: boolean
  onClose: () => void
  onMarkAsRead: (id: string) => void
}> = ({ notifications, isOpen, onClose, onMarkAsRead }) => {
  if (!isOpen) return null

  const getIcon = (type: string) => {
    switch (type) {
      case 'warning': return <AlertCircle className="h-5 w-5 text-yellow-500" />
      case 'success': return <CheckCircle className="h-5 w-5 text-green-500" />
      default: return <Bell className="h-5 w-5 text-blue-500" />
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="absolute top-full right-0 mt-2 w-80 bg-white rounded-lg shadow-xl border border-gray-200 z-50"
    >
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-gray-900">Notificações</h3>
          <span className="text-sm text-gray-500">
            {notifications.filter(n => !n.read).length} não lidas
          </span>
        </div>
      </div>
      <div className="max-h-96 overflow-y-auto">
        {notifications.length === 0 ? (
          <div className="p-4 text-center text-gray-500">
            Nenhuma notificação
          </div>
        ) : (
          notifications.map((notification) => (
            <div
              key={notification.id}
              className={`p-4 border-b border-gray-100 hover:bg-gray-50 cursor-pointer ${
                !notification.read ? 'bg-blue-50' : ''
              }`}
              onClick={() => onMarkAsRead(notification.id)}
            >
              <div className="flex items-start space-x-3">
                {getIcon(notification.type)}
                <div className="flex-1">
                  <p className="font-medium text-sm text-gray-900">
                    {notification.title}
                  </p>
                  <p className="text-sm text-gray-600 mt-1">
                    {notification.message}
                  </p>
                  <p className="text-xs text-gray-400 mt-2">
                    {notification.date}
                  </p>
                </div>
                {!notification.read && (
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </motion.div>
  )
}

interface HeaderProps {
  onLogout: () => void;
  children: React.ReactNode;
}


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
export const HeaderApp: React.FC<HeaderProps> = ({ onLogout, children }) => {
  const router = useRouter();
  const [user, setUser] = useState<IUserInfo | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [showNotifications, setShowNotifications] = useState(false)
  
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const currentUser = getCurrentUser();
    if (!currentUser) {
      router.push("/");
    } else {
      setUser(currentUser);
    }
  }, [router]);

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

  // Notificações mockadas
  useEffect(() => {
    setNotifications([
      {
        id: '1',
        title: 'ASO Pendente',
        message: '15 ASOs aguardando liberação médica',
        type: 'warning',
        date: '10 min atrás',
        read: false
      },
      {
        id: '2',
        title: 'Exames Atrasados',
        message: '8 exames com resultado pendente há mais de 48h',
        type: 'warning',
        date: '1 hora atrás',
        read: false
      },
      {
        id: '3',
        title: 'Agendamento Confirmado',
        message: 'Novo agendamento para SEW EURODRIVE',
        type: 'info',
        date: '2 horas atrás',
        read: true
      },
      {
        id: '4',
        title: 'Liberação Concluída',
        message: '23 prontuários liberados hoje',
        type: 'success',
        date: '3 horas atrás',
        read: true
      }
    ])
  }, [])

   const unreadNotificationsCount = notifications.filter(n => !n.read).length
  const handleMarkAsRead = (id: string) => {
  setNotifications(prev =>
    prev.map(notification =>
      notification.id === id ? { ...notification, read: true } : notification
    )
  )
}

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
              {/* Botão de Notificações no Header */}
              <div className="relative">
                <button
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                  aria-label="Notificações"
                >
                  <Bell className="h-5 w-5" />
                  {unreadNotificationsCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                      {unreadNotificationsCount}
                    </span>
                  )}
                </button>
                
                <NotificationsPanel
                  notifications={notifications}
                  isOpen={showNotifications}
                  onClose={() => setShowNotifications(false)}
                  onMarkAsRead={handleMarkAsRead}
                />
              </div>

              {/* User profile with dropdown */}
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="flex items-center gap-2 p-2 rounded-xl hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
                  aria-expanded={isDropdownOpen}
                  aria-haspopup="true"
                  aria-label="Abrir menu do usuário"
                >

                  {/* Nome + perfil (visível em telas médias para cima) */}
                  <div className="hidden md:block text-left">
                    <p className="text-sm font-semibold text-gray-900">
                      {user?.nome}
                    </p>
                    <p
                      className={`text-xs px-2 py-0.5 rounded-full font-medium text-center border shadow-sm ${getSpecialtyColor(
                        user?.perfil ?? ""
                      )}`}
                    >
                      {user?.perfil}
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
                        <p className="text-sm font-medium text-gray-900">{user?.nome}</p>
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