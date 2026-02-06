import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';

// 채널 테이블
export const channels = sqliteTable('channels', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  rssUrl: text('rss_url').notNull(),
  shortCode: text('short_code').notNull(),
  category: text('category').notNull(), // direct_needs, trends, builders, insights
  isActive: integer('is_active', { mode: 'boolean' }).default(true),
  lastFetchedAt: text('last_fetched_at'),
  fetchStatus: text('fetch_status'), // success, failed, pending
  errorMessage: text('error_message'),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

// 피드 테이블
export const feeds = sqliteTable('feeds', {
  id: text('id').primaryKey(),
  channelId: text('channel_id').references(() => channels.id),
  title: text('title').notNull(),
  link: text('link').notNull().unique(),
  content: text('content'),
  summary: text('summary'),
  author: text('author'),
  publishedAt: text('published_at'),
  collectedAt: text('collected_at').notNull(),
  isRead: integer('is_read', { mode: 'boolean' }).default(false),
  isBookmarked: integer('is_bookmarked', { mode: 'boolean' }).default(false),
  // 스마트 필터링 필드
  hasNeedKeyword: integer('has_need_keyword', { mode: 'boolean' }).default(false),
  hasMoneyKeyword: integer('has_money_keyword', { mode: 'boolean' }).default(false),
  priorityScore: real('priority_score').default(0),
  detectedKeywords: text('detected_keywords'), // JSON 배열
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

// AI 분석 결과 테이블
export const feedAnalysis = sqliteTable('feed_analysis', {
  id: text('id').primaryKey(),
  feedId: text('feed_id').notNull().references(() => feeds.id).unique(),
  // AI 분석 결과
  summary: text('summary'),                    // 1-2문장 요약
  keywords: text('keywords'),                  // JSON 배열
  potentialScore: integer('potential_score'),  // 1-10 점수
  potentialReason: text('potential_reason'),   // 점수 근거
  // 메타데이터
  modelUsed: text('model_used'),               // 사용된 모델명
  status: text('status').default('pending'),   // pending, analyzing, completed, failed
  errorMessage: text('error_message'),         // 실패 시 에러 메시지
  // 타임스탬프
  analyzedAt: text('analyzed_at'),             // 분석 완료 시간
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

// 아이디어 테이블
export const ideas = sqliteTable('ideas', {
  id: text('id').primaryKey(),
  feedId: text('feed_id').references(() => feeds.id),
  // 핵심 필드
  problem: text('problem').notNull(),
  currentSolution: text('current_solution'),
  moneyEvidence: text('money_evidence'),
  opportunity: text('opportunity'),
  oneLineIdea: text('one_line_idea').notNull(),
  // 파이프라인 필드
  stage: text('stage').default('collected'), // collected, reviewing, promising, building
  priority: integer('priority').default(3), // 1-5
  notes: text('notes'),
  nextAction: text('next_action'),
  dueDate: text('due_date'),
  // 메타데이터
  tags: text('tags'), // JSON 배열
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

// 스케줄러 설정 테이블
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

// 스케줄러 실행 로그 테이블
export const schedulerLogs = sqliteTable('scheduler_logs', {
  id: text('id').primaryKey(),
  startedAt: text('started_at').notNull(),
  completedAt: text('completed_at'),
  duration: integer('duration'),
  totalChannels: integer('total_channels').default(0),
  successChannels: integer('success_channels').default(0),
  failedChannels: integer('failed_channels').default(0),
  totalFeeds: integer('total_feeds').default(0),
  newFeeds: integer('new_feeds').default(0),
  duplicates: integer('duplicates').default(0),
  status: text('status').default('running'), // running, success, partial, failed
  errorMessage: text('error_message'),
  triggeredBy: text('triggered_by').default('scheduler'), // scheduler, manual, api
  createdAt: text('created_at').notNull(),
});

// 타입 추론
export type Channel = typeof channels.$inferSelect;
export type NewChannel = typeof channels.$inferInsert;
export type Feed = typeof feeds.$inferSelect;
export type NewFeed = typeof feeds.$inferInsert;
export type Idea = typeof ideas.$inferSelect;
export type NewIdea = typeof ideas.$inferInsert;
export type FeedAnalysis = typeof feedAnalysis.$inferSelect;
export type NewFeedAnalysis = typeof feedAnalysis.$inferInsert;
export type SchedulerConfig = typeof schedulerConfig.$inferSelect;
export type NewSchedulerConfig = typeof schedulerConfig.$inferInsert;
export type SchedulerLog = typeof schedulerLogs.$inferSelect;
export type NewSchedulerLog = typeof schedulerLogs.$inferInsert;
