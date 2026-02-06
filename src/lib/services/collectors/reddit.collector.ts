// ===========================================
// Reddit Content Collector (OAuth2)
// ===========================================

import { db } from '@/lib/db';
import { channels, feeds } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';
import { SmartFilter } from '@/lib/utils/smart-filter';
import { redditConfig, isRedditConfigured } from '@/lib/config';
import { BaseCollector, CollectResult } from './base.collector';

interface RedditTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  scope: string;
}

interface RedditPost {
  kind: string;
  data: {
    id: string;
    title: string;
    selftext: string;
    selftext_html: string | null;
    author: string;
    subreddit: string;
    permalink: string;
    url: string;
    created_utc: number;
    score: number;
    num_comments: number;
    is_self: boolean;
  };
}

interface RedditListingResponse {
  kind: string;
  data: {
    after: string | null;
    before: string | null;
    children: RedditPost[];
  };
}

export class RedditCollector extends BaseCollector {
  readonly type = 'reddit' as const;

  private accessToken: string | null = null;
  private tokenExpiry: number = 0;

  /**
   * Reddit URL인지 확인
   */
  canHandle(url: string): boolean {
    return url.includes('reddit.com');
  }

  /**
   * OAuth2 액세스 토큰 획득
   */
  private async getAccessToken(): Promise<string> {
    // 토큰이 유효하면 재사용
    if (this.accessToken && Date.now() < this.tokenExpiry - 60000) {
      return this.accessToken;
    }

    if (!isRedditConfigured()) {
      throw new Error('REDDIT_NOT_CONFIGURED');
    }

    const credentials = Buffer.from(
      `${redditConfig.clientId}:${redditConfig.clientSecret}`
    ).toString('base64');

    const response = await fetch('https://www.reddit.com/api/v1/access_token', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': redditConfig.userAgent,
      },
      body: new URLSearchParams({
        grant_type: 'password',
        username: redditConfig.username,
        password: redditConfig.password,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Reddit OAuth failed: ${response.status} - ${error}`);
    }

    const data: RedditTokenResponse = await response.json();
    this.accessToken = data.access_token;
    this.tokenExpiry = Date.now() + data.expires_in * 1000;

    return this.accessToken;
  }

  /**
   * Subreddit 이름 추출
   */
  private extractSubreddit(url: string): string | null {
    // https://www.reddit.com/r/SaaS/.rss 형식에서 SaaS 추출
    const match = url.match(/reddit\.com\/r\/([^\/]+)/);
    return match ? match[1] : null;
  }

  /**
   * Reddit API로 포스트 가져오기
   */
  private async fetchPosts(subreddit: string, limit: number = 25): Promise<RedditPost[]> {
    const token = await this.getAccessToken();

    const response = await fetch(
      `https://oauth.reddit.com/r/${subreddit}/new?limit=${limit}`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'User-Agent': redditConfig.userAgent,
        },
      }
    );

    if (!response.ok) {
      if (response.status === 403) {
        throw new Error(`Subreddit r/${subreddit} is private or quarantined`);
      }
      if (response.status === 404) {
        throw new Error(`Subreddit r/${subreddit} not found`);
      }
      throw new Error(`Reddit API error: ${response.status}`);
    }

    const data: RedditListingResponse = await response.json();
    return data.data.children;
  }

  /**
   * 단일 채널에서 Reddit 수집
   */
  async collectFromChannel(channelId: string): Promise<CollectResult> {
    const channel = await db.query.channels.findFirst({
      where: eq(channels.id, channelId),
    });

    if (!channel) {
      return this.createErrorResult(channelId, 'Unknown', 'Channel not found');
    }

    // Reddit 설정 확인
    if (!isRedditConfigured()) {
      return this.createErrorResult(
        channelId,
        channel.name,
        'Reddit API not configured. Please set REDDIT_CLIENT_ID, REDDIT_CLIENT_SECRET, REDDIT_USERNAME, REDDIT_PASSWORD in .env'
      );
    }

    const subreddit = this.extractSubreddit(channel.rssUrl);
    if (!subreddit) {
      return this.createErrorResult(channelId, channel.name, 'Invalid Reddit URL');
    }

    try {
      const posts = await this.fetchPosts(subreddit);
      const now = new Date().toISOString();

      let collected = 0;
      let duplicates = 0;

      for (const post of posts) {
        const postData = post.data;
        const link = `https://www.reddit.com${postData.permalink}`;

        // 중복 체크
        const existing = await db.query.feeds.findFirst({
          where: eq(feeds.link, link),
        });

        if (existing) {
          duplicates++;
          continue;
        }

        // 컨텐츠 구성
        const content = postData.selftext || '';
        const textToAnalyze = `${postData.title} ${content}`;
        const analysis = SmartFilter.getAnalysisForDb(textToAnalyze);

        // 피드 저장
        await db.insert(feeds).values({
          id: uuidv4(),
          channelId: channel.id,
          title: postData.title,
          link,
          content: content || null,
          summary: content.slice(0, 500) || null,
          author: postData.author,
          publishedAt: new Date(postData.created_utc * 1000).toISOString(),
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

      return this.createSuccessResult(channelId, channel.name, collected, duplicates);
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

      return this.createErrorResult(channelId, channel.name, errorMessage);
    }
  }

  /**
   * 모든 활성 Reddit 채널에서 수집
   */
  async collectAll(): Promise<CollectResult[]> {
    const activeChannels = await db.query.channels.findMany({
      where: eq(channels.isActive, true),
    });

    // Reddit 채널만 필터링
    const redditChannels = activeChannels.filter((ch) => this.canHandle(ch.rssUrl));
    const results: CollectResult[] = [];

    for (const channel of redditChannels) {
      console.log(`[Reddit] Collecting from ${channel.name}...`);
      const result = await this.collectFromChannel(channel.id);
      results.push(result);

      // Reddit API rate limit: 60 requests/minute
      // 1초 딜레이로 안전하게 처리
      await this.delay(1000);
    }

    return results;
  }

  /**
   * 특정 채널 목록에서 수집
   */
  async collectFromChannels(channelIds: string[]): Promise<CollectResult[]> {
    const results: CollectResult[] = [];

    for (const channelId of channelIds) {
      const result = await this.collectFromChannel(channelId);
      results.push(result);
      await this.delay(1000);
    }

    return results;
  }
}

// 싱글톤 인스턴스
export const redditCollector = new RedditCollector();
