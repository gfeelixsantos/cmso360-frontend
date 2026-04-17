const SIGNATURE_STATUS_LABELS: Record<string, string> = {
  PENDENTE: "Pendente Assinatura",
  PROCESSANDO: "Processando Assinatura",
  ASSINADO: "Assinado Digitalmente",
  LIBERADO: "Assinado Digitalmente",
  DIGITALIZADA: "Digitalizada",
  ERRO_IDENTIDADE_PROFISSIONAL: "Erro de Identidade Profissional",
  FALHA: "Falha na Assinatura",
};

const ASO_STATUS_LABELS: Record<string, string> = {
  PENDENTE: "Aguardando Geracao",
  GERADO: "Aguardando Assinatura",
  ASSINADO: "Assinado - Enriquecimento",
  LIBERADO: "Liberado",
  FALHA: "Falha na assinatura",
  DIGITALIZADA: "Digitalizada",
};

export function normalizeSignatureStatus(status?: string | null): string {
  if (!status) return "";

  return status;
}

export function normalizeAsoStatus(status?: string | null): string {
  if (!status) return "";

  return status;
}

export function getSignatureStatusLabel(status?: string | null): string {
  if (!status) return "";

  return SIGNATURE_STATUS_LABELS[status] || status.replace(/_/g, " ");
}

export function getAsoStatusLabel(status?: string | null): string {
  if (!status) return "";

  return ASO_STATUS_LABELS[status] || status.replace(/_/g, " ");
}
