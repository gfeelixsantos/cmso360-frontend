import { useCallback, useEffect, useRef, useState } from "react";

import {
  type CreateBatchRequest,
  type GedBatchJob,
  createBatchJob,
  getBatchJobStatus,
  isJobActive,
  isJobTerminal,
} from "@/lib/ged-batch-client";

const GED_BATCH_STORAGE_KEY = "cmso360.ged-batch.active-job-id";

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
  pollInterval = 5000,
}: UseGedBatchJobOptions = {}): UseGedBatchJobReturn {
  const [currentJob, setCurrentJob] = useState<GedBatchJob | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isPolling, setIsPolling] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const onCompletedRef = useRef(onCompleted);
  const onFailedRef = useRef(onFailed);
  const onFinishedRef = useRef(onFinished);
  const handledTerminalJobsRef = useRef(new Set<string>());

  onCompletedRef.current = onCompleted;
  onFailedRef.current = onFailed;
  onFinishedRef.current = onFinished;

  const stopPolling = useCallback(() => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
    setIsPolling(false);
  }, []);

  const handleTerminalJob = useCallback(
    (job: GedBatchJob) => {
      const terminalKey = `${job.id}:${job.status}`;

      if (handledTerminalJobsRef.current.has(terminalKey)) {
        return false;
      }

      handledTerminalJobsRef.current.add(terminalKey);

      if (job.status === "completed" || job.status === "partial") {
        onCompletedRef.current?.(job);
      } else {
        onFailedRef.current?.(job);
      }

      onFinishedRef.current?.(job);

      return true;
    },
    [],
  );

  const persistJobId = useCallback((jobId: string | null) => {
    if (typeof window === "undefined") return;

    if (jobId) {
      window.localStorage.setItem(GED_BATCH_STORAGE_KEY, jobId);
    } else {
      window.localStorage.removeItem(GED_BATCH_STORAGE_KEY);
    }
  }, []);

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

  useEffect(() => {
    if (typeof window === "undefined") return;

    const jobId = window.localStorage.getItem(GED_BATCH_STORAGE_KEY);
    if (!jobId) return;

    let cancelled = false;

    const restoreJob = async () => {
      try {
        const job = await getBatchJobStatus(jobId);
        if (cancelled) return;

        setCurrentJob(job);

        if (isJobActive(job.status)) {
          startPolling(job.id);
        } else if (isJobTerminal(job.status)) {
          handleTerminalJob(job);
        }
      } catch {
        if (!cancelled) {
          persistJobId(null);
        }
      }
    };

    void restoreJob();

    return () => {
      cancelled = true;
    };
  }, [handleTerminalJob, persistJobId, startPolling]);

  const startBatch = useCallback(
    async (payload: CreateBatchRequest) => {
      setIsCreating(true);
      setError(null);

      try {
        const job = await createBatchJob(payload);

        setCurrentJob(job);
        persistJobId(job.id);
        setIsCreating(false);

        if (isJobActive(job.status)) {
          startPolling(job.id);
        } else if (isJobTerminal(job.status)) {
          handleTerminalJob(job);
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
    [handleTerminalJob, persistJobId, startPolling],
  );

  const clearJob = useCallback(() => {
    stopPolling();
    setCurrentJob(null);
    setError(null);
    persistJobId(null);
    handledTerminalJobsRef.current.clear();
  }, [persistJobId, stopPolling]);

  return {
    currentJob,
    isCreating,
    isPolling,
    error,
    startBatch,
    clearJob,
  };
}
