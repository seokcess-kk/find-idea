// ===========================================
// Collectors Module Export & Factory
// ===========================================

export type { CollectResult, ChannelInfo, CollectedItem, IContentCollector } from './base.collector';
export { BaseCollector } from './base.collector';
export { RSSCollector, rssCollector } from './rss.collector';
export { RedditCollector, redditCollector } from './reddit.collector';

import { db } from '@/lib/db';
import { channels } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { rssCollector } from './rss.collector';
import { redditCollector } from './reddit.collector';
import type { CollectResult, IContentCollector } from './base.collector';

/**
 * Collector Factory
 * URL 패턴에 따라 적절한 collector를 선택
 */
class CollectorFactory {
  private collectors: IContentCollector[] = [redditCollector, rssCollector];

  /**
   * URL에 맞는 collector 반환
   */
  getCollectorForUrl(url: string): IContentCollector {
    for (const collector of this.collectors) {
      if (collector.canHandle(url)) {
        return collector;
      }
    }
    // 기본값은 RSS
    return rssCollector;
  }

  /**
   * 단일 채널 수집 (자동으로 적절한 collector 선택)
   */
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

    const collector = this.getCollectorForUrl(channel.rssUrl);
    return collector.collectFromChannel(channelId);
  }

  /**
   * 모든 활성 채널 수집 (각 채널에 맞는 collector 사용)
   */
  async collectAll(): Promise<CollectResult[]> {
    const activeChannels = await db.query.channels.findMany({
      where: eq(channels.isActive, true),
    });

    const results: CollectResult[] = [];

    // Reddit 채널 먼저 수집 (OAuth 토큰 재사용)
    const redditChannels = activeChannels.filter((ch) => redditCollector.canHandle(ch.rssUrl));
    const rssChannels = activeChannels.filter((ch) => rssCollector.canHandle(ch.rssUrl));

    console.log(`[Collector] Found ${redditChannels.length} Reddit channels, ${rssChannels.length} RSS channels`);

    // Reddit 채널 수집
    for (const channel of redditChannels) {
      console.log(`[Collector] Reddit: ${channel.name}`);
      const result = await redditCollector.collectFromChannel(channel.id);
      results.push(result);
    }

    // RSS 채널 수집
    for (const channel of rssChannels) {
      console.log(`[Collector] RSS: ${channel.name}`);
      const result = await rssCollector.collectFromChannel(channel.id);
      results.push(result);
    }

    return results;
  }

  /**
   * 특정 채널 목록 수집
   */
  async collectFromChannels(channelIds: string[]): Promise<CollectResult[]> {
    const results: CollectResult[] = [];

    for (const channelId of channelIds) {
      const result = await this.collectFromChannel(channelId);
      results.push(result);
    }

    return results;
  }
}

// 싱글톤 인스턴스
export const collectorFactory = new CollectorFactory();
