import { create } from 'zustand';
import type { Feed, FeedListResponse } from '@/types';

interface FeedState {
  feeds: Feed[];
  total: number;
  page: number;
  totalPages: number;
  isLoading: boolean;
  error: string | null;
  selectedFeed: Feed | null;

  // Actions
  fetchFeeds: (query?: Record<string, string>) => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  toggleBookmark: (id: string) => Promise<void>;
  setSelectedFeed: (feed: Feed | null) => void;
  setPage: (page: number) => void;
}

export const useFeedStore = create<FeedState>((set, get) => ({
  feeds: [],
  total: 0,
  page: 1,
  totalPages: 1,
  isLoading: false,
  error: null,
  selectedFeed: null,

  fetchFeeds: async (query = {}) => {
    set({ isLoading: true, error: null });
    try {
      const params = new URLSearchParams({ page: String(get().page), ...query });
      const response = await fetch(`/api/feeds?${params}`);

      if (!response.ok) throw new Error('Failed to fetch feeds');

      const data: FeedListResponse = await response.json();
      set({
        feeds: data.feeds,
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

  markAsRead: async (id: string) => {
    try {
      await fetch(`/api/feeds/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isRead: true }),
      });

      set((state) => ({
        feeds: state.feeds.map((f) => (f.id === id ? { ...f, isRead: true } : f)),
      }));
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  },

  toggleBookmark: async (id: string) => {
    const feed = get().feeds.find((f) => f.id === id);
    if (!feed) return;

    try {
      await fetch(`/api/feeds/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isBookmarked: !feed.isBookmarked }),
      });

      set((state) => ({
        feeds: state.feeds.map((f) =>
          f.id === id ? { ...f, isBookmarked: !f.isBookmarked } : f
        ),
      }));
    } catch (error) {
      console.error('Failed to toggle bookmark:', error);
    }
  },

  setSelectedFeed: (feed) => set({ selectedFeed: feed }),
  setPage: (page) => set({ page }),
}));
