"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import {
  type CreateBatchRequest,
  type GedBatchJob,
  createBatchJob,
  getBatchJobStatus,
  isJobTerminal,
} from "@/lib/ged-batch-client";

const ACTIVE_JOB_KEY = "ged-batch:active-job";

function getActiveJobId(): string | null {
  try {
    return localStorage.getItem(ACTIVE_JOB_KEY);
  } catch {
    return null;
  }
}

function setActiveJobId(jobId: string) {
  try {
    localStorage.setItem(ACTIVE_JOB_KEY, jobId);
  } catch {}
}

function clearActiveJobId() {
  try {
    localStorage.removeItem(ACTIVE_JOB_KEY);
  } catch {}
}

interface UseGedBatchJobOptions {
  onCompleted?: (job: GedBatchJob) => void;
  onFailed?: (job: GedBatchJob) => void;
  onFinished?: (job: GedBatchJob) => void;
  pollInterval?: number;
}

interface UseGedBatchJobReturn {
  currentJob: GedBatchJob | null;
  isCreating: boolean;
  isPolling: boolean;
  error: string | null;
  startBatch: (payload: CreateBatchRequest) => Promise<GedBatchJob | null>;
  clearJob: () => void;
}

export function useGedBatchJob({
  onCompleted,
  onFailed,
  onFinished,
  pollInterval = 3000,
}: UseGedBatchJobOptions = {}): UseGedBatchJobReturn {
  const [currentJob, setCurrentJob] = useState<GedBatchJob | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isPolling, setIsPolling] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const jobIdRef = useRef<string | null>(null);

  const stopPolling = useCallback(() => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
    setIsPolling(false);
  }, []);

  const handleTerminalJob = useCallback(
    (job: GedBatchJob) => {
      clearActiveJobId();
      if (job.status === "completed" || job.status === "partial") {
        onCompleted?.(job);
      } else {
        onFailed?.(job);
      }
      onFinished?.(job);
    },
    [onCompleted, onFailed, onFinished],
  );

  const startPolling = useCallback(
    (jobId: string) => {
      stopPolling();
      setIsPolling(true);

      const poll = async () => {
        try {
          const job = await getBatchJobStatus(jobId);
          setCurrentJob(job);

          if (isJobTerminal(job.status)) {
            stopPolling();
            handleTerminalJob(job);
          }
        } catch {
          stopPolling();
          setError("Erro ao consultar status do job.");
          clearActiveJobId();
        }
      };

      void poll();
      pollingRef.current = setInterval(poll, pollInterval);
    },
    [handleTerminalJob, pollInterval, stopPolling],
  );

  // Restaura job ativo do localStorage ao montar
  useEffect(() => {
    const activeJobId = getActiveJobId();
    if (activeJobId) {
      startPolling(activeJobId);
    }
    return () => stopPolling();
  }, [startPolling, stopPolling]);

  const startBatch = useCallback(
    async (payload: CreateBatchRequest) => {
      setIsCreating(true);
      setError(null);

      try {
        const job = await createBatchJob(payload);
        setCurrentJob(job);
        setIsCreating(false);

        if (isJobTerminal(job.status)) {
          handleTerminalJob(job);
        } else {
          setActiveJobId(job.id);
          jobIdRef.current = job.id;
          startPolling(job.id);
        }

        return job;
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Erro ao iniciar lote.",
        );
        setIsCreating(false);
        return null;
      }
    },
    [handleTerminalJob, startPolling],
  );

  const clearJob = useCallback(() => {
    stopPolling();
    clearActiveJobId();
    setCurrentJob(null);
    setError(null);
  }, [stopPolling]);

  return {
    currentJob,
    isCreating,
    isPolling,
    error,
    startBatch,
    clearJob,
  };
}
