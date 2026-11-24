import { isSupabaseConfigured, supabase } from '../supabase';

export const incidentTypes = ['earthquake', 'flood', 'fire', 'lightning', 'cyclone', 'heatwave', 'other'] as const;
export const incidentPriorities = ['immediate', 'urgent', 'non-urgent'] as const;
export const incidentBackendStatuses = ['submitted', 'under_review', 'resolved'] as const;

export type IncidentType = (typeof incidentTypes)[number];
export type IncidentPriority = (typeof incidentPriorities)[number];
export type IncidentBackendStatus = (typeof incidentBackendStatuses)[number];

export interface IncidentReportInput {
  incidentType: IncidentType;
  location: string;
  description: string;
  priority: IncidentPriority;
}

export interface IncidentReportRecord extends IncidentReportInput {
  id: string;
  reporterId: string | null;
  createdAt: string;
}

export interface IncidentSubmissionConfirmation {
  id: string;
  status: IncidentBackendStatus;
  submittedAt: string;
}

export class IncidentSubmissionError extends Error {
  readonly retryable: boolean;

  constructor(message: string, retryable = false) {
    super(message);
    this.name = 'IncidentSubmissionError';
    this.retryable = retryable;
  }
}

export const isRetryableIncidentSubmissionError = (error: unknown) =>
  error instanceof IncidentSubmissionError && error.retryable;

const configurationError = () =>
  new IncidentSubmissionError('Online submission is unavailable because Supabase is not configured. Your report remains saved on this device.');

const missingTableError = () =>
  new IncidentSubmissionError('Online submission is not configured yet. Apply the incident-report database migration before retrying.');

const permissionError = () =>
  new IncidentSubmissionError('The backend denied this submission. Sign in with the account that saved the report and retry.');

const isTransientBackendError = (error: { code?: string; message?: string; status?: number }) => {
  if (
    error.code === '42501' ||
    error.code === 'PGRST301' ||
    error.code === '23514' ||
    error.code === '22001' ||
    error.code === '22P02' ||
    error.code === '23502' ||
    error.status === 401 ||
    error.status === 403 ||
    error.status === 409
  ) {
    return false;
  }

  if (error.status === 408 || error.status === 429 || (error.status !== undefined && error.status >= 500)) {
    return true;
  }

  return !error.code || /fetch|network|timeout|connection|load failed/i.test(error.message ?? '');
};

const backendError = (error: { code?: string; message?: string; status?: number }) =>
  new IncidentSubmissionError(
    error.message || 'The backend could not confirm this report. It remains queued for retry.',
    isTransientBackendError(error)
  );

const isMissingTableError = (error: { code?: string; message?: string }) =>
  error.code === 'PGRST205' ||
  error.code === '42P01' ||
  /relation\s+["']?[^"']*incident_reports["']?\s+does not exist/i.test(error.message ?? '');

const validateConfirmation = (value: unknown): IncidentSubmissionConfirmation => {
  if (!value || typeof value !== 'object') {
    throw new IncidentSubmissionError('The backend did not confirm the incident report. It has not been marked as submitted.');
  }

  const record = value as Record<string, unknown>;
  if (
    !incidentBackendStatuses.some((status) => status === record.status) ||
    typeof record.id !== 'string' ||
    typeof record.submitted_at !== 'string'
  ) {
    throw new IncidentSubmissionError('The backend returned an incomplete submission confirmation.');
  }

  return {
    id: record.id,
    status: record.status as IncidentBackendStatus,
    submittedAt: record.submitted_at,
  };
};

export const incidentReportService = {
  async submit(report: IncidentReportRecord, userId: string): Promise<IncidentSubmissionConfirmation> {
    if (!isSupabaseConfigured()) throw configurationError();
    if (!userId || userId === 'local-user-id') {
      throw new IncidentSubmissionError('Sign in online before this report can be submitted.');
    }

    const payload = {
      client_id: report.id,
      reporter_id: userId,
      incident_type: report.incidentType,
      location: report.location,
      description: report.description,
      priority: report.priority,
    };

    const { data, error } = await supabase
      .from('incident_reports')
      .insert(payload)
      .select('id, status, submitted_at')
      .single();

    if (!error) return validateConfirmation(data);
    if (isMissingTableError(error)) throw missingTableError();

    if (error.code === '23505') {
      const { data: existing, error: lookupError } = await supabase
        .from('incident_reports')
        .select('id, status, submitted_at')
        .eq('client_id', report.id)
        .eq('reporter_id', userId)
        .single();

      if (!lookupError) return validateConfirmation(existing);
      if (isMissingTableError(lookupError)) throw missingTableError();
      if (lookupError.code === '42501') throw permissionError();
      throw backendError(lookupError);
    }

    if (error.code === '42501') throw permissionError();

    throw backendError(error);
  },
};
