'use client';

import { useState } from 'react';
import { IdeaList } from '@/components/ideas/IdeaList';
import { IdeaModal } from '@/components/ideas/IdeaModal';
import { useIdeaStore } from '@/store/ideaStore';
import type { Idea } from '@/types';

export default function IdeasPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { createIdea, fetchIdeas } = useIdeaStore();

  const handleEdit = (idea: Idea) => {
    // TODO: Implement edit functionality
    console.log('Edit idea:', idea);
  };

  const handleSubmitIdea = async (data: Parameters<typeof createIdea>[0]) => {
    await createIdea(data);
    setIsModalOpen(false);
    fetchIdeas();
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Ideas Pipeline</h2>
          <p className="text-gray-600">
            Track and manage your product ideas
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
        >
          + New Idea
        </button>
      </div>

      {/* Idea List (Kanban) */}
      <IdeaList onEdit={handleEdit} />

      {/* New Idea Modal */}
      <IdeaModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleSubmitIdea}
      />
    </div>
  );
}
