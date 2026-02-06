'use client';

import { IdeaForm } from './IdeaForm';
import type { Feed, IdeaStage } from '@/types';

interface IdeaModalProps {
  isOpen: boolean;
  sourceFeed?: Feed | null;
  onClose: () => void;
  onSubmit: (data: {
    feedId?: string;
    problem: string;
    currentSolution?: string;
    moneyEvidence?: string;
    opportunity?: string;
    oneLineIdea: string;
    stage?: IdeaStage;
    priority?: number;
  }) => void;
}

export function IdeaModal({ isOpen, sourceFeed, onClose, onSubmit }: IdeaModalProps) {
  if (!isOpen) return null;

  const handleSubmit = (data: Parameters<typeof onSubmit>[0]) => {
    onSubmit(data);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto mx-4">
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Record Idea</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        </div>

        <div className="p-6">
          <IdeaForm
            sourceFeed={sourceFeed}
            onSubmit={handleSubmit}
            onCancel={onClose}
          />
        </div>
      </div>
    </div>
  );
}
