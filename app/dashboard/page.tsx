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
} from "lucide-react";

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

// Componentes
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

// Componente Principal CORRIGIDO
export default function DashboardPage() {
  const router = useRouter();

  const [user, setUser] = useState<IUserInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(
    null,
  );

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
        const res = await fetch(NEST_DASHBOARD);

        if (!res.ok) throw new Error("Erro ao buscar atendimentos");

        const responseStats: DashboardStats = await res.json();

        setDashboardStats(responseStats);
      } catch (err) {
        console.error("Erro ao carregar atendimentos:", err);
        // ✅ Define array vazio em caso de erro
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
      title: "Atendimentos Hoje",
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

  // ✅ FIX 4: Mostrar loading até carregar tudo
  if (isLoading || !user) {
    return <CmsoLoading />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <HeaderApp
        children={null}
        onLogout={() => {
          logout();
          router.push("/");
        }}
      />

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
          <motion.h2
            animate={{ opacity: 1, x: 0 }}
            className="text-xl font-semibold text-gray-800 flex items-center mb-6"
            id="stats-title"
            initial={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.5, delay: 0.8 }}
          >
            Visão Geral do Sistema
          </motion.h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {stats.map((stat, index) => (
              <StatsCard
                key={stat.title}
                description={stat.description}
                icon={stat.icon}
                index={index}
                title={stat.title}
                trend={stat.trend}
                value={stat.value !== undefined ? stat.value.toString() : "N/A"}
              />
            ))}
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
    </div>
  );
}
