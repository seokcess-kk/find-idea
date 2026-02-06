'use client';

import { useEffect } from 'react';
import { IdeaCard } from './IdeaCard';
import { useIdeaStore } from '@/store/ideaStore';
import type { Idea } from '@/types';

interface IdeaListProps {
  onEdit: (idea: Idea) => void;
}

export function IdeaList({ onEdit }: IdeaListProps) {
  const { ideas, isLoading, error, page, totalPages, fetchIdeas, updateIdea, deleteIdea, setPage } = useIdeaStore();

  useEffect(() => {
    fetchIdeas();
  }, [page, fetchIdeas]);

  const handleStageChange = (id: string, stage: Idea['stage']) => {
    updateIdea(id, { stage });
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this idea?')) {
      deleteIdea(id);
    }
  };

  if (error) {
    return (
      <div className="text-center py-8 text-red-600">
        Error: {error}
      </div>
    );
  }

  if (isLoading) {
    return <div className="text-center py-8">Loading...</div>;
  }

  if (ideas.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No ideas yet. Create one from a feed!
      </div>
    );
  }

  // Group by stage for kanban-like view
  const stages = ['collected', 'reviewing', 'promising', 'building'] as const;
  const groupedIdeas = stages.reduce(
    (acc, stage) => {
      acc[stage] = ideas.filter((i) => i.stage === stage);
      return acc;
    },
    {} as Record<typeof stages[number], Idea[]>
  );

  return (
    <div>
      {/* Kanban View */}
      <div className="grid grid-cols-4 gap-4">
        {stages.map((stage) => (
          <div key={stage} className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-medium text-gray-700 mb-3 capitalize">
              {stage} ({groupedIdeas[stage].length})
            </h3>
            <div className="space-y-3">
              {groupedIdeas[stage].map((idea) => (
                <IdeaCard
                  key={idea.id}
                  idea={idea}
                  onEdit={onEdit}
                  onDelete={handleDelete}
                  onStageChange={handleStageChange}
                />
              ))}
            </div>
          </div>
        ))}
      </div>

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
