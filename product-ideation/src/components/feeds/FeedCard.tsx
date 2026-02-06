'use client';

import { format } from 'date-fns';
import type { Feed } from '@/types';

interface FeedCardProps {
  feed: Feed;
  onRead: (id: string) => void;
  onBookmark: (id: string) => void;
  onCreateIdea: (feed: Feed) => void;
}

export function FeedCard({ feed, onRead, onBookmark, onCreateIdea }: FeedCardProps) {
  const keywords = feed.detectedKeywords ? JSON.parse(feed.detectedKeywords) : [];

  const handleClick = () => {
    if (!feed.isRead) {
      onRead(feed.id);
    }
  };

  return (
    <div
      className={`bg-white rounded-lg border p-4 hover:shadow-md transition-shadow cursor-pointer ${
        feed.isRead ? 'opacity-70' : ''
      }`}
      onClick={handleClick}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 bg-blue-100 text-blue-800 text-xs font-medium rounded">
            {feed.channelId?.slice(0, 3).toUpperCase() || 'UNK'}
          </span>
          {feed.priorityScore >= 7 && (
            <span className="text-yellow-500">⭐</span>
          )}
          <span className="text-sm font-medium text-gray-600">
            {feed.priorityScore.toFixed(1)}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onBookmark(feed.id);
            }}
            className={`p-1 rounded hover:bg-gray-100 ${
              feed.isBookmarked ? 'text-yellow-500' : 'text-gray-400'
            }`}
          >
            {feed.isBookmarked ? '📌' : '📍'}
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onCreateIdea(feed);
            }}
            className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200"
          >
            + Idea
          </button>
        </div>
      </div>

      {/* Title */}
      <h3 className="font-medium text-gray-900 mb-2 line-clamp-2">
        {feed.title}
      </h3>

      {/* Summary */}
      {feed.summary && (
        <p className="text-sm text-gray-600 mb-3 line-clamp-2">
          {feed.summary}
        </p>
      )}

      {/* Keywords */}
      {keywords.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {keywords.slice(0, 5).map((kw: string, idx: number) => (
            <span
              key={idx}
              className="px-2 py-0.5 bg-purple-50 text-purple-700 text-xs rounded"
            >
              {kw}
            </span>
          ))}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between text-xs text-gray-500">
        <span>
          {format(new Date(feed.collectedAt), 'yyyy-MM-dd HH:mm')}
        </span>
        <a
          href={feed.link}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="text-blue-600 hover:underline"
        >
          Open →
        </a>
      </div>
    </div>
  );
}
