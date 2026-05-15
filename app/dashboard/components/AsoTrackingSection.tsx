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
  CircleHelp,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";

import {
  AsoPanelDisplayStatus,
  AsoPendingItem,
  useAsoTracking,
} from "@/hooks/useAsoTracking";

const SUMMARY_EXPLANATIONS = [
  {
    label: "A iniciar",
    description: "ASOs que ainda não entraram efetivamente no processamento.",
  },
  {
    label: "Em andamento",
    description: "ASOs que estao sendo gerados neste momento.",
  },
  {
    label: "Com atenção",
    description:
      "ASOs com falha ou que dependem de autenticação/intervenção para continuar.",
  },
];

const STATUS_EXPLANATIONS = [
  {
    label: "Aguardando envio",
    description: "O ASO ainda não chegou ao gerador.",
  },
  {
    label: "Na fila do gerador",
    description: "O ASO esta visivel na fila do cmso360-aso-generate.",
  },
  {
    label: "Em geração",
    description: "O gerador já pegou o ASO e está criando o documento.",
  },
  {
    label: "Nas etapas seguintes",
    description:
      "O ASO saiu da geração e agora está nas etapas seguintes da liberação.",
  },
  {
    label: "Precisa de intervenção",
    description:
      "O fluxo depende de autenticação da assinatura digital ou outra ação manual.",
  },
  {
    label: "Com falha",
    description: "O fluxo registrou falha e não conclui sozinho.",
  },
];

function HelpPopover() {
  return (
    <div className="group relative">
      <button
        aria-label="Explicar os contadores e situações da liberação de ASOs"
        className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-[#44735E]/20 bg-white/80 text-[#44735E] transition-colors hover:bg-white"
        type="button"
        onClick={(event) => event.stopPropagation()}
      >
        <CircleHelp className="h-3.5 w-3.5" />
      </button>

      <div className="pointer-events-none absolute right-0 top-7 z-20 hidden w-[360px] rounded-xl border border-gray-200 bg-white p-5 text-left shadow-xl group-hover:block group-focus-within:block">
        <p className="text-base font-semibold text-gray-900">
          Como interpretar esta seção
        </p>
        <p className="mt-1 text-sm leading-6 text-gray-600">
          Esta seção mostra apenas ASOs que ainda não foram liberados e seguem
          em tratamento no sistema.
        </p>

        <div className="mt-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
            Resumo do topo
          </p>
          <div className="mt-2 space-y-2">
            {SUMMARY_EXPLANATIONS.map((item) => (
              <div key={item.label}>
                <p className="text-sm font-medium text-gray-800">
                  {item.label}
                </p>
                <p className="text-sm leading-6 text-gray-600">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
            Situações dos cards
          </p>
          <div className="mt-2 space-y-2">
            {STATUS_EXPLANATIONS.map((item) => (
              <div key={item.label}>
                <p className="text-sm font-medium text-gray-800">
                  {item.label}
                </p>
                <p className="text-sm leading-6 text-gray-600">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function isSignatureAuthenticationPending(message: string | null | undefined) {
  const normalized = String(message || "").toLowerCase();

  return (
    normalized.includes("sessao psc") ||
    normalized.includes("sessão psc") ||
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

const PROCESS_STEPS = [
  "Envio ao gerador",
  "Geração do PDF",
  "Assinatura digital",
  "Validação da assinatura",
  "Envio do e-mail",
] as const;

type ProcessStepState =
  | "complete"
  | "current"
  | "upcoming"
  | "attention"
  | "failed";

function getCurrentStepIndex(item: AsoPendingItem): number {
  const displayStatus = item.panel?.displayStatus;

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
    if (
      item.status === "AGUARDANDO_AUTENTICACAO" ||
      item.etapa === "ASSINATURA"
    ) {
      return 2;
    }

    return item.url ? 2 : 1;
  }

  if (displayStatus === "COM_FALHA") {
    return item.url ? 2 : 1;
  }

  if (displayStatus === "SEGUINDO_AUTOMATICAMENTE") {
    if (item.status === "PROCESSANDO" || item.etapa === "ASSINATURA") {
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

function getStepClasses(state: ProcessStepState) {
  switch (state) {
    case "complete":
      return {
        dot: "border-[#44735E] bg-[#44735E] text-white",
        line: "bg-[#44735E]",
        label: "text-[#2f5a47]",
      };
    case "current":
      return {
        dot: "border-[#c88a11] bg-[#f8e4b1] text-[#8b5e00]",
        line: "bg-[#e6d6ab]",
        label: "text-[#8b5e00]",
      };
    case "attention":
      return {
        dot: "border-orange-500 bg-orange-100 text-orange-700",
        line: "bg-orange-200",
        label: "text-orange-700",
      };
    case "failed":
      return {
        dot: "border-red-500 bg-red-100 text-red-700",
        line: "bg-red-200",
        label: "text-red-700",
      };
    default:
      return {
        dot: "border-gray-200 bg-white text-gray-400",
        line: "bg-gray-200",
        label: "text-gray-400",
      };
  }
}

function ProcessTimeline({ item }: { item: AsoPendingItem }) {
  const displayStatus = item.panel?.displayStatus;
  const currentIndex = getCurrentStepIndex(item);

  return (
    <div className="mt-4 rounded-xl border border-[#44735E]/10 bg-[#f8faf8] px-4 py-4">
      <div className="grid gap-3 md:grid-cols-5">
        {PROCESS_STEPS.map((step, index) => {
          const state = getStepState(
            index,
            currentIndex,
            displayStatus || "AGUARDANDO_ENVIO",
          );
          const classes = getStepClasses(state);

          return (
            <div
              key={step}
              className="relative flex items-start gap-3 md:block"
            >
              {index < PROCESS_STEPS.length - 1 && (
                <div
                  className={`absolute left-[14px] top-7 h-8 w-[2px] ${classes.line} md:left-[calc(50%+16px)] md:top-[14px] md:h-[2px] md:w-[calc(100%-8px)]`}
                />
              )}

              <div
                className={`relative z-[1] flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-[11px] font-semibold ${classes.dot}`}
              >
                {index + 1}
              </div>

              <div className="min-w-0 md:mt-3">
                <p
                  className={`text-[11px] font-semibold uppercase tracking-wide ${classes.label}`}
                >
                  {step}
                </p>
                <p className="mt-1 text-[11px] leading-5 text-gray-500">
                  {index < currentIndex
                    ? "Etapa concluída"
                    : index === currentIndex
                      ? state === "attention"
                        ? "Etapa com intervenção"
                        : state === "failed"
                          ? "Etapa com falha"
                          : "Etapa atual"
                      : "Próxima etapa"}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

const AsoItemCard = ({
  item,
  index,
}: {
  item: AsoPendingItem;
  index: number;
}) => {
  if (!item.panel) {
    return null;
  }

  const friendlyError = getFriendlyOperationalError(item.error);
  const technicalDetails = [
    `Parecer medico: ${item.parecer || "N/A"}`,
    `Tempo na etapa: ${item.tempoNaEtapa}`,
    `Medico: ${item.nomeMedico || "N/A"}`,
    `Unidade: ${item.unidadeAtendimento || "N/A"}`,
  ];

  if (item.fonte === "FILA_AZURE") {
    technicalDetails.push("Origem: Fila Azure");
  }

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
              <span>{item.parecer || "N/A"}</span>
            </div>
            <h4 className="mt-1 text-base font-semibold text-gray-900">
              {item.nomeFuncionario}
            </h4>
          </div>
        </div>

        <ProcessTimeline item={item} />

        <div className="mt-3 rounded-lg bg-gray-50 px-3 py-3">
          <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
            Detalhes desta etapa
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {technicalDetails.map((detail) => (
              <span
                key={detail}
                className="rounded-full border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-600"
              >
                {detail}
              </span>
            ))}
          </div>
        </div>

        {friendlyError && (
          <div className="mt-3 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            <span>{friendlyError}</span>
          </div>
        )}
      </div>
    </motion.div>
  );
};

interface AsoTrackingSectionProps {
  refreshSignal?: number;
}

export function AsoTrackingSection({
  refreshSignal = 0,
}: AsoTrackingSectionProps) {
  const [page, setPage] = useState(1);
  const [isExpanded, setIsExpanded] = useState(false);
  const previousRefreshSignal = useRef(refreshSignal);

  const { data, loading, error, refetch } = useAsoTracking({
    autoRefresh: true,
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

  const items = [...(data?.items || [])].sort((a, b) => {
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

  const total = data?.totalItems || data?.total || 0;
  const currentPage = data?.page || page;
  const totalPages = data?.totalPages || 1;
  const pageSize = data?.limit || 100;
  const pageStart = total === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const pageEnd = total === 0 ? 0 : pageStart + items.length - 1;
  const startCount =
    (data?.stats?.aguardandoEnvio || 0) + (data?.stats?.naFilaDoGerador || 0);
  const inProgressCount =
    (data?.stats?.emGeracao || 0) + (data?.stats?.seguindoAutomaticamente || 0);
  const attentionCount =
    (data?.stats?.precisaIntervencao || 0) + (data?.stats?.comFalha || 0);
  const summaryParts = [
    startCount > 0 ? `${startCount} a iniciar` : null,
    inProgressCount > 0 ? `${inProgressCount} em andamento` : null,
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
        className="w-full cursor-pointer border-b border-gray-200 bg-[#B8D864]/20 px-5 py-4 text-left transition-all duration-200 hover:bg-[#B8D864]/25 hover:shadow-md"
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
                <h3 className="text-base font-semibold tracking-tight text-gray-800">
                  Liberação de ASOs
                  {data?.janelaDias && (
                    <span className="ml-2 text-xs font-normal text-gray-500">
                      (últimos {data.janelaDias} dias)
                    </span>
                  )}
                </h3>
                <HelpPopover />
              </div>

              <p className="text-xs text-gray-600">
                {total} item{total !== 1 ? "s" : ""} em acompanhamento
                operacional
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
