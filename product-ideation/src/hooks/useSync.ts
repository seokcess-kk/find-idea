'use client';

import { useState, useCallback } from 'react';
import type { SyncResponse } from '@/types';

export function useSync() {
  const [isLoading, setIsLoading] = useState(false);
  const [lastResult, setLastResult] = useState<SyncResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const sync = useCallback(async (channelId?: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const body = channelId ? { channelId } : {};
      const response = await fetch('/api/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        throw new Error('Sync failed');
      }

      const data: SyncResponse = await response.json();
      setLastResult(data);
      return data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const syncAll = useCallback(() => {
    return sync();
  }, [sync]);

  const syncChannel = useCallback(
    (channelId: string) => {
      return sync(channelId);
    },
    [sync]
  );

  const reset = useCallback(() => {
    setLastResult(null);
    setError(null);
  }, []);

  return {
    isLoading,
    lastResult,
    error,
    sync,
    syncAll,
    syncChannel,
    reset,
  };
}
