import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface FeedFilters {
  channelId?: string;
  isRead?: boolean;
  isBookmarked?: boolean;
  hasNeedKeyword?: boolean;
  hasMoneyKeyword?: boolean;
  minPriority?: number;
  search?: string;
}

export interface IdeaFilters {
  stage?: 'collected' | 'reviewing' | 'promising' | 'building';
  minPriority?: number;
  search?: string;
  tag?: string;
}

interface FilterState {
  feedFilters: FeedFilters;
  ideaFilters: IdeaFilters;

  // Feed filter actions
  setFeedFilter: <K extends keyof FeedFilters>(key: K, value: FeedFilters[K]) => void;
  setFeedFilters: (filters: Partial<FeedFilters>) => void;
  clearFeedFilters: () => void;

  // Idea filter actions
  setIdeaFilter: <K extends keyof IdeaFilters>(key: K, value: IdeaFilters[K]) => void;
  setIdeaFilters: (filters: Partial<IdeaFilters>) => void;
  clearIdeaFilters: () => void;

  // Utility
  getFeedQueryParams: () => Record<string, string>;
  getIdeaQueryParams: () => Record<string, string>;
}

const defaultFeedFilters: FeedFilters = {};
const defaultIdeaFilters: IdeaFilters = {};

export const useFilterStore = create<FilterState>()(
  persist(
    (set, get) => ({
      feedFilters: defaultFeedFilters,
      ideaFilters: defaultIdeaFilters,

      // Feed filter actions
      setFeedFilter: (key, value) =>
        set((state) => ({
          feedFilters: { ...state.feedFilters, [key]: value },
        })),

      setFeedFilters: (filters) =>
        set((state) => ({
          feedFilters: { ...state.feedFilters, ...filters },
        })),

      clearFeedFilters: () => set({ feedFilters: defaultFeedFilters }),

      // Idea filter actions
      setIdeaFilter: (key, value) =>
        set((state) => ({
          ideaFilters: { ...state.ideaFilters, [key]: value },
        })),

      setIdeaFilters: (filters) =>
        set((state) => ({
          ideaFilters: { ...state.ideaFilters, ...filters },
        })),

      clearIdeaFilters: () => set({ ideaFilters: defaultIdeaFilters }),

      // Convert filters to query params
      getFeedQueryParams: () => {
        const filters = get().feedFilters;
        const params: Record<string, string> = {};

        if (filters.channelId) params.channelId = filters.channelId;
        if (filters.isRead !== undefined) params.isRead = String(filters.isRead);
        if (filters.isBookmarked !== undefined) params.isBookmarked = String(filters.isBookmarked);
        if (filters.hasNeedKeyword !== undefined) params.hasNeedKeyword = String(filters.hasNeedKeyword);
        if (filters.hasMoneyKeyword !== undefined) params.hasMoneyKeyword = String(filters.hasMoneyKeyword);
        if (filters.minPriority !== undefined) params.minPriority = String(filters.minPriority);
        if (filters.search) params.search = filters.search;

        return params;
      },

      getIdeaQueryParams: () => {
        const filters = get().ideaFilters;
        const params: Record<string, string> = {};

        if (filters.stage) params.stage = filters.stage;
        if (filters.minPriority !== undefined) params.minPriority = String(filters.minPriority);
        if (filters.search) params.search = filters.search;
        if (filters.tag) params.tag = filters.tag;

        return params;
      },
    }),
    {
      name: 'product-ideation-filters',
      partialize: (state) => ({
        feedFilters: state.feedFilters,
        ideaFilters: state.ideaFilters,
      }),
    }
  )
);
