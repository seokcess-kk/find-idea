import { create } from 'zustand';
import type { Idea, IdeaListResponse, IdeaStage } from '@/types';

interface CreateIdeaInput {
  feedId?: string;
  problem: string;
  currentSolution?: string;
  moneyEvidence?: string;
  opportunity?: string;
  oneLineIdea: string;
  stage?: IdeaStage;
  priority?: number;
}

interface IdeaState {
  ideas: Idea[];
  total: number;
  page: number;
  totalPages: number;
  isLoading: boolean;
  error: string | null;
  selectedIdea: Idea | null;

  // Actions
  fetchIdeas: (query?: Record<string, string>) => Promise<void>;
  createIdea: (data: CreateIdeaInput) => Promise<Idea | null>;
  updateIdea: (id: string, data: Partial<Idea>) => Promise<void>;
  deleteIdea: (id: string) => Promise<void>;
  setSelectedIdea: (idea: Idea | null) => void;
  setPage: (page: number) => void;
}

export const useIdeaStore = create<IdeaState>((set, get) => ({
  ideas: [],
  total: 0,
  page: 1,
  totalPages: 1,
  isLoading: false,
  error: null,
  selectedIdea: null,

  fetchIdeas: async (query = {}) => {
    set({ isLoading: true, error: null });
    try {
      const params = new URLSearchParams({ page: String(get().page), ...query });
      const response = await fetch(`/api/ideas?${params}`);

      if (!response.ok) throw new Error('Failed to fetch ideas');

      const data: IdeaListResponse = await response.json();
      set({
        ideas: data.ideas,
        total: data.total,
        page: data.page,
        totalPages: data.totalPages,
      });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Unknown error' });
    } finally {
      set({ isLoading: false });
    }
  },

  createIdea: async (data: CreateIdeaInput) => {
    try {
      const response = await fetch('/api/ideas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) throw new Error('Failed to create idea');

      const idea: Idea = await response.json();
      set((state) => ({ ideas: [idea, ...state.ideas] }));
      return idea;
    } catch (error) {
      console.error('Failed to create idea:', error);
      return null;
    }
  },

  updateIdea: async (id: string, data: Partial<Idea>) => {
    try {
      const response = await fetch(`/api/ideas/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) throw new Error('Failed to update idea');

      const updatedIdea: Idea = await response.json();
      set((state) => ({
        ideas: state.ideas.map((i) => (i.id === id ? updatedIdea : i)),
      }));
    } catch (error) {
      console.error('Failed to update idea:', error);
    }
  },

  deleteIdea: async (id: string) => {
    try {
      await fetch(`/api/ideas/${id}`, { method: 'DELETE' });
      set((state) => ({
        ideas: state.ideas.filter((i) => i.id !== id),
      }));
    } catch (error) {
      console.error('Failed to delete idea:', error);
    }
  },

  setSelectedIdea: (idea) => set({ selectedIdea: idea }),
  setPage: (page) => set({ page }),
}));
