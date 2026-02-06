import cron, { ScheduledTask } from 'node-cron';
import { db } from '@/lib/db';
import { schedulerConfig, schedulerLogs } from '@/lib/db/schema';
import { collectorFactory, CollectResult } from '@/lib/services/collectors';
import { eq, desc } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';
import type { SchedulerStatus, ScheduleResult, SchedulerLogType, SchedulerConfigType } from '@/types/scheduler';

export class SchedulerService {
  private static instance: SchedulerService;
  private cronJob: ScheduledTask | null = null;
  private isRunning: boolean = false;
  private config: SchedulerConfigType | null = null;

  private constructor() {}

  static getInstance(): SchedulerService {
    if (!SchedulerService.instance) {
      SchedulerService.instance = new SchedulerService();
    }
    return SchedulerService.instance;
  }

  /**
   * 스케줄러 초기화 (앱 시작 시 호출)
   */
  async initialize(): Promise<void> {
    await this.loadConfig();

    if (this.config?.enabled) {
      this.start();
    }

    console.log('[Scheduler] Initialized:', {
      enabled: this.config?.enabled,
      cron: this.config?.cronExpression,
    });
  }

  /**
   * DB에서 설정 로드
   */
  private async loadConfig(): Promise<void> {
    let config = await db.query.schedulerConfig.findFirst({
      where: eq(schedulerConfig.id, 'default'),
    });

    // 설정이 없으면 기본값으로 생성
    if (!config) {
      const now = new Date().toISOString();
      await db.insert(schedulerConfig).values({
        id: 'default',
        enabled: true,
        cronExpression: '0 9 * * *',
        timezone: 'Asia/Seoul',
        maxRetries: 3,
        retryDelayMs: 5000,
        createdAt: now,
        updatedAt: now,
      });

      config = await db.query.schedulerConfig.findFirst({
        where: eq(schedulerConfig.id, 'default'),
      });
    }

    this.config = config as SchedulerConfigType;
  }

  /**
   * 스케줄러 시작
   */
  start(): void {
    if (this.cronJob) {
      this.stop();
    }

    if (!this.config) {
      console.error('[Scheduler] Config not loaded');
      return;
    }

    // cron expression 유효성 검사
    if (!cron.validate(this.config.cronExpression)) {
      console.error('[Scheduler] Invalid cron expression:', this.config.cronExpression);
      return;
    }

    this.cronJob = cron.schedule(
      this.config.cronExpression,
      async () => {
        console.log('[Scheduler] Cron job triggered');
        try {
          await this.runScheduledCollection('scheduler');
        } catch (error) {
          console.error('[Scheduler] Collection failed:', error);
        }
      },
      {
        timezone: this.config.timezone,
      }
    );

    console.log(`[Scheduler] Started with cron: ${this.config.cronExpression}`);
  }

  /**
   * 스케줄러 중지
   */
  stop(): void {
    if (this.cronJob) {
      this.cronJob.stop();
      this.cronJob = null;
      console.log('[Scheduler] Stopped');
    }
  }

  /**
   * 스케줄 재설정
   */
  async reschedule(cronExpression: string): Promise<void> {
    const now = new Date().toISOString();

    await db
      .update(schedulerConfig)
      .set({
        cronExpression,
        updatedAt: now,
      })
      .where(eq(schedulerConfig.id, 'default'));

    await this.loadConfig();

    if (this.config?.enabled) {
      this.start();
    }
  }

  /**
   * 스케줄러 활성화/비활성화
   */
  async setEnabled(enabled: boolean): Promise<void> {
    const now = new Date().toISOString();

    await db
      .update(schedulerConfig)
      .set({
        enabled,
        updatedAt: now,
      })
      .where(eq(schedulerConfig.id, 'default'));

    await this.loadConfig();

    if (enabled) {
      this.start();
    } else {
      this.stop();
    }
  }

  /**
   * 스케줄된 수집 실행
   */
  async runScheduledCollection(
    triggeredBy: 'scheduler' | 'manual' | 'api' = 'scheduler'
  ): Promise<ScheduleResult> {
    // 이미 실행 중이면 스킵
    if (this.isRunning) {
      throw new Error('Collection already in progress');
    }

    this.isRunning = true;
    const logId = uuidv4();
    const startedAt = new Date().toISOString();

    // 시작 로그 기록
    await db.insert(schedulerLogs).values({
      id: logId,
      startedAt,
      status: 'running',
      triggeredBy,
      createdAt: startedAt,
    });

    try {
      // 모든 채널 수집 실행 (RSS + Reddit)
      const results = await collectorFactory.collectAll();

      const completedAt = new Date().toISOString();
      const duration = new Date(completedAt).getTime() - new Date(startedAt).getTime();

      // 결과 집계
      const totalChannels = results.length;
      const successChannels = results.filter((r: CollectResult) => r.success).length;
      const failedChannels = results.filter((r: CollectResult) => !r.success).length;
      const newFeeds = results.reduce((sum: number, r: CollectResult) => sum + r.collected, 0);
      const duplicates = results.reduce((sum: number, r: CollectResult) => sum + r.duplicates, 0);

      // 상태 결정
      let status: 'success' | 'partial' | 'failed' = 'success';
      if (failedChannels === totalChannels) {
        status = 'failed';
      } else if (failedChannels > 0) {
        status = 'partial';
      }

      // 완료 로그 업데이트
      await db
        .update(schedulerLogs)
        .set({
          completedAt,
          duration,
          totalChannels,
          successChannels,
          failedChannels,
          totalFeeds: newFeeds + duplicates,
          newFeeds,
          duplicates,
          status,
        })
        .where(eq(schedulerLogs.id, logId));

      this.isRunning = false;

      console.log(`[Scheduler] Collection completed: ${newFeeds} new feeds, ${failedChannels} failed channels`);

      return {
        logId,
        startedAt,
        completedAt,
        duration,
        totalChannels,
        successChannels,
        failedChannels,
        newFeeds,
        duplicates,
        status,
      };
    } catch (error) {
      const completedAt = new Date().toISOString();
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      // 에러 로그 업데이트
      await db
        .update(schedulerLogs)
        .set({
          completedAt,
          status: 'failed',
          errorMessage,
        })
        .where(eq(schedulerLogs.id, logId));

      this.isRunning = false;
      throw error;
    }
  }

  /**
   * 현재 상태 조회
   */
  async getStatus(): Promise<SchedulerStatus> {
    await this.loadConfig();

    const lastRun = await db.query.schedulerLogs.findFirst({
      orderBy: [desc(schedulerLogs.startedAt)],
    });

    // 다음 실행 시간 계산
    let nextRun: string | null = null;
    if (this.config?.enabled && this.cronJob) {
      nextRun = this.getNextRunTime(this.config.cronExpression);
    }

    return {
      enabled: this.config?.enabled ?? false,
      cronExpression: this.config?.cronExpression ?? '0 9 * * *',
      timezone: this.config?.timezone ?? 'Asia/Seoul',
      isRunning: this.isRunning,
      lastRun: lastRun as SchedulerLogType | null,
      nextRun,
    };
  }

  /**
   * 설정 조회
   */
  async getConfig(): Promise<SchedulerConfigType | null> {
    await this.loadConfig();
    return this.config;
  }

  /**
   * 로그 목록 조회
   */
  async getLogs(limit: number = 10): Promise<SchedulerLogType[]> {
    const logs = await db.query.schedulerLogs.findMany({
      orderBy: [desc(schedulerLogs.startedAt)],
      limit,
    });
    return logs as SchedulerLogType[];
  }

  /**
   * 다음 실행 시간 계산
   */
  private getNextRunTime(cronExpression: string): string {
    // cron 표현식에서 다음 실행 시간 추정
    const parts = cronExpression.split(' ');
    if (parts.length >= 5) {
      const [minute, hour] = parts;
      const now = new Date();
      const next = new Date();

      // 시간 설정
      const targetHour = hour === '*' ? now.getHours() : parseInt(hour);
      const targetMinute = minute === '*' ? 0 : parseInt(minute);

      next.setHours(targetHour, targetMinute, 0, 0);

      // 이미 지났으면 다음 날
      if (next <= now) {
        next.setDate(next.getDate() + 1);
      }

      return next.toISOString();
    }
    return 'Unknown';
  }

  /**
   * 실행 중 여부 확인
   */
  getIsRunning(): boolean {
    return this.isRunning;
  }

  /**
   * 오래된 로그 정리 (30일 이상)
   */
  async cleanupOldLogs(daysToKeep: number = 30): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
    const cutoffStr = cutoffDate.toISOString();

    // Drizzle에서 직접 비교 연산이 어려우므로 전체 조회 후 필터링
    const oldLogs = await db.query.schedulerLogs.findMany({
      where: (logs, { lt }) => lt(logs.startedAt, cutoffStr),
    });

    for (const log of oldLogs) {
      await db.delete(schedulerLogs).where(eq(schedulerLogs.id, log.id));
    }

    return oldLogs.length;
  }
}

// 싱글턴 인스턴스 export
export const schedulerService = SchedulerService.getInstance();
