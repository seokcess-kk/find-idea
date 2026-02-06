import { NextResponse } from 'next/server';
import { analysisService } from '@/lib/services/analysis.service';

export async function GET() {
  try {
    const status = await analysisService.getStatus();

    return NextResponse.json(status);
  } catch (error) {
    console.error('Failed to get Ollama status:', error);

    return NextResponse.json(
      {
        available: false,
        url: process.env.OLLAMA_URL || 'http://localhost:11434',
        model: process.env.OLLAMA_MODEL || 'llama3.2',
        models: [],
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
