// ===========================================
// Ollama AI Provider
// ===========================================

import { ollamaConfig, PROMPTS } from '@/lib/config';
import type { IAIProvider, AIAnalysisResult } from './ai-provider.interface';

interface OllamaGenerateResponse {
  response: string;
  model: string;
  done: boolean;
}

interface OllamaModel {
  name: string;
  modified_at: string;
  size: number;
}

interface OllamaTagsResponse {
  models: OllamaModel[];
}

export class OllamaProvider implements IAIProvider {
  readonly type = 'ollama' as const;
  readonly model: string;
  private baseUrl: string;
  private timeout: number;

  constructor(config?: Partial<typeof ollamaConfig>) {
    this.baseUrl = config?.url || ollamaConfig.url;
    this.model = config?.model || ollamaConfig.model;
    this.timeout = config?.timeout || ollamaConfig.timeout;
  }

  /**
   * Ollama 서버 연결 확인
   */
  async checkConnection(): Promise<boolean> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch(this.baseUrl, {
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      return response.ok;
    } catch {
      return false;
    }
  }

  /**
   * 사용 가능한 모델 목록 조회
   */
  async listModels(): Promise<string[]> {
    try {
      const response = await fetch(`${this.baseUrl}/api/tags`);
      if (!response.ok) {
        return [];
      }
      const data: OllamaTagsResponse = await response.json();
      return data.models.map((m) => m.name);
    } catch {
      return [];
    }
  }

  /**
   * 텍스트 생성 (기본)
   */
  private async generate(prompt: string): Promise<string> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(`${this.baseUrl}/api/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: this.model,
          prompt,
          stream: false,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Ollama API error: ${response.status}`);
      }

      const data: OllamaGenerateResponse = await response.json();
      return data.response.trim();
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('Ollama request timeout');
      }
      throw error;
    }
  }

  /**
   * 피드 요약 생성
   */
  async generateSummary(feed: {
    title: string;
    content: string;
    channel?: string;
  }): Promise<string> {
    const prompt = PROMPTS.summary(
      feed.channel || 'Unknown',
      feed.title,
      this.truncateContent(feed.content, 2000)
    );

    const response = await this.generate(prompt);
    return this.cleanResponse(response);
  }

  /**
   * 키워드 추출
   */
  async extractKeywords(content: string): Promise<string[]> {
    const prompt = PROMPTS.keywords(this.truncateContent(content, 2000));
    const response = await this.generate(prompt);

    try {
      const jsonMatch = response.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        const keywords = JSON.parse(jsonMatch[0]);
        if (Array.isArray(keywords)) {
          return keywords.slice(0, 5).map((k) => String(k).toLowerCase());
        }
      }
    } catch {
      // 파싱 실패 시 빈 배열 반환
    }

    return [];
  }

  /**
   * 아이디어 잠재력 평가
   */
  async evaluatePotential(
    content: string
  ): Promise<{ score: number; reason: string }> {
    const prompt = PROMPTS.potential(this.truncateContent(content, 2000));
    const response = await this.generate(prompt);

    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const result = JSON.parse(jsonMatch[0]);
        if (typeof result.score === 'number' && typeof result.reason === 'string') {
          return {
            score: Math.min(10, Math.max(1, Math.round(result.score))),
            reason: result.reason.slice(0, 100),
          };
        }
      }
    } catch {
      // 파싱 실패 시 기본값 반환
    }

    return { score: 5, reason: '분석 결과 파싱 실패' };
  }

  /**
   * 전체 분석 실행 (요약 + 키워드 + 잠재력)
   */
  async analyzeAll(feed: {
    title: string;
    content: string;
    channel?: string;
  }): Promise<AIAnalysisResult> {
    const contentForAnalysis = `${feed.title}\n\n${feed.content}`;

    // 순차 실행 (병렬 시 Ollama 부하 문제 가능)
    const summary = await this.generateSummary(feed);
    const keywords = await this.extractKeywords(contentForAnalysis);
    const potential = await this.evaluatePotential(contentForAnalysis);

    return { summary, keywords, potential };
  }

  /**
   * 컨텐츠 길이 제한
   */
  private truncateContent(content: string, maxLength: number): string {
    if (content.length <= maxLength) {
      return content;
    }
    return content.slice(0, maxLength) + '...';
  }

  /**
   * 응답 정리
   */
  private cleanResponse(response: string): string {
    return response
      .replace(/^(Summary:|요약:)\s*/i, '')
      .replace(/\n+/g, ' ')
      .trim();
  }
}
