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

// 타입 추론
export type Channel = typeof channels.$inferSelect;
export type NewChannel = typeof channels.$inferInsert;
export type Feed = typeof feeds.$inferSelect;
export type NewFeed = typeof feeds.$inferInsert;
export type Idea = typeof ideas.$inferSelect;
export type NewIdea = typeof ideas.$inferInsert;
