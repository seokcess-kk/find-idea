import { NextRequest, NextResponse } from 'next/server';
import { feedService } from '@/lib/services/feed.service';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;

    const query = {
      channelId: searchParams.get('channelId') || undefined,
      isRead: searchParams.get('isRead') === 'true' ? true : searchParams.get('isRead') === 'false' ? false : undefined,
      isBookmarked: searchParams.get('isBookmarked') === 'true' ? true : undefined,
      hasNeedKeyword: searchParams.get('hasNeedKeyword') === 'true' ? true : undefined,
      page: parseInt(searchParams.get('page') || '1'),
      limit: parseInt(searchParams.get('limit') || '20'),
      sortBy: (searchParams.get('sortBy') as 'newest' | 'oldest' | 'priority') || 'priority',
    };

    const result = await feedService.list(query);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching feeds:', error);
    return NextResponse.json({ error: 'Failed to fetch feeds' }, { status: 500 });
  }
}
