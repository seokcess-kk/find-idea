import { NextRequest, NextResponse } from 'next/server';
import { ideaService, type IdeaStage } from '@/lib/services/idea.service';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;

    const query = {
      stage: searchParams.get('stage') as IdeaStage | undefined,
      priority: searchParams.get('priority') ? parseInt(searchParams.get('priority')!) : undefined,
      page: parseInt(searchParams.get('page') || '1'),
      limit: parseInt(searchParams.get('limit') || '20'),
    };

    const result = await ideaService.list(query);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching ideas:', error);
    return NextResponse.json({ error: 'Failed to fetch ideas' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.problem || !body.oneLineIdea) {
      return NextResponse.json(
        { error: 'problem and oneLineIdea are required' },
        { status: 400 }
      );
    }

    const idea = await ideaService.create(body);
    return NextResponse.json(idea, { status: 201 });
  } catch (error) {
    console.error('Error creating idea:', error);
    return NextResponse.json({ error: 'Failed to create idea' }, { status: 500 });
  }
}
