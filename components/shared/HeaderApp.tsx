"use client";

import { Badge, Button, Link } from "@heroui/react";
import { motion, AnimatePresence } from "framer-motion";
import {
  AlertCircle,
  ArrowLeft,
  Bell,
  CheckCheck,
  CheckCircle,
  ChevronDown,
  ExternalLink,
  Inbox,
  LayoutGrid,
  LogOut,
  Settings,
  CalendarDays,
  Stethoscope,
  Users,
  ChartNoAxesCombined,
  FileText,
} from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";

import { getCurrentUser } from "@/lib/utils";
import { IUserInfo } from "@/lib/user/interfaces/IUser";
import {
  type AppNotification,
  addNotification,
  clearAllNotifications,
  clearReadNotifications,
  getNotifications,
  markAllAsRead,
  markAsRead,
  subscribe,
} from "@/lib/notification-store";

type MenuView = "menu" | "notifications";

const getSpecialtyColor = (especialidade: string) => {
  const colorMap: Record<string, string> = {
    MASTER: "bg-gray-100 text-gray-800 border-gray-300",
    MÉDICO: "bg-blue-100 text-blue-700 border-blue-200",
    ENFERMAGEM: "bg-emerald-100 text-emerald-700 border-emerald-200",
    FONOAUDIOLOGA: "bg-violet-100 text-violet-700 border-violet-200",
    ADMINISTRATIVO: "bg-slate-100 text-slate-700 border-slate-200",
    COMERCIAL: "bg-orange-100 text-orange-700 border-orange-200",
    ATENDIMENTO: "bg-cyan-100 text-cyan-700 border-cyan-200",
    LABORATORIO: "bg-yellow-100 text-yellow-700 border-yellow-200",
    CONVIDADO: "bg-stone-100 text-stone-600 border-stone-200",
    ENGENHARIA: "bg-red-100 text-red-700 border-red-200",
  };

  return colorMap[especialidade] || "bg-gray-100 text-gray-700 border-gray-200";
};

const getAvatarColor = (especialidade: string) => {
  const colorMap: Record<string, string> = {
    MASTER: "bg-gray-800",
    MÉDICO: "bg-blue-600",
    ENFERMAGEM: "bg-emerald-500",
    FONOAUDIOLOGA: "bg-violet-500",
    ADMINISTRATIVO: "bg-slate-600",
    COMERCIAL: "bg-orange-500",
    ATENDIMENTO: "bg-cyan-500",
    LABORATORIO: "bg-yellow-600",
    CONVIDADO: "bg-stone-400",
    ENGENHARIA: "bg-red-500",
  };

  return colorMap[especialidade] || "bg-gray-500";
};

const getHoverColor = (especialidade: string) => {
  const colorMap: Record<string, string> = {
    MASTER: "hover:bg-gray-50 hover:text-gray-800",
    MÉDICO: "hover:bg-blue-50 hover:text-blue-700",
    ENFERMAGEM: "hover:bg-emerald-50 hover:text-emerald-700",
    FONOAUDIOLOGA: "hover:bg-violet-50 hover:text-violet-700",
    ADMINISTRATIVO: "hover:bg-slate-50 hover:text-slate-700",
    COMERCIAL: "hover:bg-orange-50 hover:text-orange-700",
    ATENDIMENTO: "hover:bg-cyan-50 hover:text-cyan-700",
    LABORATORIO: "hover:bg-yellow-50 hover:text-yellow-700",
    CONVIDADO: "hover:bg-stone-50 hover:text-stone-600",
    ENGENHARIA: "hover:bg-red-50 hover:text-red-700",
  };

  return colorMap[especialidade] || "hover:bg-gray-50 hover:text-gray-900";
};

const getInitials = (nome: string): string => {
  if (!nome) return "?";

  const names = nome.trim().split(/\s+/);

  if (names.length === 1) return names[0].substring(0, 2).toUpperCase();

  return (names[0][0] + names[names.length - 1][0]).toUpperCase();
};

const getNotificationIcon = (type: AppNotification["type"]) => {
  switch (type) {
    case "warning":
      return <AlertCircle className="h-5 w-5 text-amber-500" />;
    case "success":
      return <CheckCircle className="h-5 w-5 text-emerald-500" />;
    case "error":
      return <AlertCircle className="h-5 w-5 text-red-500" />;
    default:
      return <Bell className="h-5 w-5 text-sky-500" />;
  }
};

const NotificationsList: React.FC<{
  notifications: AppNotification[];
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
  onClearRead: () => void;
  onClearAll: () => void;
  onOpenAction: (notification: AppNotification) => void;
}> = ({
  notifications,
  onMarkAsRead,
  onMarkAllAsRead,
  onClearRead,
  onClearAll,
  onOpenAction,
}) => {
  const unreadCount = notifications.filter((n) => !n.read).length;
  const hasUnread = unreadCount > 0;
  const hasRead = notifications.some((n) => n.read);
  const recentNotifications = notifications.slice(0, 8);

  return (
    <div className="flex flex-col">
      <div className="border-b border-gray-100 px-4 py-3">
        <h3 className="text-sm font-semibold text-gray-900">Notificações</h3>
        <p className="text-xs text-gray-500">
          {unreadCount} não lida(s) · {notifications.length} total
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Button
            isDisabled={!hasUnread}
            size="sm"
            startContent={<CheckCheck className="h-4 w-4" />}
            variant="light"
            onPress={onMarkAllAsRead}
          >
            Marcar todas
          </Button>
          <Button
            isDisabled={notifications.length === 0}
            size="sm"
            startContent={<Inbox className="h-4 w-4" />}
            variant="light"
            onPress={onClearAll}
          >
            Limpar tudo
          </Button>
        </div>
      </div>

      <div className="max-h-[28rem] overflow-y-auto">
        {recentNotifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-4 py-8 text-center text-gray-500">
            <Bell className="mb-3 h-8 w-8 text-gray-300" />
            <p className="text-sm font-medium text-gray-700">
              Nenhuma notificação
            </p>
            <p className="text-xs text-gray-500">
              Novos eventos aparecerão aqui.
            </p>
          </div>
        ) : (
          recentNotifications.map((notification) => (
            <div
              key={notification.id}
              className={`border-b border-gray-100 px-4 py-3 transition-colors hover:bg-gray-50 ${
                notification.read ? "" : "bg-sky-50/60"
              }`}
            >
              <div className="flex items-start gap-3">
                <button
                  aria-label={`Marcar notificação ${notification.title} como lida`}
                  className="mt-0.5 rounded-full bg-white p-2 shadow-sm ring-1 ring-gray-100"
                  onClick={() => onMarkAsRead(notification.id)}
                >
                  {getNotificationIcon(notification.type)}
                </button>

                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-gray-900">
                        {notification.title}
                      </p>
                      <p className="mt-1 text-sm text-gray-600">
                        {notification.message}
                      </p>
                    </div>

                    {!notification.read && (
                      <span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-sky-500" />
                    )}
                  </div>

                  <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-gray-500">
                    {notification.date}
                  </div>

                  <div className="mt-3 flex flex-wrap gap-2">
                    {notification.actionUrl && (
                      <Button
                        color="primary"
                        size="sm"
                        startContent={<ExternalLink className="h-4 w-4" />}
                        variant="flat"
                        onPress={() => onOpenAction(notification)}
                      >
                        {notification.actionLabel || "Abrir"}
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="light"
                      onPress={() => onMarkAsRead(notification.id)}
                    >
                      {notification.read ? "Lida" : "Marcar como lida"}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

interface HeaderProps {
  onLogout: () => void;
  children?: React.ReactNode;
}

export const HeaderApp: React.FC<HeaderProps> = ({ onLogout, children }) => {
  const router = useRouter();
  const [user, setUser] = useState<IUserInfo | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [view, setView] = useState<MenuView>("menu");
  const [notifications, setNotifications] = useState<AppNotification[]>(() =>
    getNotifications(),
  );

  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const currentUser = getCurrentUser();

    if (!currentUser) {
      router.push("/");
    } else {
      setUser(currentUser);
    }
  }, [router]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        closeMenu();
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closeMenu();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  useEffect(() => {
    const unsubscribe = subscribe(setNotifications);

    return unsubscribe;
  }, []);

  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
      return;
    }

    const handler = (event: MessageEvent) => {
      const data = event.data;

      if (!data || data.type !== "app-notification" || !data.notification) {
        return;
      }

      addNotification(data.notification);
    };

    navigator.serviceWorker.addEventListener("message", handler);

    return () => navigator.serviceWorker.removeEventListener("message", handler);
  }, []);

  const unreadNotificationsCount = useMemo(
    () => notifications.filter((n) => !n.read).length,
    [notifications],
  );

  const closeMenu = () => {
    setIsMenuOpen(false);
    setView("menu");
  };

  const handleMarkAsRead = (id: string) => {
    markAsRead(id);
  };

  const handleOpenAction = (notification: AppNotification) => {
    if (!notification.actionUrl) return;

    markAsRead(notification.id);
    closeMenu();

    if (/^https?:\/\//i.test(notification.actionUrl)) {
      window.open(notification.actionUrl, "_blank", "noopener,noreferrer");

      return;
    }

    router.push(notification.actionUrl);
  };

  const handleNavigate = (path: string) => {
    closeMenu();
    router.push(path);
  };

  const handleLogout = () => {
    closeMenu();
    onLogout();
  };

  return (
    <motion.header
      animate={{ y: 0, opacity: 1 }}
      className="sticky top-0 z-40 border-b border-gray-100 bg-white/95 shadow-sm backdrop-blur-md"
      initial={{ y: -80, opacity: 0 }}
      role="banner"
      transition={{ duration: 0.6, ease: "easeOut" }}
    >
      <div className="mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <Link
            aria-label="Ir para o dashboard"
            className="flex items-center gap-2 rounded-lg p-1 transition-transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500"
            href="/dashboard"
          >
            <Image
              priority
              alt="CMSO 360"
              className="h-12 w-auto"
              height={54}
              src="/images/logo.png"
              width={180}
            />
          </Link>

          {children}

          <div className="flex items-center gap-3">
            <div ref={menuRef} className="relative">
              <button
                aria-expanded={isMenuOpen}
                aria-haspopup="true"
                aria-label="Abrir menu do usuário"
                className="flex cursor-pointer items-center gap-2 rounded-xl p-2 transition-colors hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                onClick={() => setIsMenuOpen((current) => !current)}
              >
                <Badge
                  color="danger"
                  content={unreadNotificationsCount}
                  isInvisible={unreadNotificationsCount === 0}
                  placement="bottom-left"
                  shape="circle"
                  size="sm"
                >
                  <div
                    className={`flex h-9 w-9 items-center justify-center rounded-full ${getAvatarColor(user?.perfil ?? "")} ring-2 ring-white shadow-md`}
                    title={user?.nome}
                  >
                    <span className="text-sm font-semibold text-white">
                      {getInitials(user?.nome ?? "")}
                    </span>
                  </div>
                </Badge>

                <div className="hidden text-left md:block">
                  <p className="text-sm font-semibold text-gray-900">
                    {user?.nome}
                  </p>
                  <p
                    className={`rounded-full border px-2 py-0.5 text-center text-xs font-medium shadow-sm ${getSpecialtyColor(
                      user?.perfil ?? "",
                    )}`}
                  >
                    {user?.perfil}
                  </p>
                </div>

                <ChevronDown
                  aria-hidden="true"
                  className={`h-4 w-4 text-gray-500 transition-transform ${
                    isMenuOpen ? "rotate-180" : ""
                  }`}
                />
              </button>

              <AnimatePresence>
                {isMenuOpen && (
                  <motion.div
                    animate={{ opacity: 1, y: 0 }}
                    className="absolute right-0 z-50 mt-2 w-[22rem] overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl"
                    exit={{ opacity: 0, y: -10 }}
                    initial={{ opacity: 0, y: -10 }}
                    role="menu"
                    transition={{ duration: 0.2 }}
                  >
                    <div className="border-b border-gray-100 px-4 py-3">
                      <p className="text-sm font-semibold text-gray-900">
                        {user?.nome}
                      </p>
                      <p className="text-xs text-gray-500">{user?.perfil}</p>
                    </div>

                    <div className="grid grid-cols-4 gap-1 border-b border-gray-100 px-4 py-3">
                      {[
                        { icon: Stethoscope, label: "Atendimento", path: "/atendimento" },
                        { icon: Users, label: "Recepção", path: "/recepcao" },
                        { icon: ChartNoAxesCombined, label: "Relatórios", path: "/relatorio" },
                        { icon: FileText, label: "Prontuários", path: "/prontuarios" },
                      ].map((item) => (
                        <button
                          key={item.path}
                          className={`flex flex-col items-center gap-1.5 rounded-lg p-2 text-gray-600 cursor-pointer transition-colors ${getHoverColor(user?.perfil ?? "")}`}
                          onClick={() => handleNavigate(item.path)}
                        >
                          <item.icon className="h-5 w-5" />
                          <span className="text-[10px] font-medium leading-tight text-center">{item.label}</span>
                        </button>
                      ))}
                    </div>

                    <button
                      className={`flex w-full items-center px-4 py-2 text-sm text-gray-700 cursor-pointer transition-colors ${getHoverColor(user?.perfil ?? "")}`}
                      onClick={() => handleNavigate("/agenda")}
                    >
                      <CalendarDays className="mr-3 h-4 w-4" />
                      Agenda de Compromissos
                    </button>

                    <button
                      className={`flex w-full items-center px-4 py-2 text-sm text-gray-700 cursor-pointer transition-colors ${getHoverColor(user?.perfil ?? "")}`}
                      onClick={() => handleNavigate("/configuracoes")}
                    >
                      <Settings className="mr-3 h-4 w-4" />
                      Configurações
                    </button>

                    <button
                      className={`flex w-full items-center px-4 py-2 text-sm text-gray-700 cursor-pointer transition-colors ${getHoverColor(user?.perfil ?? "")}`}
                      onClick={() => handleNavigate("/servicos")}
                    >
                      <LayoutGrid className="mr-3 h-4 w-4" />
                      Serviços
                    </button>

                    <button
                      aria-expanded={view === "notifications"}
                      className={`flex w-full items-center justify-between px-4 py-2 text-sm text-gray-700 cursor-pointer transition-colors ${getHoverColor(user?.perfil ?? "")}`}
                      onClick={() =>
                        setView((current) =>
                          current === "notifications" ? "menu" : "notifications",
                        )
                      }
                    >
                      <span className="flex items-center">
                        <Bell className="mr-3 h-4 w-4" />
                        Notificações
                      </span>
                      <span className="flex items-center gap-2">
                        {unreadNotificationsCount > 0 && (
                          <Badge
                            color="danger"
                            content={unreadNotificationsCount}
                            shape="circle"
                            size="sm"
                          >
                            <span className="sr-only">não lidas</span>
                          </Badge>
                        )}
                        <ChevronDown
                          aria-hidden="true"
                          className={`h-3.5 w-3.5 text-gray-400 transition-transform ${
                            view === "notifications" ? "rotate-180" : ""
                          }`}
                        />
                      </span>
                    </button>

                    <AnimatePresence initial={false}>
                      {view === "notifications" && (
                        <motion.div
                          animate={{ height: "auto", opacity: 1 }}
                          className="overflow-hidden border-t border-gray-100"
                          exit={{ height: 0, opacity: 0 }}
                          initial={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2, ease: "easeOut" }}
                        >
                          <div className="max-h-[28rem] overflow-y-auto">
                            <NotificationsList
                              notifications={notifications}
                              onClearAll={clearAllNotifications}
                              onClearRead={clearReadNotifications}
                              onMarkAllAsRead={markAllAsRead}
                              onMarkAsRead={handleMarkAsRead}
                              onOpenAction={handleOpenAction}
                            />
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <div className="border-t border-gray-100" />

                    <button
                      className="flex w-full items-center px-4 py-2 text-sm text-red-600 cursor-pointer transition-colors hover:bg-red-50"
                      onClick={handleLogout}
                    >
                      <LogOut className="mr-3 h-4 w-4" />
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
  );
};
