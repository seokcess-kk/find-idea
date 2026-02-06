// Scheduler Types

export interface SchedulerConfigType {
  id: string;
  enabled: boolean;
  cronExpression: string;
  timezone: string;
  maxRetries: number;
  retryDelayMs: number;
  createdAt: string;
  updatedAt: string;
}

export interface SchedulerLogType {
  id: string;
  startedAt: string;
  completedAt: string | null;
  duration: number | null;
  totalChannels: number;
  successChannels: number;
  failedChannels: number;
  totalFeeds: number;
  newFeeds: number;
  duplicates: number;
  status: 'running' | 'success' | 'partial' | 'failed';
  errorMessage: string | null;
  triggeredBy: 'scheduler' | 'manual' | 'api';
  createdAt: string;
}

export interface SchedulerStatus {
  enabled: boolean;
  cronExpression: string;
  timezone: string;
  isRunning: boolean;
  lastRun: SchedulerLogType | null;
  nextRun: string | null;
}

export interface SchedulePreset {
  label: string;
  value: string;
  description: string;
}

export interface ScheduleResult {
  logId: string;
  startedAt: string;
  completedAt: string;
  duration: number;
  totalChannels: number;
  successChannels: number;
  failedChannels: number;
  newFeeds: number;
  duplicates: number;
  status: 'success' | 'partial' | 'failed';
}

export interface UpdateSchedulerRequest {
  enabled?: boolean;
  cronExpression?: string;
}

export interface SchedulerStatusResponse extends SchedulerStatus {
  presets: SchedulePreset[];
}
