import { useCallback, useEffect, useRef, useState } from "react";

import {
  type CreateBatchRequest,
  type GedBatchJob,
  createBatchJob,
  getBatchJobStatus,
  isJobTerminal,
} from "@/lib/ged-batch-client";

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

  const stopPolling = useCallback(() => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
    setIsPolling(false);
  }, []);

  const handleTerminalJob = useCallback(
    (job: GedBatchJob) => {
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
        }
      };

      void poll();
      pollingRef.current = setInterval(poll, pollInterval);
    },
    [handleTerminalJob, pollInterval, stopPolling],
  );

  useEffect(() => {
    return () => stopPolling();
  }, [stopPolling]);

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
