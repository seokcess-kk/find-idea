// ===========================================
// AI Provider Interface
// ===========================================

import type { AIProviderType } from '@/lib/config';

/**
 * AI 분석 결과 타입
 */
export interface AIAnalysisResult {
  summary: string | null;
  keywords: string[];
  potential: {
    score: number;
    reason: string;
  };
}

/**
 * AI Provider 인터페이스
 * Ollama와 OpenAI 모두 이 인터페이스를 구현
 */
export interface IAIProvider {
  /** Provider 타입 */
  readonly type: AIProviderType;

  /** 사용 중인 모델명 */
  readonly model: string;

  /**
   * Provider 연결 상태 확인
   */
  checkConnection(): Promise<boolean>;

  /**
   * 사용 가능한 모델 목록 조회 (optional)
   */
  listModels?(): Promise<string[]>;

  /**
   * 피드 요약 생성
   */
  generateSummary(feed: {
    title: string;
    content: string;
    channel?: string;
  }): Promise<string>;

  /**
   * 키워드 추출
   */
  extractKeywords(content: string): Promise<string[]>;

  /**
   * 아이디어 잠재력 평가
   */
  evaluatePotential(content: string): Promise<{ score: number; reason: string }>;

  /**
   * 전체 분석 실행 (요약 + 키워드 + 잠재력)
   */
  analyzeAll(feed: {
    title: string;
    content: string;
    channel?: string;
  }): Promise<AIAnalysisResult>;
}

/**
 * AI Provider 상태 정보
 */
export interface AIProviderStatus {
  provider: AIProviderType;
  available: boolean;
  model: string;
  models?: string[];
  error?: string;
}
