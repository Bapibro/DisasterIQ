import { useCallback, useEffect, useRef, useState } from 'react';
import {
  IncidentSubmissionError,
  incidentBackendStatuses,
  incidentPriorities,
  incidentReportService,
  incidentTypes,
  type IncidentReportInput,
  type IncidentSubmissionConfirmation,
} from '../lib/services/incidentReportService';

const STORAGE_KEY = 'disasteriq_offline_incident_reports_v2';
const LEGACY_STORAGE_KEY = 'disasteriq_offline_incident_reports_v1';
const STORAGE_EVENT = 'disasteriq-offline-reports-change-v2';
const QUEUE_LOCK = 'disasteriq-offline-report-queue-v2';
const ANONYMOUS_OWNER = 'anonymous';
const STORAGE_ERROR = 'This browser could not save the report queue locally. Keep this page open and call 112 if there is immediate danger.';
const STORAGE_READ_ERROR = 'The saved report queue could not be read, so no reports were changed. Existing reports were protected from being overwritten.';
const LOCK_ERROR = 'This browser cannot safely coordinate offline reports across tabs. Automatic submission and report changes are unavailable.';
const MAX_AUTO_ATTEMPTS = 6;
const MAX_RETRY_DELAY = 30000;

class QueueReadError extends Error {}
class QueueLockError extends Error {}

export type IncidentReportStatus = 'pending' | 'syncing' | 'submitted' | 'failed';

export interface QueuedIncidentReport extends IncidentReportInput {
  id: string;
  reporterId: string | null;
  status: IncidentReportStatus;
  createdAt: string;
  updatedAt: string;
  attempts: number;
  lastError?: string;
  nextRetryAt?: string;
  confirmation?: IncidentSubmissionConfirmation;
}

interface StoredQueues {
  version: 2;
  queues: Record<string, QueuedIncidentReport[]>;
}

interface QueueView {
  owner: string;
  reports: QueuedIncidentReport[];
  unclaimedCount: number;
}

const emptyStoredQueues = (): StoredQueues => ({ version: 2, queues: Object.create(null) });
const getOwnerKey = (userId: string | null) => userId ?? ANONYMOUS_OWNER;
const getSyncLockName = (userId: string | null) => `disasteriq-offline-report-sync-v2:${getOwnerKey(userId)}`;

const withQueueLock = <T,>(task: () => Promise<T>): Promise<T> => {
  if (!navigator.locks?.request) {
    return Promise.reject(new QueueLockError('Web Locks are unavailable.'));
  }
  return navigator.locks.request(QUEUE_LOCK, task);
};

const getStorageFailureMessage = (error: unknown) => {
  if (error instanceof QueueLockError) return LOCK_ERROR;
  if (error instanceof QueueReadError) return STORAGE_READ_ERROR;
  return STORAGE_ERROR;
};

const getRetryDelay = (attempts: number) => {
  const exponential = Math.min(MAX_RETRY_DELAY, 1000 * 2 ** Math.min(Math.max(attempts - 1, 0), 5));
  return Math.round(exponential * (0.8 + Math.random() * 0.4));
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  Boolean(value && typeof value === 'object' && !Array.isArray(value));

const isConfirmation = (value: unknown): value is IncidentSubmissionConfirmation => {
  if (!isRecord(value)) return false;
  return (
    typeof value.id === 'string' &&
    incidentBackendStatuses.some((status) => status === value.status) &&
    typeof value.submittedAt === 'string' &&
    Number.isFinite(Date.parse(value.submittedAt))
  );
};

const isQueuedReport = (value: unknown): value is QueuedIncidentReport => {
  if (!isRecord(value)) return false;
  return (
    typeof value.id === 'string' &&
    value.id.length > 0 &&
    incidentTypes.some((type) => type === value.incidentType) &&
    typeof value.location === 'string' &&
    typeof value.description === 'string' &&
    incidentPriorities.some((priority) => priority === value.priority) &&
    (value.reporterId === null || (typeof value.reporterId === 'string' && value.reporterId.length > 0)) &&
    ['pending', 'syncing', 'submitted', 'failed'].includes(String(value.status)) &&
    typeof value.createdAt === 'string' &&
    Number.isFinite(Date.parse(value.createdAt)) &&
    typeof value.updatedAt === 'string' &&
    Number.isFinite(Date.parse(value.updatedAt)) &&
    typeof value.attempts === 'number' &&
    Number.isInteger(value.attempts) &&
    value.attempts >= 0 &&
    (value.lastError === undefined || typeof value.lastError === 'string') &&
    (value.nextRetryAt === undefined || (typeof value.nextRetryAt === 'string' && Number.isFinite(Date.parse(value.nextRetryAt)))) &&
    (value.confirmation === undefined || isConfirmation(value.confirmation)) &&
    (value.status !== 'submitted' || isConfirmation(value.confirmation))
  );
};

const readStoredQueues = (): StoredQueues => {
  let stored: string | null;
  try {
    stored = localStorage.getItem(STORAGE_KEY);
  } catch {
    throw new QueueReadError('The report queue could not be read.');
  }
  if (stored === null) return emptyStoredQueues();

  let parsed: unknown;
  try {
    parsed = JSON.parse(stored);
  } catch {
    throw new QueueReadError('The report queue contains invalid JSON.');
  }
  if (!isRecord(parsed) || parsed.version !== 2 || !isRecord(parsed.queues)) {
    throw new QueueReadError('The report queue has an unsupported format.');
  }

  const queues: Record<string, QueuedIncidentReport[]> = Object.create(null);
  for (const [owner, reports] of Object.entries(parsed.queues)) {
    if (!Array.isArray(reports) || !reports.every(isQueuedReport)) {
      throw new QueueReadError('The report queue contains invalid records.');
    }
    queues[owner] = reports;
  }
  return { version: 2, queues };
};

const readInitialQueue = (userId: string | null): QueueView => {
  try {
    return createQueueView(readStoredQueues(), userId);
  } catch {
    return createQueueView(emptyStoredQueues(), userId);
  }
};

const writeStoredQueues = (state: StoredQueues) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
};

const mergeReports = (current: QueuedIncidentReport[], incoming: QueuedIncidentReport[]) => {
  const merged = new Map(current.map((report) => [report.id, report]));
  for (const report of incoming) {
    if (!merged.has(report.id)) merged.set(report.id, report);
  }
  return [...merged.values()].sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
};

const migrateLegacyReports = (state: StoredQueues): StoredQueues => {
  let parsed: unknown;
  try {
    const stored = localStorage.getItem(LEGACY_STORAGE_KEY);
    if (stored === null) return state;
    parsed = JSON.parse(stored);
  } catch {
    throw new QueueReadError('The legacy report queue could not be read.');
  }
  if (!Array.isArray(parsed) || !parsed.every(isQueuedReport)) {
    throw new QueueReadError('The legacy report queue contains invalid records.');
  }

  const incoming = parsed.map((report) =>
    report.status === 'syncing'
      ? {
          ...report,
          status: 'pending' as const,
          updatedAt: new Date().toISOString(),
          lastError: 'A previous submission attempt was interrupted. This report will be retried.',
        }
      : report
  );

  if (incoming.length > 0) {
    const queues = { ...state.queues };
    for (const report of incoming) {
      const owner = getOwnerKey(report.reporterId);
      queues[owner] = mergeReports(queues[owner] ?? [], [report]);
    }
    const next = { version: 2 as const, queues };
    writeStoredQueues(next);
    state = next;
  }

  localStorage.removeItem(LEGACY_STORAGE_KEY);
  return state;
};

const readMigratedState = () => migrateLegacyReports(readStoredQueues());

const getOwnerReports = (state: StoredQueues, userId: string | null) => {
  const owner = getOwnerKey(userId);
  return (state.queues[owner] ?? []).filter((report) =>
    userId ? report.reporterId === userId : report.reporterId === null
  );
};

const createQueueView = (state: StoredQueues, userId: string | null): QueueView => ({
  owner: getOwnerKey(userId),
  reports: getOwnerReports(state, userId),
  unclaimedCount: userId ? getOwnerReports(state, null).length : 0,
});

const getErrorMessage = (error: unknown) =>
  error instanceof Error ? error.message : 'The report could not be submitted. It remains saved for retry.';

export function useOfflineIncidentReports(isOnline: boolean, userId: string | null) {
  const owner = getOwnerKey(userId);
  const ownerRef = useRef(owner);
  const onlineRef = useRef(isOnline);
  const syncingOwnersRef = useRef(new Set<string>());
  const mountedRef = useRef(true);

  useEffect(() => {
    ownerRef.current = owner;
    onlineRef.current = isOnline;
  }, [isOnline, owner]);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const [queue, setQueue] = useState<QueueView>(() => readInitialQueue(userId));
  const [storageError, setStorageError] = useState<{ owner: string; message: string } | null>(null);

  const publish = useCallback((view: QueueView) => {
    if (!mountedRef.current || view.owner !== ownerRef.current) return;
    setQueue(view);
    setStorageError(null);
  }, []);

  const failStorage = useCallback((failedOwner: string, message = STORAGE_ERROR) => {
    if (!mountedRef.current || failedOwner !== ownerRef.current) return;
    setStorageError({ owner: failedOwner, message });
  }, []);

  const mutateQueue = useCallback(async <T,>(
    mutationUserId: string | null,
    update: (current: QueuedIncidentReport[]) => { reports: QueuedIncidentReport[]; result: T }
  ): Promise<{ saved: true; result: T } | { saved: false }> => {
    try {
      const outcome = await withQueueLock(async () => {
        const state = readMigratedState();
        const current = getOwnerReports(state, mutationUserId);
        const updated = update(current);
        let next = state;
        let changed = false;

        if (updated.reports !== current) {
          next = {
            version: 2,
            queues: { ...state.queues, [getOwnerKey(mutationUserId)]: updated.reports },
          };
          writeStoredQueues(next);
          changed = true;
        }

        return { view: createQueueView(next, mutationUserId), result: updated.result, changed };
      });

      if (outcome.changed) window.dispatchEvent(new Event(STORAGE_EVENT));
      publish(outcome.view);
      return { saved: true, result: outcome.result };
    } catch (error) {
      failStorage(getOwnerKey(mutationUserId), getStorageFailureMessage(error));
      return { saved: false };
    }
  }, [failStorage, publish]);

  const loadQueue = useCallback(async (loadUserId: string | null, recoverInterrupted: boolean) => {
    if (!navigator.locks?.request) {
      return createQueueView(readStoredQueues(), loadUserId);
    }

    const read = () => withQueueLock(async () => {
      let state = readMigratedState();
      if (recoverInterrupted) {
        const current = getOwnerReports(state, loadUserId);
        let changed = false;
        const reports = current.map((report) => {
          if (report.status !== 'syncing') return report;
          changed = true;
          return {
            ...report,
            status: 'pending' as const,
            updatedAt: new Date().toISOString(),
            lastError: 'A previous submission attempt was interrupted. This report will be retried.',
          };
        });
        if (changed) {
          state = { version: 2, queues: { ...state.queues, [getOwnerKey(loadUserId)]: reports } };
          writeStoredQueues(state);
        }
      }
      return createQueueView(state, loadUserId);
    });

    if (recoverInterrupted) {
      const view = await navigator.locks.request(getSyncLockName(loadUserId), { ifAvailable: true }, read);
      if (view) return view;
      return createQueueView(readStoredQueues(), loadUserId);
    }
    return read();
  }, []);

  useEffect(() => {
    let active = true;
    void loadQueue(userId, true)
      .then((view) => {
        if (active) publish(view);
      })
      .catch((error) => {
        if (active) failStorage(getOwnerKey(userId), getStorageFailureMessage(error));
      });
    return () => {
      active = false;
    };
  }, [failStorage, loadQueue, publish, userId]);

  useEffect(() => {
    const refresh = () => {
      const currentUserId = ownerRef.current === ANONYMOUS_OWNER ? null : ownerRef.current;
      try {
        publish(createQueueView(readStoredQueues(), currentUserId));
      } catch (error) {
        failStorage(getOwnerKey(currentUserId), getStorageFailureMessage(error));
      }
    };
    const handleStorage = (event: StorageEvent) => {
      if (event.key === STORAGE_KEY || event.key === null) refresh();
    };

    window.addEventListener('storage', handleStorage);
    window.addEventListener(STORAGE_EVENT, refresh);
    return () => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener(STORAGE_EVENT, refresh);
    };
  }, [failStorage, publish]);

  const syncReports = useCallback(async (force = false) => {
    if (!isOnline || !userId || !onlineRef.current || !navigator.onLine || !mountedRef.current) return;
    const syncOwner = getOwnerKey(userId);
    if (!navigator.locks?.request) {
      failStorage(syncOwner, LOCK_ERROR);
      return;
    }
    if (syncingOwnersRef.current.has(syncOwner)) return;
    syncingOwnersRef.current.add(syncOwner);

    try {
      const run = async () => {
        if (!mountedRef.current || !onlineRef.current || !navigator.onLine || ownerRef.current !== syncOwner) return;

        const recovered = await mutateQueue(userId, (current) => {
          let changed = false;
          const reports = current.map((report) => {
            if (report.status !== 'syncing') return report;
            changed = true;
            return {
              ...report,
              status: 'pending' as const,
              updatedAt: new Date().toISOString(),
              lastError: 'A previous submission attempt was interrupted. This report will be retried.',
              nextRetryAt: undefined,
            };
          });
          return { reports: changed ? reports : current, result: undefined };
        });
        if (!recovered.saved) return;

        const attempted = new Set<string>();
        while (mountedRef.current && onlineRef.current && navigator.onLine && ownerRef.current === syncOwner) {
          const started = await mutateQueue(userId, (current) => {
            const report = current.find((item) =>
              !attempted.has(item.id) &&
              (item.status === 'pending' || (item.status === 'failed' && (force || (
                item.nextRetryAt !== undefined &&
                Date.parse(item.nextRetryAt) <= Date.now() &&
                item.attempts < MAX_AUTO_ATTEMPTS
              ))))
            );
            if (!report) return { reports: current, result: null };
            return {
              reports: current.map((item) =>
                item.id === report.id
                  ? {
                      ...item,
                      status: 'syncing' as const,
                      updatedAt: new Date().toISOString(),
                      attempts: item.attempts + 1,
                      lastError: undefined,
                      nextRetryAt: undefined,
                    }
                  : item
              ),
              result: report,
            };
          });
          if (!started.saved || !started.result) return;

          const report = started.result;
          attempted.add(report.id);
          try {
            const confirmation = await incidentReportService.submit(report, userId);
            const finished = await mutateQueue(userId, (current) => ({
              reports: current.map((item) =>
                item.id === report.id && item.status === 'syncing'
                  ? {
                      ...item,
                      status: 'submitted' as const,
                      updatedAt: new Date().toISOString(),
                      lastError: undefined,
                      nextRetryAt: undefined,
                      confirmation,
                    }
                  : item
              ),
              result: undefined,
            }));
            if (!finished.saved) return;
          } catch (error) {
            const retryable = error instanceof IncidentSubmissionError ? error.retryable : true;
            const canAutoRetry = retryable && report.attempts < MAX_AUTO_ATTEMPTS;
            const lastError = retryable && !canAutoRetry
              ? `${getErrorMessage(error)} Automatic retries are paused; use Retry to try again.`
              : getErrorMessage(error);
            const failed = await mutateQueue(userId, (current) => ({
              reports: current.map((item) =>
                item.id === report.id && item.status === 'syncing'
                  ? {
                      ...item,
                      status: 'failed' as const,
                      updatedAt: new Date().toISOString(),
                      lastError,
                      nextRetryAt: canAutoRetry
                        ? new Date(Date.now() + getRetryDelay(report.attempts)).toISOString()
                        : undefined,
                    }
                  : item
              ),
              result: undefined,
            }));
            if (!failed.saved) return;
          }
        }
      };

      await navigator.locks.request(getSyncLockName(userId), run);
    } catch (error) {
      failStorage(syncOwner, getStorageFailureMessage(error));
    } finally {
      syncingOwnersRef.current.delete(syncOwner);
    }
  }, [failStorage, isOnline, mutateQueue, userId]);

  useEffect(() => {
    if (!isOnline || !userId || !navigator.onLine || !navigator.locks?.request) return;
    const now = Date.now();
    const hasPending = queue.reports.some((report) => report.status === 'pending');
    const retryTimes = queue.reports
      .filter((report) =>
        report.status === 'failed' &&
        report.nextRetryAt !== undefined &&
        report.attempts < MAX_AUTO_ATTEMPTS
      )
      .map((report) => Date.parse(report.nextRetryAt!));
    if (!hasPending && retryTimes.length === 0) return;

    const delay = hasPending ? 0 : Math.max(0, Math.min(...retryTimes) - now);
    const timeout = window.setTimeout(() => {
      void syncReports();
    }, Math.min(delay, MAX_RETRY_DELAY));
    return () => window.clearTimeout(timeout);
  }, [isOnline, queue.reports, syncReports, userId]);

  const saveReport = useCallback(async (input: IncidentReportInput) => {
    const now = new Date().toISOString();
    const report: QueuedIncidentReport = {
      ...input,
      id: crypto.randomUUID(),
      reporterId: userId,
      status: 'pending',
      createdAt: now,
      updatedAt: now,
      attempts: 0,
    };
    const saved = await mutateQueue(userId, (current) => ({
      reports: mergeReports(current, [report]),
      result: undefined,
    }));
    return saved.saved;
  }, [mutateQueue, userId]);

  const removeReport = useCallback(async (id: string) => {
    const removed = await mutateQueue(userId, (current) => {
      const target = current.find((report) => report.id === id);
      if (target?.status === 'syncing') return { reports: current, result: false };
      return { reports: current.filter((report) => report.id !== id), result: true };
    });
    return removed.saved && removed.result;
  }, [mutateQueue, userId]);

  const claimAnonymousReports = useCallback(async () => {
    if (!userId) return false;

    try {
      const outcome = await withQueueLock(async () => {
        const state = readMigratedState();
        const anonymous = getOwnerReports(state, null);
        if (anonymous.length === 0) return { view: createQueueView(state, userId), changed: false };

        const claimed = anonymous.map((report) =>
          report.status === 'syncing'
            ? {
                ...report,
                reporterId: userId,
                status: 'pending' as const,
                updatedAt: new Date().toISOString(),
                lastError: 'A previous submission attempt was interrupted. This report will be retried.',
              }
            : { ...report, reporterId: userId }
        );
        const next: StoredQueues = {
          version: 2,
          queues: {
            ...state.queues,
            [getOwnerKey(userId)]: mergeReports(getOwnerReports(state, userId), claimed),
            [ANONYMOUS_OWNER]: [],
          },
        };
        writeStoredQueues(next);
        return { view: createQueueView(next, userId), changed: true };
      });

      if (outcome.changed) window.dispatchEvent(new Event(STORAGE_EVENT));
      publish(outcome.view);
      return true;
    } catch (error) {
      failStorage(getOwnerKey(userId), getStorageFailureMessage(error));
      return false;
    }
  }, [failStorage, publish, userId]);

  const visibleQueue = queue.owner === owner ? queue : createQueueView(emptyStoredQueues(), userId);

  return {
    reports: visibleQueue.reports,
    unclaimedCount: visibleQueue.unclaimedCount,
    storageError: storageError?.owner === owner ? storageError.message : '',
    saveReport,
    syncReports,
    removeReport,
    claimAnonymousReports,
  };
}
