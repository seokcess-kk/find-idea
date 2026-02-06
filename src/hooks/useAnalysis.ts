'use client';

import { useState, useCallback, useEffect } from 'react';
import type { FeedAnalysis, OllamaStatus } from '@/types';

interface UseAnalysisReturn {
  analysis: FeedAnalysis | null;
  isLoading: boolean;
  error: string | null;
  ollamaStatus: OllamaStatus | null;
  analyze: () => Promise<void>;
  refresh: () => Promise<void>;
  checkOllamaStatus: () => Promise<void>;
}

export function useAnalysis(feedId?: string): UseAnalysisReturn {
  const [analysis, setAnalysis] = useState<FeedAnalysis | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ollamaStatus, setOllamaStatus] = useState<OllamaStatus | null>(null);

  // Ollama 상태 확인
  const checkOllamaStatus = useCallback(async () => {
    try {
      const response = await fetch('/api/analyze/status');
      const data = await response.json();
      setOllamaStatus(data);
    } catch {
      setOllamaStatus({
        available: false,
        url: 'http://localhost:11434',
        model: 'llama3.2',
        models: [],
        error: 'Failed to check Ollama status',
      });
    }
  }, []);

  // 기존 분석 결과 조회
  const fetchAnalysis = useCallback(async () => {
    if (!feedId) return;

    try {
      const response = await fetch(`/api/analyze?feedId=${feedId}`);
      const data = await response.json();
      if (data.success && data.analysis) {
        setAnalysis(data.analysis);
      }
    } catch {
      // 조회 실패는 무시 (분석 안 된 상태)
    }
  }, [feedId]);

  // 분석 실행
  const analyze = useCallback(async () => {
    if (!feedId) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ feedId }),
      });

      const data = await response.json();

      if (data.success && data.analysis) {
        setAnalysis(data.analysis);
      } else {
        setError(data.error || 'Analysis failed');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Analysis failed');
    } finally {
      setIsLoading(false);
    }
  }, [feedId]);

  // 분석 새로고침 (재실행)
  const refresh = useCallback(async () => {
    await analyze();
  }, [analyze]);

  // 초기 로드: Ollama 상태 + 기존 분석 결과
  useEffect(() => {
    checkOllamaStatus();
  }, [checkOllamaStatus]);

  useEffect(() => {
    fetchAnalysis();
  }, [fetchAnalysis]);

  return {
    analysis,
    isLoading,
    error,
    ollamaStatus,
    analyze,
    refresh,
    checkOllamaStatus,
  };
}
