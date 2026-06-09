"use client";

import { motion } from "framer-motion";
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  RotateCw,
} from "lucide-react";
import React, { useEffect, useMemo, useRef, useState } from "react";

import { toProxyUrl } from "@/lib/blob/blob-proxy";
import {
  AsoPanelDisplayStatus,
  AsoPendingItem,
  requeueAso,
  useAsoTracking,
} from "@/hooks/useAsoTracking";
import { WorkerHealthIndicator } from "./WorkerHealthIndicator";

function isSignatureAuthenticationPending(message: string | null | undefined) {
  const normalized = String(message || "").toLowerCase();

  return (
    (normalized.includes("sess") && normalized.includes("psc")) ||
    normalized.includes("autentic") ||
    normalized.includes("credencial")
  );
}

function getFriendlyOperationalError(message: string | null | undefined) {
  if (!message) {
    return null;
  }

  if (isSignatureAuthenticationPending(message)) {
    return "Aguardando autenticação da assinatura digital.";
  }

  return message;
}

function getUpdatedAtSortValue(updatedAt: string | null) {
  if (!updatedAt) {
    return 0;
  }

  const value = Date.parse(updatedAt);

  return Number.isNaN(value) ? 0 : value;
}

function formatRetryAt(value: string | null | undefined) {
  if (!value) {
    return null;
  }

  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return parsed.toLocaleString("pt-BR");
}

const PROCESS_STEPS = [
  { label: "Envio", short: "ENV" },
  { label: "PDF", short: "PDF" },
  { label: "Assinatura", short: "ASS" },
  { label: "Validação", short: "VAL" },
  { label: "E-mail", short: "EML" },
] as const;

type ProcessStepState =
  | "complete"
  | "current"
  | "upcoming"
  | "attention"
  | "failed";

function getCurrentStepIndex(item: AsoPendingItem): number {
  const displayStatus = item.panel?.displayStatus;

  if (item.status === "LIBERADO") {
    return 5;
  }

  if (item.emailSent) {
    return 4;
  }

  if (
    displayStatus === "AGUARDANDO_ENVIO" ||
    displayStatus === "NA_FILA_DO_GERADOR"
  ) {
    return 0;
  }

  if (displayStatus === "EM_GERACAO") {
    return 1;
  }

  if (displayStatus === "PRECISA_DE_INTERVENCAO") {
    if (item.validacaoUrl || (item.signatureStatus && item.signatureStatus !== "PENDENTE")) {
      return 3;
    }

    return item.url ? 2 : 1;
  }

  if (displayStatus === "COM_FALHA") {
    if (item.validacaoUrl || (item.signatureStatus && item.signatureStatus !== "PENDENTE")) {
      return 3;
    }

    return item.url ? 2 : 1;
  }

  if (displayStatus === "SEGUINDO_AUTOMATICAMENTE") {
    if (item.validacaoUrl || (item.signatureStatus && item.signatureStatus !== "PENDENTE")) {
      return 3;
    }

    return 2;
  }

  return 0;
}

function getStepState(
  index: number,
  currentIndex: number,
  displayStatus: AsoPanelDisplayStatus,
): ProcessStepState {
  if (displayStatus === "PRECISA_DE_INTERVENCAO" && index === currentIndex) {
    return "attention";
  }

  if (displayStatus === "COM_FALHA" && index === currentIndex) {
    return "failed";
  }

  if (index < currentIndex) {
    return "complete";
  }

  if (index === currentIndex) {
    return "current";
  }

  return "upcoming";
}

function getSignaturePhase(
  item: AsoPendingItem,
): "digitalizada" | "pendente" | "assinado" {
  if (item.signatureStatus === "LIBERADO") return "assinado";
  if (item.status === "DIGITALIZADA") return "digitalizada";
  return "pendente";
}

function ProcessTimeline({ item }: { item: AsoPendingItem }) {
  const displayStatus = item.panel?.displayStatus;
  const currentIndex = getCurrentStepIndex(item);
  const totalSteps = PROCESS_STEPS.length;
  const progressPercent = (currentIndex / (totalSteps - 1)) * 100;
  const signaturePhase = getSignaturePhase(item);

  const isFailed = displayStatus === "COM_FALHA";
  const isAttention = displayStatus === "PRECISA_DE_INTERVENCAO";
  const hasError = isFailed || isAttention;
  const isDone = currentIndex >= totalSteps - 1;

  return (
    <div className="mt-3">
      <div className="relative">
        <div className="h-1.5 overflow-hidden rounded-full bg-gray-100">
          <div
            className={`h-full transition-all duration-700 ease-out ${
              hasError
                ? "bg-gradient-to-r from-[#44735E] via-amber-400 to-red-400"
                : "bg-gradient-to-r from-[#44735E] to-emerald-400"
            }`}
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        <div className="absolute -top-0.5 left-0 flex w-full justify-between">
          {PROCESS_STEPS.map((step, index) => {
            const isBioFacial =
              item.origem && item.origem !== "SOC";
            const state = getStepState(
              index,
              currentIndex,
              displayStatus || "AGUARDANDO_ENVIO",
            );
            const isComplete = state === "complete";
            const isCurrent = state === "current";
            const isStepAttention = state === "attention";
            const isStepFailed = state === "failed";
            const isStepDone = isComplete;
            const isActive = index === currentIndex;

            const stepLabel =
              index === 0 && isBioFacial
                ? "INI"
                : index === 2
                  ? signaturePhase === "assinado"
                    ? "ASS ✓"
                    : signaturePhase === "digitalizada"
                      ? "ASS (PDF)"
                      : "ASS"
                  : step.short;

            return (
              <div key={step.label} className="flex flex-col items-center">
                <div
                  className={`relative flex h-4 w-4 items-center justify-center rounded-full transition-all duration-300 ${
                    isComplete
                      ? "bg-[#44735E] shadow-[0_0_6px_rgba(68,115,94,0.4)]"
                      : isStepAttention
                        ? "bg-orange-400 shadow-[0_0_8px_rgba(251,146,60,0.5)] animate-pulse"
                        : isStepFailed
                          ? "bg-red-400 shadow-[0_0_8px_rgba(248,113,113,0.5)]"
                          : isCurrent
                            ? "bg-amber-300 shadow-[0_0_8px_rgba(252,211,77,0.4)]"
                            : "bg-gray-200"
                  }`}
                >
                  {isComplete && (
                    <svg
                      className="h-2.5 w-2.5 text-white"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={3}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  )}
                </div>

                <span
                  className={`mt-1.5 text-[7px] font-semibold uppercase tracking-wider ${
                    isStepDone
                      ? "text-[#44735E]"
                      : isStepAttention
                        ? "text-orange-500"
                        : isStepFailed
                          ? "text-red-500"
                          : isActive
                            ? "text-amber-600"
                            : "text-gray-300"
                  }`}
                >
                  {stepLabel}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-6 flex items-center justify-between text-[9px]">
        <span className="text-gray-400">
          {currentIndex + 1}/{totalSteps}
        </span>
        <span
          className={`font-medium ${
            hasError
              ? isFailed
                ? "text-red-500"
                : "text-orange-500"
              : isDone
                ? "text-[#44735E]"
                : "text-amber-600"
          }`}
        >
          {hasError
            ? isFailed
              ? "Falha"
              : "Ação necessária"
            : isDone
              ? "Concluído"
              : PROCESS_STEPS[currentIndex]?.label || "Início"}
        </span>
      </div>
    </div>
  );
}

const AsoItemCard = React.memo(({
  item,
  index,
  onRequeued,
}: {
  item: AsoPendingItem;
  index: number;
  onRequeued?: () => void;
}) => {
  const [requeueing, setRequeueing] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  if (!item.panel) {
    return null;
  }

  const friendlyError = getFriendlyOperationalError(item.error);
  const retryAt = formatRetryAt(item.nextRetryAt);
  const details = [
    item.tempoNaEtapa,
    item.nomeMedico || "N/A",
  ];

  if (retryAt) {
    details.push(
      item.retryCount && item.retryCount > 0
        ? `Tentativa ${item.retryCount + 1} em ${retryAt}`
        : `Próxima tentativa: ${retryAt}`,
    );
  }

  if (item.fonte === "FILA_AZURE") {
    details.push("Fila Azure");
  }

  const handleRequeue = async () => {
    setRequeueing(true);
    try {
      await requeueAso(item.schedulingId);
      onRequeued?.();
    } catch (err) {
      console.error("Erro ao reenfileirar:", err);
      alert(
        `Falha ao reenfileirar: ${err instanceof Error ? err.message : "Erro desconhecido"}`,
      );
    } finally {
      setRequeueing(false);
      setShowConfirm(false);
    }
  };

  return (
    <motion.div
      animate={{ opacity: 1, y: 0 }}
      className="overflow-hidden rounded-xl border border-gray-200 bg-white transition-all hover:shadow-md"
      initial={{ opacity: 0, y: 10 }}
      transition={{ delay: index * 0.04 }}
    >
      <div className="p-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2 text-sm text-gray-500">
              <span className="truncate font-medium text-gray-700">
                {item.nomeEmpresa}
              </span>
              <span>{item.tipoExame}</span>
              <span>{item.dataAgendamento}</span>
              {item.unidadeAtendimento && (
                <span>{item.unidadeAtendimento}</span>
              )}
            </div>
            <div className="mt-1 flex items-center gap-2">
              <h4 className="text-base font-semibold text-gray-900">
                {item.nomeFuncionario}
              </h4>
              {item.origem && item.origem !== 'SOC' && (
                <span
                  className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${
                    item.origem === 'BIOMETRIA'
                      ? 'bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-500/20'
                      : item.origem === 'FACIAL'
                        ? 'bg-purple-50 text-purple-700 ring-1 ring-inset ring-purple-500/20'
                        : 'bg-gray-50 text-gray-600 ring-1 ring-inset ring-gray-500/20'
                  }`}
                >
                  {item.origem}
                </span>
              )}
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            {friendlyError && (
              <span
                className="inline-flex max-w-[280px] items-center gap-1 truncate rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-medium text-red-600 ring-1 ring-inset ring-red-500/10"
                title={friendlyError}
              >
                <AlertTriangle className="h-2.5 w-2.5 shrink-0" />
                <span className="truncate">{friendlyError}</span>
              </span>
            )}
            {item.url && (
              <a
                className="inline-flex shrink-0 rounded-lg border border-[#44735E]/20 bg-white px-3 py-1.5 text-sm font-medium text-[#44735E] transition-colors hover:bg-[#44735E]/5"
                href={toProxyUrl(item.url)}
                rel="noreferrer"
                target="_blank"
              >
                Ver ASO
              </a>
            )}
          </div>
        </div>

        <ProcessTimeline item={item} />

        <div className="mt-2">
          <p className="text-xs text-gray-500">
            {details.join(" · ")}
          </p>
        </div>

        {(item.panel.needsManualAction || item.error) && (
          <div className="mt-3 flex justify-end">
            {showConfirm ? (
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500">
                  Reprocessar este ASO?
                </span>
                <button
                  className="inline-flex items-center gap-1 rounded-lg bg-[#44735E] px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-[#365e4c] disabled:opacity-50"
                  disabled={requeueing}
                  type="button"
                  onClick={handleRequeue}
                >
                  {requeueing ? (
                    <span className="h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  ) : (
                    <CheckCircle className="h-3.5 w-3.5" />
                  )}
                  Confirmar
                </button>
                <button
                  className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 transition-colors hover:bg-gray-50"
                  disabled={requeueing}
                  type="button"
                  onClick={() => setShowConfirm(false)}
                >
                  Cancelar
                </button>
              </div>
            ) : (
              <button
                className="inline-flex items-center gap-1.5 rounded-lg border border-orange-300 bg-orange-50 px-3 py-1.5 text-xs font-medium text-orange-700 transition-colors hover:bg-orange-100"
                type="button"
                onClick={() => setShowConfirm(true)}
              >
                <RotateCw className="h-3.5 w-3.5" />
                Reprocessar
              </button>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
});

interface AsoTrackingSectionProps {
  refreshSignal?: number;
}

export function AsoTrackingSection({
  refreshSignal = 0,
}: AsoTrackingSectionProps) {
  const [page, setPage] = useState(1);
  const [isExpanded, setIsExpanded] = useState(false);
  const previousRefreshSignal = useRef(refreshSignal);

  const { data, loading, isRefreshing, error, refetch } = useAsoTracking({
    autoRefresh: isExpanded,
    refreshInterval: 120000,
    limit: 100,
    page,
  });

  useEffect(() => {
    if (data?.page && data.page !== page) {
      setPage(data.page);
    }
  }, [data?.page, page]);

  useEffect(() => {
    if (previousRefreshSignal.current === refreshSignal) {
      return;
    }

    previousRefreshSignal.current = refreshSignal;
    void refetch();
  }, [refreshSignal, refetch]);

  const items = useMemo(() => {
    return [...(data?.items || [])].sort((a, b) => {
      const nameDifference = a.nomeFuncionario.localeCompare(
        b.nomeFuncionario,
        "pt-BR",
        {
          sensitivity: "base",
        },
      );

      if (nameDifference !== 0) {
        return nameDifference;
      }

      return (
        getUpdatedAtSortValue(b.updatedAt) - getUpdatedAtSortValue(a.updatedAt)
      );
    });
  }, [data?.items]);

  if (error) {
    return (
      <motion.div
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl border border-red-200 bg-gradient-to-br from-red-50 to-white p-6 shadow-sm"
        initial={{ opacity: 0, y: 20 }}
      >
        <div className="flex items-start gap-4">
          <div className="rounded-xl bg-red-100 p-3">
            <AlertCircle className="h-6 w-6 text-red-600" />
          </div>
          <div className="flex-1">
            <h3 className="mb-1 text-lg font-semibold text-red-800">
              Erro ao carregar liberação de ASOs
            </h3>
            <p className="mb-3 text-sm text-red-600">{error.message}</p>
            <button
              className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700"
              type="button"
              onClick={() => {
                void refetch();
              }}
            >
              Tentar novamente
            </button>
          </div>
        </div>
      </motion.div>
    );
  }

  if (loading && !data) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="mb-6 flex items-center justify-between">
          <div className="h-6 w-48 animate-pulse rounded bg-gray-200" />
          <div className="h-8 w-24 animate-pulse rounded bg-gray-200" />
        </div>
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-24 animate-pulse rounded-lg bg-gray-100"
            />
          ))}
        </div>
      </div>
    );
  }

  const total = data?.totalItems || data?.total || 0;
  const currentPage = data?.page || page;
  const totalPages = data?.totalPages || 1;
  const pageSize = data?.limit || 100;
  const pageStart = total === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const pageEnd = total === 0 ? 0 : pageStart + items.length - 1;
  const startCount = data?.stats?.naFilaDoGerador || 0;
  const inProgressCount =
    (data?.stats?.emGeracao || 0) + (data?.stats?.seguindoAutomaticamente || 0);
  const attentionCount =
    (data?.stats?.precisaIntervencao || 0) + (data?.stats?.comFalha || 0);
  const summaryParts = [
    startCount > 0 ? `${startCount} aguardando geração` : null,
    inProgressCount > 0 ? `${inProgressCount} em processamento` : null,
    attentionCount > 0 ? `${attentionCount} com atenção` : null,
  ].filter(Boolean);

  return (
    <motion.div
      animate={{ opacity: 1, y: 0 }}
      className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm"
      initial={{ opacity: 0, y: 20 }}
      transition={{ duration: 0.4 }}
    >
      <div
        className="w-full cursor-pointer border-b border-gray-200 bg-white px-5 py-4 text-left transition-all duration-200 hover:bg-gray-50"
        role="button"
        tabIndex={0}
        onClick={() => setIsExpanded((current) => !current)}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            setIsExpanded((current) => !current);
          }
        }}
      >
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 transition-colors hover:bg-gray-200">
              {isExpanded ? (
                <ChevronUp className="h-6 w-6 text-[#44735E]" />
              ) : (
                <ChevronDown className="h-6 w-6 text-[#44735E]" />
              )}
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-semibold tracking-tight text-gray-800">
                  Liberação de ASOs
                </h3>
                <span className="rounded-full border border-[#44735E]/20 bg-[#44735E]/10 px-2.5 py-0.5 text-xs font-medium text-[#44735E]">
                  Versão de Avaliação
                </span>
                {data?.janelaDias && (
                  <span className="text-sm font-normal text-gray-500">
                    (últimos {data.janelaDias} dias)
                  </span>
                )}
              </div>

              <p className="text-sm text-gray-600">
                {total} atendimento{total !== 1 ? "s" : ""}
                {summaryParts.length > 0 && (
                  <span className="ml-2 font-medium text-gray-400">
                    | {summaryParts.join(" | ")}
                  </span>
                )}
                {data?.lastUpdate && (
                  <span className="ml-2 text-gray-400">
                    | Atualizado{" "}
                    {new Date(data.lastUpdate).toLocaleTimeString("pt-BR")}
                  </span>
                )}
              </p>
            </div>
          </div>
        </div>
      </div>

      {isExpanded && (
        <motion.div
          animate={{ opacity: 1, height: "auto" }}
          className="p-5"
          exit={{ opacity: 0, height: 0 }}
          initial={{ opacity: 0, height: 0 }}
        >
          <WorkerHealthIndicator />

          {items.length === 0 ? (
            <div className="py-8 text-center">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <h4 className="mb-1 text-base font-medium text-gray-900">
                Nenhum item ativo na liberação de ASOs
              </h4>
              <p className="text-xs text-gray-500">
                Não há ASOs em liberação para este recorte no momento.
              </p>
            </div>
          ) : (
            <div className="max-h-[440px] space-y-3 overflow-y-auto pr-2">
              {items.map((item, index) => (
                <AsoItemCard
                  key={item.schedulingId}
                  index={index}
                  item={item}
                  onRequeued={refetch}
                />
              ))}

              <div className="flex flex-col gap-3 border-t border-gray-100 pb-1 pt-3 md:flex-row md:items-center md:justify-between">
                <p className="text-xs text-gray-500">
                  Exibindo {pageStart}-{pageEnd} de {total} itens da liberação
                  de ASOs.
                </p>
                <div className="flex items-center gap-2">
                  <button
                    className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                    disabled={currentPage <= 1}
                    type="button"
                    onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                  >
                    <ChevronLeft className="h-3.5 w-3.5" />
                    Anterior
                  </button>
                  <span className="text-xs font-medium text-gray-500">
                    Página {currentPage} de {totalPages}
                  </span>
                  <button
                    className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                    disabled={currentPage >= totalPages}
                    type="button"
                    onClick={() =>
                      setPage((prev) => Math.min(prev + 1, totalPages))
                    }
                  >
                    Próxima
                    <ChevronRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      )}
    </motion.div>
  );
}
