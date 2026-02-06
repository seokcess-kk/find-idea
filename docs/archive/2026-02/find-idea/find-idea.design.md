# Product Ideation System - Design Document

> 버전: 1.0.0
> 작성일: 2026-02-06
> Plan 참조: docs/01-plan/features/product-ideation.plan.md (v2.1.0)
> PDCA Phase: Design

---

## 1. 시스템 아키텍처 (System Architecture)

### 1.1 전체 구조

```
┌─────────────────────────────────────────────────────────────────────┐
│                        Product Ideation System                       │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │                    Next.js 15 App Router                     │    │
│  │  ┌─────────────────────────────────────────────────────────┐│    │
│  │  │                    Presentation Layer                    ││    │
│  │  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌────────────┐  ││    │
│  │  │  │Dashboard │ │Feed List │ │Idea Form │ │  Settings  │  ││    │
│  │  │  │  Page    │ │Component │ │  Modal   │ │    Page    │  ││    │
│  │  │  └──────────┘ └──────────┘ └──────────┘ └────────────┘  ││    │
│  │  └─────────────────────────────────────────────────────────┘│    │
│  │                              │                               │    │
│  │  ┌─────────────────────────────────────────────────────────┐│    │
│  │  │                     API Layer                            ││    │
│  │  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────────┐    ││    │
│  │  │  │ /api/feeds  │ │ /api/ideas  │ │ /api/channels   │    ││    │
│  │  │  └─────────────┘ └─────────────┘ └─────────────────┘    ││    │
│  │  │  ┌─────────────┐ ┌─────────────┐                        ││    │
│  │  │  │ /api/sync   │ │ /api/export │                        ││    │
│  │  │  └─────────────┘ └─────────────┘                        ││    │
│  │  └─────────────────────────────────────────────────────────┘│    │
│  │                              │                               │    │
│  │  ┌─────────────────────────────────────────────────────────┐│    │
│  │  │                   Service Layer                          ││    │
│  │  │  ┌──────────────┐ ┌──────────────┐ ┌────────────────┐   ││    │
│  │  │  │ FeedService  │ │ IdeaService  │ │ ChannelService │   ││    │
│  │  │  └──────────────┘ └──────────────┘ └────────────────┘   ││    │
│  │  │  ┌──────────────┐ ┌──────────────┐                      ││    │
│  │  │  │ RSSCollector │ │SmartFilter   │                      ││    │
│  │  │  └──────────────┘ └──────────────┘                      ││    │
│  │  └─────────────────────────────────────────────────────────┘│    │
│  └─────────────────────────────────────────────────────────────┘    │
│                              │                                       │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │                      Data Layer                              │    │
│  │  ┌──────────────────────────────────────────────────────┐   │    │
│  │  │              Drizzle ORM                              │   │    │
│  │  └──────────────────────────────────────────────────────┘   │    │
│  │                          │                                   │    │
│  │  ┌──────────────────────────────────────────────────────┐   │    │
│  │  │              SQLite (better-sqlite3)                  │   │    │
│  │  │              ./data/ideation.db                       │   │    │
│  │  └──────────────────────────────────────────────────────┘   │    │
│  └─────────────────────────────────────────────────────────────┘    │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### 1.2 기술 스택 확정

| 레이어 | 기술 | 버전 | 선택 이유 |
|--------|------|------|-----------|
| Framework | Next.js | 15.x | App Router, Server Actions |
| Language | TypeScript | 5.x | 타입 안정성 |
| UI | React | 19.x | 컴포넌트 기반 |
| Styling | Tailwind CSS | 3.x | 유틸리티 기반, 빠른 개발 |
| UI Components | shadcn/ui | latest | 커스터마이징 가능 |
| Database | SQLite | 3.x | 로컬 파일 기반 |
| ORM | Drizzle | latest | 경량, 타입 안전 |
| RSS Parser | rss-parser | 3.x | 안정적, 널리 사용 |
| State | Zustand | 4.x | 경량 상태관리 |
| Forms | React Hook Form | 7.x | 성능 최적화 |
| Validation | Zod | 3.x | 스키마 검증 |

---

## 2. 디렉토리 구조 (Directory Structure)

```
product-ideation/
├── src/
│   ├── app/                          # Next.js App Router
│   │   ├── layout.tsx                # 루트 레이아웃
│   │   ├── page.tsx                  # 메인 대시보드
│   │   ├── ideas/
│   │   │   └── page.tsx              # 아이디어 목록
│   │   ├── settings/
│   │   │   └── page.tsx              # 설정 페이지
│   │   └── api/                      # API Routes
│   │       ├── feeds/
│   │       │   ├── route.ts          # GET: 목록, POST: 수동 추가
│   │       │   └── [id]/
│   │       │       └── route.ts      # GET, PATCH, DELETE
│   │       ├── ideas/
│   │       │   ├── route.ts          # GET, POST
│   │       │   └── [id]/
│   │       │       └── route.ts      # GET, PATCH, DELETE
│   │       ├── channels/
│   │       │   └── route.ts          # GET, PATCH
│   │       ├── sync/
│   │       │   └── route.ts          # POST: 수동 동기화
│   │       └── export/
│   │           └── route.ts          # GET: 데이터 내보내기
│   │
│   ├── components/                   # UI 컴포넌트
│   │   ├── ui/                       # shadcn/ui 컴포넌트
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   ├── dialog.tsx
│   │   │   ├── input.tsx
│   │   │   ├── select.tsx
│   │   │   ├── textarea.tsx
│   │   │   └── badge.tsx
│   │   ├── layout/
│   │   │   ├── Header.tsx
│   │   │   ├── Sidebar.tsx
│   │   │   └── Navigation.tsx
│   │   ├── feeds/
│   │   │   ├── FeedList.tsx          # 피드 목록
│   │   │   ├── FeedCard.tsx          # 피드 카드
│   │   │   ├── FeedFilter.tsx        # 필터 컴포넌트
│   │   │   └── FeedDetail.tsx        # 피드 상세
│   │   ├── ideas/
│   │   │   ├── IdeaList.tsx          # 아이디어 목록
│   │   │   ├── IdeaCard.tsx          # 아이디어 카드
│   │   │   ├── IdeaForm.tsx          # 아이디어 입력 폼
│   │   │   └── IdeaModal.tsx         # 아이디어 모달
│   │   └── dashboard/
│   │       ├── StatsCard.tsx         # 통계 카드
│   │       └── SyncButton.tsx        # 동기화 버튼
│   │
│   ├── lib/                          # 유틸리티
│   │   ├── db/
│   │   │   ├── index.ts              # DB 연결
│   │   │   ├── schema.ts             # Drizzle 스키마
│   │   │   └── migrations/           # 마이그레이션
│   │   ├── services/
│   │   │   ├── feed.service.ts       # 피드 서비스
│   │   │   ├── idea.service.ts       # 아이디어 서비스
│   │   │   ├── channel.service.ts    # 채널 서비스
│   │   │   └── rss.collector.ts      # RSS 수집기
│   │   ├── utils/
│   │   │   ├── smart-filter.ts       # 스마트 필터링
│   │   │   ├── keywords.ts           # 키워드 상수
│   │   │   └── date.ts               # 날짜 유틸
│   │   └── validations/
│   │       ├── feed.schema.ts        # 피드 스키마
│   │       └── idea.schema.ts        # 아이디어 스키마
│   │
│   ├── hooks/                        # 커스텀 훅
│   │   ├── useFeeds.ts
│   │   ├── useIdeas.ts
│   │   └── useSync.ts
│   │
│   ├── store/                        # Zustand 스토어
│   │   ├── feedStore.ts
│   │   └── filterStore.ts
│   │
│   └── types/                        # 타입 정의
│       ├── feed.ts
│       ├── idea.ts
│       └── channel.ts
│
├── data/                             # 데이터 디렉토리
│   └── ideation.db                   # SQLite DB 파일
│
├── drizzle.config.ts                 # Drizzle 설정
├── tailwind.config.ts
├── tsconfig.json
├── package.json
└── README.md
```

---

## 3. 데이터베이스 설계 (Database Schema)

### 3.1 Drizzle 스키마 정의

```typescript
// src/lib/db/schema.ts

import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';

// 채널 테이블
export const channels = sqliteTable('channels', {
  id: text('id').primaryKey(),           // UUID
  name: text('name').notNull(),           // 채널명
  rssUrl: text('rss_url').notNull(),      // RSS URL
  shortCode: text('short_code').notNull(), // 짧은 코드 (SMT, PH 등)
  category: text('category').notNull(),    // direct_needs, trends, builders, insights
  isActive: integer('is_active', { mode: 'boolean' }).default(true),
  lastFetchedAt: text('last_fetched_at'),  // ISO 문자열
  fetchStatus: text('fetch_status'),       // success, failed, pending
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
  content: text('content'),               // 원문 내용
  summary: text('summary'),               // 요약
  author: text('author'),
  publishedAt: text('published_at'),      // 원본 게시일
  collectedAt: text('collected_at').notNull(),
  isRead: integer('is_read', { mode: 'boolean' }).default(false),
  isBookmarked: integer('is_bookmarked', { mode: 'boolean' }).default(false),
  // 스마트 필터링 필드
  hasNeedKeyword: integer('has_need_keyword', { mode: 'boolean' }).default(false),
  hasMoneyKeyword: integer('has_money_keyword', { mode: 'boolean' }).default(false),
  priorityScore: real('priority_score').default(0),  // 계산된 우선순위
  detectedKeywords: text('detected_keywords'),       // JSON 배열
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

// 아이디어 테이블
export const ideas = sqliteTable('ideas', {
  id: text('id').primaryKey(),
  feedId: text('feed_id').references(() => feeds.id),
  // 핵심 필드 (Plan 템플릿 기반)
  problem: text('problem').notNull(),
  currentSolution: text('current_solution'),
  moneyEvidence: text('money_evidence'),
  opportunity: text('opportunity'),
  oneLineIdea: text('one_line_idea').notNull(),
  // 파이프라인 필드
  stage: text('stage').default('collected'),  // collected, reviewing, promising, building
  priority: integer('priority').default(3),    // 1-5
  notes: text('notes'),
  nextAction: text('next_action'),
  dueDate: text('due_date'),
  // 메타데이터
  tags: text('tags'),                          // JSON 배열
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

// 인덱스
export const feedsLinkIndex = sqliteTable('feeds_link_idx', {
  link: text('link').unique(),
});
```

### 3.2 초기 채널 데이터

```typescript
// src/lib/db/seed.ts

export const initialChannels = [
  // 직접적 니즈 표현
  { id: 'ch-001', name: 'r/SomebodyMakeThis', rssUrl: 'https://www.reddit.com/r/SomebodyMakeThis/new/.rss', shortCode: 'SMT', category: 'direct_needs' },
  { id: 'ch-002', name: 'r/AppIdeas', rssUrl: 'https://www.reddit.com/r/AppIdeas/new/.rss', shortCode: 'APP', category: 'direct_needs' },
  { id: 'ch-003', name: 'Ask HN', rssUrl: 'https://hnrss.org/ask', shortCode: 'AHN', category: 'direct_needs' },
  // 트렌드/경쟁 분석
  { id: 'ch-004', name: 'Product Hunt', rssUrl: 'https://www.producthunt.com/feed', shortCode: 'PH', category: 'trends' },
  { id: 'ch-005', name: 'BetaList', rssUrl: 'https://betalist.com/feed', shortCode: 'BL', category: 'trends' },
  { id: 'ch-006', name: 'Show HN', rssUrl: 'https://hnrss.org/show', shortCode: 'SHN', category: 'trends' },
  // 빌더 커뮤니티
  { id: 'ch-007', name: 'r/startups', rssUrl: 'https://www.reddit.com/r/startups/new/.rss', shortCode: 'SU', category: 'builders' },
  { id: 'ch-008', name: 'r/Entrepreneur', rssUrl: 'https://www.reddit.com/r/Entrepreneur/new/.rss', shortCode: 'ENT', category: 'builders' },
  { id: 'ch-009', name: 'r/SaaS', rssUrl: 'https://www.reddit.com/r/SaaS/new/.rss', shortCode: 'SAAS', category: 'builders' },
  { id: 'ch-010', name: 'r/SideProject', rssUrl: 'https://www.reddit.com/r/SideProject/new/.rss', shortCode: 'SP', category: 'builders' },
  { id: 'ch-011', name: 'Indie Hackers', rssUrl: 'https://www.indiehackers.com/feed.xml', shortCode: 'IH', category: 'builders' },
  // 전략적 인사이트
  { id: 'ch-012', name: 'Y Combinator Blog', rssUrl: 'https://www.ycombinator.com/blog/rss', shortCode: 'YC', category: 'insights' },
  { id: 'ch-013', name: 'First Round Review', rssUrl: 'https://review.firstround.com/feed.xml', shortCode: 'FR', category: 'insights' },
];
```

---

## 4. API 설계 (API Design)

### 4.1 엔드포인트 명세

#### Feeds API

| Method | Endpoint | 설명 | Request | Response |
|--------|----------|------|---------|----------|
| GET | `/api/feeds` | 피드 목록 | `?channel=&isRead=&page=&limit=&sort=` | `{ feeds, total, page }` |
| GET | `/api/feeds/:id` | 피드 상세 | - | `Feed` |
| PATCH | `/api/feeds/:id` | 피드 수정 | `{ isRead?, isBookmarked? }` | `Feed` |
| DELETE | `/api/feeds/:id` | 피드 삭제 | - | `{ success }` |

#### Ideas API

| Method | Endpoint | 설명 | Request | Response |
|--------|----------|------|---------|----------|
| GET | `/api/ideas` | 아이디어 목록 | `?stage=&page=&limit=` | `{ ideas, total, page }` |
| POST | `/api/ideas` | 아이디어 생성 | `CreateIdeaDTO` | `Idea` |
| GET | `/api/ideas/:id` | 아이디어 상세 | - | `Idea` |
| PATCH | `/api/ideas/:id` | 아이디어 수정 | `UpdateIdeaDTO` | `Idea` |
| DELETE | `/api/ideas/:id` | 아이디어 삭제 | - | `{ success }` |

#### Sync API

| Method | Endpoint | 설명 | Request | Response |
|--------|----------|------|---------|----------|
| POST | `/api/sync` | 수동 동기화 | `{ channelIds?: string[] }` | `{ collected, errors }` |
| GET | `/api/sync/status` | 동기화 상태 | - | `{ lastSync, status }` |

#### Channels API

| Method | Endpoint | 설명 | Request | Response |
|--------|----------|------|---------|----------|
| GET | `/api/channels` | 채널 목록 | - | `Channel[]` |
| PATCH | `/api/channels/:id` | 채널 수정 | `{ isActive? }` | `Channel` |

#### Export API

| Method | Endpoint | 설명 | Request | Response |
|--------|----------|------|---------|----------|
| GET | `/api/export` | 데이터 내보내기 | `?format=json|csv&type=feeds|ideas` | File |

### 4.2 DTO 정의

```typescript
// src/types/dto.ts

// Feed
export interface FeedListQuery {
  channel?: string;
  isRead?: boolean;
  isBookmarked?: boolean;
  hasNeedKeyword?: boolean;
  page?: number;
  limit?: number;
  sort?: 'newest' | 'oldest' | 'priority';
}

export interface FeedListResponse {
  feeds: Feed[];
  total: number;
  page: number;
  totalPages: number;
}

// Idea
export interface CreateIdeaDTO {
  feedId?: string;
  problem: string;
  currentSolution?: string;
  moneyEvidence?: string;
  opportunity?: string;
  oneLineIdea: string;
  stage?: IdeaStage;
  priority?: number;
  tags?: string[];
}

export interface UpdateIdeaDTO {
  problem?: string;
  currentSolution?: string;
  moneyEvidence?: string;
  opportunity?: string;
  oneLineIdea?: string;
  stage?: IdeaStage;
  priority?: number;
  notes?: string;
  nextAction?: string;
  dueDate?: string;
  tags?: string[];
}

export type IdeaStage = 'collected' | 'reviewing' | 'promising' | 'building';
```

---

## 5. 핵심 서비스 설계 (Core Services)

### 5.1 RSS Collector Service

```typescript
// src/lib/services/rss.collector.ts

import Parser from 'rss-parser';

interface CollectResult {
  channelId: string;
  success: boolean;
  collected: number;
  duplicates: number;
  error?: string;
}

export class RSSCollector {
  private parser: Parser;

  constructor() {
    this.parser = new Parser({
      timeout: 10000,
      headers: {
        'User-Agent': 'Product-Ideation-Bot/1.0'
      }
    });
  }

  async collectFromChannel(channel: Channel): Promise<CollectResult> {
    try {
      const feed = await this.parser.parseURL(channel.rssUrl);

      let collected = 0;
      let duplicates = 0;

      for (const item of feed.items) {
        const exists = await this.feedExists(item.link);
        if (exists) {
          duplicates++;
          continue;
        }

        await this.saveFeed({
          channelId: channel.id,
          title: item.title || '',
          link: item.link || '',
          content: item.content || item.contentSnippet || '',
          author: item.creator || item.author,
          publishedAt: item.pubDate,
          ...this.analyzeKeywords(item.title + ' ' + item.content)
        });

        collected++;
      }

      return { channelId: channel.id, success: true, collected, duplicates };
    } catch (error) {
      return {
        channelId: channel.id,
        success: false,
        collected: 0,
        duplicates: 0,
        error: error.message
      };
    }
  }

  async collectAll(): Promise<CollectResult[]> {
    const channels = await this.getActiveChannels();
    const results: CollectResult[] = [];

    // 순차 실행 (Rate Limiting 방지)
    for (const channel of channels) {
      const result = await this.collectFromChannel(channel);
      results.push(result);

      // 채널 간 500ms 딜레이
      await this.delay(500);
    }

    return results;
  }

  private analyzeKeywords(text: string): KeywordAnalysis {
    // 스마트 필터에서 처리
    return SmartFilter.analyze(text);
  }
}
```

### 5.2 Smart Filter Service

```typescript
// src/lib/utils/smart-filter.ts

// 니즈 키워드 (수익화 신호)
const NEED_KEYWORDS = [
  'i need', 'i want', 'i wish', "i'd pay", 'looking for',
  'frustrated with', 'anyone built', 'does anyone know',
  'how do i', 'is there a', 'why isn\'t there',
  'would pay for', 'shut up and take my money',
  'please make', 'someone should build'
];

// 돈 관련 키워드
const MONEY_KEYWORDS = [
  '$', 'dollar', 'pay', 'paid', 'price', 'cost',
  'subscription', 'saas', 'revenue', 'mrr', 'arr',
  'profitable', 'monetize', 'business', 'customer'
];

export interface KeywordAnalysis {
  hasNeedKeyword: boolean;
  hasMoneyKeyword: boolean;
  priorityScore: number;
  detectedKeywords: string[];
}

export class SmartFilter {
  static analyze(text: string): KeywordAnalysis {
    const lowerText = text.toLowerCase();
    const detectedKeywords: string[] = [];

    // 니즈 키워드 검사
    const hasNeedKeyword = NEED_KEYWORDS.some(kw => {
      if (lowerText.includes(kw)) {
        detectedKeywords.push(kw);
        return true;
      }
      return false;
    });

    // 돈 키워드 검사
    const hasMoneyKeyword = MONEY_KEYWORDS.some(kw => {
      if (lowerText.includes(kw)) {
        detectedKeywords.push(kw);
        return true;
      }
      return false;
    });

    // 우선순위 점수 계산 (0-10)
    let priorityScore = 0;
    if (hasNeedKeyword) priorityScore += 5;
    if (hasMoneyKeyword) priorityScore += 3;
    priorityScore += Math.min(detectedKeywords.length, 2);  // 최대 +2

    return {
      hasNeedKeyword,
      hasMoneyKeyword,
      priorityScore: Math.min(priorityScore, 10),
      detectedKeywords: JSON.stringify(detectedKeywords)
    };
  }

  static sortByPriority(feeds: Feed[]): Feed[] {
    return feeds.sort((a, b) => {
      // 1. 우선순위 점수
      if (b.priorityScore !== a.priorityScore) {
        return b.priorityScore - a.priorityScore;
      }
      // 2. 최신순
      return new Date(b.collectedAt).getTime() - new Date(a.collectedAt).getTime();
    });
  }
}
```

---

## 6. UI 컴포넌트 설계 (UI Components)

### 6.1 페이지 구조

```
┌─────────────────────────────────────────────────────────────────┐
│  Header                                              [Sync] [⚙] │
├─────────────────────────────────────────────────────────────────┤
│  ┌────────┐                                                     │
│  │        │  ┌───────────────────────────────────────────────┐  │
│  │ Sidebar│  │ Main Content Area                             │  │
│  │        │  │                                               │  │
│  │ Feeds  │  │  [Filter Bar]                                 │  │
│  │ Ideas  │  │                                               │  │
│  │ ─────  │  │  [Content List / Grid]                        │  │
│  │ Stats  │  │                                               │  │
│  │        │  │                                               │  │
│  └────────┘  └───────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

### 6.2 주요 컴포넌트 명세

#### FeedCard 컴포넌트

```typescript
// src/components/feeds/FeedCard.tsx

interface FeedCardProps {
  feed: Feed;
  onRead: (id: string) => void;
  onBookmark: (id: string) => void;
  onCreateIdea: (feed: Feed) => void;
}

/*
┌─────────────────────────────────────────────────────────────┐
│ [SMT] ⭐ 8.5                                    ☐ 📌 [+Idea] │
├─────────────────────────────────────────────────────────────┤
│ I need an app that helps me track my daily habits...        │
│                                                             │
│ 🏷️ [i need] [track] [app]                                   │
│                                                             │
│ 📅 2026-02-06 14:30  •  r/SomebodyMakeThis                  │
└─────────────────────────────────────────────────────────────┘
*/
```

#### IdeaForm 컴포넌트

```typescript
// src/components/ideas/IdeaForm.tsx

interface IdeaFormProps {
  sourceFeed?: Feed;
  existingIdea?: Idea;
  onSubmit: (data: CreateIdeaDTO | UpdateIdeaDTO) => void;
  onCancel: () => void;
}

/*
Form Fields:
- problem* (textarea): 문제 정의
- currentSolution (textarea): 현재 해결책
- moneyEvidence (textarea): 돈의 증거
- opportunity (textarea): 기회
- oneLineIdea* (input): 한 줄 아이디어
- stage (select): 파이프라인 단계
- priority (slider): 우선순위 1-5
- tags (tag input): 태그
*/
```

#### FeedFilter 컴포넌트

```typescript
// src/components/feeds/FeedFilter.tsx

interface FilterState {
  channels: string[];        // 선택된 채널
  categories: string[];      // 선택된 카테고리
  isRead: boolean | null;    // 읽음 여부
  hasNeedKeyword: boolean;   // 니즈 키워드 있음
  dateRange: DateRange;      // 날짜 범위
  sortBy: 'newest' | 'oldest' | 'priority';
}

/*
┌─────────────────────────────────────────────────────────────┐
│ Channel: [All ▼]  Category: [All ▼]  [☐ Unread] [☑ Needs]   │
│ Sort: [Priority ▼]                              [🔄 Reset]  │
└─────────────────────────────────────────────────────────────┘
*/
```

---

## 7. 상태 관리 (State Management)

### 7.1 Zustand Store

```typescript
// src/store/feedStore.ts

import { create } from 'zustand';

interface FeedState {
  feeds: Feed[];
  total: number;
  page: number;
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchFeeds: (query: FeedListQuery) => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  toggleBookmark: (id: string) => Promise<void>;
  setPage: (page: number) => void;
}

export const useFeedStore = create<FeedState>((set, get) => ({
  feeds: [],
  total: 0,
  page: 1,
  isLoading: false,
  error: null,

  fetchFeeds: async (query) => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch(`/api/feeds?${new URLSearchParams(query)}`);
      const data = await response.json();
      set({ feeds: data.feeds, total: data.total, page: data.page });
    } catch (error) {
      set({ error: error.message });
    } finally {
      set({ isLoading: false });
    }
  },

  markAsRead: async (id) => {
    await fetch(`/api/feeds/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ isRead: true })
    });
    set(state => ({
      feeds: state.feeds.map(f => f.id === id ? { ...f, isRead: true } : f)
    }));
  },

  toggleBookmark: async (id) => {
    const feed = get().feeds.find(f => f.id === id);
    await fetch(`/api/feeds/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ isBookmarked: !feed?.isBookmarked })
    });
    set(state => ({
      feeds: state.feeds.map(f =>
        f.id === id ? { ...f, isBookmarked: !f.isBookmarked } : f
      )
    }));
  },

  setPage: (page) => set({ page })
}));
```

### 7.2 Filter Store

```typescript
// src/store/filterStore.ts

interface FilterState {
  filters: FilterState;
  setFilter: (key: keyof FilterState, value: any) => void;
  resetFilters: () => void;
}

const defaultFilters: FilterState = {
  channels: [],
  categories: [],
  isRead: null,
  hasNeedKeyword: false,
  dateRange: { from: null, to: null },
  sortBy: 'priority'
};

export const useFilterStore = create<FilterState>((set) => ({
  filters: defaultFilters,
  setFilter: (key, value) =>
    set(state => ({ filters: { ...state.filters, [key]: value } })),
  resetFilters: () => set({ filters: defaultFilters })
}));
```

---

## 8. 구현 순서 (Implementation Order)

### Phase 1: 프로젝트 기반 (Day 1)

| # | 작업 | 파일 | 의존성 |
|---|------|------|--------|
| 1.1 | Next.js 프로젝트 생성 | - | - |
| 1.2 | 의존성 설치 | package.json | 1.1 |
| 1.3 | Tailwind + shadcn/ui 설정 | tailwind.config.ts | 1.2 |
| 1.4 | Drizzle 설정 | drizzle.config.ts | 1.2 |
| 1.5 | DB 스키마 정의 | src/lib/db/schema.ts | 1.4 |
| 1.6 | 초기 마이그레이션 | migrations/ | 1.5 |
| 1.7 | Seed 데이터 | src/lib/db/seed.ts | 1.6 |

### Phase 2: 백엔드 API (Day 2)

| # | 작업 | 파일 | 의존성 |
|---|------|------|--------|
| 2.1 | RSS Collector | src/lib/services/rss.collector.ts | 1.5 |
| 2.2 | Smart Filter | src/lib/utils/smart-filter.ts | - |
| 2.3 | Feed Service | src/lib/services/feed.service.ts | 1.5, 2.2 |
| 2.4 | Idea Service | src/lib/services/idea.service.ts | 1.5 |
| 2.5 | Feeds API | src/app/api/feeds/ | 2.3 |
| 2.6 | Ideas API | src/app/api/ideas/ | 2.4 |
| 2.7 | Sync API | src/app/api/sync/ | 2.1 |
| 2.8 | Channels API | src/app/api/channels/ | 1.5 |

### Phase 3: 프론트엔드 (Day 3-4)

| # | 작업 | 파일 | 의존성 |
|---|------|------|--------|
| 3.1 | 레이아웃 | src/app/layout.tsx | 1.3 |
| 3.2 | Zustand Stores | src/store/ | - |
| 3.3 | FeedCard | src/components/feeds/FeedCard.tsx | 1.3 |
| 3.4 | FeedList | src/components/feeds/FeedList.tsx | 3.3 |
| 3.5 | FeedFilter | src/components/feeds/FeedFilter.tsx | 3.2 |
| 3.6 | 대시보드 페이지 | src/app/page.tsx | 3.4, 3.5 |
| 3.7 | IdeaForm | src/components/ideas/IdeaForm.tsx | 1.3 |
| 3.8 | IdeaModal | src/components/ideas/IdeaModal.tsx | 3.7 |
| 3.9 | IdeaList | src/components/ideas/IdeaList.tsx | 3.7 |
| 3.10 | Ideas 페이지 | src/app/ideas/page.tsx | 3.9 |

### Phase 4: 통합 및 테스트 (Day 5)

| # | 작업 | 파일 | 의존성 |
|---|------|------|--------|
| 4.1 | SyncButton 통합 | src/components/dashboard/SyncButton.tsx | 2.7 |
| 4.2 | 설정 페이지 | src/app/settings/page.tsx | 2.8 |
| 4.3 | Export API | src/app/api/export/ | 2.3, 2.4 |
| 4.4 | 에러 핸들링 | 전역 | - |
| 4.5 | 로딩 상태 | 컴포넌트 | - |
| 4.6 | E2E 테스트 | - | 전체 |

---

## 9. 의존성 목록 (Dependencies)

```json
{
  "dependencies": {
    "next": "^15.0.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "drizzle-orm": "^0.34.0",
    "better-sqlite3": "^11.0.0",
    "rss-parser": "^3.13.0",
    "zustand": "^4.5.0",
    "react-hook-form": "^7.53.0",
    "zod": "^3.23.0",
    "@hookform/resolvers": "^3.9.0",
    "date-fns": "^3.6.0",
    "uuid": "^10.0.0"
  },
  "devDependencies": {
    "typescript": "^5.6.0",
    "tailwindcss": "^3.4.0",
    "drizzle-kit": "^0.25.0",
    "@types/better-sqlite3": "^7.6.0",
    "@types/uuid": "^10.0.0"
  }
}
```

---

## 10. 설정 파일 (Configuration)

### 10.1 환경변수

```env
# .env.local

# Database
DATABASE_PATH=./data/ideation.db

# App
NEXT_PUBLIC_APP_NAME=Product Ideation
NEXT_PUBLIC_APP_VERSION=1.0.0

# RSS Collection
RSS_TIMEOUT_MS=10000
RSS_DELAY_MS=500
```

### 10.2 Drizzle 설정

```typescript
// drizzle.config.ts

import type { Config } from 'drizzle-kit';

export default {
  schema: './src/lib/db/schema.ts',
  out: './src/lib/db/migrations',
  driver: 'better-sqlite',
  dbCredentials: {
    url: process.env.DATABASE_PATH || './data/ideation.db'
  }
} satisfies Config;
```

---

## 11. 검증 체크리스트 (Validation Checklist)

### Plan 요구사항 매핑

| Plan FR | Design 섹션 | 구현 상태 |
|---------|-------------|-----------|
| FR-01: 자동 수집 | 5.1 RSS Collector | ✅ 설계됨 |
| FR-02: 데이터 저장 | 3.1 DB Schema | ✅ 설계됨 |
| FR-03: 아이디어 기록 | 3.1 ideas table, 6.2 IdeaForm | ✅ 설계됨 |
| FR-04: 뷰어/대시보드 | 6.1, 6.2 UI Components | ✅ 설계됨 |
| FR-06: 스마트 필터링 | 5.2 Smart Filter | ✅ 설계됨 |
| FR-08: 파이프라인 | 3.1 ideas.stage | ✅ 설계됨 |
| FR-11: 내보내기 | 4.1 Export API | ✅ 설계됨 |
| NFR-01: 로컬 실행 | 전체 아키텍처 | ✅ 설계됨 |
| NFR-02: 간단한 설치 | 1.2 기술 스택 | ✅ 설계됨 |
| NFR-03: 데이터 소유권 | SQLite 로컬 DB | ✅ 설계됨 |

---

## Appendix: 타입 정의

```typescript
// src/types/index.ts

export interface Channel {
  id: string;
  name: string;
  rssUrl: string;
  shortCode: string;
  category: 'direct_needs' | 'trends' | 'builders' | 'insights';
  isActive: boolean;
  lastFetchedAt: string | null;
  fetchStatus: 'success' | 'failed' | 'pending' | null;
  createdAt: string;
  updatedAt: string;
}

export interface Feed {
  id: string;
  channelId: string;
  title: string;
  link: string;
  content: string | null;
  summary: string | null;
  author: string | null;
  publishedAt: string | null;
  collectedAt: string;
  isRead: boolean;
  isBookmarked: boolean;
  hasNeedKeyword: boolean;
  hasMoneyKeyword: boolean;
  priorityScore: number;
  detectedKeywords: string[];
  createdAt: string;
  updatedAt: string;
  // Relations
  channel?: Channel;
}

export interface Idea {
  id: string;
  feedId: string | null;
  problem: string;
  currentSolution: string | null;
  moneyEvidence: string | null;
  opportunity: string | null;
  oneLineIdea: string;
  stage: 'collected' | 'reviewing' | 'promising' | 'building';
  priority: number;
  notes: string | null;
  nextAction: string | null;
  dueDate: string | null;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  // Relations
  feed?: Feed;
}
```
