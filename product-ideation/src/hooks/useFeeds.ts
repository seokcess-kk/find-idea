'use client';

import { useCallback, useEffect } from 'react';
import { useFeedStore } from '@/store/feedStore';
import { useFilterStore } from '@/store/filterStore';

export function useFeeds() {
  const {
    feeds,
    total,
    page,
    totalPages,
    isLoading,
    error,
    selectedFeed,
    fetchFeeds,
    markAsRead,
    toggleBookmark,
    setSelectedFeed,
    setPage,
  } = useFeedStore();

  const { feedFilters, getFeedQueryParams } = useFilterStore();

  const refresh = useCallback(() => {
    const params = getFeedQueryParams();
    fetchFeeds(params);
  }, [fetchFeeds, getFeedQueryParams]);

  // Auto-fetch on mount and when filters change
  useEffect(() => {
    refresh();
  }, [refresh, page, feedFilters]);

  const goToPage = useCallback(
    (newPage: number) => {
      if (newPage >= 1 && newPage <= totalPages) {
        setPage(newPage);
      }
    },
    [setPage, totalPages]
  );

  const nextPage = useCallback(() => {
    goToPage(page + 1);
  }, [goToPage, page]);

  const prevPage = useCallback(() => {
    goToPage(page - 1);
  }, [goToPage, page]);

  return {
    // Data
    feeds,
    total,
    page,
    totalPages,
    isLoading,
    error,
    selectedFeed,

    // Actions
    refresh,
    markAsRead,
    toggleBookmark,
    setSelectedFeed,

    // Pagination
    goToPage,
    nextPage,
    prevPage,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1,
  };
}
