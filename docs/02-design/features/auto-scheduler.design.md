# Auto Scheduler - Design Document

> 버전: 1.0.0
> 작성일: 2026-02-06
> PDCA Phase: Design
> Plan 문서: docs/01-plan/features/auto-scheduler.plan.md

---

## 1. 시스템 아키텍처 (System Architecture)

### 1.1 전체 구조

```
┌────────────────────────────────────────────────────────────────┐
│                       Next.js Application                       │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                    Scheduler Module                       │   │
│  │                                                           │   │
│  │  ┌─────────────────┐         ┌──────────────────────┐    │   │
│  │  │ SchedulerService │────────►│    RSSCollector      │    │   │
│  │  │                  │         │    (기존 서비스)      │    │   │
│  │  │ - start()        │         └──────────────────────┘    │   │
│  │  │ - stop()         │                   │                 │   │
│  │  │ - reschedule()   │                   ▼                 │   │
│  │  │ - getStatus()    │         ┌──────────────────────┐    │   │
│  │  └─────────┬────────┘         │      feeds 테이블     │    │   │
│  │            │                  └──────────────────────┘    │   │
│  │            │                                              │   │
│  │            ▼                                              │   │
│  │  ┌─────────────────┐                                      │   │
│  │  │   node-cron     │                                      │   │
│  │  │   CronJob       │                                      │   │
│  │  └─────────────────┘                                      │   │
│  │            │                                              │   │
│  │            ▼                                              │   │
│  │  ┌─────────────────┐    ┌──────────────────────┐         │   │
│  │  │ scheduler_config│    │   scheduler_logs     │         │   │
│  │  │    (설정 DB)    │    │    (실행 로그 DB)    │         │   │
│  │  └─────────────────┘    └──────────────────────┘         │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
│  ┌─────────────────────────┐    ┌────────────────────────────┐  │
│  │     API Routes          │    │        UI Components        │  │
│  │  /api/scheduler         │◄──►│     SchedulerPanel          │  │
│  │  /api/scheduler/logs    │    │     (Settings 페이지)        │  │
│  │  /api/scheduler/trigger │    └────────────────────────────┘  │
│  └─────────────────────────┘                                    │
└────────────────────────────────────────────────────────────────┘
```

### 1.2 컴포넌트 흐름

```
앱 시작 (next start)
       │
       ▼
┌──────────────────┐
│ instrumentation  │  ← Next.js instrumentation hook
│     .ts          │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│ SchedulerService │
│   .initialize()  │
└────────┬─────────┘
         │
         ├──► DB에서 scheduler_config 조회
         │
         ├──► enabled === true 이면
         │         │
         │         ▼
         │    ┌──────────────┐
         │    │ CronJob 생성 │
         │    │ & 시작       │
         │    └──────────────┘
         │
         └──► 스케줄 시간 도달
                   │
                   ▼
              ┌──────────────┐
              │ runSchedule  │
              │ dCollection()│
              └──────┬───────┘
                     │
                     ├──► scheduler_logs에 시작 기록
                     │
                     ├──► rssCollector.collectAll()
                     │
                     └──► scheduler_logs에 완료 기록
```

---

## 2. 데이터베이스 스키마 (Database Schema)

### 2.1 scheduler_config 테이블

스케줄러 설정을 저장하는 싱글턴 테이블

```typescript
// src/lib/db/schema.ts에 추가

export const schedulerConfig = sqliteTable('scheduler_config', {
  id: text('id').primaryKey().default('default'),
  enabled: integer('enabled', { mode: 'boolean' }).default(true),
  cronExpression: text('cron_expression').default('0 9 * * *'),
  timezone: text('timezone').default('Asia/Seoul'),
  maxRetries: integer('max_retries').default(3),
  retryDelayMs: integer('retry_delay_ms').default(5000),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

export type SchedulerConfig = typeof schedulerConfig.$inferSelect;
export type NewSchedulerConfig = typeof schedulerConfig.$inferInsert;
```

**필드 설명**:

| 필드 | 타입 | 기본값 | 설명 |
|------|------|--------|------|
| id | TEXT | 'default' | 싱글턴 ID |
| enabled | BOOLEAN | true | 스케줄러 활성화 여부 |
| cronExpression | TEXT | '0 9 * * *' | Cron 표현식 (매일 오전 9시) |
| timezone | TEXT | 'Asia/Seoul' | 타임존 |
| maxRetries | INTEGER | 3 | 실패 시 최대 재시도 횟수 |
| retryDelayMs | INTEGER | 5000 | 재시도 간격 (ms) |
| createdAt | TEXT | - | 생성 시간 |
| updatedAt | TEXT | - | 수정 시간 |

### 2.2 scheduler_logs 테이블

스케줄 실행 로그를 저장

```typescript
// src/lib/db/schema.ts에 추가

export const schedulerLogs = sqliteTable('scheduler_logs', {
  id: text('id').primaryKey(),
  startedAt: text('started_at').notNull(),
  completedAt: text('completed_at'),
  duration: integer('duration'),              // 실행 시간 (ms)
  totalChannels: integer('total_channels').default(0),
  successChannels: integer('success_channels').default(0),
  failedChannels: integer('failed_channels').default(0),
  totalFeeds: integer('total_feeds').default(0),
  newFeeds: integer('new_feeds').default(0),
  duplicates: integer('duplicates').default(0),
  status: text('status').default('running'),  // running, success, partial, failed
  errorMessage: text('error_message'),
  triggeredBy: text('triggered_by').default('scheduler'), // scheduler, manual, api
  createdAt: text('created_at').notNull(),
});

export type SchedulerLog = typeof schedulerLogs.$inferSelect;
export type NewSchedulerLog = typeof schedulerLogs.$inferInsert;
```

**필드 설명**:

| 필드 | 타입 | 설명 |
|------|------|------|
| id | TEXT | UUID |
| startedAt | TEXT | 시작 시간 (ISO8601) |
| completedAt | TEXT | 완료 시간 |
| duration | INTEGER | 실행 시간 (ms) |
| totalChannels | INTEGER | 전체 채널 수 |
| successChannels | INTEGER | 성공 채널 수 |
| failedChannels | INTEGER | 실패 채널 수 |
| totalFeeds | INTEGER | 전체 수집 피드 수 |
| newFeeds | INTEGER | 신규 피드 수 |
| duplicates | INTEGER | 중복 피드 수 |
| status | TEXT | running / success / partial / failed |
| errorMessage | TEXT | 실패 시 에러 메시지 |
| triggeredBy | TEXT | 트리거 소스 |
| createdAt | TEXT | 생성 시간 |

### 2.3 Drizzle Relations

```typescript
// src/lib/db/schema.ts에 추가

import { relations } from 'drizzle-orm';

// 기존 relations 유지...

// 스케줄러 관계는 별도 테이블이므로 relations 불필요
```

---

## 3. 서비스 레이어 (Service Layer)

### 3.1 SchedulerService 클래스

```typescript
// src/lib/scheduler/scheduler.service.ts

import cron, { ScheduledTask } from 'node-cron';
import { db } from '@/lib/db';
import { schedulerConfig, schedulerLogs, SchedulerConfig, SchedulerLog } from '@/lib/db/schema';
import { rssCollector, CollectResult } from '@/lib/services/rss.collector';
import { eq, desc } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';

export interface SchedulerStatus {
  enabled: boolean;
  cronExpression: string;
  timezone: string;
  isRunning: boolean;
  lastRun: SchedulerLog | null;
  nextRun: string | null;
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
  results: CollectResult[];
}

export class SchedulerService {
  private static instance: SchedulerService;
  private cronJob: ScheduledTask | null = null;
  private isRunning: boolean = false;
  private config: SchedulerConfig | null = null;

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

    this.config = config!;
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

    this.cronJob = cron.schedule(
      this.config.cronExpression,
      async () => {
        await this.runScheduledCollection('scheduler');
      },
      {
        timezone: this.config.timezone,
        scheduled: true,
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
      // RSS 수집 실행
      const results = await rssCollector.collectAll();

      const completedAt = new Date().toISOString();
      const duration = new Date(completedAt).getTime() - new Date(startedAt).getTime();

      // 결과 집계
      const totalChannels = results.length;
      const successChannels = results.filter(r => r.success).length;
      const failedChannels = results.filter(r => !r.success).length;
      const newFeeds = results.reduce((sum, r) => sum + r.collected, 0);
      const duplicates = results.reduce((sum, r) => sum + r.duplicates, 0);

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
        results,
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

    // 다음 실행 시간 계산 (간단한 구현)
    let nextRun: string | null = null;
    if (this.config?.enabled && this.cronJob) {
      // node-cron은 nextDate를 직접 제공하지 않으므로 별도 계산 필요
      // 간단히 현재 설정된 cron 표현식 표시
      nextRun = this.getNextRunTime(this.config.cronExpression);
    }

    return {
      enabled: this.config?.enabled ?? false,
      cronExpression: this.config?.cronExpression ?? '0 9 * * *',
      timezone: this.config?.timezone ?? 'Asia/Seoul',
      isRunning: this.isRunning,
      lastRun: lastRun ?? null,
      nextRun,
    };
  }

  /**
   * 로그 목록 조회
   */
  async getLogs(limit: number = 10): Promise<SchedulerLog[]> {
    return db.query.schedulerLogs.findMany({
      orderBy: [desc(schedulerLogs.startedAt)],
      limit,
    });
  }

  /**
   * 다음 실행 시간 계산 (간단한 구현)
   */
  private getNextRunTime(cronExpression: string): string {
    // node-cron 패턴에서 다음 실행 시간 추정
    // 실제로는 cron-parser 라이브러리 사용 권장
    const parts = cronExpression.split(' ');
    if (parts.length >= 5) {
      const [minute, hour] = parts;
      const now = new Date();
      const next = new Date();
      next.setHours(parseInt(hour) || 0, parseInt(minute) || 0, 0, 0);

      if (next <= now) {
        next.setDate(next.getDate() + 1);
      }

      return next.toISOString();
    }
    return 'Unknown';
  }

  /**
   * 오래된 로그 정리 (30일 이상)
   */
  async cleanupOldLogs(daysToKeep: number = 30): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    const result = await db
      .delete(schedulerLogs)
      .where(
        // startedAt이 cutoffDate보다 이전인 로그 삭제
        // Drizzle에서는 lt 연산자 사용
        // 간단히 SQL로 처리
      );

    // 삭제된 행 수 반환 (SQLite에서는 changes로 확인)
    return 0; // 실제 구현 시 수정
  }
}

// 싱글턴 인스턴스 export
export const schedulerService = SchedulerService.getInstance();
```

### 3.2 Scheduler 초기화 (Instrumentation)

```typescript
// src/instrumentation.ts (Next.js 15+)

export async function register() {
  // 서버 사이드에서만 실행
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { schedulerService } = await import('@/lib/scheduler/scheduler.service');

    // 스케줄러 초기화
    await schedulerService.initialize();

    // 프로세스 종료 시 정리
    process.on('SIGTERM', () => {
      schedulerService.stop();
    });

    process.on('SIGINT', () => {
      schedulerService.stop();
    });
  }
}
```

---

## 4. API 설계 (API Design)

### 4.1 GET /api/scheduler

스케줄러 상태 조회

**Request**: 없음

**Response**:
```typescript
interface SchedulerStatusResponse {
  enabled: boolean;
  cronExpression: string;
  timezone: string;
  isRunning: boolean;
  lastRun: {
    id: string;
    startedAt: string;
    completedAt: string | null;
    status: string;
    newFeeds: number;
    failedChannels: number;
  } | null;
  nextRun: string | null;
  presets: Array<{
    label: string;
    value: string;
    description: string;
  }>;
}
```

**구현**:
```typescript
// src/app/api/scheduler/route.ts

import { NextResponse } from 'next/server';
import { schedulerService } from '@/lib/scheduler/scheduler.service';

const SCHEDULE_PRESETS = [
  { label: '매일 오전 6시', value: '0 6 * * *', description: '일찍 확인' },
  { label: '매일 오전 9시', value: '0 9 * * *', description: '권장' },
  { label: '매일 오후 12시', value: '0 12 * * *', description: '점심 시간' },
  { label: '12시간마다', value: '0 */12 * * *', description: '자주 확인' },
  { label: '6시간마다', value: '0 */6 * * *', description: '실시간에 가깝게' },
];

export async function GET() {
  try {
    const status = await schedulerService.getStatus();

    return NextResponse.json({
      ...status,
      presets: SCHEDULE_PRESETS,
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to get scheduler status' },
      { status: 500 }
    );
  }
}
```

### 4.2 POST /api/scheduler

스케줄러 설정 변경

**Request**:
```typescript
interface UpdateSchedulerRequest {
  enabled?: boolean;
  cronExpression?: string;
}
```

**Response**:
```typescript
interface UpdateSchedulerResponse {
  success: boolean;
  config: {
    enabled: boolean;
    cronExpression: string;
    timezone: string;
  };
}
```

**구현**:
```typescript
// src/app/api/scheduler/route.ts (POST 추가)

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { enabled, cronExpression } = body;

    if (typeof enabled === 'boolean') {
      await schedulerService.setEnabled(enabled);
    }

    if (cronExpression && typeof cronExpression === 'string') {
      // Cron 표현식 유효성 검사
      if (!isValidCron(cronExpression)) {
        return NextResponse.json(
          { error: 'Invalid cron expression' },
          { status: 400 }
        );
      }
      await schedulerService.reschedule(cronExpression);
    }

    const status = await schedulerService.getStatus();

    return NextResponse.json({
      success: true,
      config: {
        enabled: status.enabled,
        cronExpression: status.cronExpression,
        timezone: status.timezone,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to update scheduler' },
      { status: 500 }
    );
  }
}

function isValidCron(expression: string): boolean {
  // 간단한 유효성 검사
  const parts = expression.split(' ');
  return parts.length === 5;
}
```

### 4.3 GET /api/scheduler/logs

실행 로그 조회

**Request Query**:
```
?limit=10
```

**Response**:
```typescript
interface SchedulerLogsResponse {
  logs: Array<{
    id: string;
    startedAt: string;
    completedAt: string | null;
    duration: number | null;
    totalChannels: number;
    successChannels: number;
    failedChannels: number;
    newFeeds: number;
    duplicates: number;
    status: string;
    triggeredBy: string;
  }>;
  total: number;
}
```

**구현**:
```typescript
// src/app/api/scheduler/logs/route.ts

import { NextResponse } from 'next/server';
import { schedulerService } from '@/lib/scheduler/scheduler.service';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10');

    const logs = await schedulerService.getLogs(limit);

    return NextResponse.json({
      logs,
      total: logs.length,
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to get logs' },
      { status: 500 }
    );
  }
}
```

### 4.4 POST /api/scheduler/trigger

수동 실행 트리거

**Request**: 없음

**Response**:
```typescript
interface TriggerResponse {
  success: boolean;
  result?: ScheduleResult;
  error?: string;
}
```

**구현**:
```typescript
// src/app/api/scheduler/trigger/route.ts

import { NextResponse } from 'next/server';
import { schedulerService } from '@/lib/scheduler/scheduler.service';

export async function POST() {
  try {
    const result = await schedulerService.runScheduledCollection('api');

    return NextResponse.json({
      success: true,
      result,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';

    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
```

---

## 5. UI 컴포넌트 (UI Components)

### 5.1 SchedulerPanel 컴포넌트

```typescript
// src/components/settings/SchedulerPanel.tsx

'use client';

import { useState, useEffect } from 'react';

interface SchedulerStatus {
  enabled: boolean;
  cronExpression: string;
  timezone: string;
  isRunning: boolean;
  lastRun: {
    id: string;
    startedAt: string;
    completedAt: string | null;
    status: string;
    newFeeds: number;
    failedChannels: number;
  } | null;
  nextRun: string | null;
  presets: Array<{
    label: string;
    value: string;
    description: string;
  }>;
}

export function SchedulerPanel() {
  const [status, setStatus] = useState<SchedulerStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [triggering, setTriggering] = useState(false);

  // 상태 로드
  useEffect(() => {
    fetchStatus();
  }, []);

  const fetchStatus = async () => {
    try {
      const res = await fetch('/api/scheduler');
      const data = await res.json();
      setStatus(data);
    } catch (error) {
      console.error('Failed to fetch scheduler status:', error);
    } finally {
      setLoading(false);
    }
  };

  // 활성화/비활성화 토글
  const toggleEnabled = async () => {
    if (!status) return;

    setUpdating(true);
    try {
      const res = await fetch('/api/scheduler', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: !status.enabled }),
      });

      if (res.ok) {
        await fetchStatus();
      }
    } catch (error) {
      console.error('Failed to toggle scheduler:', error);
    } finally {
      setUpdating(false);
    }
  };

  // 스케줄 변경
  const changeSchedule = async (cronExpression: string) => {
    setUpdating(true);
    try {
      const res = await fetch('/api/scheduler', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cronExpression }),
      });

      if (res.ok) {
        await fetchStatus();
      }
    } catch (error) {
      console.error('Failed to change schedule:', error);
    } finally {
      setUpdating(false);
    }
  };

  // 수동 실행
  const triggerNow = async () => {
    setTriggering(true);
    try {
      const res = await fetch('/api/scheduler/trigger', {
        method: 'POST',
      });

      if (res.ok) {
        await fetchStatus();
      }
    } catch (error) {
      console.error('Failed to trigger scheduler:', error);
    } finally {
      setTriggering(false);
    }
  };

  // 날짜 포맷
  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleString('ko-KR');
  };

  if (loading) {
    return <div className="p-4">Loading...</div>;
  }

  if (!status) {
    return <div className="p-4 text-red-500">Failed to load scheduler status</div>;
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
        ⏰ Auto Scheduler
      </h3>

      {/* 상태 표시 */}
      <div className="mb-4 flex items-center gap-3">
        <span className="text-gray-600">Status:</span>
        <span className={`px-2 py-1 rounded text-sm font-medium ${
          status.enabled
            ? 'bg-green-100 text-green-800'
            : 'bg-gray-100 text-gray-600'
        }`}>
          {status.enabled ? '🟢 Active' : '🔴 Inactive'}
        </span>
        {status.isRunning && (
          <span className="px-2 py-1 rounded text-sm bg-blue-100 text-blue-800 animate-pulse">
            Running...
          </span>
        )}
      </div>

      {/* 스케줄 선택 */}
      <div className="mb-4">
        <label className="block text-sm text-gray-600 mb-2">Schedule:</label>
        <select
          value={status.cronExpression}
          onChange={(e) => changeSchedule(e.target.value)}
          disabled={updating}
          className="w-full p-2 border rounded-lg disabled:opacity-50"
        >
          {status.presets.map((preset) => (
            <option key={preset.value} value={preset.value}>
              {preset.label} ({preset.description})
            </option>
          ))}
        </select>
      </div>

      {/* 실행 정보 */}
      <div className="mb-4 text-sm text-gray-600 space-y-1">
        <p>
          <span className="font-medium">Last Run:</span>{' '}
          {formatDate(status.lastRun?.startedAt ?? null)}
          {status.lastRun && (
            <span className={`ml-2 px-1 rounded text-xs ${
              status.lastRun.status === 'success'
                ? 'bg-green-100 text-green-700'
                : status.lastRun.status === 'partial'
                ? 'bg-yellow-100 text-yellow-700'
                : 'bg-red-100 text-red-700'
            }`}>
              {status.lastRun.status}
            </span>
          )}
        </p>
        <p>
          <span className="font-medium">Next Run:</span>{' '}
          {status.enabled ? formatDate(status.nextRun) : 'Disabled'}
        </p>
        {status.lastRun && (
          <p>
            <span className="font-medium">Last Result:</span>{' '}
            {status.lastRun.newFeeds} new feeds, {status.lastRun.failedChannels} failed
          </p>
        )}
      </div>

      {/* 액션 버튼 */}
      <div className="flex gap-3">
        <button
          onClick={toggleEnabled}
          disabled={updating}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            status.enabled
              ? 'bg-red-100 text-red-700 hover:bg-red-200'
              : 'bg-green-100 text-green-700 hover:bg-green-200'
          } disabled:opacity-50`}
        >
          {updating ? '...' : status.enabled ? 'Disable' : 'Enable'}
        </button>

        <button
          onClick={triggerNow}
          disabled={triggering || status.isRunning}
          className="px-4 py-2 rounded-lg font-medium bg-blue-100 text-blue-700 hover:bg-blue-200 disabled:opacity-50"
        >
          {triggering ? 'Running...' : 'Run Now'}
        </button>
      </div>
    </div>
  );
}
```

### 5.2 SchedulerLogs 컴포넌트

```typescript
// src/components/settings/SchedulerLogs.tsx

'use client';

import { useState, useEffect } from 'react';

interface LogEntry {
  id: string;
  startedAt: string;
  completedAt: string | null;
  duration: number | null;
  newFeeds: number;
  failedChannels: number;
  status: string;
  triggeredBy: string;
}

export function SchedulerLogs() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      const res = await fetch('/api/scheduler/logs?limit=10');
      const data = await res.json();
      setLogs(data.logs);
    } catch (error) {
      console.error('Failed to fetch logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('ko-KR', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDuration = (ms: number | null) => {
    if (!ms) return '-';
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  };

  if (loading) {
    return <div className="p-4">Loading logs...</div>;
  }

  return (
    <div className="bg-white rounded-lg shadow p-6 mt-4">
      <h3 className="text-lg font-semibold mb-4">📋 Execution Logs</h3>

      {logs.length === 0 ? (
        <p className="text-gray-500">No logs yet</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2">Time</th>
                <th className="text-left py-2">Duration</th>
                <th className="text-left py-2">New</th>
                <th className="text-left py-2">Failed</th>
                <th className="text-left py-2">Status</th>
                <th className="text-left py-2">Trigger</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.id} className="border-b hover:bg-gray-50">
                  <td className="py-2">{formatDate(log.startedAt)}</td>
                  <td className="py-2">{formatDuration(log.duration)}</td>
                  <td className="py-2">{log.newFeeds}</td>
                  <td className="py-2">{log.failedChannels}</td>
                  <td className="py-2">
                    <span className={`px-2 py-0.5 rounded text-xs ${
                      log.status === 'success'
                        ? 'bg-green-100 text-green-700'
                        : log.status === 'partial'
                        ? 'bg-yellow-100 text-yellow-700'
                        : log.status === 'running'
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-red-100 text-red-700'
                    }`}>
                      {log.status}
                    </span>
                  </td>
                  <td className="py-2 text-gray-500">{log.triggeredBy}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
```

---

## 6. 타입 정의 (Type Definitions)

```typescript
// src/types/scheduler.ts

export interface SchedulerConfig {
  id: string;
  enabled: boolean;
  cronExpression: string;
  timezone: string;
  maxRetries: number;
  retryDelayMs: number;
  createdAt: string;
  updatedAt: string;
}

export interface SchedulerLog {
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
  lastRun: SchedulerLog | null;
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
```

---

## 7. 구현 순서 (Implementation Order)

### Phase 1: 코어 기능 (P0) - 예상 2.5시간

| 순서 | 작업 | 파일 | 시간 |
|:---:|------|------|:----:|
| 1 | DB 스키마 추가 | `src/lib/db/schema.ts` | 20분 |
| 2 | node-cron 설치 | `package.json` | 5분 |
| 3 | 타입 정의 | `src/types/scheduler.ts` | 15분 |
| 4 | SchedulerService 구현 | `src/lib/scheduler/scheduler.service.ts` | 60분 |
| 5 | instrumentation 설정 | `src/instrumentation.ts` | 15분 |
| 6 | DB 마이그레이션 | `drizzle-kit push` | 5분 |

### Phase 2: API (P0) - 예상 1시간

| 순서 | 작업 | 파일 | 시간 |
|:---:|------|------|:----:|
| 7 | 상태 조회 API | `src/app/api/scheduler/route.ts` | 20분 |
| 8 | 로그 조회 API | `src/app/api/scheduler/logs/route.ts` | 15분 |
| 9 | 트리거 API | `src/app/api/scheduler/trigger/route.ts` | 15분 |
| 10 | API 테스트 | curl / Postman | 10분 |

### Phase 3: UI (P1) - 예상 1시간

| 순서 | 작업 | 파일 | 시간 |
|:---:|------|------|:----:|
| 11 | SchedulerPanel | `src/components/settings/SchedulerPanel.tsx` | 30분 |
| 12 | SchedulerLogs | `src/components/settings/SchedulerLogs.tsx` | 20분 |
| 13 | Settings 페이지 통합 | `src/app/settings/page.tsx` | 10분 |

### Phase 4: 테스트 & 정리 - 예상 30분

| 순서 | 작업 | 시간 |
|:---:|------|:----:|
| 14 | 통합 테스트 | 20분 |
| 15 | 빌드 확인 | 10분 |

---

## 8. 의존성 (Dependencies)

### 신규 패키지

```json
{
  "dependencies": {
    "node-cron": "^3.0.3"
  },
  "devDependencies": {
    "@types/node-cron": "^3.0.11"
  }
}
```

### 설치 명령어

```bash
npm install node-cron
npm install -D @types/node-cron
```

---

## 9. 설정 파일 (Configuration)

### next.config.js 수정

```javascript
// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  // instrumentation 활성화
  experimental: {
    instrumentationHook: true,
  },
};

module.exports = nextConfig;
```

---

## 10. 테스트 체크리스트

### 기능 테스트

- [ ] 스케줄러 활성화/비활성화
- [ ] 스케줄 변경 (프리셋 선택)
- [ ] 수동 트리거 실행
- [ ] 실행 로그 기록
- [ ] 앱 재시작 후 스케줄러 자동 시작

### API 테스트

```bash
# 상태 조회
curl http://localhost:3000/api/scheduler

# 활성화
curl -X POST http://localhost:3000/api/scheduler \
  -H "Content-Type: application/json" \
  -d '{"enabled": true}'

# 스케줄 변경
curl -X POST http://localhost:3000/api/scheduler \
  -H "Content-Type: application/json" \
  -d '{"cronExpression": "0 */6 * * *"}'

# 수동 트리거
curl -X POST http://localhost:3000/api/scheduler/trigger

# 로그 조회
curl http://localhost:3000/api/scheduler/logs?limit=5
```

---

## 11. 제약사항 및 주의사항

### 제약사항

1. **앱 실행 필수**: 스케줄러는 Next.js 앱이 실행 중일 때만 동작
2. **싱글 인스턴스**: 여러 인스턴스 실행 시 중복 수집 가능성
3. **타임존**: 서버 타임존 설정 주의 필요

### 주의사항

1. **프로덕션 배포 시**: Vercel 등에서는 instrumentation이 제한적
2. **로그 정리**: 주기적으로 오래된 로그 삭제 필요
3. **에러 처리**: 수집 실패 시 전체 스케줄러에 영향 없도록 격리

---

**Design 작성일**: 2026-02-06
**작성자**: Claude (pdca-design)
**상태**: 📐 Design 완료 - Do 단계 진행 가능
