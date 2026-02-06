# Auto Scheduler - Plan Document

> 버전: 1.0.0
> 작성일: 2026-02-06
> PDCA Phase: Plan
> Parent Feature: find-idea

---

## 1. 개요 (Overview)

### 1.1 기능 목적
RSS 피드 수집을 **자동으로 스케줄링**하여 매일 정해진 시간에 새 콘텐츠를 수집하는 기능

### 1.2 현재 상태
- ✅ RSS 수집 로직 구현됨 (`RSSCollector`)
- ✅ Sync API 엔드포인트 존재 (`POST /api/sync`)
- ❌ 자동 스케줄러 없음 (수동 트리거만 가능)

### 1.3 해결할 문제
| 문제 | 영향 |
|------|------|
| 매일 수동으로 Sync 버튼 클릭 필요 | 사용자 불편, 수집 누락 가능 |
| 최신 피드 놓칠 수 있음 | 기회 손실 |
| 일정한 수집 주기 없음 | 데이터 일관성 부족 |

### 1.4 기대 효과
- 🕐 매일 자동으로 피드 수집
- 📊 일관된 데이터 축적
- 🔔 수집 결과 알림 (선택)

---

## 2. 기능 요구사항 (Functional Requirements)

### FR-SCHED-01: 스케줄 설정 (P0)
- **설명**: 사용자가 수집 스케줄을 설정할 수 있음
- **옵션**:
  | 옵션 | Cron 표현식 | 설명 |
  |------|------------|------|
  | 매일 오전 9시 | `0 9 * * *` | 기본값 (권장) |
  | 매일 오전 6시 | `0 6 * * *` | 일찍 확인하고 싶은 경우 |
  | 12시간마다 | `0 */12 * * *` | 자주 확인 |
  | 6시간마다 | `0 */6 * * *` | 실시간에 가깝게 |
  | 사용자 지정 | custom | 고급 사용자용 |
- **저장**: 환경변수 또는 DB 설정 테이블

### FR-SCHED-02: 백그라운드 실행 (P0)
- **설명**: 앱이 실행 중일 때 백그라운드에서 스케줄 실행
- **구현 방식**:
  - Option A: `node-cron` 라이브러리 (앱 내장)
  - Option B: 외부 Cron 서비스 (Vercel Cron, GitHub Actions)
  - Option C: OS 레벨 Cron (systemd, Task Scheduler)
- **권장**: Option A (node-cron) - 로컬 실행 환경에 적합

### FR-SCHED-03: 수집 결과 로깅 (P0)
- **설명**: 각 스케줄 실행 결과를 기록
- **로그 필드**:
  | 필드 | 타입 | 설명 |
  |------|------|------|
  | id | string | 로그 ID |
  | startedAt | datetime | 시작 시간 |
  | completedAt | datetime | 완료 시간 |
  | totalFeeds | number | 총 수집 피드 수 |
  | newFeeds | number | 신규 피드 수 |
  | duplicates | number | 중복 제외 수 |
  | failures | number | 실패 채널 수 |
  | status | enum | success / partial / failed |

### FR-SCHED-04: 스케줄러 ON/OFF (P1)
- **설명**: Settings 페이지에서 스케줄러 활성화/비활성화
- **UI**:
  ```
  ┌─────────────────────────────────────────┐
  │ ⏰ Auto Scheduler                       │
  │ ────────────────────────────────────    │
  │ Status: [🟢 Active / 🔴 Inactive]       │
  │                                         │
  │ Schedule: [매일 오전 9시 ▼]              │
  │                                         │
  │ Last Run: 2026-02-06 09:00:00           │
  │ Next Run: 2026-02-07 09:00:00           │
  │                                         │
  │ [Enable/Disable]                        │
  └─────────────────────────────────────────┘
  ```

### FR-SCHED-05: 수집 완료 알림 (P2)
- **설명**: 스케줄 실행 완료 시 알림
- **알림 방식**:
  - 브라우저 알림 (앱 열려있을 때)
  - 이메일 알림 (선택, 외부 서비스 필요)
  - 로컬 파일 로그
- **우선순위**: P2 (나중에 구현)

---

## 3. 비기능 요구사항 (Non-Functional Requirements)

### NFR-SCHED-01: 안정성
- 스케줄러 실패 시 앱 전체에 영향 없음
- 에러 발생 시 자동 재시도 (최대 3회)
- 실패 로그 기록

### NFR-SCHED-02: 리소스 효율
- CPU/메모리 과도한 사용 방지
- 채널 간 요청 간격 유지 (500ms)
- 동시 수집 제한 (1개 채널씩 순차)

### NFR-SCHED-03: 로컬 실행
- 외부 서비스 의존성 최소화
- 인터넷 연결만 있으면 동작
- 로컬 타임존 기준 스케줄

---

## 4. 기술 설계 (Technical Design)

### 4.1 아키텍처

```
┌─────────────────────────────────────────────────────┐
│                    Next.js App                       │
│  ┌─────────────────────────────────────────────┐    │
│  │              Scheduler Module                │    │
│  │  ┌─────────────┐    ┌──────────────────┐    │    │
│  │  │  node-cron  │───►│  RSSCollector    │    │    │
│  │  │  (스케줄러)  │    │  (기존 수집기)    │    │    │
│  │  └─────────────┘    └──────────────────┘    │    │
│  │         │                    │              │    │
│  │         ▼                    ▼              │    │
│  │  ┌─────────────┐    ┌──────────────────┐    │    │
│  │  │ScheduleLog │    │     feeds        │    │    │
│  │  │  (로그DB)   │    │   (피드 DB)      │    │    │
│  │  └─────────────┘    └──────────────────┘    │    │
│  └─────────────────────────────────────────────┘    │
│                                                      │
│  Settings API ◄──────► Settings UI                   │
└─────────────────────────────────────────────────────┘
```

### 4.2 데이터 모델

```sql
-- 스케줄 설정 테이블
CREATE TABLE scheduler_config (
  id TEXT PRIMARY KEY DEFAULT 'default',
  enabled INTEGER DEFAULT 1,           -- 0: disabled, 1: enabled
  cron_expression TEXT DEFAULT '0 9 * * *',
  timezone TEXT DEFAULT 'Asia/Seoul',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

-- 스케줄 실행 로그 테이블
CREATE TABLE scheduler_logs (
  id TEXT PRIMARY KEY,
  started_at TEXT NOT NULL,
  completed_at TEXT,
  total_feeds INTEGER DEFAULT 0,
  new_feeds INTEGER DEFAULT 0,
  duplicates INTEGER DEFAULT 0,
  failures INTEGER DEFAULT 0,
  status TEXT DEFAULT 'running',  -- running, success, partial, failed
  error_message TEXT,
  created_at TEXT NOT NULL
);
```

### 4.3 주요 컴포넌트

| 파일 | 역할 |
|------|------|
| `src/lib/scheduler/index.ts` | 스케줄러 메인 모듈 |
| `src/lib/scheduler/cron.ts` | node-cron 래퍼 |
| `src/lib/db/schema.ts` | 스키마 추가 |
| `src/app/api/scheduler/route.ts` | 스케줄러 제어 API |
| `src/components/settings/SchedulerPanel.tsx` | 설정 UI |

### 4.4 API 엔드포인트

| Method | Endpoint | 설명 |
|--------|----------|------|
| GET | `/api/scheduler` | 스케줄러 상태 조회 |
| POST | `/api/scheduler` | 스케줄러 설정 변경 |
| GET | `/api/scheduler/logs` | 실행 로그 조회 |
| POST | `/api/scheduler/trigger` | 수동 트리거 |

---

## 5. 구현 순서 (Implementation Order)

### Phase 1: 코어 기능 (P0)
1. [ ] DB 스키마 추가 (scheduler_config, scheduler_logs)
2. [ ] `node-cron` 패키지 설치
3. [ ] SchedulerService 클래스 구현
4. [ ] 앱 시작 시 스케줄러 초기화

### Phase 2: API & UI (P1)
5. [ ] 스케줄러 제어 API 구현
6. [ ] Settings 페이지에 SchedulerPanel 추가
7. [ ] 실행 로그 조회 UI

### Phase 3: 개선 (P2)
8. [ ] 브라우저 알림 기능
9. [ ] 스케줄 프리셋 선택 UI
10. [ ] 로그 보관 기간 설정

---

## 6. 리스크 및 대응 (Risks)

| 리스크 | 영향 | 대응 방안 |
|--------|------|-----------|
| 앱 종료 시 스케줄러 중단 | 수집 누락 | 앱을 백그라운드 서비스로 실행 안내 |
| node-cron 메모리 누수 | 앱 성능 저하 | 단일 인스턴스 패턴, 정기 재시작 |
| 타임존 혼란 | 잘못된 시간에 실행 | 로컬 타임존 명시적 설정 |
| 동시 실행 충돌 | 중복 수집 | 실행 중 플래그로 중복 방지 |

---

## 7. 의사결정 필요 항목 (Decisions Needed)

| 항목 | 옵션 | 권장 |
|------|------|------|
| 스케줄러 라이브러리 | node-cron vs node-schedule | **node-cron** (더 간단) |
| 기본 스케줄 | 매일 1회 vs 12시간마다 | **매일 오전 9시** |
| 로그 보관 기간 | 7일 vs 30일 vs 무제한 | **30일** |
| 앱 종료 시 처리 | 경고만 vs 백그라운드 전환 | **경고 안내** |

---

## 8. 예상 공수 (Estimation)

| 작업 | 예상 시간 |
|------|:--------:|
| DB 스키마 & 마이그레이션 | 0.5h |
| SchedulerService 구현 | 1.5h |
| API 엔드포인트 | 1h |
| Settings UI 추가 | 1h |
| 테스트 & 디버깅 | 1h |
| **총계** | **5h** |

---

## 9. 성공 기준 (Success Criteria)

- [ ] 설정한 시간에 자동으로 RSS 수집 실행
- [ ] Settings 페이지에서 스케줄러 ON/OFF 가능
- [ ] 실행 로그 확인 가능
- [ ] 앱 재시작 후에도 스케줄 유지

---

## Appendix: 참고 자료

- [node-cron npm](https://www.npmjs.com/package/node-cron)
- [Cron 표현식 생성기](https://crontab.guru/)
- [Next.js Background Tasks](https://nextjs.org/docs/app/building-your-application/deploying#background-tasks)

---

**Plan 작성일**: 2026-02-06
**작성자**: Claude (pdca-plan)
**상태**: 📝 Plan 완료 - Design 단계 진행 가능
