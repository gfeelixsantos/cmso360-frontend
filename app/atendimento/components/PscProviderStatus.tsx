"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  CheckCircle,
  Clock,
  ShieldAlert,
  Cloud,
} from "lucide-react";

import { StatusBadge, StatusColor } from "@/components/shared/StatusBadge";
import { ProviderIcon } from "@/components/shared/ProviderIcon";
import { IPscAuthStatus, IUserInfoSettings } from "@/lib/user/interfaces/IUser";

export interface PscProviderStatusProps {
  pscAuthStatus: IPscAuthStatus;
  settings?: IUserInfoSettings | null;
  isLoading?: boolean;
  onClick?: () => void;
}

function getStatusConfig(
  status: IPscAuthStatus["status"],
  provider?: string | null,
  isBryKmsConfigured?: boolean,
): {
  label: string;
  icon: React.ComponentType<any>;
  color: StatusColor;
} {
  if (provider === "BRYKMS") {
    if (isBryKmsConfigured) {
      return {
        label: "Bry Cloud",
        icon: Cloud,
        color: "green",
      };
    }

    return {
      label: "Não configurado",
      icon: AlertCircle,
      color: "yellow",
    };
  }

  switch (status) {
    case "ACTIVE":
      return {
        label: "Autenticado",
        icon: CheckCircle,
        color: "green",
      };
    case "EXPIRED":
      return {
        label: "Sessão expirada",
        icon: Clock,
        color: "yellow",
      };
    case "ERROR":
      return {
        label: "Erro",
        icon: ShieldAlert,
        color: "red",
      };
    case "NOT_AUTHENTICATED":
    default:
      return {
        label: "Não autenticado",
        icon: AlertCircle,
        color: "gray",
      };
  }
}

function formatExpiresAt(expiresAt: string | null): string {
  if (!expiresAt) return "";

  try {
    const date = new Date(expiresAt);

    return date.toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "";
  }
}

function getProviderLabel(
  settings?: IUserInfoSettings | null,
  pscName?: string | null,
): string | null {
  if (settings?.assinaturaProvider === "BRYKMS") {
    return "BRy Cloud";
  }

  if (pscName?.trim()) {
    return pscName.trim();
  }

  if (settings?.pscPadrao?.trim()) {
    return settings.pscPadrao.trim();
  }

  if (settings?.provedorPadrao?.trim()) {
    return settings.provedorPadrao.trim();
  }

  if (settings?.assinaturaProvider === "PSC") {
    return "PSC";
  }

  return null;
}

function formatRemainingTime(expiresAt: string | null, now: number): string {
  if (!expiresAt) return "";

  const expiresAtMs = new Date(expiresAt).getTime();

  if (Number.isNaN(expiresAtMs)) return "";

  const diffMs = expiresAtMs - now;

  if (diffMs <= 0) {
    return "Sessão expirada";
  }

  const totalMinutes = Math.floor(diffMs / (1000 * 60));
  const days = Math.floor(totalMinutes / (60 * 24));
  const hours = Math.floor((totalMinutes % (60 * 24)) / 60);
  const minutes = totalMinutes % 60;

  if (days > 0) {
    return `Válido por ${days}d ${hours}h`;
  }

  if (hours > 0) {
    return `Válido por ${hours}h ${minutes}min`;
  }

  return `Válido por ${Math.max(minutes, 1)}min`;
}

export function PscProviderStatus({
  pscAuthStatus,
  settings,
  isLoading = false,
  onClick,
}: PscProviderStatusProps) {
  const [now, setNow] = useState(() => Date.now());
  const isBryKmsConfigured =
    settings?.assinaturaProvider === "BRYKMS" &&
    !!settings?.uuidCert &&
    settings.uuidCert.trim() !== "";

  const config = getStatusConfig(
    pscAuthStatus.status,
    settings?.assinaturaProvider,
    isBryKmsConfigured,
  );
  const Icon = config.icon;
  const isBryCloudActive =
    settings?.assinaturaProvider === "BRYKMS" && isBryKmsConfigured;
  const isPscActive =
    settings?.assinaturaProvider === "PSC" && pscAuthStatus.status === "ACTIVE";
  const providerLabel = getProviderLabel(settings, pscAuthStatus.pscName);
  const showPscProviderAsStatus = isPscActive && !!providerLabel;
  const remainingTimeLabel = useMemo(
    () => formatRemainingTime(pscAuthStatus.expiresAt, now),
    [pscAuthStatus.expiresAt, now],
  );
  const badgeIcon =
    showPscProviderAsStatus && providerLabel ? (
      <ProviderIcon
        className="rounded-sm shadow-none"
        name={providerLabel}
        size={18}
      />
    ) : isBryCloudActive && config.color === "green" ? (
      <Cloud className="w-3 h-3 text-white fill-white" />
    ) : (
      <Icon className="w-3 h-3" />
    );
  const badgeLabel = showPscProviderAsStatus ? providerLabel : config.label;
  const signatureBadgeClass =
    config.color === "green"
      ? "!w-full justify-center !bg-[#AFCA07] !text-white !border-[#9AB406]"
      : "!w-full justify-center";

  const isClickable =
    !!onClick &&
    settings?.assinaturaProvider !== "BRYKMS" &&
    pscAuthStatus.status !== "ACTIVE";

  useEffect(() => {
    if (!pscAuthStatus.expiresAt || !pscAuthStatus.isActive) return;

    const interval = window.setInterval(() => {
      setNow(Date.now());
    }, 60_000);

    return () => window.clearInterval(interval);
  }, [pscAuthStatus.expiresAt, pscAuthStatus.isActive]);

  if (isLoading) {
    return (
      <StatusBadge
        color="yellow"
        icon={
          <div className="w-3 h-3 border-2 border-amber-300 border-t-amber-700 rounded-full animate-spin" />
        }
        label="Conectando ao provedor..."
      />
    );
  }

  return (
    <div className="w-full flex flex-col gap-1 items-stretch">
      <StatusBadge
        className={signatureBadgeClass}
        color={config.color}
        icon={badgeIcon}
        label={badgeLabel}
        onClick={isClickable ? onClick : undefined}
      />
      {/* Tempo de expiração - apenas para PSC, não para BRYKMS */}
      {pscAuthStatus.expiresAt &&
        pscAuthStatus.isActive &&
        settings?.assinaturaProvider !== "BRYKMS" && (
          <>
            <span className="text-xs font-medium text-[#104e35] pl-1">
              {remainingTimeLabel}
            </span>
            <span className="text-xs text-gray-500 pl-1">
              Expira em: {formatExpiresAt(pscAuthStatus.expiresAt)}
            </span>
          </>
        )}
    </div>
  );
}
