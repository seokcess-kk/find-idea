'use client';

import type { FeedAnalysis, OllamaStatus } from '@/types';

interface AnalysisPanelProps {
  analysis: FeedAnalysis | null;
  isLoading: boolean;
  error: string | null;
  ollamaStatus: OllamaStatus | null;
  onAnalyze: () => void;
  onRefresh: () => void;
}

export function AnalysisPanel({
  analysis,
  isLoading,
  error,
  ollamaStatus,
  onAnalyze,
  onRefresh,
}: AnalysisPanelProps) {
  // Ollama 미연결 상태
  if (!ollamaStatus?.available) {
    return (
      <div className="mt-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <span className="text-lg">🤖</span>
          <span>AI 분석: Ollama 연결 필요</span>
          <a
            href="https://ollama.ai"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:underline"
          >
            설치하기
          </a>
        </div>
      </div>
    );
  }

  // 로딩 상태
  if (isLoading) {
    return (
      <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
        <div className="flex items-center gap-2 text-sm text-blue-700">
          <span className="animate-spin">⏳</span>
          <span>AI 분석 중... (최대 30초 소요)</span>
        </div>
      </div>
    );
  }

  // 에러 상태
  if (error) {
    return (
      <div className="mt-3 p-3 bg-red-50 rounded-lg border border-red-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-red-700">
            <span>❌</span>
            <span>분석 실패: {getErrorMessage(error)}</span>
          </div>
          <button
            onClick={onAnalyze}
            className="px-2 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200"
          >
            재시도
          </button>
        </div>
      </div>
    );
  }

  // 분석 결과 없음
  if (!analysis) {
    return (
      <div className="mt-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <span className="text-lg">🤖</span>
            <span>AI 분석 가능</span>
          </div>
          <button
            onClick={onAnalyze}
            className="px-3 py-1 text-xs bg-purple-100 text-purple-700 rounded hover:bg-purple-200 font-medium"
          >
            분석하기
          </button>
        </div>
      </div>
    );
  }

  // 분석 진행 중 (status: analyzing)
  if (analysis.status === 'analyzing') {
    return (
      <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
        <div className="flex items-center gap-2 text-sm text-blue-700">
          <span className="animate-spin">⏳</span>
          <span>AI 분석 진행 중...</span>
        </div>
      </div>
    );
  }

  // 분석 결과 표시
  return (
    <div className="mt-3 p-3 bg-purple-50 rounded-lg border border-purple-200">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2 text-sm font-medium text-purple-800">
          <span>🤖</span>
          <span>AI Analysis</span>
        </div>
        <button
          onClick={onRefresh}
          className="p-1 text-purple-600 hover:bg-purple-100 rounded"
          title="다시 분석"
        >
          🔄
        </button>
      </div>

      <div className="space-y-2 text-sm">
        {/* 요약 */}
        {analysis.summary && (
          <div className="flex items-start gap-2">
            <span className="text-purple-600">📝</span>
            <span className="text-gray-700">{analysis.summary}</span>
          </div>
        )}

        {/* 키워드 */}
        {analysis.keywords && analysis.keywords.length > 0 && (
          <div className="flex items-start gap-2">
            <span className="text-purple-600">🏷️</span>
            <div className="flex flex-wrap gap-1">
              {analysis.keywords.map((kw, idx) => (
                <span
                  key={idx}
                  className="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs rounded"
                >
                  {kw}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* 잠재력 점수 */}
        {analysis.potentialScore !== null && (
          <div className="flex items-start gap-2">
            <span className="text-purple-600">⭐</span>
            <span className="text-gray-700">
              <span className="font-medium">{analysis.potentialScore}/10</span>
              {analysis.potentialReason && (
                <span className="text-gray-500"> - {analysis.potentialReason}</span>
              )}
            </span>
          </div>
        )}
      </div>

      {/* 모델 정보 */}
      <div className="mt-2 text-xs text-gray-400">
        {analysis.modelUsed && <span>Model: {analysis.modelUsed}</span>}
      </div>
    </div>
  );
}

function getErrorMessage(error: string): string {
  switch (error) {
    case 'FEED_NOT_FOUND':
      return '피드를 찾을 수 없습니다';
    case 'OLLAMA_UNAVAILABLE':
      return 'Ollama 서버 연결 실패';
    case 'Ollama request timeout':
      return '요청 시간 초과';
    default:
      return error;
  }
}
