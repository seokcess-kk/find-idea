'use client';

import { format } from 'date-fns';
import type { Idea } from '@/types';

interface IdeaCardProps {
  idea: Idea;
  onEdit: (idea: Idea) => void;
  onDelete: (id: string) => void;
  onStageChange: (id: string, stage: Idea['stage']) => void;
}

const stageColors = {
  collected: 'bg-gray-100 text-gray-700',
  reviewing: 'bg-blue-100 text-blue-700',
  promising: 'bg-yellow-100 text-yellow-700',
  building: 'bg-green-100 text-green-700',
};

const priorityStars = (priority: number) => '⭐'.repeat(priority);

export function IdeaCard({ idea, onEdit, onDelete, onStageChange }: IdeaCardProps) {
  return (
    <div className="bg-white rounded-lg border p-4 hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <span className={`px-2 py-1 text-xs font-medium rounded ${stageColors[idea.stage]}`}>
          {idea.stage}
        </span>
        <span className="text-sm">{priorityStars(idea.priority)}</span>
      </div>

      {/* One Line Idea */}
      <h3 className="font-medium text-gray-900 mb-2">{idea.oneLineIdea}</h3>

      {/* Problem */}
      <p className="text-sm text-gray-600 mb-3 line-clamp-2">{idea.problem}</p>

      {/* Stage Selector */}
      <div className="mb-3">
        <select
          value={idea.stage}
          onChange={(e) => onStageChange(idea.id, e.target.value as Idea['stage'])}
          className="text-xs px-2 py-1 border rounded"
        >
          <option value="collected">Collected</option>
          <option value="reviewing">Reviewing</option>
          <option value="promising">Promising</option>
          <option value="building">Building</option>
        </select>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between text-xs text-gray-500">
        <span>{format(new Date(idea.createdAt), 'yyyy-MM-dd')}</span>
        <div className="flex gap-2">
          <button
            onClick={() => onEdit(idea)}
            className="text-blue-600 hover:underline"
          >
            Edit
          </button>
          <button
            onClick={() => onDelete(idea.id)}
            className="text-red-600 hover:underline"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}
