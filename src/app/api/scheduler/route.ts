import { NextResponse } from 'next/server';
import { schedulerService } from '@/lib/scheduler';
import cron from 'node-cron';

const SCHEDULE_PRESETS = [
  { label: '매일 오전 6시', value: '0 6 * * *', description: '일찍 확인' },
  { label: '매일 오전 9시', value: '0 9 * * *', description: '권장' },
  { label: '매일 오후 12시', value: '0 12 * * *', description: '점심 시간' },
  { label: '매일 오후 6시', value: '0 18 * * *', description: '퇴근 시간' },
  { label: '12시간마다', value: '0 */12 * * *', description: '자주 확인' },
  { label: '6시간마다', value: '0 */6 * * *', description: '실시간에 가깝게' },
];

// GET /api/scheduler - 스케줄러 상태 조회
export async function GET() {
  try {
    const status = await schedulerService.getStatus();

    return NextResponse.json({
      ...status,
      presets: SCHEDULE_PRESETS,
    });
  } catch (error) {
    console.error('[API] Failed to get scheduler status:', error);
    return NextResponse.json(
      { error: 'Failed to get scheduler status' },
      { status: 500 }
    );
  }
}

// POST /api/scheduler - 스케줄러 설정 변경
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { enabled, cronExpression } = body;

    if (typeof enabled === 'boolean') {
      await schedulerService.setEnabled(enabled);
    }

    if (cronExpression && typeof cronExpression === 'string') {
      // Cron 표현식 유효성 검사
      if (!cron.validate(cronExpression)) {
        return NextResponse.json(
          { error: 'Invalid cron expression' },
          { status: 400 }
        );
      }
      await schedulerService.reschedule(cronExpression);
    }

    const status = await schedulerService.getStatus();

    return NextResponse.json({
      success: true,
      config: {
        enabled: status.enabled,
        cronExpression: status.cronExpression,
        timezone: status.timezone,
      },
    });
  } catch (error) {
    console.error('[API] Failed to update scheduler:', error);
    return NextResponse.json(
      { error: 'Failed to update scheduler' },
      { status: 500 }
    );
  }
}
