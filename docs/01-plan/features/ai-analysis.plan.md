# Plan: AI 분석 기능 (ai-analysis)

> FR-05: Ollama 연동을 통한 피드 자동 요약 및 AI 기반 분석 기능

## 1. 개요

### 1.1 목표
수집된 피드에 대해 로컬 LLM(Ollama)을 활용하여 자동 요약, 핵심 키워드 추출,
아이디어 잠재력 평가 등 AI 기반 분석 기능을 제공합니다.

### 1.2 배경
- 현재 product-ideation v1.0에서는 스마트 필터링(키워드 기반)만 지원
- 사용자가 수동으로 피드를 읽고 분석해야 함
- Ollama를 통해 로컬에서 무료로 LLM 활용 가능

### 1.3 범위
- Ollama 연동 서비스
- 피드 자동 요약
- 핵심 키워드/주제 추출
- 아이디어 잠재력 점수 (AI 기반)
- 분석 결과 저장 및 표시

---

## 2. 요구사항

### 2.1 기능 요구사항 (FR)

| ID | 요구사항 | 우선순위 | 설명 |
|----|----------|:--------:|------|
| FR-05-01 | Ollama 연동 | P0 | Ollama API 클라이언트 구현 |
| FR-05-02 | 피드 요약 | P0 | 피드 내용을 1-2문장으로 요약 |
| FR-05-03 | 키워드 추출 | P1 | 핵심 키워드/토픽 3-5개 추출 |
| FR-05-04 | 잠재력 평가 | P1 | AI 기반 아이디어 잠재력 점수 (1-10) |
| FR-05-05 | 배치 분석 | P2 | 여러 피드 일괄 분석 |
| FR-05-06 | 분석 결과 저장 | P0 | DB에 분석 결과 저장 |
| FR-05-07 | UI 표시 | P0 | 피드 카드에 분석 결과 표시 |

### 2.2 비기능 요구사항 (NFR)

| ID | 요구사항 | 설명 |
|----|----------|------|
| NFR-05-01 | 로컬 실행 | Ollama 로컬 서버 사용 (외부 API 없음) |
| NFR-05-02 | 성능 | 단일 피드 분석 30초 이내 |
| NFR-05-03 | 에러 처리 | Ollama 미실행 시 graceful degradation |
| NFR-05-04 | 모델 선택 | 사용자가 Ollama 모델 선택 가능 |

---

## 3. 기술 설계

### 3.1 Ollama 연동

```
┌─────────────────┐     HTTP     ┌─────────────────┐
│   find-idea     │ ──────────► │     Ollama      │
│   (Next.js)     │ ◄────────── │   (localhost)   │
└─────────────────┘   JSON      └─────────────────┘
                                       │
                                ┌──────┴──────┐
                                │   Models    │
                                │ - llama3.2  │
                                │ - mistral   │
                                │ - gemma2    │
                                └─────────────┘
```

### 3.2 데이터 흐름

```
1. 사용자가 피드 분석 요청
   └── [UI] FeedCard "분석" 버튼 클릭

2. API 호출
   └── POST /api/analyze
       └── body: { feedId, analysisType }

3. AI 분석 서비스
   └── OllamaService.analyze(feed)
       ├── generateSummary()
       ├── extractKeywords()
       └── evaluatePotential()

4. 결과 저장
   └── feed_analysis 테이블 INSERT/UPDATE

5. UI 업데이트
   └── FeedCard에 분석 결과 표시
```

### 3.3 DB 스키마 확장

```sql
-- 새 테이블: feed_analysis
CREATE TABLE feed_analysis (
  id TEXT PRIMARY KEY,
  feed_id TEXT NOT NULL REFERENCES feeds(id),
  summary TEXT,
  keywords TEXT,  -- JSON array
  potential_score INTEGER,  -- 1-10
  potential_reason TEXT,
  model_used TEXT,
  analyzed_at TEXT,
  UNIQUE(feed_id)
);

-- 설정 테이블 확장
ALTER TABLE settings ADD COLUMN ollama_model TEXT DEFAULT 'llama3.2';
ALTER TABLE settings ADD COLUMN ollama_url TEXT DEFAULT 'http://localhost:11434';
```

### 3.4 API 설계

| Endpoint | Method | 설명 |
|----------|--------|------|
| `/api/analyze` | POST | 단일 피드 분석 |
| `/api/analyze/batch` | POST | 배치 분석 (여러 피드) |
| `/api/analyze/status` | GET | Ollama 연결 상태 확인 |
| `/api/settings/ollama` | GET/PUT | Ollama 설정 관리 |

### 3.5 프롬프트 설계

#### 요약 프롬프트
```
You are analyzing a post from {channel} about potential product ideas or problems.

Post Title: {title}
Post Content: {content}

Provide a concise 1-2 sentence summary focusing on:
- The core problem or need being expressed
- Any mentioned pain points or frustrations
- Potential market opportunity

Summary:
```

#### 키워드 추출 프롬프트
```
Extract 3-5 key topics/keywords from this post.
Return as JSON array: ["keyword1", "keyword2", ...]

Post: {content}
```

#### 잠재력 평가 프롬프트
```
Rate this post's potential as a product idea from 1-10.
Consider: problem clarity, market size hints, willingness to pay signals.

Post: {content}

Respond in JSON: {"score": N, "reason": "brief explanation"}
```

---

## 4. 구현 계획

### Phase 1: 기반 구축 (P0)
1. Ollama 서비스 클래스 구현
2. feed_analysis 테이블 생성
3. `/api/analyze` 엔드포인트 구현
4. 요약 기능 구현

### Phase 2: 분석 확장 (P1)
5. 키워드 추출 기능
6. 잠재력 평가 기능
7. 설정 페이지 Ollama 옵션 추가

### Phase 3: UI 통합 (P0/P1)
8. FeedCard에 분석 결과 표시
9. "분석" 버튼 추가
10. 분석 진행 상태 표시

### Phase 4: 고급 기능 (P2)
11. 배치 분석 기능
12. 분석 결과 필터링

---

## 5. 파일 구조 (예상)

```
src/
├── lib/
│   └── services/
│       └── ollama.service.ts      # NEW: Ollama 연동
│
├── app/
│   └── api/
│       └── analyze/
│           ├── route.ts           # NEW: 분석 API
│           ├── batch/route.ts     # NEW: 배치 분석
│           └── status/route.ts    # NEW: 상태 확인
│
├── components/
│   └── feeds/
│       ├── FeedCard.tsx           # MODIFY: 분석 결과 표시
│       └── AnalysisResult.tsx     # NEW: 분석 결과 컴포넌트
│
└── types/
    └── index.ts                   # MODIFY: Analysis 타입 추가
```

---

## 6. 리스크 및 대응

| 리스크 | 영향도 | 대응 방안 |
|--------|:------:|-----------|
| Ollama 미설치 | 높음 | 상태 확인 API로 사전 검증, 설치 가이드 제공 |
| 분석 속도 저하 | 중간 | 비동기 처리, 로딩 상태 표시 |
| 모델별 응답 차이 | 중간 | 프롬프트 최적화, 파싱 로직 강화 |
| 메모리 사용량 | 낮음 | 작은 모델 기본값 (llama3.2:1b) |

---

## 7. 의존성

### 7.1 외부 의존성
- **Ollama**: 로컬 LLM 서버 (사용자 설치 필요)
  - 설치: https://ollama.ai
  - 모델: `ollama pull llama3.2`

### 7.2 npm 패키지
- 추가 패키지 없음 (fetch API 사용)

---

## 8. 체크리스트

- [ ] Ollama 서비스 클래스 구현
- [ ] feed_analysis 테이블 스키마 추가
- [ ] 분석 API 엔드포인트 구현
- [ ] 요약 기능 구현 및 테스트
- [ ] 키워드 추출 기능 구현
- [ ] 잠재력 평가 기능 구현
- [ ] FeedCard UI 수정
- [ ] AnalysisResult 컴포넌트 생성
- [ ] 설정 페이지 Ollama 옵션 추가
- [ ] 에러 처리 및 graceful degradation
- [ ] 빌드 테스트

---

**작성일**: 2026-02-06
**상태**: Draft
**다음 단계**: Design 문서 작성 또는 바로 구현
