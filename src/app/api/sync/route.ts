import { NextRequest, NextResponse } from 'next/server';
import { rssCollector } from '@/lib/services/rss.collector';
import { channelService } from '@/lib/services/channel.service';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const channelIds = body.channelIds as string[] | undefined;

    let results;

    if (channelIds && channelIds.length > 0) {
      // 특정 채널만 수집
      results = await rssCollector.collectFromChannels(channelIds);
    } else {
      // 모든 활성 채널 수집
      results = await rssCollector.collectAll();
    }

    const summary = {
      total: results.length,
      success: results.filter((r) => r.success).length,
      failed: results.filter((r) => !r.success).length,
      collected: results.reduce((sum, r) => sum + r.collected, 0),
      duplicates: results.reduce((sum, r) => sum + r.duplicates, 0),
    };

    return NextResponse.json({ results, summary });
  } catch (error) {
    console.error('Error syncing feeds:', error);
    return NextResponse.json({ error: 'Failed to sync feeds' }, { status: 500 });
  }
}

export async function GET() {
  try {
    const channels = await channelService.list();

    const lastSync = channels
      .filter((ch) => ch.lastFetchedAt)
      .sort((a, b) => new Date(b.lastFetchedAt!).getTime() - new Date(a.lastFetchedAt!).getTime())[0];

    const channelStatus = channels.map((ch) => ({
      id: ch.id,
      name: ch.name,
      shortCode: ch.shortCode,
      status: ch.fetchStatus,
      lastFetched: ch.lastFetchedAt,
      error: ch.errorMessage,
    }));

    return NextResponse.json({
      lastSync: lastSync?.lastFetchedAt || null,
      channels: channelStatus,
    });
  } catch (error) {
    console.error('Error getting sync status:', error);
    return NextResponse.json({ error: 'Failed to get sync status' }, { status: 500 });
  }
}
