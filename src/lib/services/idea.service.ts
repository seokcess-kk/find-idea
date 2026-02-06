import { db } from '@/lib/db';
import { ideas, feeds } from '@/lib/db/schema';
import { eq, desc, and, sql } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';

export type IdeaStage = 'collected' | 'reviewing' | 'promising' | 'building';

export interface CreateIdeaDTO {
  feedId?: string;
  problem: string;
  currentSolution?: string;
  moneyEvidence?: string;
  opportunity?: string;
  oneLineIdea: string;
  stage?: IdeaStage;
  priority?: number;
  tags?: string[];
}

export interface UpdateIdeaDTO {
  problem?: string;
  currentSolution?: string;
  moneyEvidence?: string;
  opportunity?: string;
  oneLineIdea?: string;
  stage?: IdeaStage;
  priority?: number;
  notes?: string;
  nextAction?: string;
  dueDate?: string;
  tags?: string[];
}

export interface IdeaListQuery {
  stage?: IdeaStage;
  priority?: number;
  page?: number;
  limit?: number;
}

export class IdeaService {
  async list(query: IdeaListQuery) {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const offset = (page - 1) * limit;

    const conditions = [];

    if (query.stage) {
      conditions.push(eq(ideas.stage, query.stage));
    }

    if (query.priority) {
      conditions.push(eq(ideas.priority, query.priority));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const ideaList = await db.query.ideas.findMany({
      where: whereClause,
      orderBy: [desc(ideas.priority), desc(ideas.createdAt)],
      limit,
      offset,
    });

    const countResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(ideas)
      .where(whereClause);
    const total = countResult[0]?.count || 0;

    return {
      ideas: ideaList,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getById(id: string) {
    return db.query.ideas.findFirst({
      where: eq(ideas.id, id),
    });
  }

  async create(data: CreateIdeaDTO) {
    const now = new Date().toISOString();
    const id = uuidv4();

    await db.insert(ideas).values({
      id,
      feedId: data.feedId || null,
      problem: data.problem,
      currentSolution: data.currentSolution || null,
      moneyEvidence: data.moneyEvidence || null,
      opportunity: data.opportunity || null,
      oneLineIdea: data.oneLineIdea,
      stage: data.stage || 'collected',
      priority: data.priority || 3,
      tags: data.tags ? JSON.stringify(data.tags) : null,
      createdAt: now,
      updatedAt: now,
    });

    return this.getById(id);
  }

  async update(id: string, data: UpdateIdeaDTO) {
    const now = new Date().toISOString();

    const updateData: Record<string, unknown> = { updatedAt: now };

    if (data.problem !== undefined) updateData.problem = data.problem;
    if (data.currentSolution !== undefined) updateData.currentSolution = data.currentSolution;
    if (data.moneyEvidence !== undefined) updateData.moneyEvidence = data.moneyEvidence;
    if (data.opportunity !== undefined) updateData.opportunity = data.opportunity;
    if (data.oneLineIdea !== undefined) updateData.oneLineIdea = data.oneLineIdea;
    if (data.stage !== undefined) updateData.stage = data.stage;
    if (data.priority !== undefined) updateData.priority = data.priority;
    if (data.notes !== undefined) updateData.notes = data.notes;
    if (data.nextAction !== undefined) updateData.nextAction = data.nextAction;
    if (data.dueDate !== undefined) updateData.dueDate = data.dueDate;
    if (data.tags !== undefined) updateData.tags = JSON.stringify(data.tags);

    await db.update(ideas).set(updateData).where(eq(ideas.id, id));

    return this.getById(id);
  }

  async delete(id: string) {
    await db.delete(ideas).where(eq(ideas.id, id));
    return { success: true };
  }

  async getStats() {
    const stages = ['collected', 'reviewing', 'promising', 'building'] as const;
    const stats: Record<string, number> = {};

    for (const stage of stages) {
      const result = await db
        .select({ count: sql<number>`count(*)` })
        .from(ideas)
        .where(eq(ideas.stage, stage));
      stats[stage] = result[0]?.count || 0;
    }

    const totalResult = await db.select({ count: sql<number>`count(*)` }).from(ideas);
    stats.total = totalResult[0]?.count || 0;

    return stats;
  }
}

export const ideaService = new IdeaService();
