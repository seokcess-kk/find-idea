import { NextResponse } from 'next/server';
import { schedulerService } from '@/lib/scheduler';

// POST /api/scheduler/trigger - 수동 실행 트리거
export async function POST() {
  try {
    // 이미 실행 중인지 확인
    if (schedulerService.getIsRunning()) {
      return NextResponse.json(
        { success: false, error: 'Collection already in progress' },
        { status: 409 }
      );
    }

    const result = await schedulerService.runScheduledCollection('api');

    return NextResponse.json({
      success: true,
      result,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[API] Failed to trigger scheduler:', error);

    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
