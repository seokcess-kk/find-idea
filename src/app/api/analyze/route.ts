import { NextRequest, NextResponse } from 'next/server';
import { analysisService } from '@/lib/services/analysis.service';
import type { AnalyzeRequest, AnalyzeResponse } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const body: AnalyzeRequest = await request.json();

    if (!body.feedId) {
      return NextResponse.json<AnalyzeResponse>(
        {
          success: false,
          error: 'INVALID_FEED_ID',
        },
        { status: 400 }
      );
    }

    const analysis = await analysisService.analyzeFeed(body.feedId, body.options);

    return NextResponse.json<AnalyzeResponse>({
      success: true,
      analysis,
    });
  } catch (error) {
    console.error('Analysis failed:', error);

    const errorMessage = error instanceof Error ? error.message : 'ANALYSIS_FAILED';

    // 에러 타입에 따른 상태 코드
    let status = 500;
    if (errorMessage === 'FEED_NOT_FOUND') {
      status = 404;
    } else if (errorMessage.includes('not available') || errorMessage.includes('UNAVAILABLE')) {
      status = 503;
    }

    return NextResponse.json<AnalyzeResponse>(
      {
        success: false,
        error: errorMessage,
      },
      { status }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const feedId = searchParams.get('feedId');

    if (!feedId) {
      return NextResponse.json(
        { success: false, error: 'INVALID_FEED_ID' },
        { status: 400 }
      );
    }

    const analysis = await analysisService.getAnalysis(feedId);

    return NextResponse.json({
      success: true,
      analysis,
    });
  } catch (error) {
    console.error('Failed to get analysis:', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
