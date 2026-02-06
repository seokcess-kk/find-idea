import { db } from '@/lib/db';
import { channels } from '@/lib/db/schema';
import { eq, sql } from 'drizzle-orm';

export class ChannelService {
  async list() {
    return db.query.channels.findMany({
      orderBy: (channels, { asc }) => [asc(channels.category), asc(channels.name)],
    });
  }

  async getById(id: string) {
    return db.query.channels.findFirst({
      where: eq(channels.id, id),
    });
  }

  async toggleActive(id: string) {
    const channel = await this.getById(id);
    if (!channel) return null;

    const now = new Date().toISOString();
    await db
      .update(channels)
      .set({ isActive: !channel.isActive, updatedAt: now })
      .where(eq(channels.id, id));

    return this.getById(id);
  }

  async getStats() {
    const totalResult = await db.select({ count: sql<number>`count(*)` }).from(channels);
    const activeResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(channels)
      .where(eq(channels.isActive, true));

    const byCategory = await db
      .select({
        category: channels.category,
        count: sql<number>`count(*)`,
      })
      .from(channels)
      .groupBy(channels.category);

    return {
      total: totalResult[0]?.count || 0,
      active: activeResult[0]?.count || 0,
      byCategory: byCategory.reduce(
        (acc, curr) => {
          acc[curr.category] = curr.count;
          return acc;
        },
        {} as Record<string, number>
      ),
    };
  }
}

export const channelService = new ChannelService();
