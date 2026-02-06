'use client';

import { useState } from 'react';
import type { Feed, IdeaStage } from '@/types';

interface IdeaFormProps {
  sourceFeed?: Feed | null;
  onSubmit: (data: {
    feedId?: string;
    problem: string;
    currentSolution?: string;
    moneyEvidence?: string;
    opportunity?: string;
    oneLineIdea: string;
    stage?: IdeaStage;
    priority?: number;
    tags?: string;
  }) => void;
  onCancel: () => void;
}

export function IdeaForm({ sourceFeed, onSubmit, onCancel }: IdeaFormProps) {
  const [formData, setFormData] = useState({
    problem: '',
    currentSolution: '',
    moneyEvidence: '',
    opportunity: '',
    oneLineIdea: '',
    stage: 'collected' as IdeaStage,
    priority: 3,
    tags: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      feedId: sourceFeed?.id,
      ...formData,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Source Feed */}
      {sourceFeed && (
        <div className="p-3 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-500">Source:</p>
          <p className="text-sm font-medium">{sourceFeed.title}</p>
        </div>
      )}

      {/* Problem */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Problem *
        </label>
        <textarea
          required
          rows={3}
          value={formData.problem}
          onChange={(e) => setFormData({ ...formData, problem: e.target.value })}
          className="w-full px-3 py-2 border rounded-md text-sm"
          placeholder="What problem does this solve?"
        />
      </div>

      {/* Current Solution */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Current Solution
        </label>
        <textarea
          rows={2}
          value={formData.currentSolution}
          onChange={(e) => setFormData({ ...formData, currentSolution: e.target.value })}
          className="w-full px-3 py-2 border rounded-md text-sm"
          placeholder="How do people solve this now?"
        />
      </div>

      {/* Money Evidence */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Money Evidence
        </label>
        <textarea
          rows={2}
          value={formData.moneyEvidence}
          onChange={(e) => setFormData({ ...formData, moneyEvidence: e.target.value })}
          className="w-full px-3 py-2 border rounded-md text-sm"
          placeholder="Evidence that people will pay for this"
        />
      </div>

      {/* Opportunity */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Opportunity
        </label>
        <textarea
          rows={2}
          value={formData.opportunity}
          onChange={(e) => setFormData({ ...formData, opportunity: e.target.value })}
          className="w-full px-3 py-2 border rounded-md text-sm"
          placeholder="What's the opportunity here?"
        />
      </div>

      {/* One Line Idea */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          One Line Idea *
        </label>
        <input
          required
          type="text"
          value={formData.oneLineIdea}
          onChange={(e) => setFormData({ ...formData, oneLineIdea: e.target.value })}
          className="w-full px-3 py-2 border rounded-md text-sm"
          placeholder="Summarize your idea in one line"
        />
      </div>

      {/* Stage & Priority */}
      <div className="flex gap-4">
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Stage
          </label>
          <select
            value={formData.stage}
            onChange={(e) => setFormData({ ...formData, stage: e.target.value as IdeaStage })}
            className="w-full px-3 py-2 border rounded-md text-sm"
          >
            <option value="collected">Collected</option>
            <option value="reviewing">Reviewing</option>
            <option value="promising">Promising</option>
            <option value="building">Building</option>
          </select>
        </div>
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Priority (1-5)
          </label>
          <input
            type="number"
            min={1}
            max={5}
            value={formData.priority}
            onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) })}
            className="w-full px-3 py-2 border rounded-md text-sm"
          />
        </div>
      </div>

      {/* Tags */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Tags
        </label>
        <input
          type="text"
          value={formData.tags}
          onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
          className="w-full px-3 py-2 border rounded-md text-sm"
          placeholder="Comma-separated tags (e.g., saas, b2b, automation)"
        />
      </div>

      {/* Buttons */}
      <div className="flex justify-end gap-3 pt-4">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-gray-700 border rounded-md hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Save Idea
        </button>
      </div>
    </form>
  );
}
