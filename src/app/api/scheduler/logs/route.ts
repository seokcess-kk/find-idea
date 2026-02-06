import { NextResponse } from 'next/server';
import { schedulerService } from '@/lib/scheduler';

// GET /api/scheduler/logs - 실행 로그 조회
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10');

    const logs = await schedulerService.getLogs(Math.min(limit, 100));

    return NextResponse.json({
      logs,
      total: logs.length,
    });
  } catch (error) {
    console.error('[API] Failed to get scheduler logs:', error);
    return NextResponse.json(
      { error: 'Failed to get scheduler logs' },
      { status: 500 }
    );
  }
}
