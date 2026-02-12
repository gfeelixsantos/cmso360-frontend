"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Users,
  Stethoscope,
  Calendar,
  FileText,
  CheckCircle,
  Clock,
  ChartNoAxesCombined,
  Bell,
  X,
} from "lucide-react";
import { Button } from "@heroui/react";

import { StatisticsSection } from "./components/StatisticsSection";
import { getCurrentMessage, Message } from "./message/messageDisplay";

import { IUserInfo } from "@/lib/user/interfaces/IUser";
import { getCurrentUser, logout } from "@/lib/utils";
import { HeaderApp } from "@/components/shared/HeaderApp";
import CmsoLoading from "@/components/shared/CmsoLoading";
import { NEST_DASHBOARD } from "@/config/constants";

// Interfaces
interface MenuCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  path: string;
  subItems: { icon: React.ReactNode; text: string }[];
  onPress: () => void;
  index: number;
}

interface StatsCardProps {
  title: string;
  value: string;
  icon: React.ReactNode;
  index: number;
  description?: string;
  trend?: {
    value: string;
    isPositive: boolean;
  };
}

interface DashboardStats {
  totalGeral: number;
  agendados: number;
  atendimento: number;
  aguardandoResultados: number;
  aguardandoAvaliacaoMedica: number;
}

// Constantes
const SESSION_MESSAGE_KEY = "dashboard_current_message";
const SESSION_SEEN_KEY = "message_seen";

// Componente Modal de Mensagem
const MessageModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  message: Message | null;
}> = ({ isOpen, onClose, message }) => {
  if (!isOpen || !message) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <motion.div
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden"
        exit={{ opacity: 0, scale: 0.95 }}
        initial={{ opacity: 0, scale: 0.95 }}
      >
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <video
                autoPlay
                loop
                muted
                playsInline
                className="h-20 w-20 object-contain"
                src="/images/gifs/Notification.webm"
              />
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  {message.title}
                </h2>
                <p className="text-md text-gray-500">{message.date}</p>
              </div>
            </div>
            <button
              aria-label="Fechar"
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              onClick={onClose}
            >
              <X className="h-5 w-5 text-gray-500" />
            </button>
          </div>
        </div>

        <div className="p-6 overflow-y-auto max-h-[50vh]">
          <div className="prose prose-lg max-w-none">
            <div className="whitespace-pre-line text-gray-700">
              {message.content}
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-gray-200 bg-gray-50">
          <div className="flex justify-end">
            <Button
              className="px-6 py-2"
              color="default"
              variant="ghost"
              onPress={onClose}
            >
              Fechar
            </Button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

// Botão flutuante para mensagens
const MessageFloatingButton: React.FC<{
  onClick: () => void;
  hasMessage: boolean;
}> = ({ onClick, hasMessage }) => (
  <button
    aria-label="Visualizar mensagem atual"
    className="fixed bottom-6 right-6 z-40 w-14 h-14 bg-[#44735E] rounded-full shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 flex items-center justify-center group"
    disabled={true}
    onClick={onClick}
  >
    <Bell className="h-6 w-6 text-white" />
    {hasMessage && (
      <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-white animate-pulse" />
    )}
    <span className="absolute -top-10 right-0 bg-gray-900 text-white text-xs py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
      Ver mensagem
    </span>
  </button>
);

// Funções para gerenciar sessão
const setSessionMessage = (message: Message): void => {
  if (typeof window !== "undefined") {
    // Remove mensagem anterior e marcação de vista
    sessionStorage.removeItem(SESSION_SEEN_KEY);
    sessionStorage.setItem(SESSION_MESSAGE_KEY, JSON.stringify(message));
  }
};

const getSessionMessage = (): Message | null => {
  if (typeof window !== "undefined") {
    const messageStr = sessionStorage.getItem(SESSION_MESSAGE_KEY);

    return messageStr ? JSON.parse(messageStr) : null;
  }

  return null;
};

const markMessageAsSeen = (): void => {
  if (typeof window !== "undefined") {
    sessionStorage.setItem(SESSION_SEEN_KEY, "true");
  }
};

const hasSeenMessage = (): boolean => {
  if (typeof window !== "undefined") {
    return sessionStorage.getItem(SESSION_SEEN_KEY) === "true";
  }

  return false;
};

const clearSessionMessage = (): void => {
  if (typeof window !== "undefined") {
    sessionStorage.removeItem(SESSION_MESSAGE_KEY);
    sessionStorage.removeItem(SESSION_SEEN_KEY);
  }
};

// Componentes existentes...
const WelcomeSection: React.FC<{ name: string }> = ({ name }) => (
  <motion.section
    animate={{ opacity: 1, y: 0 }}
    aria-labelledby="welcome-title"
    className="mb-10"
    initial={{ opacity: 0, y: 20 }}
    transition={{ duration: 0.5 }}
  >
    <section className="flex justify-between">
      <div>
        <h1
          className="text-3xl font-bold text-gray-900 tracking-tight"
          id="welcome-title"
        >
          Bem-vindo,{" "}
          <span>
            {name.split(" ")[0]} {name.split(" ")[1]}
          </span>
        </h1>
        <p className="text-lg text-gray-600 mt-2">
          Acesse as funcionalidades do sistema abaixo
        </p>
      </div>
    </section>
  </motion.section>
);

const MenuCard: React.FC<MenuCardProps> = ({
  title,
  description,
  icon,
  subItems,
  onPress,
  index,
}) => (
  <motion.article
    animate={{ opacity: 1, y: 0 }}
    aria-label={`Acessar ${title}`}
    className="group bg-white rounded-xl shadow-sm hover:shadow-xl transition-all duration-300 cursor-pointer border border-gray-200"
    initial={{ opacity: 0, y: 20 }}
    role="button"
    tabIndex={0}
    transition={{ duration: 0.5, delay: index * 0.1 }}
    onClick={onPress}
    onKeyDown={(e) => e.key === "Enter" && onPress()}
  >
    <header aria-labelledby={`card-title-${index}`} className="text-center p-6">
      <motion.div
        className="mx-auto w-16 h-16 rounded-full flex items-center justify-center bg-gray-50 mb-4"
        whileHover={{ scale: 1.1 }}
      >
        {icon}
      </motion.div>
      <h3
        className="text-xl font-semibold text-gray-900"
        id={`card-title-${index}`}
      >
        {title}
      </h3>
      <p className="text-gray-600 text-sm">{description}</p>
    </header>
    <div className="p-6">
      <div className="flex items-center justify-center space-x-4 text-sm text-gray-600">
        {subItems.map((item, i) => (
          <div key={i} aria-label={item.text} className="flex items-center">
            {item.icon}
            <span>{item.text}</span>
          </div>
        ))}
      </div>
      <button
        aria-label={`Acessar ${title}`}
        className="w-full px-4 py-2 bg-[#44735E] text-white rounded-md hover:bg-[#B8D864] focus:outline-none focus:ring-2 focus:ring-[#3dbdb9] focus:ring-offset-2 transition-colors"
      >
        Acessar
      </button>
    </div>
  </motion.article>
);

const StatsCard: React.FC<StatsCardProps> = ({
  title,
  value,
  icon,
  index,
  description,
  trend,
}) => (
  <article
    aria-labelledby={`stat-title-${index}`}
    className="bg-white rounded-2xl shadow-sm border border-gray-200/80 overflow-hidden"
    role="region"
  >
    <div className="p-6">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p
            className="text-sm font-medium text-gray-600 mb-1"
            id={`stat-title-${index}`}
          >
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
);

// Componente Principal
export default function DashboardPage() {
  const router = useRouter();

  const [user, setUser] = useState<IUserInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(
    null,
  );
  const [currentMessage, setCurrentMessage] = useState<Message | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [hasNewMessage, setHasNewMessage] = useState(false);

  // Buscar mensagem atual
  const fetchAndSetMessage = async () => {
    const message = await getCurrentMessage();

    if (message) {
      // Sempre sobrescreve a mensagem anterior na sessão
      setSessionMessage(message);
      setCurrentMessage(message);

      // Verificar se já foi vista
      if (!hasSeenMessage()) {
        setShowModal(true);
      }

      setHasNewMessage(true);
    }
  };

  useEffect(() => {
    const initDashboard = async () => {
      const currentUser = getCurrentUser();

      if (!currentUser) {
        setIsLoading(false);
        router.push("/");

        return;
      }

      setUser(currentUser);

      try {
        // Buscar dados do dashboard
        const res = await fetch(NEST_DASHBOARD);

        if (!res.ok) throw new Error("Erro ao buscar atendimentos");

        const responseStats: DashboardStats = await res.json();

        setDashboardStats(responseStats);

        // Verificar se há mensagem na sessão
        const storedMessage = getSessionMessage();

        if (storedMessage) {
          setCurrentMessage(storedMessage);
          setHasNewMessage(true);

          // Mostrar modal apenas se ainda não foi vista
          if (!hasSeenMessage()) {
            setShowModal(true);
          }
        } else {
          // Buscar nova mensagem
          await fetchAndSetMessage();
        }
      } catch (err) {
        console.error("Erro ao carregar atendimentos:", err);
        setDashboardStats(null);
      } finally {
        setIsLoading(false);
      }
    };

    initDashboard();
  }, [router]);

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
  ];

  const stats = [
    {
      title: "Total Prontuários",
      value: dashboardStats?.totalGeral,
      icon: <FileText className="h-6 w-6" />,
      description: "Até dia atual",
    },
    {
      title: "Atendimentos Previstos",
      value: dashboardStats?.agendados,
      icon: <Calendar className="h-6 w-6" />,
      description: "Todas as unidades",
      trend: { value: "+12%", isPositive: true },
    },
    {
      title: "Aguardando Liberação",
      value: `${dashboardStats?.aguardandoAvaliacaoMedica}`,
      icon: <CheckCircle className="h-6 w-6" />,
      description: "Para avaliação médica",
    },
    {
      title: "Aguardando Resultados",
      value: dashboardStats?.aguardandoResultados,
      icon: <Clock className="h-6 w-6" />,
      description: "Para finalização de exames",
    },
  ];

  if (isLoading || !user) {
    return <CmsoLoading />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <HeaderApp
        onLogout={() => {
          // Limpar mensagem ao fazer logout
          clearSessionMessage();
          logout();
          router.push("/");
        }}
      >
        <></>
      </HeaderApp>

      <main
        aria-label="Dashboard principal"
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6"
      >
        <WelcomeSection name={user.nome} />

        <section
          aria-label="Menu de funcionalidades"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
        >
          {menuItems.map((item, index) => (
            <MenuCard
              key={item.title}
              description={item.description}
              icon={item.icon}
              index={index}
              path={item.path}
              subItems={item.subItems}
              title={item.title}
              onPress={() => router.push(item.path)}
            />
          ))}
        </section>

        <section aria-labelledby="stats-title" className="mt-8">
          <div>
            <StatisticsSection />
          </div>
        </section>

        <motion.footer
          animate={{ opacity: 1 }}
          className="mt-12 pt-8 border-t border-gray-200 text-center"
          initial={{ opacity: 0 }}
          transition={{ duration: 0.5, delay: 1.5 }}
        >
          <p className="text-sm text-gray-600">
            Centro Médico de Saúde Ocupacional • {new Date().getFullYear()}
          </p>
        </motion.footer>
      </main>

      {/* Modal de Mensagem */}
      <MessageModal
        isOpen={showModal}
        message={currentMessage}
        onClose={() => {
          markMessageAsSeen();
          setShowModal(false);
        }}
      />

      {/* Botão flutuante para mensagens */}
      {currentMessage && (
        <MessageFloatingButton
          hasMessage={hasNewMessage}
          onClick={() => {
            setShowModal(true);
          }}
        />
      )}
    </div>
  );
}
