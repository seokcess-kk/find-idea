// ===========================================
// OpenAI AI Provider
// ===========================================

import { openaiConfig, PROMPTS } from '@/lib/config';
import type { IAIProvider, AIAnalysisResult } from './ai-provider.interface';

interface OpenAIChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface OpenAIChatResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: {
    index: number;
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }[];
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export class OpenAIProvider implements IAIProvider {
  readonly type = 'openai' as const;
  readonly model: string;
  private apiKey: string;
  private timeout: number;
  private baseUrl = 'https://api.openai.com/v1';

  constructor(config?: Partial<typeof openaiConfig>) {
    this.apiKey = config?.apiKey || openaiConfig.apiKey;
    this.model = config?.model || openaiConfig.model;
    this.timeout = config?.timeout || openaiConfig.timeout;
  }

  /**
   * OpenAI API 연결 확인
   */
  async checkConnection(): Promise<boolean> {
    if (!this.apiKey || !this.apiKey.startsWith('sk-')) {
      return false;
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch(`${this.baseUrl}/models`, {
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
        },
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
      const response = await fetch(`${this.baseUrl}/models`, {
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
        },
      });

      if (!response.ok) {
        return [];
      }

      const data = await response.json();
      return data.data
        .filter((m: { id: string }) => m.id.startsWith('gpt-'))
        .map((m: { id: string }) => m.id);
    } catch {
      return [];
    }
  }

  /**
   * Chat Completion API 호출
   */
  private async chat(messages: OpenAIChatMessage[]): Promise<string> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: this.model,
          messages,
          temperature: 0.7,
          max_tokens: 500,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(`OpenAI API error: ${response.status} - ${error.error?.message || 'Unknown error'}`);
      }

      const data: OpenAIChatResponse = await response.json();
      return data.choices[0]?.message?.content?.trim() || '';
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('OpenAI request timeout');
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
      this.truncateContent(feed.content, 4000)
    );

    const response = await this.chat([
      {
        role: 'system',
        content: 'You are a helpful assistant that analyzes posts for product ideas. Always respond in Korean.',
      },
      { role: 'user', content: prompt },
    ]);

    return this.cleanResponse(response);
  }

  /**
   * 키워드 추출
   */
  async extractKeywords(content: string): Promise<string[]> {
    const prompt = PROMPTS.keywords(this.truncateContent(content, 4000));

    const response = await this.chat([
      {
        role: 'system',
        content: 'You are a keyword extraction assistant. Return only a JSON array of keywords.',
      },
      { role: 'user', content: prompt },
    ]);

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
    const prompt = PROMPTS.potential(this.truncateContent(content, 4000));

    const response = await this.chat([
      {
        role: 'system',
        content: 'You are an idea evaluator. Respond only in the specified JSON format.',
      },
      { role: 'user', content: prompt },
    ]);

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
   * OpenAI는 병렬 요청 가능하므로 Promise.all 사용
   */
  async analyzeAll(feed: {
    title: string;
    content: string;
    channel?: string;
  }): Promise<AIAnalysisResult> {
    const contentForAnalysis = `${feed.title}\n\n${feed.content}`;

    // OpenAI는 rate limit이 높으므로 병렬 실행 가능
    const [summary, keywords, potential] = await Promise.all([
      this.generateSummary(feed),
      this.extractKeywords(contentForAnalysis),
      this.evaluatePotential(contentForAnalysis),
    ]);

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
