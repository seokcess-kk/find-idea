'use client';

import { useCallback, useEffect } from 'react';
import { useIdeaStore } from '@/store/ideaStore';
import { useFilterStore } from '@/store/filterStore';
import type { Idea, IdeaStage } from '@/types';

export function useIdeas() {
  const {
    ideas,
    total,
    page,
    totalPages,
    isLoading,
    error,
    selectedIdea,
    fetchIdeas,
    createIdea,
    updateIdea,
    deleteIdea,
    setSelectedIdea,
    setPage,
  } = useIdeaStore();

  const { ideaFilters, getIdeaQueryParams } = useFilterStore();

  const refresh = useCallback(() => {
    const params = getIdeaQueryParams();
    fetchIdeas(params);
  }, [fetchIdeas, getIdeaQueryParams]);

  // Auto-fetch on mount and when filters change
  useEffect(() => {
    refresh();
  }, [refresh, page, ideaFilters]);

  const goToPage = useCallback(
    (newPage: number) => {
      if (newPage >= 1 && newPage <= totalPages) {
        setPage(newPage);
      }
    },
    [setPage, totalPages]
  );

  const moveToStage = useCallback(
    async (id: string, stage: IdeaStage) => {
      await updateIdea(id, { stage });
    },
    [updateIdea]
  );

  const updatePriority = useCallback(
    async (id: string, priority: number) => {
      await updateIdea(id, { priority });
    },
    [updateIdea]
  );

  // Group ideas by stage for Kanban view
  const ideasByStage = ideas.reduce(
    (acc, idea) => {
      if (!acc[idea.stage]) acc[idea.stage] = [];
      acc[idea.stage].push(idea);
      return acc;
    },
    {} as Record<IdeaStage, Idea[]>
  );

  return {
    // Data
    ideas,
    ideasByStage,
    total,
    page,
    totalPages,
    isLoading,
    error,
    selectedIdea,

    // Actions
    refresh,
    createIdea,
    updateIdea,
    deleteIdea,
    setSelectedIdea,
    moveToStage,
    updatePriority,

    // Pagination
    goToPage,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1,
  };
}
