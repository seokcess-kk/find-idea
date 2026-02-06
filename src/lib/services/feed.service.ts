import { db } from '@/lib/db';
import { feeds, channels } from '@/lib/db/schema';
import { eq, desc, asc, and, sql } from 'drizzle-orm';

export interface FeedListQuery {
  channelId?: string;
  category?: string;
  isRead?: boolean;
  isBookmarked?: boolean;
  hasNeedKeyword?: boolean;
  page?: number;
  limit?: number;
  sortBy?: 'newest' | 'oldest' | 'priority';
}

export interface FeedListResponse {
  feeds: (typeof feeds.$inferSelect & { channel?: typeof channels.$inferSelect })[];
  total: number;
  page: number;
  totalPages: number;
}

export class FeedService {
  async list(query: FeedListQuery): Promise<FeedListResponse> {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const offset = (page - 1) * limit;

    // 조건 빌드
    const conditions = [];

    if (query.channelId) {
      conditions.push(eq(feeds.channelId, query.channelId));
    }

    if (query.isRead !== undefined) {
      conditions.push(eq(feeds.isRead, query.isRead));
    }

    if (query.isBookmarked !== undefined) {
      conditions.push(eq(feeds.isBookmarked, query.isBookmarked));
    }

    if (query.hasNeedKeyword !== undefined) {
      conditions.push(eq(feeds.hasNeedKeyword, query.hasNeedKeyword));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // 정렬
    let orderBy;
    switch (query.sortBy) {
      case 'oldest':
        orderBy = asc(feeds.collectedAt);
        break;
      case 'priority':
        orderBy = desc(feeds.priorityScore);
        break;
      case 'newest':
      default:
        orderBy = desc(feeds.collectedAt);
    }

    // 쿼리 실행
    const feedList = await db.query.feeds.findMany({
      where: whereClause,
      orderBy: [orderBy, desc(feeds.createdAt)],
      limit,
      offset,
      with: {
        // channel 관계가 있으면 포함
      },
    });

    // 카운트
    const countResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(feeds)
      .where(whereClause);
    const total = countResult[0]?.count || 0;

    return {
      feeds: feedList,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getById(id: string) {
    return db.query.feeds.findFirst({
      where: eq(feeds.id, id),
    });
  }

  async markAsRead(id: string) {
    const now = new Date().toISOString();
    await db
      .update(feeds)
      .set({ isRead: true, updatedAt: now })
      .where(eq(feeds.id, id));
    return this.getById(id);
  }

  async toggleBookmark(id: string) {
    const feed = await this.getById(id);
    if (!feed) return null;

    const now = new Date().toISOString();
    await db
      .update(feeds)
      .set({ isBookmarked: !feed.isBookmarked, updatedAt: now })
      .where(eq(feeds.id, id));
    return this.getById(id);
  }

  async delete(id: string) {
    await db.delete(feeds).where(eq(feeds.id, id));
    return { success: true };
  }

  async getStats() {
    const totalResult = await db.select({ count: sql<number>`count(*)` }).from(feeds);
    const unreadResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(feeds)
      .where(eq(feeds.isRead, false));
    const bookmarkedResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(feeds)
      .where(eq(feeds.isBookmarked, true));
    const highPriorityResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(feeds)
      .where(sql`${feeds.priorityScore} >= 7`);

    return {
      total: totalResult[0]?.count || 0,
      unread: unreadResult[0]?.count || 0,
      bookmarked: bookmarkedResult[0]?.count || 0,
      highPriority: highPriorityResult[0]?.count || 0,
    };
  }
}

export const feedService = new FeedService();
