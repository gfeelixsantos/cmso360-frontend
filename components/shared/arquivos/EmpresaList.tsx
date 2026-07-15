"use client";

import React, { useEffect, useState } from "react";
import { Building2, ChevronDown, Download, ExternalLink, FileText, Loader2, Search } from "lucide-react";
import { Button, Card, CardBody, Input, Spinner } from "@heroui/react";

import type { EmpresaNode } from "@/hooks/useBlobExplorer";
import type { GedBatchJob } from "@/lib/ged-batch-client";

const ITEMS_PER_PAGE = 20;

interface EmpresaListProps {
  empresas: EmpresaNode[];
  isLoading: boolean;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onSelect: (codigoEmpresa: string) => void;
  onDownloadProntuarios?: (codigoEmpresa: string, razaoSocial: string) => void;
  onDownloadAsos?: (codigoEmpresa: string, razaoSocial: string) => void;
  currentJob?: GedBatchJob | null;
  isCreatingJob?: boolean;
}

const JOB_STATUS_LABEL: Record<string, string> = {
  queued: "Na fila…",
  processing: "Processando…",
  completed: "Concluído",
  partial: "Parcial",
  failed: "Falhou",
};

const EmpresaList: React.FC<EmpresaListProps> = ({
  empresas,
  isLoading,
  searchQuery,
  onSearchChange,
  onSelect,
  onDownloadProntuarios,
  onDownloadAsos,
  currentJob,
  isCreatingJob = false,
}) => {
  const [visibleCount, setVisibleCount] = useState(ITEMS_PER_PAGE);

  useEffect(() => {
    setVisibleCount(ITEMS_PER_PAGE);
  }, [searchQuery]);

  const displayedEmpresas = empresas.slice(0, visibleCount);
  const remaining = empresas.length - visibleCount;

  return (
    <div className="flex h-full flex-col gap-4">
      <Input
        isClearable
        placeholder="Buscar empresa..."
        size="sm"
        startContent={<Search className="h-4 w-4 text-default-400" />}
        value={searchQuery}
        onClear={() => onSearchChange("")}
        onValueChange={onSearchChange}
      />

      {isLoading ? (
        <div className="flex flex-1 flex-col items-center justify-center rounded-large border border-dashed border-default-200 bg-default-50/60 p-8 text-default-500">
          <Spinner color="primary" size="lg" />
          <p className="mt-3 text-sm">Carregando empresas...</p>
        </div>
      ) : empresas.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center rounded-large border border-dashed border-default-200 bg-default-50/60 p-8 text-default-400">
          <Building2 className="mb-3 h-10 w-10 text-default-300" />
          <p className="text-sm font-medium">
            {searchQuery.length >= 3
              ? "Nenhuma empresa encontrada para a busca."
              : "Nenhuma empresa disponível."}
          </p>
        </div>
      ) : (
        <>
          <div className="grid flex-1 auto-rows-fr gap-3 overflow-y-auto pr-1 sm:grid-cols-2 xl:grid-cols-3">
            {displayedEmpresas.map((empresa, index) => {
            const isJobForThisEmpresa =
              currentJob?.scope === "empresa" &&
              currentJob.empresa.codigoEmpresa === empresa.codigoEmpresa;

            const jobStatus = isJobForThisEmpresa ? currentJob?.status : undefined;
            const isActive =
              isCreatingJob ||
              (isJobForThisEmpresa &&
                (jobStatus === "queued" || jobStatus === "processing"));
            const isTerminal =
              isJobForThisEmpresa &&
              (jobStatus === "completed" ||
                jobStatus === "partial" ||
                jobStatus === "failed");
            const zipUrl =
              isJobForThisEmpresa && isTerminal
                ? currentJob?.result?.zipUrl
                : undefined;

            return (
              <div
                key={`${empresa.codigoEmpresa}-${index}`}
                className="min-h-[136px] cursor-pointer"
                role="button"
                tabIndex={0}
                onClick={() => onSelect(empresa.codigoEmpresa)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    onSelect(empresa.codigoEmpresa);
                  }
                }}
              >
                <Card className="h-full border border-default-200 bg-white transition-colors duration-150 hover:border-brand-primary/40 hover:shadow-sm">
                  <CardBody className="p-4">
                    <div className="flex h-full flex-col justify-between gap-4">
                      <div className="flex items-start gap-3">
                        <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-medium bg-brand-primary/10 text-brand-primary">
                          <Building2 className="h-5 w-5" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold text-default-800">
                            {empresa.razaoSocial}
                          </p>
                          <p className="mt-1 text-xs text-default-500">
                            Cod: {empresa.codigoEmpresa}
                          </p>
                          <p className="text-xs text-default-400">
                            {empresa.totalProntuarios} prontuario(s) disponiveis
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between border-t border-default-200 pt-3">
                        <span className="text-xs text-default-500">Arquivos</span>
                        <div
                          className="flex items-center gap-2"
                          onClick={(event) => event.stopPropagation()}
                          onKeyDown={(event) => event.stopPropagation()}
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
                                onDownloadProntuarios?.(empresa.codigoEmpresa, empresa.razaoSocial)
                              }
                            >
                              Tentar novamente
                            </Button>
                          ) : (
                            <div className="flex items-center gap-2">
                              {onDownloadProntuarios && (
                                <Button
                                  className="bg-brand-primary text-white hover:bg-brand-primary-hover"
                                  size="sm"
                                  startContent={<FileText className="h-3.5 w-3.5" />}
                                  onPress={() =>
                                    onDownloadProntuarios(empresa.codigoEmpresa, empresa.razaoSocial)
                                  }
                                >
                                  Prontuários
                                </Button>
                              )}
                              {onDownloadAsos && (
                                <Button
                                  className="bg-success/15 text-success hover:bg-success/25"
                                  size="sm"
                                  startContent={<Download className="h-3.5 w-3.5" />}
                                  onPress={() =>
                                    onDownloadAsos(empresa.codigoEmpresa, empresa.razaoSocial)
                                  }
                                >
                                  ASOs
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

          {remaining > 0 && (
            <div className="flex justify-center pt-2 pb-1">
              <Button
                size="sm"
                variant="flat"
                color="primary"
                startContent={<ChevronDown className="h-4 w-4" />}
                onPress={() => setVisibleCount((prev) => prev + ITEMS_PER_PAGE)}
              >
                Carregar mais {Math.min(remaining, ITEMS_PER_PAGE)} de {remaining} empresas
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default EmpresaList;