import { db } from '@/lib/db';
import { feedAnalysis, feeds, channels } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';
import { aiFactory } from './ai';
import type { FeedAnalysis, AIStatus, AnalyzeOptions } from '@/types';

export class AnalysisService {
  /**
   * AI Provider 연결 상태 확인
   */
  async getStatus(): Promise<AIStatus> {
    const status = await aiFactory.getStatus();
    const fallback = aiFactory.getFallbackProvider();

    return {
      provider: status.provider,
      available: status.available,
      model: status.model,
      models: status.models || [],
      fallbackEnabled: !!fallback,
      fallbackProvider: fallback?.type,
      error: status.error,
    };
  }

  /**
   * 피드 분석 결과 조회
   */
  async getAnalysis(feedId: string): Promise<FeedAnalysis | null> {
    const result = await db
      .select()
      .from(feedAnalysis)
      .where(eq(feedAnalysis.feedId, feedId))
      .limit(1);

    if (result.length === 0) {
      return null;
    }

    return this.mapToFeedAnalysis(result[0]);
  }

  /**
   * 단일 피드 분석 실행
   */
  async analyzeFeed(
    feedId: string,
    options: AnalyzeOptions = {}
  ): Promise<FeedAnalysis> {
    const {
      includeSummary = true,
      includeKeywords = true,
      includePotential = true,
    } = options;

    // 피드 조회
    const feedResult = await db
      .select({
        feed: feeds,
        channel: channels,
      })
      .from(feeds)
      .leftJoin(channels, eq(feeds.channelId, channels.id))
      .where(eq(feeds.id, feedId))
      .limit(1);

    if (feedResult.length === 0) {
      throw new Error('FEED_NOT_FOUND');
    }

    const { feed, channel } = feedResult[0];
    const now = new Date().toISOString();

    // 기존 분석 결과 확인
    const existing = await this.getAnalysis(feedId);
    const analysisId = existing?.id || uuidv4();

    // 분석 시작 상태로 업데이트
    if (existing) {
      await db
        .update(feedAnalysis)
        .set({
          status: 'analyzing',
          updatedAt: now,
        })
        .where(eq(feedAnalysis.id, analysisId));
    } else {
      await db.insert(feedAnalysis).values({
        id: analysisId,
        feedId,
        status: 'analyzing',
        createdAt: now,
        updatedAt: now,
      });
    }

    try {
      // AI Factory를 통한 분석 실행 (fallback 지원)
      const content = feed.content || feed.title;
      const result = await aiFactory.analyzeWithFallback(
        {
          title: feed.title,
          content,
          channel: channel?.name,
        },
        {
          includeSummary,
          includeKeywords,
          includePotential,
        }
      );

      // 결과 저장
      const completedAt = new Date().toISOString();
      const provider = aiFactory.getProvider();
      const modelUsed = `${result.provider}:${provider.model}`;

      await db
        .update(feedAnalysis)
        .set({
          summary: result.summary,
          keywords: JSON.stringify(result.keywords),
          potentialScore: result.potential.score,
          potentialReason: result.potential.reason,
          modelUsed,
          status: 'completed',
          errorMessage: null,
          analyzedAt: completedAt,
          updatedAt: completedAt,
        })
        .where(eq(feedAnalysis.id, analysisId));

      return {
        id: analysisId,
        feedId,
        summary: result.summary,
        keywords: result.keywords,
        potentialScore: result.potential.score,
        potentialReason: result.potential.reason,
        modelUsed,
        status: 'completed',
        errorMessage: null,
        analyzedAt: completedAt,
        createdAt: existing?.createdAt || now,
        updatedAt: completedAt,
      };
    } catch (error) {
      // 실패 상태로 업데이트
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      const failedAt = new Date().toISOString();

      await db
        .update(feedAnalysis)
        .set({
          status: 'failed',
          errorMessage,
          updatedAt: failedAt,
        })
        .where(eq(feedAnalysis.id, analysisId));

      throw error;
    }
  }

  /**
   * 분석 결과 삭제
   */
  async deleteAnalysis(feedId: string): Promise<void> {
    await db.delete(feedAnalysis).where(eq(feedAnalysis.feedId, feedId));
  }

  /**
   * DB 결과를 FeedAnalysis 타입으로 변환
   */
  private mapToFeedAnalysis(row: typeof feedAnalysis.$inferSelect): FeedAnalysis {
    let keywords: string[] = [];
    try {
      keywords = row.keywords ? JSON.parse(row.keywords) : [];
    } catch {
      keywords = [];
    }

    return {
      id: row.id,
      feedId: row.feedId,
      summary: row.summary,
      keywords,
      potentialScore: row.potentialScore,
      potentialReason: row.potentialReason,
      modelUsed: row.modelUsed,
      status: (row.status as FeedAnalysis['status']) || 'pending',
      errorMessage: row.errorMessage,
      analyzedAt: row.analyzedAt,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }
}

// 싱글톤 인스턴스
export const analysisService = new AnalysisService();
