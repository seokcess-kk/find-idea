'use client';

import { useEffect, useState } from 'react';
import { FeedCard } from './FeedCard';
import { useFeedStore } from '@/store/feedStore';
import type { Feed } from '@/types';

interface FeedListProps {
  onCreateIdea: (feed: Feed) => void;
}

export function FeedList({ onCreateIdea }: FeedListProps) {
  const { feeds, isLoading, error, page, totalPages, fetchFeeds, markAsRead, toggleBookmark, setPage } = useFeedStore();

  const [filters, setFilters] = useState({
    sortBy: 'priority',
    isRead: '',
    hasNeedKeyword: '',
  });

  useEffect(() => {
    const query: Record<string, string> = { sortBy: filters.sortBy };
    if (filters.isRead) query.isRead = filters.isRead;
    if (filters.hasNeedKeyword === 'true') query.hasNeedKeyword = 'true';
    fetchFeeds(query);
  }, [page, filters, fetchFeeds]);

  if (error) {
    return (
      <div className="text-center py-8 text-red-600">
        Error: {error}
      </div>
    );
  }

  return (
    <div>
      {/* Filters */}
      <div className="flex gap-4 mb-4 p-4 bg-white rounded-lg border">
        <select
          value={filters.sortBy}
          onChange={(e) => setFilters({ ...filters, sortBy: e.target.value })}
          className="px-3 py-2 border rounded-md text-sm"
        >
          <option value="priority">Priority</option>
          <option value="newest">Newest</option>
          <option value="oldest">Oldest</option>
        </select>

        <select
          value={filters.isRead}
          onChange={(e) => setFilters({ ...filters, isRead: e.target.value })}
          className="px-3 py-2 border rounded-md text-sm"
        >
          <option value="">All</option>
          <option value="false">Unread</option>
          <option value="true">Read</option>
        </select>

        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={filters.hasNeedKeyword === 'true'}
            onChange={(e) =>
              setFilters({ ...filters, hasNeedKeyword: e.target.checked ? 'true' : '' })
            }
            className="rounded"
          />
          Has Need Keyword
        </label>
      </div>

      {/* Feed List */}
      {isLoading ? (
        <div className="text-center py-8">Loading...</div>
      ) : feeds.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          No feeds found. Try syncing first.
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {feeds.map((feed) => (
            <FeedCard
              key={feed.id}
              feed={feed}
              onRead={markAsRead}
              onBookmark={toggleBookmark}
              onCreateIdea={onCreateIdea}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-6">
          <button
            onClick={() => setPage(page - 1)}
            disabled={page <= 1}
            className="px-4 py-2 border rounded-md disabled:opacity-50"
          >
            Previous
          </button>
          <span className="px-4 py-2">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage(page + 1)}
            disabled={page >= totalPages}
            className="px-4 py-2 border rounded-md disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
