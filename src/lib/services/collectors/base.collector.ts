// ===========================================
// Content Collector Interface
// ===========================================

/**
 * 수집 결과 타입
 */
export interface CollectResult {
  channelId: string;
  channelName: string;
  success: boolean;
  collected: number;
  duplicates: number;
  error?: string;
}

/**
 * 채널 정보 타입
 */
export interface ChannelInfo {
  id: string;
  name: string;
  rssUrl: string;
  shortCode: string;
  category: string;
  isActive: boolean;
}

/**
 * 수집된 아이템 타입
 */
export interface CollectedItem {
  title: string;
  link: string;
  content: string | null;
  summary: string | null;
  author: string | null;
  publishedAt: string | null;
  // Reddit 추가 메타데이터 (optional)
  upvotes?: number;
  commentCount?: number;
  subreddit?: string;
}

/**
 * Content Collector 인터페이스
 * RSS와 Reddit Collector 모두 이 인터페이스를 구현
 */
export interface IContentCollector {
  /** Collector 타입 */
  readonly type: 'rss' | 'reddit';

  /**
   * 단일 채널에서 수집
   */
  collectFromChannel(channelId: string): Promise<CollectResult>;

  /**
   * 모든 활성 채널에서 수집
   */
  collectAll(): Promise<CollectResult[]>;

  /**
   * 특정 채널 목록에서 수집
   */
  collectFromChannels(channelIds: string[]): Promise<CollectResult[]>;

  /**
   * 해당 URL이 이 collector로 처리 가능한지 확인
   */
  canHandle(url: string): boolean;
}

/**
 * Base Collector 추상 클래스
 * 공통 유틸리티 메서드 제공
 */
export abstract class BaseCollector implements IContentCollector {
  abstract readonly type: 'rss' | 'reddit';

  abstract collectFromChannel(channelId: string): Promise<CollectResult>;
  abstract collectAll(): Promise<CollectResult[]>;
  abstract collectFromChannels(channelIds: string[]): Promise<CollectResult[]>;
  abstract canHandle(url: string): boolean;

  /**
   * 딜레이 유틸리티
   */
  protected delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * 에러 결과 생성
   */
  protected createErrorResult(
    channelId: string,
    channelName: string,
    error: string
  ): CollectResult {
    return {
      channelId,
      channelName,
      success: false,
      collected: 0,
      duplicates: 0,
      error,
    };
  }

  /**
   * 성공 결과 생성
   */
  protected createSuccessResult(
    channelId: string,
    channelName: string,
    collected: number,
    duplicates: number
  ): CollectResult {
    return {
      channelId,
      channelName,
      success: true,
      collected,
      duplicates,
    };
  }
}
