import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { feeds, ideas, channels } from '@/lib/db/schema';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const format = searchParams.get('format') || 'json';
    const type = searchParams.get('type') || 'all';

    let data: Record<string, unknown> = {};

    if (type === 'feeds' || type === 'all') {
      data.feeds = await db.select().from(feeds);
    }

    if (type === 'ideas' || type === 'all') {
      data.ideas = await db.select().from(ideas);
    }

    if (type === 'channels' || type === 'all') {
      data.channels = await db.select().from(channels);
    }

    if (format === 'csv') {
      // CSV 형식 변환
      let csv = '';

      if (type === 'feeds' && Array.isArray(data.feeds)) {
        const feedData = data.feeds as Record<string, unknown>[];
        if (feedData.length > 0) {
          csv = Object.keys(feedData[0]).join(',') + '\n';
          csv += feedData
            .map((row) =>
              Object.values(row)
                .map((v) => `"${String(v || '').replace(/"/g, '""')}"`)
                .join(',')
            )
            .join('\n');
        }
      } else if (type === 'ideas' && Array.isArray(data.ideas)) {
        const ideaData = data.ideas as Record<string, unknown>[];
        if (ideaData.length > 0) {
          csv = Object.keys(ideaData[0]).join(',') + '\n';
          csv += ideaData
            .map((row) =>
              Object.values(row)
                .map((v) => `"${String(v || '').replace(/"/g, '""')}"`)
                .join(',')
            )
            .join('\n');
        }
      }

      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="${type}-export.csv"`,
        },
      });
    }

    // JSON 형식
    return new NextResponse(JSON.stringify(data, null, 2), {
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="${type}-export.json"`,
      },
    });
  } catch (error) {
    console.error('Error exporting data:', error);
    return NextResponse.json({ error: 'Failed to export data' }, { status: 500 });
  }
}
