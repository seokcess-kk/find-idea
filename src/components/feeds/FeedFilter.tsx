'use client';

import { useEffect, useState } from 'react';
import { useFilterStore } from '@/store/filterStore';
import type { Channel } from '@/types';

interface FeedFilterProps {
  onFilterChange?: () => void;
}

export function FeedFilter({ onFilterChange }: FeedFilterProps) {
  const [channels, setChannels] = useState<Channel[]>([]);
  const { feedFilters, setFeedFilter, clearFeedFilters } = useFilterStore();

  useEffect(() => {
    fetchChannels();
  }, []);

  const fetchChannels = async () => {
    try {
      const response = await fetch('/api/channels');
      const data = await response.json();
      setChannels(data.channels || []);
    } catch (error) {
      console.error('Failed to fetch channels:', error);
    }
  };

  const handleFilterChange = (key: keyof typeof feedFilters, value: unknown) => {
    setFeedFilter(key, value as typeof feedFilters[typeof key]);
    onFilterChange?.();
  };

  const handleClear = () => {
    clearFeedFilters();
    onFilterChange?.();
  };

  const hasActiveFilters = Object.values(feedFilters).some(
    (v) => v !== undefined && v !== ''
  );

  return (
    <div className="bg-white border rounded-lg p-4 mb-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-medium text-gray-900">Filters</h3>
        {hasActiveFilters && (
          <button
            onClick={handleClear}
            className="text-sm text-blue-600 hover:text-blue-700"
          >
            Clear all
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Channel Filter */}
        <div>
          <label className="block text-xs text-gray-500 mb-1">Channel</label>
          <select
            value={feedFilters.channelId || ''}
            onChange={(e) =>
              handleFilterChange('channelId', e.target.value || undefined)
            }
            className="w-full px-2 py-1.5 border rounded text-sm"
          >
            <option value="">All Channels</option>
            {channels.map((ch) => (
              <option key={ch.id} value={ch.id}>
                {ch.name}
              </option>
            ))}
          </select>
        </div>

        {/* Read Status */}
        <div>
          <label className="block text-xs text-gray-500 mb-1">Read Status</label>
          <select
            value={feedFilters.isRead === undefined ? '' : String(feedFilters.isRead)}
            onChange={(e) =>
              handleFilterChange(
                'isRead',
                e.target.value === '' ? undefined : e.target.value === 'true'
              )
            }
            className="w-full px-2 py-1.5 border rounded text-sm"
          >
            <option value="">All</option>
            <option value="false">Unread</option>
            <option value="true">Read</option>
          </select>
        </div>

        {/* Bookmarked */}
        <div>
          <label className="block text-xs text-gray-500 mb-1">Bookmarked</label>
          <select
            value={feedFilters.isBookmarked === undefined ? '' : String(feedFilters.isBookmarked)}
            onChange={(e) =>
              handleFilterChange(
                'isBookmarked',
                e.target.value === '' ? undefined : e.target.value === 'true'
              )
            }
            className="w-full px-2 py-1.5 border rounded text-sm"
          >
            <option value="">All</option>
            <option value="true">Bookmarked</option>
            <option value="false">Not Bookmarked</option>
          </select>
        </div>

        {/* Min Priority */}
        <div>
          <label className="block text-xs text-gray-500 mb-1">Min Priority</label>
          <select
            value={feedFilters.minPriority || ''}
            onChange={(e) =>
              handleFilterChange(
                'minPriority',
                e.target.value ? Number(e.target.value) : undefined
              )
            }
            className="w-full px-2 py-1.5 border rounded text-sm"
          >
            <option value="">Any</option>
            <option value="3">3+</option>
            <option value="5">5+</option>
            <option value="7">7+</option>
          </select>
        </div>
      </div>

      {/* Keyword Filters */}
      <div className="flex gap-4 mt-3">
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={feedFilters.hasNeedKeyword === true}
            onChange={(e) =>
              handleFilterChange(
                'hasNeedKeyword',
                e.target.checked ? true : undefined
              )
            }
            className="rounded"
          />
          <span>Need Keywords</span>
        </label>

        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={feedFilters.hasMoneyKeyword === true}
            onChange={(e) =>
              handleFilterChange(
                'hasMoneyKeyword',
                e.target.checked ? true : undefined
              )
            }
            className="rounded"
          />
          <span>Money Keywords</span>
        </label>
      </div>

      {/* Search */}
      <div className="mt-3">
        <input
          type="text"
          placeholder="Search feeds..."
          value={feedFilters.search || ''}
          onChange={(e) => handleFilterChange('search', e.target.value || undefined)}
          className="w-full px-3 py-2 border rounded text-sm"
        />
      </div>
    </div>
  );
}
