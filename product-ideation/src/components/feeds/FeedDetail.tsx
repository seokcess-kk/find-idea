'use client';

import type { Feed } from '@/types';

interface FeedDetailProps {
  feed: Feed;
  onClose: () => void;
  onCreateIdea: (feed: Feed) => void;
}

export function FeedDetail({ feed, onClose, onCreateIdea }: FeedDetailProps) {
  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="border-b p-4">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h2 className="text-lg font-semibold text-gray-900">{feed.title}</h2>
              <div className="flex items-center gap-2 mt-1 text-sm text-gray-500">
                {feed.channel && (
                  <span className="px-2 py-0.5 bg-gray-100 rounded text-xs">
                    {feed.channel.shortCode}
                  </span>
                )}
                <span>{formatDate(feed.publishedAt)}</span>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 overflow-y-auto max-h-[50vh]">
          {/* Keywords */}
          <div className="flex items-center gap-2 mb-4">
            {feed.hasNeedKeyword && (
              <span className="px-2 py-1 bg-orange-100 text-orange-700 text-xs rounded">
                Need Keyword
              </span>
            )}
            {feed.hasMoneyKeyword && (
              <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded">
                Money Keyword
              </span>
            )}
            <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded">
              Priority: {feed.priorityScore}/10
            </span>
          </div>

          {/* Detected Keywords */}
          {feed.detectedKeywords && (
            <div className="mb-4">
              <p className="text-xs text-gray-500 mb-1">Detected Keywords:</p>
              <div className="flex flex-wrap gap-1">
                {feed.detectedKeywords.split(',').map((kw, i) => (
                  <span
                    key={i}
                    className="px-2 py-0.5 bg-gray-100 text-gray-700 text-xs rounded"
                  >
                    {kw.trim()}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Summary */}
          {feed.summary && (
            <div className="mb-4">
              <p className="text-sm text-gray-600">{feed.summary}</p>
            </div>
          )}

          {/* Full Content */}
          {feed.content && (
            <div className="prose prose-sm max-w-none">
              <div
                dangerouslySetInnerHTML={{ __html: feed.content }}
                className="text-gray-700"
              />
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t p-4 flex items-center justify-between">
          <a
            href={feed.link}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-blue-600 hover:text-blue-700"
          >
            Open Original →
          </a>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 border rounded-md hover:bg-gray-50"
            >
              Close
            </button>
            <button
              onClick={() => onCreateIdea(feed)}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Create Idea
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
