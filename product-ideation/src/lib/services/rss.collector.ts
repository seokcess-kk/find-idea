import Parser from 'rss-parser';
import { db } from '@/lib/db';
import { channels, feeds } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';
import { SmartFilter } from '@/lib/utils/smart-filter';

const parser = new Parser({
  timeout: 10000,
  headers: {
    'User-Agent': 'Product-Ideation-Bot/1.0',
  },
});

export interface CollectResult {
  channelId: string;
  channelName: string;
  success: boolean;
  collected: number;
  duplicates: number;
  error?: string;
}

export class RSSCollector {
  private async delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  async collectFromChannel(channelId: string): Promise<CollectResult> {
    const channel = await db.query.channels.findFirst({
      where: eq(channels.id, channelId),
    });

    if (!channel) {
      return {
        channelId,
        channelName: 'Unknown',
        success: false,
        collected: 0,
        duplicates: 0,
        error: 'Channel not found',
      };
    }

    try {
      const feed = await parser.parseURL(channel.rssUrl);
      const now = new Date().toISOString();

      let collected = 0;
      let duplicates = 0;

      for (const item of feed.items) {
        if (!item.link) continue;

        // 중복 체크
        const existing = await db.query.feeds.findFirst({
          where: eq(feeds.link, item.link),
        });

        if (existing) {
          duplicates++;
          continue;
        }

        // 텍스트 분석
        const textToAnalyze = `${item.title || ''} ${item.content || item.contentSnippet || ''}`;
        const analysis = SmartFilter.getAnalysisForDb(textToAnalyze);

        // 피드 저장
        await db.insert(feeds).values({
          id: uuidv4(),
          channelId: channel.id,
          title: item.title || 'No Title',
          link: item.link,
          content: item.content || item.contentSnippet || null,
          summary: item.contentSnippet?.slice(0, 500) || null,
          author: item.creator || item.author || null,
          publishedAt: item.pubDate || item.isoDate || null,
          collectedAt: now,
          isRead: false,
          isBookmarked: false,
          ...analysis,
          createdAt: now,
          updatedAt: now,
        });

        collected++;
      }

      // 채널 상태 업데이트
      await db
        .update(channels)
        .set({
          lastFetchedAt: now,
          fetchStatus: 'success',
          errorMessage: null,
          updatedAt: now,
        })
        .where(eq(channels.id, channelId));

      return {
        channelId,
        channelName: channel.name,
        success: true,
        collected,
        duplicates,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const now = new Date().toISOString();

      // 채널 에러 상태 업데이트
      await db
        .update(channels)
        .set({
          fetchStatus: 'failed',
          errorMessage,
          updatedAt: now,
        })
        .where(eq(channels.id, channelId));

      return {
        channelId,
        channelName: channel.name,
        success: false,
        collected: 0,
        duplicates: 0,
        error: errorMessage,
      };
    }
  }

  async collectAll(): Promise<CollectResult[]> {
    const activeChannels = await db.query.channels.findMany({
      where: eq(channels.isActive, true),
    });

    const results: CollectResult[] = [];

    for (const channel of activeChannels) {
      console.log(`Collecting from ${channel.name}...`);
      const result = await this.collectFromChannel(channel.id);
      results.push(result);

      // 채널 간 딜레이 (Rate Limiting 방지)
      await this.delay(500);
    }

    return results;
  }

  async collectFromChannels(channelIds: string[]): Promise<CollectResult[]> {
    const results: CollectResult[] = [];

    for (const channelId of channelIds) {
      const result = await this.collectFromChannel(channelId);
      results.push(result);
      await this.delay(500);
    }

    return results;
  }
}

export const rssCollector = new RSSCollector();
