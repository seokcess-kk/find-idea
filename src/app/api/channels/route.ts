import { NextRequest, NextResponse } from 'next/server';
import { channelService } from '@/lib/services/channel.service';

export async function GET() {
  try {
    const channels = await channelService.list();
    const stats = await channelService.getStats();
    return NextResponse.json({ channels, stats });
  } catch (error) {
    console.error('Error fetching channels:', error);
    return NextResponse.json({ error: 'Failed to fetch channels' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.id) {
      return NextResponse.json({ error: 'Channel ID required' }, { status: 400 });
    }

    if (body.isActive !== undefined) {
      const channel = await channelService.toggleActive(body.id);
      return NextResponse.json(channel);
    }

    return NextResponse.json({ error: 'Invalid update' }, { status: 400 });
  } catch (error) {
    console.error('Error updating channel:', error);
    return NextResponse.json({ error: 'Failed to update channel' }, { status: 500 });
  }
}
