'use client';

import { useState } from 'react';
import type { SyncResponse } from '@/types';

interface SyncButtonProps {
  onSyncComplete?: () => void;
}

export function SyncButton({ onSyncComplete }: SyncButtonProps) {
  const [isSyncing, setIsSyncing] = useState(false);
  const [result, setResult] = useState<SyncResponse | null>(null);

  const handleSync = async () => {
    setIsSyncing(true);
    setResult(null);

    try {
      const response = await fetch('/api/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });

      if (!response.ok) throw new Error('Sync failed');

      const data: SyncResponse = await response.json();
      setResult(data);
      onSyncComplete?.();
    } catch (error) {
      console.error('Sync error:', error);
      setResult({
        results: [],
        summary: { total: 0, success: 0, failed: 1, collected: 0, duplicates: 0 },
      });
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div>
      <button
        onClick={handleSync}
        disabled={isSyncing}
        className={`px-4 py-2 rounded-md font-medium ${
          isSyncing
            ? 'bg-gray-400 cursor-not-allowed'
            : 'bg-blue-600 hover:bg-blue-700 text-white'
        }`}
      >
        {isSyncing ? 'Syncing...' : '🔄 Sync Feeds'}
      </button>

      {result && (
        <div className="mt-4 p-4 bg-gray-50 rounded-lg">
          <h4 className="font-medium mb-2">Sync Result</h4>
          <div className="text-sm text-gray-600 space-y-1">
            <p>✅ Success: {result.summary.success}/{result.summary.total} channels</p>
            <p>📥 Collected: {result.summary.collected} new feeds</p>
            <p>🔄 Duplicates: {result.summary.duplicates}</p>
            {result.summary.failed > 0 && (
              <p className="text-red-600">❌ Failed: {result.summary.failed}</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
