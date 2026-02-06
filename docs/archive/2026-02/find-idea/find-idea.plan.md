# Product Ideation System - Plan Document

> 버전: 2.1.0
> 작성일: 2026-02-06
> 갱신일: 2026-02-06
> PDCA Phase: Plan

---

## 1. 개요 (Overview)

### 1.1 프로젝트 목적
매일 글로벌 채널에서 수익화 가능한 문제/니즈를 자동 수집하고, 이를 기반으로 프로덕트 아이디어를 도출하는 **개인용 시스템** 구축

### 1.2 핵심 가치
- **시간 절약**: 13개 채널을 수동으로 확인할 필요 없음
- **기회 포착**: 트렌드와 니즈를 빠르게 파악
- **체계적 기록**: 아이디어를 구조화된 형태로 저장

### 1.3 대상 사용자
- 1인 개발자 / 인디해커
- 사이드 프로젝트 아이디어를 찾는 개인

---

## 2. 수집 채널 (Data Sources)

> 총 13개 채널 - 목적별 4개 카테고리로 구분

### 2.1 직접적 니즈 표현 (Direct Needs) ⭐

| # | 채널명 | RSS 주소 | 특징 | 멤버/규모 |
|---|--------|----------|------|-----------|
| 1 | Reddit r/SomebodyMakeThis | https://www.reddit.com/r/SomebodyMakeThis/new/.rss | "I need..." 형태의 직접적 요청 | 81K |
| 2 | Reddit r/AppIdeas | https://www.reddit.com/r/AppIdeas/new/.rss | 앱 아이디어 제안 | 활성 |
| 3 | Hacker News Ask HN | https://hnrss.org/ask | 개발자 커뮤니티 질문/토론 | - |

### 2.2 트렌드/경쟁 분석 (Trends & Competition)

| # | 채널명 | RSS 주소 | 특징 | 멤버/규모 |
|---|--------|----------|------|-----------|
| 4 | Product Hunt | https://www.producthunt.com/feed | 신규 프로덕트 런칭 | Top 플랫폼 |
| 5 | BetaList | https://betalist.com/feed | 런칭 전 스타트업 발견 | - |
| 6 | Hacker News Show HN | https://hnrss.org/show | 개발자 프로젝트 쇼케이스 | - |

### 2.3 빌더 커뮤니티 (Builder Communities)

| # | 채널명 | RSS 주소 | 특징 | 멤버/규모 |
|---|--------|----------|------|-----------|
| 7 | Reddit r/startups | https://www.reddit.com/r/startups/new/.rss | PMF, 스케일링 논의 | 1.8M |
| 8 | Reddit r/Entrepreneur | https://www.reddit.com/r/Entrepreneur/new/.rss | 가장 큰 창업 커뮤니티 | 4.7M |
| 9 | Reddit r/SaaS | https://www.reddit.com/r/SaaS/new/.rss | SaaS 수익화 집중 | 260K |
| 10 | Reddit r/SideProject | https://www.reddit.com/r/SideProject/new/.rss | 사이드 프로젝트 공유 | 활성 |
| 11 | Indie Hackers | https://www.indiehackers.com/feed.xml | 인디해커 커뮤니티 | - |

### 2.4 전략적 인사이트 (Strategic Insights)

| # | 채널명 | RSS 주소 | 특징 | 멤버/규모 |
|---|--------|----------|------|-----------|
| 12 | Y Combinator Blog | https://www.ycombinator.com/blog/rss | YC 트렌드, RFS 아이디어 | Top VC |
| 13 | First Round Review | https://review.firstround.com/feed.xml | VC 관점 스타트업 인사이트 | Top VC |

### 2.5 채널 우선순위

```
수익화 니즈 발견 기여도:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
r/SomebodyMakeThis  ████████████████████████████  ⭐ 최고
r/AppIdeas          ██████████████████████████
Ask HN              ████████████████████████
r/startups          ██████████████████████
r/SaaS              ████████████████████
Product Hunt        ██████████████████            트렌드 파악
r/Entrepreneur      ████████████████
BetaList            ██████████████
r/SideProject       ████████████
Indie Hackers       ██████████
Show HN             ████████                      경쟁 분석
YC Blog             ██████                        전략적 인사이트
First Round         ████
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## 3. 기능 요구사항 (Functional Requirements)

### FR-01: 자동 수집 (Auto Collection)
- **설명**: 13개 RSS 피드에서 매일 새 게시물 자동 수집
- **상세**:
  - 스케줄러를 통한 일일 자동 실행 (또는 수동 트리거)
  - RSS 파싱하여 새 항목 추출
  - 중복 제거 (URL 기반)
  - 채널별 수집 상태 관리 (실패 시 재시도)
- **우선순위**: 필수 (P0)

### FR-02: 데이터 저장 (Data Storage)
- **설명**: 수집된 항목을 구조화하여 저장
- **저장 필드**:
  | 필드 | 타입 | 설명 |
  |------|------|------|
  | id | string | 고유 식별자 (UUID) |
  | title | string | 게시물 제목 |
  | link | string | 원문 링크 |
  | channel | string | 채널명 |
  | collectedAt | datetime | 수집 일시 |
  | summary | string? | 요약 (선택) |
  | isRead | boolean | 읽음 여부 |
- **우선순위**: 필수 (P0)

### FR-03: 아이디어 기록 (Idea Recording)
- **설명**: 수집된 피드에서 아이디어를 구조화하여 기록
- **템플릿 형식**:
  ```
  날짜:
  소스:
  문제:
  현재 해결책:
  돈의 증거:
  기회:
  한 줄 아이디어:
  ```
- **저장 필드**:
  | 필드 | 타입 | 설명 |
  |------|------|------|
  | id | string | 고유 식별자 |
  | date | date | 기록 날짜 |
  | sourceId | string | 원본 피드 ID (FK) |
  | problem | string | 문제 정의 |
  | currentSolution | string | 현재 해결책 |
  | moneyEvidence | string | 돈의 증거 |
  | opportunity | string | 기회 분석 |
  | oneLineIdea | string | 한 줄 아이디어 |
- **우선순위**: 필수 (P0)

### FR-04: 뷰어/대시보드 (Viewer/Dashboard)
- **설명**: 수집된 피드와 아이디어를 한눈에 확인
- **기능**:
  - 피드 목록 조회 (채널별 필터링)
  - 피드 상세 보기
  - 아이디어 기록 추가/수정
  - 아이디어 목록 조회
- **우선순위**: 필수 (P0)

---

## 4. 비기능 요구사항 (Non-Functional Requirements)

### NFR-01: 로컬 실행
- 외부 서버 의존성 최소화
- 개인 PC에서 독립 실행 가능

### NFR-02: 간단한 설치
- 복잡한 설정 없이 빠른 시작
- Node.js 또는 Python 단일 런타임

### NFR-03: 데이터 소유권
- 모든 데이터는 로컬에 저장
- 외부 서비스로 데이터 전송 없음

---

## 5. 기술 스택 제안 (Tech Stack Proposal)

### Option A: Next.js + SQLite (권장)
```
┌─────────────────────────────────────┐
│           Next.js App               │
│  ┌─────────────┐ ┌───────────────┐  │
│  │   Dashboard │ │   API Routes  │  │
│  │   (React)   │ │  (Server)     │  │
│  └─────────────┘ └───────────────┘  │
│            │            │           │
│            └────┬───────┘           │
│                 ▼                   │
│         ┌─────────────┐             │
│         │   SQLite    │             │
│         │  (better-   │             │
│         │   sqlite3)  │             │
│         └─────────────┘             │
└─────────────────────────────────────┘
```

**장점**:
- 풀스택 단일 프레임워크
- 파일 기반 DB로 백업 용이
- 타입 안정성 (TypeScript)

**스택 상세**:
| 영역 | 기술 |
|------|------|
| Frontend | Next.js 15 (App Router), React, Tailwind CSS |
| Backend | Next.js API Routes, Server Actions |
| Database | SQLite (better-sqlite3) |
| ORM | Drizzle ORM (경량) |
| RSS Parser | rss-parser |
| Scheduler | node-cron (선택) |

### Option B: Python + Streamlit
```
┌─────────────────────────────────────┐
│         Streamlit App               │
│  ┌─────────────────────────────┐    │
│  │      UI Components          │    │
│  └─────────────────────────────┘    │
│                 │                   │
│                 ▼                   │
│         ┌─────────────┐             │
│         │   SQLite    │             │
│         └─────────────┘             │
└─────────────────────────────────────┘
```

**장점**:
- 빠른 프로토타이핑
- 데이터 분석 친화적
- 설치 간단

---

## 6. 화면 구성 (Screen Layout)

### 6.1 메인 대시보드
```
┌────────────────────────────────────────────────────────┐
│  Product Ideation Dashboard                    [Sync]  │
├────────────────────────────────────────────────────────┤
│  Feeds (127)  │  Ideas (23)  │  Settings              │
├───────────────┴──────────────┴─────────────────────────┤
│                                                        │
│  ┌─────────────────────────────────────────────────┐   │
│  │ Filter: [All Channels ▼] [Today ▼] [Unread ▼]  │   │
│  └─────────────────────────────────────────────────┘   │
│                                                        │
│  ┌─────────────────────────────────────────────────┐   │
│  │ ☐ [PH] New AI writing tool launched...         │   │
│  │   2026-02-06 | Product Hunt                    │   │
│  │                                    [+ Idea]    │   │
│  ├─────────────────────────────────────────────────┤   │
│  │ ☐ [SMT] I need an app that tracks...          │   │
│  │   2026-02-06 | r/SomebodyMakeThis             │   │
│  │                                    [+ Idea]    │   │
│  └─────────────────────────────────────────────────┘   │
│                                                        │
└────────────────────────────────────────────────────────┘
```

### 6.2 아이디어 기록 모달
```
┌────────────────────────────────────────┐
│  Record Idea                      [X]  │
├────────────────────────────────────────┤
│  Source: [SMT] I need an app that...   │
│                                        │
│  문제:                                  │
│  ┌──────────────────────────────────┐  │
│  │                                  │  │
│  └──────────────────────────────────┘  │
│                                        │
│  현재 해결책:                           │
│  ┌──────────────────────────────────┐  │
│  │                                  │  │
│  └──────────────────────────────────┘  │
│                                        │
│  돈의 증거:                             │
│  ┌──────────────────────────────────┐  │
│  │                                  │  │
│  └──────────────────────────────────┘  │
│                                        │
│  기회:                                  │
│  ┌──────────────────────────────────┐  │
│  │                                  │  │
│  └──────────────────────────────────┘  │
│                                        │
│  한 줄 아이디어:                        │
│  ┌──────────────────────────────────┐  │
│  │                                  │  │
│  └──────────────────────────────────┘  │
│                                        │
│              [취소]  [저장]             │
└────────────────────────────────────────┘
```

---

## 7. 데이터 모델 (Data Model)

```
┌─────────────────┐       ┌─────────────────┐
│     feeds       │       │     ideas       │
├─────────────────┤       ├─────────────────┤
│ id (PK)         │       │ id (PK)         │
│ title           │◄──────│ feedId (FK)     │
│ link (UNIQUE)   │       │ date            │
│ channel         │       │ problem         │
│ collectedAt     │       │ currentSolution │
│ summary         │       │ moneyEvidence   │
│ isRead          │       │ opportunity     │
│ createdAt       │       │ oneLineIdea     │
│ updatedAt       │       │ createdAt       │
└─────────────────┘       │ updatedAt       │
                          └─────────────────┘

┌─────────────────┐
│    channels     │
├─────────────────┤
│ id (PK)         │
│ name            │
│ rssUrl          │
│ shortCode       │
│ isActive        │
│ lastFetchedAt   │
└─────────────────┘
```

---

## 8. 마일스톤 (Milestones)

### Phase 1: 핵심 기능 (MVP)
- [ ] 프로젝트 초기 설정
- [ ] DB 스키마 설계 및 생성
- [ ] RSS 수집 모듈 구현
- [ ] 기본 대시보드 UI
- [ ] 피드 목록 조회

### Phase 2: 아이디어 기록
- [ ] 아이디어 기록 폼
- [ ] 아이디어 목록 조회
- [ ] 피드-아이디어 연결

### Phase 3: 개선
- [ ] 자동 스케줄링 (선택)
- [ ] 필터링/검색 기능
- [ ] 데이터 내보내기

---

## 9. 리스크 및 대응 (Risks)

| 리스크 | 영향 | 대응 방안 |
|--------|------|-----------|
| RSS 피드 구조 변경 | 수집 실패 | 에러 핸들링, 알림 |
| Rate Limiting | 수집 제한 | 요청 간격 조절 |
| 대용량 데이터 | 성능 저하 | 페이지네이션, 인덱싱 |

---

## 10. 의사결정 필요 항목 (Decisions Needed)

1. **기술 스택 선택**: Next.js vs Python/Streamlit
2. **자동 수집 주기**: 매일 1회 vs 수동 트리거
3. **요약 기능**: AI 요약 사용 여부 (비용 발생)

---

## 11. 고도화 기능 (Advanced Features) - v2.0 추가

> 목적: "수익화 가능한 문제/니즈"를 더 효과적으로 발견하고 평가하기 위한 기능

### FR-05: AI 기반 자동 분석 (AI-Powered Analysis)
- **설명**: 수집된 피드를 AI가 자동으로 분석하여 수익화 가능성 평가
- **기능**:
  - 피드 내용 자동 요약
  - 문제/니즈 자동 추출
  - 수익화 가능성 점수 (1-10)
  - 카테고리 자동 분류 (SaaS, 앱, 도구, 콘텐츠 등)
- **저장 필드**:
  | 필드 | 타입 | 설명 |
  |------|------|------|
  | aiSummary | string | AI 생성 요약 |
  | extractedProblem | string | 추출된 문제점 |
  | monetizationScore | number | 수익화 가능성 (1-10) |
  | category | string | 자동 분류 카테고리 |
  | keywords | string[] | 핵심 키워드 |
- **구현 옵션**:
  - Option A: OpenAI API (비용 발생, 고품질)
  - Option B: Local LLM (Ollama + llama3, 무료, 로컬)
  - Option C: 수동 분석 (AI 없이)
- **우선순위**: 선택 (P1)

### FR-06: 스마트 필터링 & 우선순위 (Smart Filtering)
- **설명**: 수익화 가능성이 높은 피드를 상단에 노출
- **필터 기준**:
  ```
  1. 직접적인 니즈 표현 키워드 감지
     - "I need", "I wish", "I'd pay for"
     - "frustrated with", "looking for"
     - "$", "money", "budget"

  2. 참여도 신호 (가능한 경우)
     - Reddit: upvotes, comments
     - HN: points, comments
     - PH: upvotes

  3. AI 수익화 점수 (FR-05 사용 시)
  ```
- **정렬 옵션**:
  - 최신순 / 수익화 점수순 / 참여도순 / 혼합
- **우선순위**: 선택 (P1)

### FR-07: 트렌드 분석 대시보드 (Trend Analytics)
- **설명**: 시간에 따른 트렌드 및 패턴 분석
- **기능**:
  ```
  ┌────────────────────────────────────────────────────┐
  │  📈 Trend Analytics                               │
  ├────────────────────────────────────────────────────┤
  │                                                    │
  │  이번 주 떠오르는 키워드:                          │
  │  [AI Agent] [Automation] [No-code] [CLI tool]    │
  │                                                    │
  │  카테고리별 분포:           수집 추이:             │
  │  ┌──────────────┐          ┌──────────────┐       │
  │  │ SaaS    35% │          │     ╱──      │       │
  │  │ Tool    28% │          │   ╱          │       │
  │  │ App     22% │          │ ──           │       │
  │  │ Other   15% │          │              │       │
  │  └──────────────┘          └──────────────┘       │
  │                                                    │
  │  채널별 수익화 점수 평균:                          │
  │  SMT: ████████░░ 8.2                              │
  │  AppIdeas: ██████░░░░ 6.4                         │
  │  PH: █████░░░░░ 5.1                               │
  └────────────────────────────────────────────────────┘
  ```
- **분석 항목**:
  - 주간/월간 키워드 빈도
  - 카테고리별 분포
  - 채널별 평균 수익화 점수
  - 시간대별 수집량
- **우선순위**: 선택 (P2)

### FR-08: 아이디어 파이프라인 (Idea Pipeline)
- **설명**: 아이디어를 단계별로 관리하는 칸반 보드
- **파이프라인 단계**:
  ```
  ┌─────────────┬─────────────┬─────────────┬─────────────┐
  │   수집됨    │   검토중    │   유망함    │   진행중    │
  │  Collected  │  Reviewing  │  Promising  │  Building   │
  ├─────────────┼─────────────┼─────────────┼─────────────┤
  │ ┌─────────┐ │ ┌─────────┐ │ ┌─────────┐ │ ┌─────────┐ │
  │ │ Idea 1  │ │ │ Idea 4  │ │ │ Idea 7  │ │ │ Idea 9  │ │
  │ └─────────┘ │ └─────────┘ │ └─────────┘ │ └─────────┘ │
  │ ┌─────────┐ │ ┌─────────┐ │ ┌─────────┐ │             │
  │ │ Idea 2  │ │ │ Idea 5  │ │ │ Idea 8  │ │             │
  │ └─────────┘ │ └─────────┘ │ └─────────┘ │             │
  │ ┌─────────┐ │             │             │             │
  │ │ Idea 3  │ │             │             │             │
  │ └─────────┘ │             │             │             │
  └─────────────┴─────────────┴─────────────┴─────────────┘
  ```
- **저장 필드 추가**:
  | 필드 | 타입 | 설명 |
  |------|------|------|
  | stage | enum | 파이프라인 단계 |
  | priority | number | 우선순위 (1-5) |
  | notes | string | 메모/코멘트 |
  | nextAction | string | 다음 액션 |
  | dueDate | date? | 마감일 (선택) |
- **우선순위**: 선택 (P1)

### FR-09: 유사 아이디어/경쟁사 자동 탐색 (Competition Research)
- **설명**: 기록된 아이디어의 경쟁 환경 자동 조사
- **기능**:
  - 아이디어 기록 시 유사 제품 자동 검색
  - Product Hunt, Google 등에서 관련 제품 조회
  - 시장 포화도 간단 평가
- **표시 예시**:
  ```
  ┌────────────────────────────────────────┐
  │  💡 유사 제품 발견 (3개)               │
  ├────────────────────────────────────────┤
  │  1. SimilarApp - $29/mo, 4.2★          │
  │     "기존 해결책이지만 UI가 별로"       │
  │                                        │
  │  2. CompetitorX - Free, 3.8★           │
  │     "기능이 제한적"                     │
  │                                        │
  │  📊 시장 평가: 경쟁 있음, 차별화 가능   │
  └────────────────────────────────────────┘
  ```
- **우선순위**: 선택 (P2)

### FR-10: 알림 및 다이제스트 (Notifications & Digest)
- **설명**: 중요한 피드를 놓치지 않도록 알림 제공
- **기능**:
  - 일일 다이제스트 이메일/노트
  - 고점수(8+) 피드 즉시 알림 (선택)
  - 주간 트렌드 리포트
- **다이제스트 형식**:
  ```markdown
  # 📬 Daily Ideation Digest - 2026-02-06

  ## 🔥 오늘의 Top 5 (수익화 점수 기준)
  1. [9.2] "I need a tool that..." - r/SomebodyMakeThis
  2. [8.7] "Anyone built a..." - Ask HN
  ...

  ## 📊 오늘의 통계
  - 총 수집: 47개
  - 평균 점수: 5.4
  - 상위 키워드: AI, automation, productivity

  ## 💡 기록된 아이디어: 3개
  ```
- **우선순위**: 선택 (P2)

### FR-11: 데이터 내보내기 & 백업 (Export & Backup)
- **설명**: 데이터를 다양한 형식으로 내보내기
- **지원 형식**:
  - JSON (전체 데이터)
  - CSV (피드, 아이디어 각각)
  - Markdown (아이디어 노트)
  - Notion 내보내기 (선택)
- **자동 백업**:
  - 일일 자동 백업 (로컬)
  - 백업 파일 관리 (최근 7일 유지)
- **우선순위**: 선택 (P1)

---

## 12. 고도화 우선순위 매트릭스

```
           영향도 (Impact)
           High ──────────────────► Low
         ┌───────────────────────────────┐
    Low  │ FR-09      │ FR-10           │
         │ 경쟁사탐색 │ 알림/다이제스트  │
    노   ├────────────┼─────────────────┤
    력   │ FR-07      │                 │
    도   │ 트렌드분석 │                 │
         ├────────────┼─────────────────┤
   High  │ FR-05 ⭐   │ FR-11           │
         │ AI분석     │ 내보내기        │
         │ FR-06 ⭐   │                 │
         │ 스마트필터 │                 │
         │ FR-08 ⭐   │                 │
         │ 파이프라인 │                 │
         └───────────────────────────────┘

⭐ = 권장 우선 구현
```

### 권장 구현 순서

| 순서 | 기능 | 이유 |
|------|------|------|
| 1 | MVP (FR-01~04) | 핵심 기능 먼저 |
| 2 | FR-06 스마트 필터링 | 키워드 감지만으로 구현 가능, AI 불필요 |
| 3 | FR-08 아이디어 파이프라인 | 아이디어 관리 체계화 |
| 4 | FR-11 내보내기/백업 | 데이터 안전성 |
| 5 | FR-05 AI 분석 | 선택적, 비용 발생 |
| 6 | FR-07 트렌드 분석 | 데이터 축적 후 의미 있음 |
| 7 | FR-09 경쟁사 탐색 | 외부 API 연동 필요 |
| 8 | FR-10 알림/다이제스트 | 사용 패턴 파악 후 |

---

## 13. 수정된 마일스톤 (Updated Milestones)

### Phase 1: MVP (필수)
- [ ] 프로젝트 초기 설정
- [ ] DB 스키마 설계 및 생성
- [ ] RSS 수집 모듈 구현
- [ ] 기본 대시보드 UI
- [ ] 피드 목록 조회
- [ ] 아이디어 기록 폼
- [ ] 아이디어 목록 조회

### Phase 2: 스마트 기능
- [ ] FR-06: 키워드 기반 스마트 필터링
- [ ] FR-08: 아이디어 파이프라인 (칸반)
- [ ] FR-11: JSON/CSV 내보내기

### Phase 3: AI 통합 (선택)
- [ ] FR-05: AI 자동 분석 (Ollama 또는 OpenAI)
- [ ] FR-06 확장: AI 점수 기반 정렬

### Phase 4: 분석 & 알림 (선택)
- [ ] FR-07: 트렌드 분석 대시보드
- [ ] FR-09: 유사 제품 탐색
- [ ] FR-10: 일일 다이제스트

---

## 14. 수정된 데이터 모델 (Updated Data Model)

```
┌─────────────────────┐       ┌─────────────────────┐
│       feeds         │       │       ideas         │
├─────────────────────┤       ├─────────────────────┤
│ id (PK)             │       │ id (PK)             │
│ title               │◄──────│ feedId (FK)         │
│ link (UNIQUE)       │       │ date                │
│ channel             │       │ problem             │
│ collectedAt         │       │ currentSolution     │
│ content             │       │ moneyEvidence       │
│ summary             │       │ opportunity         │
│ isRead              │       │ oneLineIdea         │
│ ─── AI Fields ───   │       │ ─── Pipeline ───    │
│ aiSummary           │       │ stage               │
│ extractedProblem    │       │ priority            │
│ monetizationScore   │       │ notes               │
│ category            │       │ nextAction          │
│ keywords (JSON)     │       │ dueDate             │
│ ─── Engagement ───  │       │ createdAt           │
│ upvotes             │       │ updatedAt           │
│ comments            │       └─────────────────────┘
│ createdAt           │
│ updatedAt           │
└─────────────────────┘

┌─────────────────────┐       ┌─────────────────────┐
│     channels        │       │   competitors       │
├─────────────────────┤       ├─────────────────────┤
│ id (PK)             │       │ id (PK)             │
│ name                │       │ ideaId (FK)         │
│ rssUrl              │       │ name                │
│ shortCode           │       │ url                 │
│ isActive            │       │ pricing             │
│ lastFetchedAt       │       │ rating              │
│ avgScore            │       │ notes               │
└─────────────────────┘       │ createdAt           │
                              └─────────────────────┘
```

---

## 15. 비용 고려사항 (Cost Considerations)

| 기능 | 비용 | 대안 |
|------|------|------|
| AI 분석 (OpenAI) | ~$0.002/피드 | Ollama (무료, 로컬) |
| AI 분석 (Claude) | ~$0.003/피드 | Ollama (무료, 로컬) |
| 경쟁사 검색 | 무료 (Google) | 수동 검색 |
| 이메일 알림 | 무료 (Resend 100/day) | 로컬 노트 파일 |

### 예상 월간 비용 (AI 사용 시)
- 일일 50개 피드 × 30일 = 1,500개
- OpenAI: ~$3/월
- 로컬 LLM: $0

---

## Appendix: 참고 자료

- [rss-parser npm](https://www.npmjs.com/package/rss-parser)
- [Drizzle ORM](https://orm.drizzle.team/)
- [better-sqlite3](https://github.com/WiseLibs/better-sqlite3)
- [Ollama](https://ollama.ai/) - 로컬 LLM 실행
- [Vercel AI SDK](https://sdk.vercel.ai/) - AI 통합 간편화
