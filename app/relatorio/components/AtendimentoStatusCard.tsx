import { Chip } from "@heroui/react";
import { AlertTriangle, FileText, ShieldCheck, UserCheck } from "lucide-react";
import React from "react";

type StatusColor =
  | "default"
  | "primary"
  | "secondary"
  | "success"
  | "warning"
  | "danger";

interface AtendimentoStatusCardProps {
  hasAsoData: boolean;
  parecerAso: string;
  asoStatusLabel: string;
  asoStatusColor: string;
  profissionalAso?: string | null;
  atendimentoStatusLabel: string;
  atendimentoStatusColor: StatusColor;
  signatureLabel: string;
  signatureDate: string;
  emailLabel: string;
  emailSent?: boolean;
  asoUrl?: string | null;
  validacaoUrl?: string | null;
  observacoesParecer: string[];
  hasAsoError: boolean;
  asoErrorMessage?: string | null;
}

const getAsoStatusTextColor = (statusColor: string) => {
  if (statusColor === "success") return "text-emerald-700";
  if (statusColor === "danger") return "text-red-700";

  return "text-gray-900";
};

const AtendimentoStatusCard: React.FC<AtendimentoStatusCardProps> = ({
  hasAsoData,
  parecerAso,
  asoStatusLabel,
  asoStatusColor,
  profissionalAso,
  atendimentoStatusLabel,
  atendimentoStatusColor,
  signatureLabel,
  signatureDate,
  emailLabel,
  emailSent,
  asoUrl,
  validacaoUrl,
  observacoesParecer,
  hasAsoError,
  asoErrorMessage,
}) => {
  return (
    <div className="mt-2">
      <div className="p-1">
        <div
          className={`grid grid-cols-1 gap-6 md:grid-cols-2 ${
            hasAsoData ? "xl:grid-cols-3" : "xl:grid-cols-1"
          }`}
        >
          <section className="space-y-3">
            <h4 className="flex items-center gap-2 text-sm font-medium text-gray-600">
              <UserCheck size={16} />
              Status do Atendimento
            </h4>
            <Chip
              className="text-white font-semibold"
              color={atendimentoStatusColor}
              size="lg"
            >
              {atendimentoStatusLabel}
            </Chip>
          </section>

          {hasAsoData && (
            <section className="space-y-3">
              <div className="flex items-center justify-between gap-3">
                <h4 className="text-sm font-medium text-gray-600">
                  Parecer ASO
                </h4>
                <div className="flex items-center gap-2">
                  {asoUrl && (
                    <a
                      className="rounded-full p-1.5 text-[#44735e] transition-colors hover:bg-green-50"
                      href={asoUrl}
                      rel="noopener noreferrer"
                      target="_blank"
                    >
                      <FileText size={16} />
                    </a>
                  )}
                  {validacaoUrl && (
                    <a
                      className="rounded-full p-1.5 text-[#44735e] transition-colors hover:bg-green-50"
                      href={validacaoUrl}
                      rel="noopener noreferrer"
                      target="_blank"
                    >
                      <ShieldCheck size={16} />
                    </a>
                  )}
                </div>
              </div>

              <p className="text-sm font-medium text-gray-900">{parecerAso}</p>

              <div className="space-y-2">
                <h4 className="flex items-center gap-2 text-sm font-medium text-gray-600">
                  Situação
                </h4>
                <p className="text-xs text-gray-900">{asoStatusLabel}</p>
              </div>
            </section>
          )}

          {hasAsoData && (
            <section className="space-y-3">
              <h4 className="flex items-center gap-2 text-sm font-medium text-gray-600">
                Médico Responsável
              </h4>
              <p className="text-sm text-gray-900">
                {profissionalAso || "Nao informado"}
              </p>
              <div className="space-y-1 pt-1">
                <h4 className="flex items-center gap-2 text-sm font-medium text-gray-600">
                  Tipo de assinatura
                </h4>
                <p className="text-xs text-gray-900">{signatureLabel}</p>
                <h4 className="flex items-center gap-2 text-sm font-medium text-gray-600">
                  Atualização
                </h4>
                <p className="text-xs normal-case text-gray-600">
                  {signatureDate}
                </p>
              </div>
            </section>
          )}
        </div>

        {observacoesParecer.length > 0 && (
          <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2">
            <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-amber-700">
              Observacoes do parecer
            </p>
            <p className="text-xs text-amber-900">
              {observacoesParecer.join(" | ")}
            </p>
          </div>
        )}

        {hasAsoError && asoErrorMessage && (
          <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2">
            <p className="mb-1 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-red-700">
              <AlertTriangle size={12} />
              Erro no fluxo ASO
            </p>
            <p className="text-xs font-medium text-red-900">
              {asoErrorMessage}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default React.memo(AtendimentoStatusCard);
