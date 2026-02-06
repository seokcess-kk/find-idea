export async function register() {
  // 서버 사이드에서만 실행
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { schedulerService } = await import('@/lib/scheduler');

    // 스케줄러 초기화
    await schedulerService.initialize();

    // 프로세스 종료 시 정리
    process.on('SIGTERM', () => {
      console.log('[Instrumentation] SIGTERM received, stopping scheduler');
      schedulerService.stop();
    });

    process.on('SIGINT', () => {
      console.log('[Instrumentation] SIGINT received, stopping scheduler');
      schedulerService.stop();
    });
  }
}
