import { Chip, Tooltip } from "@heroui/react";
import {
  AlertTriangle,
  CircleHelp,
  FileText,
  MailCheck,
  MailX,
  ShieldCheck,
  UserCheck,
} from "lucide-react";
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

const ASO_PHASES_TOOLTIP = [
  "Aguardando Geracao: backend reconheceu que o ASO precisa ser emitido.",
  "Aguardando Assinatura: PDF base foi gerado e aguarda assinatura/enriquecimento.",
  "Assinado - Enriquecimento: assinatura iniciou e o documento esta sendo finalizado.",
  "Digitalizada: PDF existe, mas sem assinatura digital concluida.",
  "Liberado: ASO concluido e pronto para consulta/envio.",
  "Falha na assinatura: fluxo encontrou erro e precisa intervencao.",
].join("\n");

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
              className="font-semibold text-white"
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
                    <Tooltip
                      color="foreground"
                      content="Ver ASO"
                      disableAnimation={true}
                    >
                      <a
                        className="rounded-full p-1.5 text-[#44735e] transition-colors hover:bg-green-50"
                        href={asoUrl}
                        rel="noopener noreferrer"
                        target="_blank"
                      >
                        <FileText size={16} />
                      </a>
                    </Tooltip>
                  )}
                  {validacaoUrl && (
                    <Tooltip
                      color="foreground"
                      content="Validar assinatura"
                      disableAnimation={true}
                    >
                      <a
                        className="rounded-full p-1.5 text-[#44735e] transition-colors hover:bg-green-50"
                        href={validacaoUrl}
                        rel="noopener noreferrer"
                        target="_blank"
                      >
                        <ShieldCheck size={16} />
                      </a>
                    </Tooltip>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <p className="text-sm font-medium text-gray-900">{parecerAso}</p>
                {asoUrl && (
                  <Tooltip
                    color="foreground"
                    content="Ver ASO"
                    disableAnimation={true}
                  >
                    <a
                      className="rounded-full p-1 text-[#44735e] transition-colors hover:bg-green-50"
                      href={asoUrl}
                      rel="noopener noreferrer"
                      target="_blank"
                    >
                      <FileText size={15} />
                    </a>
                  </Tooltip>
                )}
              </div>

              <div className="space-y-2">
                <h4 className="flex items-center gap-2 text-sm font-medium text-gray-600">
                  Situação
                  <Tooltip
                    color="foreground"
                    content={
                      <div className="max-w-xs whitespace-pre-line text-xs">
                        {ASO_PHASES_TOOLTIP}
                      </div>
                    }
                    disableAnimation={true}
                  >
                    <span className="inline-flex cursor-help text-gray-400 transition-colors hover:text-gray-600">
                      <CircleHelp size={14} />
                    </span>
                  </Tooltip>
                </h4>
                <p
                  className={`text-xs font-medium ${getAsoStatusTextColor(asoStatusColor)}`}
                >
                  {asoStatusLabel}
                </p>
              </div>

              <div className="space-y-2">
                <h4 className="flex items-center gap-2 text-sm font-medium text-gray-600">
                  E-mail
                </h4>
                <div className="flex items-center gap-2">
                  {emailSent ? (
                    <MailCheck className="text-emerald-600" size={14} />
                  ) : (
                    <MailX className="text-amber-600" size={14} />
                  )}
                  <p className="text-xs font-medium text-gray-900">{emailLabel}</p>
                </div>
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
