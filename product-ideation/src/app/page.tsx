'use client';

import { useState } from 'react';
import { FeedFilter } from '@/components/feeds/FeedFilter';
import { FeedList } from '@/components/feeds/FeedList';
import { IdeaModal } from '@/components/ideas/IdeaModal';
import { SyncButton } from '@/components/dashboard/SyncButton';
import { useIdeaStore } from '@/store/ideaStore';
import { useFeedStore } from '@/store/feedStore';
import type { Feed } from '@/types';

export default function DashboardPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedFeed, setSelectedFeed] = useState<Feed | null>(null);
  const { createIdea } = useIdeaStore();
  const { fetchFeeds } = useFeedStore();

  const handleCreateIdea = (feed: Feed) => {
    setSelectedFeed(feed);
    setIsModalOpen(true);
  };

  const handleSubmitIdea = async (data: Parameters<typeof createIdea>[0]) => {
    await createIdea(data);
    setIsModalOpen(false);
    setSelectedFeed(null);
  };

  const handleSyncComplete = () => {
    fetchFeeds();
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Feed Dashboard</h2>
          <p className="text-gray-600">
            Discover product ideas from 13 global channels
          </p>
        </div>
        <SyncButton onSyncComplete={handleSyncComplete} />
      </div>

      {/* Feed Filter */}
      <FeedFilter onFilterChange={() => fetchFeeds()} />

      {/* Feed List */}
      <FeedList onCreateIdea={handleCreateIdea} />

      {/* Idea Modal */}
      <IdeaModal
        isOpen={isModalOpen}
        sourceFeed={selectedFeed}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedFeed(null);
        }}
        onSubmit={handleSubmitIdea}
      />
    </div>
  );
}
