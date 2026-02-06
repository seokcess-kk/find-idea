export interface Channel {
  id: string;
  name: string;
  rssUrl: string;
  shortCode: string;
  category: 'direct_needs' | 'trends' | 'builders' | 'insights';
  isActive: boolean;
  lastFetchedAt: string | null;
  fetchStatus: 'success' | 'failed' | 'pending' | null;
  errorMessage: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Feed {
  id: string;
  channelId: string | null;
  title: string;
  link: string;
  content: string | null;
  summary: string | null;
  author: string | null;
  publishedAt: string | null;
  collectedAt: string;
  isRead: boolean;
  isBookmarked: boolean;
  hasNeedKeyword: boolean;
  hasMoneyKeyword: boolean;
  priorityScore: number;
  detectedKeywords: string | null;
  createdAt: string;
  updatedAt: string;
  channel?: Channel;
}

export type IdeaStage = 'collected' | 'reviewing' | 'promising' | 'building';

export interface Idea {
  id: string;
  feedId: string | null;
  problem: string;
  currentSolution: string | null;
  moneyEvidence: string | null;
  opportunity: string | null;
  oneLineIdea: string;
  stage: IdeaStage;
  priority: number;
  notes: string | null;
  nextAction: string | null;
  dueDate: string | null;
  tags: string | null;
  createdAt: string;
  updatedAt: string;
  feed?: Feed;
}

export interface FeedListResponse {
  feeds: Feed[];
  total: number;
  page: number;
  totalPages: number;
}

export interface IdeaListResponse {
  ideas: Idea[];
  total: number;
  page: number;
  totalPages: number;
}

export interface SyncResult {
  channelId: string;
  channelName: string;
  success: boolean;
  collected: number;
  duplicates: number;
  error?: string;
}

export interface SyncResponse {
  results: SyncResult[];
  summary: {
    total: number;
    success: number;
    failed: number;
    collected: number;
    duplicates: number;
  };
}
