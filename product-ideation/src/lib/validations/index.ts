import { z } from 'zod';

// Feed validation schemas
export const feedUpdateSchema = z.object({
  isRead: z.boolean().optional(),
  isBookmarked: z.boolean().optional(),
});

export const feedQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  channelId: z.string().uuid().optional(),
  isRead: z.coerce.boolean().optional(),
  isBookmarked: z.coerce.boolean().optional(),
  hasNeedKeyword: z.coerce.boolean().optional(),
  hasMoneyKeyword: z.coerce.boolean().optional(),
  minPriority: z.coerce.number().min(0).max(10).optional(),
  search: z.string().optional(),
});

// Idea validation schemas
export const ideaCreateSchema = z.object({
  feedId: z.string().uuid().optional(),
  problem: z.string().min(1, 'Problem is required'),
  currentSolution: z.string().optional(),
  moneyEvidence: z.string().optional(),
  opportunity: z.string().optional(),
  oneLineIdea: z.string().min(1, 'One line idea is required'),
  stage: z.enum(['collected', 'reviewing', 'promising', 'building']).default('collected'),
  priority: z.number().min(1).max(5).default(3),
  notes: z.string().optional(),
  nextAction: z.string().optional(),
  dueDate: z.string().datetime().optional(),
  tags: z.string().optional(),
});

export const ideaUpdateSchema = ideaCreateSchema.partial();

export const ideaQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  stage: z.enum(['collected', 'reviewing', 'promising', 'building']).optional(),
  minPriority: z.coerce.number().min(1).max(5).optional(),
  search: z.string().optional(),
  tag: z.string().optional(),
});

// Channel validation schemas
export const channelCreateSchema = z.object({
  name: z.string().min(1, 'Channel name is required'),
  rssUrl: z.string().url('Invalid RSS URL'),
  shortCode: z.string().min(1).max(10),
  category: z.enum(['direct_needs', 'trends', 'builders', 'insights']),
  isActive: z.boolean().default(true),
});

export const channelUpdateSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).optional(),
  rssUrl: z.string().url().optional(),
  shortCode: z.string().min(1).max(10).optional(),
  category: z.enum(['direct_needs', 'trends', 'builders', 'insights']).optional(),
  isActive: z.boolean().optional(),
});

// Export validation schemas
export const exportQuerySchema = z.object({
  type: z.enum(['feeds', 'ideas']),
  format: z.enum(['json', 'csv']),
});

// Type inference helpers
export type FeedUpdate = z.infer<typeof feedUpdateSchema>;
export type FeedQuery = z.infer<typeof feedQuerySchema>;
export type IdeaCreate = z.infer<typeof ideaCreateSchema>;
export type IdeaUpdate = z.infer<typeof ideaUpdateSchema>;
export type IdeaQuery = z.infer<typeof ideaQuerySchema>;
export type ChannelCreate = z.infer<typeof channelCreateSchema>;
export type ChannelUpdate = z.infer<typeof channelUpdateSchema>;
export type ExportQuery = z.infer<typeof exportQuerySchema>;
