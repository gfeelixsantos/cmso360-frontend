"use client";

import React, { useEffect, useState } from "react";
import { Bell, BellOff, BellRing } from "lucide-react";
import { Button, Tooltip } from "@heroui/react";
import { hasNotificationPermission, requestNotificationPermission } from "@/lib/notifications";

export const NotificationToggle: React.FC = () => {
  const [permission, setPermission] = useState<NotificationPermission>("default");

  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      setPermission(Notification.permission);
    }
  }, []);

  const handleToggle = async () => {
    if (permission === "granted") {
      // Browsers don't allow "revoking" permission programmatically.
      alert("Para desativar as notificações, altere as configurações no cadeado ao lado da barra de endereços do seu navegador.");
      return;
    }
    
    if (permission === "denied") {
      alert("Você bloqueou as notificações. Por favor, libere a permissão no cadeado da barra de endereços e recarregue a página.");
      return;
    }

    const result = await requestNotificationPermission();
    setPermission(result);
  };

  if (typeof window === "undefined" || !("Notification" in window)) {
    return null; // Not supported
  }

  const getIcon = () => {
    if (permission === "granted") return <BellRing className="h-5 w-5 text-emerald-500" />;
    if (permission === "denied") return <BellOff className="h-5 w-5 text-gray-400" />;
    return <Bell className="h-5 w-5 text-amber-500 animate-pulse" />;
  };

  const getTooltip = () => {
    if (permission === "granted") return "Notificações do OS Ativas";
    if (permission === "denied") return "Notificações Bloqueadas";
    return "Ativar Notificações no Desktop";
  };

  return (
    <Tooltip content={getTooltip()} placement="bottom">
      <Button
        size="sm"
        variant="light"
        className="text-gray-600"
        onPress={handleToggle}
        startContent={getIcon()}
      >
        {permission === "granted" ? "Alertas Ativos" : "Ativar Alertas"}
      </Button>
    </Tooltip>
  );
};
