// ===========================================
// AI Provider Factory
// ===========================================

import { aiConfig, isOllamaConfigured, isOpenAIConfigured } from '@/lib/config';
import type { IAIProvider, AIProviderStatus } from './ai-provider.interface';
import { OllamaProvider } from './ollama.provider';
import { OpenAIProvider } from './openai.provider';

/**
 * AI Provider Factory
 * 설정에 따라 적절한 AI Provider를 생성하고 관리
 */
class AIProviderFactory {
  private primaryProvider: IAIProvider | null = null;
  private fallbackProvider: IAIProvider | null = null;

  /**
   * Primary Provider 가져오기
   */
  getProvider(): IAIProvider {
    if (!this.primaryProvider) {
      this.primaryProvider = this.createProvider(aiConfig.provider);
    }
    return this.primaryProvider;
  }

  /**
   * Fallback Provider 가져오기 (primary와 다른 provider)
   */
  getFallbackProvider(): IAIProvider | null {
    if (!aiConfig.fallbackEnabled) {
      return null;
    }

    if (!this.fallbackProvider) {
      const fallbackType = aiConfig.provider === 'ollama' ? 'openai' : 'ollama';

      // Fallback provider가 설정되어 있는지 확인
      if (fallbackType === 'openai' && !isOpenAIConfigured()) {
        return null;
      }
      if (fallbackType === 'ollama' && !isOllamaConfigured()) {
        return null;
      }

      this.fallbackProvider = this.createProvider(fallbackType);
    }

    return this.fallbackProvider;
  }

  /**
   * Provider 생성
   */
  private createProvider(type: 'ollama' | 'openai'): IAIProvider {
    switch (type) {
      case 'openai':
        return new OpenAIProvider();
      case 'ollama':
      default:
        return new OllamaProvider();
    }
  }

  /**
   * 현재 Provider 상태 조회
   */
  async getStatus(): Promise<AIProviderStatus> {
    const provider = this.getProvider();
    const available = await provider.checkConnection();
    const models = provider.listModels ? await provider.listModels() : undefined;

    return {
      provider: provider.type,
      available,
      model: provider.model,
      models,
      error: available ? undefined : `${provider.type} is not available`,
    };
  }

  /**
   * Fallback을 포함한 분석 실행
   */
  async analyzeWithFallback(
    feed: { title: string; content: string; channel?: string },
    options?: {
      includeSummary?: boolean;
      includeKeywords?: boolean;
      includePotential?: boolean;
    }
  ): Promise<{
    summary: string | null;
    keywords: string[];
    potential: { score: number; reason: string };
    provider: 'ollama' | 'openai';
  }> {
    const provider = this.getProvider();
    const { includeSummary = true, includeKeywords = true, includePotential = true } = options || {};

    try {
      // Primary provider로 시도
      const isConnected = await provider.checkConnection();
      if (!isConnected) {
        throw new Error(`${provider.type} is not available`);
      }

      let summary: string | null = null;
      let keywords: string[] = [];
      let potential = { score: 5, reason: '분석 미실행' };

      if (includeSummary) {
        summary = await provider.generateSummary(feed);
      }
      if (includeKeywords) {
        keywords = await provider.extractKeywords(`${feed.title}\n${feed.content}`);
      }
      if (includePotential) {
        potential = await provider.evaluatePotential(`${feed.title}\n${feed.content}`);
      }

      return { summary, keywords, potential, provider: provider.type };
    } catch (primaryError) {
      // Fallback이 활성화되어 있으면 fallback provider로 재시도
      const fallback = this.getFallbackProvider();
      if (!fallback) {
        throw primaryError;
      }

      console.log(`[AIFactory] Primary provider (${provider.type}) failed, trying fallback (${fallback.type})`);

      try {
        const isConnected = await fallback.checkConnection();
        if (!isConnected) {
          throw new Error(`Fallback ${fallback.type} is also not available`);
        }

        let summary: string | null = null;
        let keywords: string[] = [];
        let potential = { score: 5, reason: '분석 미실행' };

        if (includeSummary) {
          summary = await fallback.generateSummary(feed);
        }
        if (includeKeywords) {
          keywords = await fallback.extractKeywords(`${feed.title}\n${feed.content}`);
        }
        if (includePotential) {
          potential = await fallback.evaluatePotential(`${feed.title}\n${feed.content}`);
        }

        return { summary, keywords, potential, provider: fallback.type };
      } catch (fallbackError) {
        // Fallback도 실패하면 원래 에러 throw
        throw primaryError;
      }
    }
  }

  /**
   * Provider 초기화 (테스트용)
   */
  reset(): void {
    this.primaryProvider = null;
    this.fallbackProvider = null;
  }
}

// 싱글톤 인스턴스
export const aiFactory = new AIProviderFactory();

// 편의 함수: 현재 Provider 가져오기
export function getAIProvider(): IAIProvider {
  return aiFactory.getProvider();
}
