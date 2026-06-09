"use client";

import React from "react";
import { Download, ExternalLink, FolderOpen, Loader2 } from "lucide-react";
import { Button, Card, CardBody, Spinner } from "@heroui/react";

import type { ProntuarioNode } from "@/hooks/useBlobExplorer";
import type { GedBatchJob } from "@/lib/ged-batch-client";

interface ProntuarioListProps {
  prontuarios: ProntuarioNode[];
  isLoading: boolean;
  onSelect: (prontuario: ProntuarioNode) => void;
  onDownload?: (codigoProntuario: string, nomeFuncionario: string) => void;
  /**
   * Job de lote ativo (ou mais recente) referente a um prontuário.
   * Quando não-nulo e o codigoProntuario coincide, o botão exibe o estado do job.
   */
  currentJob?: GedBatchJob | null;
  /** Indica que um novo job está sendo criado (loading transitório antes do job existir) */
  isCreatingJob?: boolean;
}

const JOB_STATUS_LABEL: Record<string, string> = {
  queued: "Na fila…",
  processing: "Processando…",
  completed: "Concluído",
  partial: "Parcial",
  failed: "Falhou",
};

const ProntuarioList: React.FC<ProntuarioListProps> = ({
  prontuarios,
  isLoading,
  onSelect,
  onDownload,
  currentJob,
  isCreatingJob = false,
}) => {
  if (isLoading) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center rounded-large border border-dashed border-default-200 bg-default-50/60 p-8 text-default-500">
        <Spinner color="primary" size="lg" />
        <p className="mt-3 text-sm">Carregando prontuários...</p>
      </div>
    );
  }

  if (prontuarios.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center rounded-large border border-dashed border-default-200 bg-default-50/60 p-8 text-default-400">
        <FolderOpen className="mb-3 h-10 w-10 text-default-300" />
        <p className="text-sm font-medium">Nenhum prontuário encontrado.</p>
      </div>
    );
  }

  return (
    <div className="grid auto-rows-fr gap-3 md:grid-cols-2 xl:grid-cols-3">
      {prontuarios.map((prontuario) => {
        const isJobForThisProntuario =
          currentJob?.scope === "prontuario" &&
          currentJob.items[0]?.codigoProntuario === prontuario.codigoProntuario;

        const jobStatus = isJobForThisProntuario ? currentJob?.status : undefined;
        const isActive =
          isCreatingJob ||
          (isJobForThisProntuario &&
            (jobStatus === "queued" || jobStatus === "processing"));
        const isTerminal =
          isJobForThisProntuario &&
          (jobStatus === "completed" ||
            jobStatus === "partial" ||
            jobStatus === "failed");
        const zipUrl =
          isJobForThisProntuario && isTerminal
            ? currentJob?.result?.zipUrl
            : undefined;

        return (
          <div
            key={prontuario.codigoProntuario}
            role="button"
            tabIndex={0}
            className="min-h-[148px] cursor-pointer"
            onClick={() => onSelect(prontuario)}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                onSelect(prontuario);
              }
            }}
          >
            <Card className="min-h-[148px] border border-default-200 bg-white transition-colors duration-150 hover:border-brand-primary/40 hover:shadow-sm">
            <CardBody className="p-4">
              <div className="flex h-full flex-col justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-medium bg-brand-primary/10 text-brand-primary">
                    <FolderOpen className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-default-800">
                      {prontuario.nomeFuncionario || prontuario.codigoProntuario}
                    </p>
                    <p className="mt-1 truncate text-xs text-default-500">
                      {prontuario.codigoProntuario}
                    </p>
                    {prontuario.dataAgendamento && (
                      <p className="text-xs text-default-400">
                        {prontuario.dataAgendamento}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between border-t border-default-200 pt-3">
                  <span className="text-xs text-default-500">Arquivos</span>
                  <div className="flex items-center gap-2">
                    {onDownload && (
                      <div
                        onClick={(e) => e.stopPropagation()}
                        onKeyDown={(e) => e.stopPropagation()}
                        role="none"
                      >
                        {zipUrl && (jobStatus === "completed" || jobStatus === "partial") ? (
                          <Button
                            className={
                              jobStatus === "partial"
                                ? "bg-warning/15 text-warning hover:bg-warning/25"
                                : "bg-success/15 text-success hover:bg-success/25"
                            }
                            size="sm"
                            as="a"
                            href={zipUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            startContent={<ExternalLink className="h-3.5 w-3.5" />}
                          >
                            Baixar ZIP
                          </Button>
                        ) : isActive ? (
                          <Button
                            className="bg-brand-primary/15 text-brand-primary"
                            size="sm"
                            isDisabled
                            startContent={
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            }
                          >
                            {isCreatingJob
                              ? "Iniciando…"
                              : (JOB_STATUS_LABEL[jobStatus ?? ""] ?? "Aguarde…")}
                          </Button>
                        ) : isTerminal && !zipUrl ? (
                          <Button
                            className="bg-danger/15 text-danger hover:bg-danger/25"
                            size="sm"
                            startContent={<Download className="h-3.5 w-3.5" />}
                            onPress={() =>
                              onDownload(
                                prontuario.codigoProntuario,
                                prontuario.nomeFuncionario || prontuario.codigoProntuario,
                              )
                            }
                          >
                            Tentar novamente
                          </Button>
                        ) : (
                          <Button
                            className="bg-brand-primary text-white hover:bg-brand-primary-hover"
                            size="sm"
                            startContent={<Download className="h-3.5 w-3.5" />}
                            onPress={() =>
                              onDownload(
                                prontuario.codigoProntuario,
                                prontuario.nomeFuncionario || prontuario.codigoProntuario,
                              )
                            }
                          >
                            Baixar ZIP
                          </Button>
                        )}
                      </div>
                    )}

                  </div>
                </div>
              </div>
            </CardBody>
            </Card>
          </div>
        );
      })}
    </div>
  );
};

export default ProntuarioList;
