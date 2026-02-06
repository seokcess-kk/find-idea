# AI Analysis Feature - Design Document

> 버전: 1.0.0
> 작성일: 2026-02-06
> Plan 참조: docs/01-plan/features/ai-analysis.plan.md
> Parent: find-idea (v1.0)
> PDCA Phase: Design

---

## 1. 시스템 아키텍처 (System Architecture)

### 1.1 전체 구조

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         AI Analysis Feature                             │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                      Presentation Layer                          │   │
│  │  ┌─────────────┐  ┌──────────────┐  ┌────────────────────────┐  │   │
│  │  │ FeedCard    │  │AnalysisPanel │  │  Settings/Ollama      │  │   │
│  │  │ (Modified)  │  │  (NEW)       │  │   Page (Modified)      │  │   │
│  │  └─────────────┘  └──────────────┘  └────────────────────────┘  │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                              │                                          │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                        API Layer                                 │   │
│  │  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  │   │
│  │  │ /api/analyze    │  │ /api/analyze    │  │ /api/settings   │  │   │
│  │  │   POST          │  │   /status GET   │  │   /ollama       │  │   │
│  │  └─────────────────┘  └─────────────────┘  └─────────────────┘  │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                              │                                          │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                      Service Layer                               │   │
│  │  ┌───────────────────────────────────────────────────────────┐  │   │
│  │  │                   OllamaService (NEW)                      │  │   │
│  │  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────────┐   │  │   │
│  │  │  │generateSum- │  │extractKey-  │  │evaluatePoten-   │   │  │   │
│  │  │  │mary()       │  │words()      │  │tial()           │   │  │   │
│  │  │  └─────────────┘  └─────────────┘  └─────────────────┘   │  │   │
│  │  └───────────────────────────────────────────────────────────┘  │   │
│  │  ┌───────────────────────────────────────────────────────────┐  │   │
│  │  │                 AnalysisService (NEW)                      │  │   │
│  │  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────────┐   │  │   │
│  │  │  │analyzeFeed()│  │getAnalysis()│  │batchAnalyze()   │   │  │   │
│  │  │  └─────────────┘  └─────────────┘  └─────────────────┘   │  │   │
│  │  └───────────────────────────────────────────────────────────┘  │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                              │                                          │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                       Data Layer                                 │   │
│  │  ┌───────────────────────┐    ┌──────────────────────────────┐  │   │
│  │  │   feed_analysis       │    │   settings (Extended)        │  │   │
│  │  │   (NEW Table)         │    │   + ollama_model             │  │   │
│  │  └───────────────────────┘    │   + ollama_url               │  │   │
│  │                               └──────────────────────────────┘  │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                         Ollama (External)                               │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │  http://localhost:11434                                          │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐              │   │
│  │  │ llama3.2    │  │ mistral     │  │ gemma2      │  ...         │   │
│  │  └─────────────┘  └─────────────┘  └─────────────┘              │   │
│  └─────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────┘
```

### 1.2 Ollama 통신 흐름

```
┌────────────┐         ┌──────────────┐         ┌─────────────┐
│  FeedCard  │ ──(1)─► │ /api/analyze │ ──(2)─► │   Ollama    │
│  "분석"    │         │              │         │  Service    │
└────────────┘         └──────────────┘         └──────┬──────┘
                              │                        │
                              │                   (3) HTTP
                              │                        ▼
                              │                 ┌─────────────┐
                              │                 │   Ollama    │
                              │                 │ localhost   │
                              │                 │   :11434    │
                              │                 └──────┬──────┘
                              │                        │
                              │◄───────(4)─────────────┘
                              │     JSON Response
                              ▼
                       ┌──────────────┐
                       │ feed_analysis│
                       │   INSERT     │
                       └──────────────┘
```

---

## 2. 디렉토리 구조 (Directory Structure)

### 2.1 신규/수정 파일 목록

```
src/
├── app/
│   └── api/
│       └── analyze/
│           ├── route.ts              # NEW: POST /api/analyze
│           ├── status/
│           │   └── route.ts          # NEW: GET /api/analyze/status
│           └── batch/
│               └── route.ts          # NEW: POST /api/analyze/batch (P2)
│
├── components/
│   └── feeds/
│       ├── FeedCard.tsx              # MODIFY: 분석 버튼, 결과 표시 추가
│       └── AnalysisPanel.tsx         # NEW: 분석 결과 표시 패널
│
├── lib/
│   ├── db/
│   │   └── schema.ts                 # MODIFY: feed_analysis 테이블 추가
│   │
│   └── services/
│       ├── ollama.service.ts         # NEW: Ollama API 클라이언트
│       └── analysis.service.ts       # NEW: 분석 비즈니스 로직
│
├── hooks/
│   └── useAnalysis.ts                # NEW: 분석 관련 훅
│
└── types/
    └── index.ts                      # MODIFY: Analysis 타입 추가
```

---

## 3. 데이터베이스 스키마 (Database Schema)

### 3.1 신규 테이블: feed_analysis

```typescript
// src/lib/db/schema.ts (추가)

export const feedAnalysis = sqliteTable('feed_analysis', {
  id: text('id').primaryKey(),
  feedId: text('feed_id').notNull().references(() => feeds.id).unique(),

  // AI 분석 결과
  summary: text('summary'),                    // 1-2문장 요약
  keywords: text('keywords'),                  // JSON 배열: ["keyword1", "keyword2", ...]
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

// 타입 추론
export type FeedAnalysis = typeof feedAnalysis.$inferSelect;
export type NewFeedAnalysis = typeof feedAnalysis.$inferInsert;
```

### 3.2 설정 테이블 확장 (선택적)

현재 프로젝트에 settings 테이블이 없으므로, 환경 변수로 대체합니다.

```env
# .env.local (추가)
OLLAMA_URL=http://localhost:11434
OLLAMA_MODEL=llama3.2
OLLAMA_TIMEOUT=30000
```

---

## 4. API 설계 (API Design)

### 4.1 엔드포인트 명세

| Method | Endpoint | 설명 | Priority |
|--------|----------|------|:--------:|
| POST | `/api/analyze` | 단일 피드 분석 | P0 |
| GET | `/api/analyze/status` | Ollama 연결 상태 확인 | P0 |
| POST | `/api/analyze/batch` | 다중 피드 배치 분석 | P2 |

### 4.2 API 상세

#### POST /api/analyze

**Request:**
```typescript
interface AnalyzeRequest {
  feedId: string;
  options?: {
    includeSummary?: boolean;    // default: true
    includeKeywords?: boolean;   // default: true
    includePotential?: boolean;  // default: true
  };
}
```

**Response:**
```typescript
interface AnalyzeResponse {
  success: boolean;
  analysis?: {
    id: string;
    feedId: string;
    summary: string | null;
    keywords: string[];
    potentialScore: number | null;
    potentialReason: string | null;
    modelUsed: string;
    analyzedAt: string;
  };
  error?: string;
}
```

**Error Cases:**
| Status | Error | 설명 |
|--------|-------|------|
| 400 | INVALID_FEED_ID | feedId가 유효하지 않음 |
| 404 | FEED_NOT_FOUND | 피드를 찾을 수 없음 |
| 503 | OLLAMA_UNAVAILABLE | Ollama 서버 연결 실패 |
| 500 | ANALYSIS_FAILED | 분석 중 오류 발생 |

#### GET /api/analyze/status

**Response:**
```typescript
interface StatusResponse {
  available: boolean;
  ollamaUrl: string;
  model: string;
  models?: string[];           // 사용 가능한 모델 목록
  error?: string;
}
```

---

## 5. 서비스 설계 (Service Design)

### 5.1 OllamaService

```typescript
// src/lib/services/ollama.service.ts

interface OllamaConfig {
  baseUrl: string;    // default: http://localhost:11434
  model: string;      // default: llama3.2
  timeout: number;    // default: 30000ms
}

interface GenerateResponse {
  response: string;
  model: string;
  done: boolean;
}

export class OllamaService {
  private config: OllamaConfig;

  constructor(config?: Partial<OllamaConfig>);

  // 연결 확인
  async checkConnection(): Promise<boolean>;

  // 사용 가능한 모델 목록
  async listModels(): Promise<string[]>;

  // 텍스트 생성 (기본)
  async generate(prompt: string): Promise<string>;

  // 요약 생성
  async generateSummary(feed: { title: string; content: string; channel?: string }): Promise<string>;

  // 키워드 추출
  async extractKeywords(content: string): Promise<string[]>;

  // 잠재력 평가
  async evaluatePotential(content: string): Promise<{ score: number; reason: string }>;
}
```

### 5.2 AnalysisService

```typescript
// src/lib/services/analysis.service.ts

export class AnalysisService {
  private ollamaService: OllamaService;

  constructor();

  // 단일 피드 분석
  async analyzeFeed(feedId: string, options?: AnalyzeOptions): Promise<FeedAnalysis>;

  // 분석 결과 조회
  async getAnalysis(feedId: string): Promise<FeedAnalysis | null>;

  // 배치 분석 (P2)
  async batchAnalyze(feedIds: string[]): Promise<BatchAnalysisResult>;

  // 분석 상태 확인
  async getStatus(): Promise<AnalysisStatus>;

  // 분석 결과 삭제
  async deleteAnalysis(feedId: string): Promise<void>;
}
```

---

## 6. 프롬프트 설계 (Prompt Design)

### 6.1 요약 프롬프트

```typescript
const SUMMARY_PROMPT = `You are analyzing a post from {channel} about potential product ideas or problems.

Post Title: {title}
Post Content: {content}

Provide a concise 1-2 sentence summary in Korean focusing on:
- The core problem or need being expressed
- Any mentioned pain points or frustrations
- Potential market opportunity

Guidelines:
- Keep it under 100 characters
- Focus on actionable insights
- Use natural Korean

Summary:`;
```

### 6.2 키워드 추출 프롬프트

```typescript
const KEYWORDS_PROMPT = `Extract 3-5 key topics/keywords from this post.
Focus on: problems, tools, industries, user types, and pain points.

Post: {content}

Return ONLY a JSON array of keywords in English.
Example: ["automation", "small business", "invoicing", "time tracking"]

Keywords:`;
```

### 6.3 잠재력 평가 프롬프트

```typescript
const POTENTIAL_PROMPT = `Rate this post's potential as a product idea from 1-10.

Scoring criteria:
- Problem clarity (is the problem well-defined?)
- Market size hints (how many people might have this problem?)
- Willingness to pay signals (mentions of budget, current spending, desperation)
- Solution gap (are existing solutions inadequate?)

Post: {content}

Respond ONLY in JSON format:
{"score": N, "reason": "brief explanation in Korean (max 50 chars)"}

Response:`;
```

---

## 7. UI 컴포넌트 설계 (UI Components)

### 7.1 FeedCard 수정

```
┌─────────────────────────────────────────────────────────────────┐
│ [SMT] ⭐ 8.5                                   🔖 [🔍] [+Idea] │
├─────────────────────────────────────────────────────────────────┤
│ I need an app that helps me track my daily habits...            │
│                                                                 │
│ 🏷️ [i need] [track] [app]                                       │
│                                                                 │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ 🤖 AI Analysis                                    [Refresh] │ │
│ │ ─────────────────────────────────────────────────────────── │ │
│ │ 📝 습관 추적 앱 필요성 표현, 기존 앱 불만족                 │ │
│ │ 🏷️ habit-tracking, productivity, mobile-app                 │ │
│ │ ⭐ 7/10 - 명확한 니즈, 경쟁 시장 존재                       │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                 │
│ 📅 2026-02-06 14:30  🔗 r/SomebodyMakeThis                      │
└─────────────────────────────────────────────────────────────────┘
```

### 7.2 AnalysisPanel 컴포넌트

```typescript
// src/components/feeds/AnalysisPanel.tsx

interface AnalysisPanelProps {
  feedId: string;
  analysis: FeedAnalysis | null;
  isLoading: boolean;
  onAnalyze: () => void;
  onRefresh: () => void;
}

/*
상태별 표시:
1. analysis === null && !isLoading: "분석" 버튼 표시
2. isLoading: 스피너 + "분석 중..."
3. analysis.status === 'completed': 결과 표시
4. analysis.status === 'failed': 에러 메시지 + "재시도" 버튼
*/
```

### 7.3 UI 상태 다이어그램

```
[No Analysis] ──(Click Analyze)──► [Loading] ──(Success)──► [Show Results]
                                       │
                                       │ (Error)
                                       ▼
                                  [Show Error]
                                       │
                                       │ (Retry)
                                       ▼
                                  [Loading]
```

---

## 8. 상태 관리 (State Management)

### 8.1 useAnalysis Hook

```typescript
// src/hooks/useAnalysis.ts

interface UseAnalysisReturn {
  // 상태
  analysis: FeedAnalysis | null;
  isLoading: boolean;
  error: string | null;
  ollamaStatus: OllamaStatus | null;

  // 액션
  analyze: (feedId: string) => Promise<void>;
  refresh: (feedId: string) => Promise<void>;
  checkOllamaStatus: () => Promise<void>;
}

export function useAnalysis(feedId?: string): UseAnalysisReturn;
```

### 8.2 FeedStore 확장 (선택적)

```typescript
// src/store/feedStore.ts (확장)

interface FeedState {
  // ... 기존 상태

  // AI 분석 관련
  analysisCache: Map<string, FeedAnalysis>;

  // 액션
  setAnalysis: (feedId: string, analysis: FeedAnalysis) => void;
  clearAnalysisCache: () => void;
}
```

---

## 9. 에러 처리 및 Graceful Degradation

### 9.1 에러 시나리오

| 시나리오 | 처리 방법 |
|----------|-----------|
| Ollama 미설치/미실행 | 상태 확인 API로 감지, UI에 설치 가이드 링크 표시 |
| 네트워크 타임아웃 | 30초 타임아웃, 재시도 버튼 제공 |
| 모델 미설치 | 사용 가능한 모델 목록 표시, 설치 명령 안내 |
| 응답 파싱 실패 | 기본값 반환, 로그 기록 |
| Rate Limiting | 지수 백오프로 재시도 |

### 9.2 Graceful Degradation 전략

```typescript
// Ollama 미사용 시에도 앱 정상 동작
// AI 분석 기능만 비활성화

// FeedCard.tsx
{ollamaAvailable ? (
  <AnalysisPanel {...props} />
) : (
  <div className="text-gray-400 text-sm">
    AI 분석: Ollama 연결 필요
    <a href="https://ollama.ai" target="_blank">설치하기</a>
  </div>
)}
```

---

## 10. 구현 순서 (Implementation Order)

### Phase 1: 기반 구축 (P0)

| # | 작업 | 파일 | 의존성 |
|---|------|------|--------|
| 1.1 | feed_analysis 테이블 스키마 추가 | `src/lib/db/schema.ts` | - |
| 1.2 | 마이그레이션 실행 | `drizzle-kit` | 1.1 |
| 1.3 | Analysis 타입 정의 | `src/types/index.ts` | 1.1 |
| 1.4 | OllamaService 구현 | `src/lib/services/ollama.service.ts` | - |
| 1.5 | OllamaService 테스트 | - | 1.4 |

### Phase 2: API 구현 (P0)

| # | 작업 | 파일 | 의존성 |
|---|------|------|--------|
| 2.1 | AnalysisService 구현 | `src/lib/services/analysis.service.ts` | 1.4 |
| 2.2 | `/api/analyze/status` 엔드포인트 | `src/app/api/analyze/status/route.ts` | 1.4 |
| 2.3 | `/api/analyze` POST 엔드포인트 | `src/app/api/analyze/route.ts` | 2.1 |

### Phase 3: UI 구현 (P0/P1)

| # | 작업 | 파일 | 의존성 |
|---|------|------|--------|
| 3.1 | useAnalysis 훅 구현 | `src/hooks/useAnalysis.ts` | 2.3 |
| 3.2 | AnalysisPanel 컴포넌트 | `src/components/feeds/AnalysisPanel.tsx` | 3.1 |
| 3.3 | FeedCard 수정 | `src/components/feeds/FeedCard.tsx` | 3.2 |
| 3.4 | 설정 페이지 Ollama 상태 표시 | `src/app/settings/page.tsx` | 2.2 |

### Phase 4: 고급 기능 (P2)

| # | 작업 | 파일 | 의존성 |
|---|------|------|--------|
| 4.1 | 배치 분석 API | `src/app/api/analyze/batch/route.ts` | 2.1 |
| 4.2 | 분석 결과 필터링 | `src/components/feeds/FeedFilter.tsx` | 3.3 |

---

## 11. 의존성 (Dependencies)

### 11.1 추가 패키지

```json
{
  "dependencies": {
    // 추가 패키지 없음 - fetch API 사용
  }
}
```

### 11.2 외부 의존성

| 의존성 | 버전 | 설치 방법 |
|--------|------|-----------|
| Ollama | latest | https://ollama.ai |
| llama3.2 (모델) | - | `ollama pull llama3.2` |

---

## 12. 환경 설정 (Configuration)

### 12.1 환경 변수

```env
# .env.local (추가)

# Ollama Configuration
OLLAMA_URL=http://localhost:11434
OLLAMA_MODEL=llama3.2
OLLAMA_TIMEOUT=30000
```

### 12.2 설정 타입

```typescript
// src/lib/config/ollama.ts

export const ollamaConfig = {
  url: process.env.OLLAMA_URL || 'http://localhost:11434',
  model: process.env.OLLAMA_MODEL || 'llama3.2',
  timeout: parseInt(process.env.OLLAMA_TIMEOUT || '30000'),
};
```

---

## 13. 테스트 전략 (Testing Strategy)

### 13.1 단위 테스트

| 대상 | 테스트 항목 |
|------|-------------|
| OllamaService | 연결 확인, 응답 파싱, 에러 처리 |
| AnalysisService | CRUD 연산, 비즈니스 로직 |
| Prompts | 응답 포맷 검증 |

### 13.2 통합 테스트

| 시나리오 | 검증 항목 |
|----------|-----------|
| 정상 분석 흐름 | API → Service → DB → UI |
| Ollama 미연결 | Graceful degradation |
| 동시 분석 요청 | 중복 방지, 큐잉 |

---

## 14. 검증 체크리스트 (Validation Checklist)

### Plan 요구사항 매핑

| Plan FR | Design 섹션 | 구현 상태 |
|---------|-------------|-----------|
| FR-05-01: Ollama 연동 | 5.1 OllamaService | ✅ 설계됨 |
| FR-05-02: 피드 요약 | 6.1 SUMMARY_PROMPT | ✅ 설계됨 |
| FR-05-03: 키워드 추출 | 6.2 KEYWORDS_PROMPT | ✅ 설계됨 |
| FR-05-04: 잠재력 평가 | 6.3 POTENTIAL_PROMPT | ✅ 설계됨 |
| FR-05-05: 배치 분석 | 10 Phase 4 (P2) | ✅ 설계됨 |
| FR-05-06: 분석 결과 저장 | 3.1 feed_analysis | ✅ 설계됨 |
| FR-05-07: UI 표시 | 7.1, 7.2 컴포넌트 | ✅ 설계됨 |
| NFR-05-01: 로컬 실행 | 전체 아키텍처 | ✅ 설계됨 |
| NFR-05-02: 성능 30초 | 12.1 OLLAMA_TIMEOUT | ✅ 설계됨 |
| NFR-05-03: 에러 처리 | 9 Graceful Degradation | ✅ 설계됨 |
| NFR-05-04: 모델 선택 | 12.1 OLLAMA_MODEL | ✅ 설계됨 |

---

## Appendix A: 타입 정의

```typescript
// src/types/index.ts (추가)

export interface FeedAnalysis {
  id: string;
  feedId: string;
  summary: string | null;
  keywords: string[];           // 파싱된 배열
  potentialScore: number | null;
  potentialReason: string | null;
  modelUsed: string;
  status: 'pending' | 'analyzing' | 'completed' | 'failed';
  errorMessage: string | null;
  analyzedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface OllamaStatus {
  available: boolean;
  url: string;
  model: string;
  models: string[];
  error?: string;
}

export interface AnalyzeOptions {
  includeSummary?: boolean;
  includeKeywords?: boolean;
  includePotential?: boolean;
}

export interface AnalyzeResult {
  success: boolean;
  analysis?: FeedAnalysis;
  error?: string;
}
```

## Appendix B: Ollama API 레퍼런스

```typescript
// Ollama REST API

// 1. Generate (텍스트 생성)
// POST /api/generate
{
  "model": "llama3.2",
  "prompt": "...",
  "stream": false
}
// Response: { "response": "...", "done": true }

// 2. List Models (모델 목록)
// GET /api/tags
// Response: { "models": [{ "name": "llama3.2", ... }] }

// 3. Check Health
// GET /
// Response: "Ollama is running"
```

---

**작성일**: 2026-02-06
**상태**: Design Complete
**다음 단계**: `/pdca do ai-analysis` - 구현 시작
