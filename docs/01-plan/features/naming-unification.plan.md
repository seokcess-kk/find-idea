# Plan: 프로젝트 네이밍 통일 (naming-unification)

> 기존 `product-ideation` / `presentation-ideation` 네이밍을 `find-idea`로 통일

## 1. 개요

### 1.1 목표
프로젝트명이 `product-ideation`에서 `find-idea`로 변경됨에 따라, 모든 파일, 폴더, 코드 내부 참조를 새 프로젝트명으로 통일합니다.

### 1.2 배경
- 이전 프로젝트명: `product-ideation` (presentation-manager 하위)
- 현재 프로젝트명: `find-idea` (독립 프로젝트)
- package.json은 이미 변경됨
- 일부 코드와 메타데이터에 이전 네이밍이 남아있음

### 1.3 범위
- 소스 코드 내 하드코딩된 네이밍
- 메타데이터/상태 파일
- 문서 파일 (아카이브 포함)

---

## 2. 현황 분석

### 2.1 변경 완료된 항목
| 항목 | 상태 |
|------|------|
| `package.json` name | ✅ `find-idea` |
| 프로젝트 루트 폴더 | ✅ `find-idea/` |
| Git 저장소 | ✅ 정상 |

### 2.2 변경 필요 항목

#### A. 소스 코드 (우선순위: 높음)
| 파일 | 위치 | 현재 값 | 변경 값 |
|------|------|---------|---------|
| `src/store/filterStore.ts` | 라인 104 | `'product-ideation-filters'` | `'find-idea-filters'` |

#### B. 메타데이터 파일 (우선순위: 중간)
| 파일 | 변경 내용 |
|------|-----------|
| `docs/.pdca-status.json` | `lastFile` 경로 정리 (presentation-manager → find-idea) |
| `docs/.pdca-snapshots/*.json` | 스냅샷 내 경로 및 feature명 정리 |
| `docs/.bkit-memory.json` | 메모리 초기화 또는 정리 |

#### C. 문서/아카이브 (우선순위: 낮음 - 히스토리 보존)
| 폴더/파일 | 권장 조치 |
|-----------|-----------|
| `docs/archive/2026-02/product-ideation/` | 그대로 유지 (완료된 PDCA 기록) |
| `docs/archive/2026-02/_INDEX.md` | 그대로 유지 (히스토리) |

---

## 3. 실행 계획

### Phase 1: 소스 코드 수정
**예상 영향**: 로컬 스토리지 키 변경으로 기존 사용자 필터 설정 초기화

1. `src/store/filterStore.ts` 수정
   - `'product-ideation-filters'` → `'find-idea-filters'`

### Phase 2: 메타데이터 정리
**예상 영향**: PDCA 상태 추적 초기화

1. `.pdca-status.json` 정리
   - 모든 `lastFile` 경로에서 이전 경로 제거
   - 불필요한 하위 feature 삭제 또는 정리

2. `.pdca-snapshots/` 정리
   - 오래된 스냅샷 삭제 또는 유지 결정

3. `.bkit-memory.json` 정리
   - 세션 정보 초기화

### Phase 3: 검증
1. 프로젝트 빌드 테스트 (`npm run build`)
2. 개발 서버 실행 테스트 (`npm run dev`)
3. 네이밍 잔여 검색 (grep으로 확인)

---

## 4. 리스크 및 대응

| 리스크 | 영향도 | 대응 방안 |
|--------|--------|-----------|
| 로컬 스토리지 키 변경 | 낮음 | 사용자 필터 재설정 필요 (데이터 손실 없음) |
| PDCA 상태 초기화 | 낮음 | 아카이브는 보존됨, 새 기능부터 추적 |
| 빌드 실패 | 중간 | 변경 후 즉시 빌드 테스트 |

---

## 5. 체크리스트

- [ ] `src/store/filterStore.ts` 수정
- [ ] `.pdca-status.json` 정리
- [ ] `.pdca-snapshots/` 정리 (선택)
- [ ] `.bkit-memory.json` 정리 (선택)
- [ ] 빌드 테스트
- [ ] 개발 서버 테스트
- [ ] 잔여 네이밍 검색

---

## 6. 결정 필요 사항

1. **아카이브 문서**: 기존 `product-ideation` 폴더명 유지 vs 변경
   - 권장: 유지 (히스토리 보존 목적)

2. **PDCA 스냅샷**: 삭제 vs 유지
   - 권장: 삭제 (새로운 시작)

3. **하위 feature 정리**: 개별 feature(db, feeds 등) 상태 유지 vs 초기화
   - 권장: 초기화 (깨끗한 상태로 재시작)

---

**작성일**: 2026-02-06
**상태**: Draft
**다음 단계**: 사용자 확인 후 Do 단계 진행
