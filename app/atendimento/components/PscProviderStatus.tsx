"use client";
import { AlertCircle, CheckCircle, Clock, ShieldAlert, Cloud } from "lucide-react";

import { StatusBadge, StatusColor } from "@/components/shared/StatusBadge";
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
  pscName?: string | null,
): {
  label: string;
  icon: React.ComponentType<any>;
  color: StatusColor;
} {
  if (provider === "BRYKMS") {
    if (isBryKmsConfigured) {
      return {
        label: "BRy Cloud",
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
        label: pscName?.trim() || "Autenticado",
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

export function PscProviderStatus({
  pscAuthStatus,
  settings,
  isLoading = false,
  onClick,
}: PscProviderStatusProps) {
  const isBryKmsConfigured =
    settings?.assinaturaProvider === "BRYKMS" &&
    settings?.uuidCert &&
    settings.uuidCert.trim() !== "";

  const config = getStatusConfig(
    pscAuthStatus.status,
    settings?.assinaturaProvider,
    isBryKmsConfigured,
    pscAuthStatus.pscName,
  );
  const Icon = config.icon;
  const isBryCloudActive =
    settings?.assinaturaProvider === "BRYKMS" && isBryKmsConfigured;
  const badgeIcon =
    isBryCloudActive && config.color === "green" ? (
      <Cloud className="w-3 h-3 text-white fill-white" />
    ) : (
      <Icon className="w-3 h-3" />
    );
  const signatureBadgeClass =
    config.color === "green"
      ? "!w-full justify-center !bg-[#AFCA07] !text-white !border-[#9AB406]"
      : "!w-full justify-center";

  const isClickable =
    !!onClick &&
    settings?.assinaturaProvider !== "BRYKMS" &&
    pscAuthStatus.status !== "ACTIVE";

  if (isLoading) {
    return (
      <StatusBadge
        color="yellow"
        icon={<div className="w-3 h-3 border-2 border-amber-300 border-t-amber-700 rounded-full animate-spin" />}
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
        label={config.label}
        onClick={isClickable ? onClick : undefined}
      />
      {pscAuthStatus.expiresAt &&
        pscAuthStatus.isActive &&
        settings?.assinaturaProvider !== "BRYKMS" && (
          <span className="text-xs text-gray-500 pl-1">
            Expira: {formatExpiresAt(pscAuthStatus.expiresAt)}
          </span>
        )}
    </div>
  );
}



