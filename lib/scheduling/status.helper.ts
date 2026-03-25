const SIGNATURE_STATUS_MAP: Record<string, string> = {
  NOT_REQUIRED: "NAO_REQUER_ASSINATURA",
  WAITING_AUTH: "AGUARDANDO_AUTENTICACAO",
  PENDING_RETRY: "AGUARDANDO_REPROCESSAMENTO",
  PROCESSING: "PROCESSANDO_ASSINATURA",
  SIGNED: "ASSINADO",
  FAILED: "FALHA_ASSINATURA",
};

const SIGNATURE_STATUS_LABELS: Record<string, string> = {
  NAO_REQUER_ASSINATURA: "Não requer assinatura",
  AGUARDANDO_AUTENTICACAO: "Aguardando autenticação",
  AGUARDANDO_REPROCESSAMENTO: "Aguardando reprocessamento",
  PROCESSANDO_ASSINATURA: "Processando assinatura",
  ASSINADO: "Assinado",
  FALHA_ASSINATURA: "Falha na assinatura",
};

const ASO_STATUS_MAP: Record<string, string> = {
  SIGNED: "ASSINADO",
  FAILED: "FALHA_ASSINATURA",
};

const ASO_STATUS_LABELS: Record<string, string> = {
  PENDENTE: "Aguardando Geração",
  GERADO: "Aguardando Assinatura",
  ASSINADO: "Assinado - Enriquecimento",
  LIBERADO: "Liberado",
  ERRO: "Erro",
  FALHA_ASSINATURA: "Falha na assinatura",
};

export function normalizeSignatureStatus(status?: string | null): string {
  if (!status) return "";

  return SIGNATURE_STATUS_MAP[status] || status;
}

export function normalizeAsoStatus(status?: string | null): string {
  if (!status) return "";

  return ASO_STATUS_MAP[status] || status;
}

export function getSignatureStatusLabel(status?: string | null): string {
  const normalized = normalizeSignatureStatus(status);

  return SIGNATURE_STATUS_LABELS[normalized] || normalized.replace(/_/g, " ");
}

export function getAsoStatusLabel(status?: string | null): string {
  const normalized = normalizeAsoStatus(status);

  return ASO_STATUS_LABELS[normalized] || normalized.replace(/_/g, " ");
}
