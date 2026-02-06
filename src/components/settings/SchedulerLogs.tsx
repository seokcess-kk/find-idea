'use client';

import { useState, useEffect } from 'react';

interface LogEntry {
  id: string;
  startedAt: string;
  completedAt: string | null;
  duration: number | null;
  totalChannels: number;
  successChannels: number;
  failedChannels: number;
  newFeeds: number;
  duplicates: number;
  status: string;
  triggeredBy: string;
}

export function SchedulerLogs() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      setError(null);
      const res = await fetch('/api/scheduler/logs?limit=10');
      if (!res.ok) throw new Error('Failed to fetch logs');
      const data = await res.json();
      setLogs(data.logs);
    } catch (err) {
      console.error('Failed to fetch logs:', err);
      setError('로그를 불러올 수 없습니다');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('ko-KR', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDuration = (ms: number | null) => {
    if (!ms) return '-';
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${Math.floor(ms / 60000)}m ${((ms % 60000) / 1000).toFixed(0)}s`;
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      success: 'bg-green-100 text-green-700',
      partial: 'bg-yellow-100 text-yellow-700',
      running: 'bg-blue-100 text-blue-700',
      failed: 'bg-red-100 text-red-700',
    };
    return styles[status] || 'bg-gray-100 text-gray-700';
  };

  const getTriggerIcon = (triggeredBy: string) => {
    switch (triggeredBy) {
      case 'scheduler':
        return '⏰';
      case 'manual':
        return '👆';
      case 'api':
        return '🔌';
      default:
        return '❓';
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6 mt-4">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-8 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6 mt-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <span>📋</span> Execution Logs
        </h3>
        <button
          onClick={fetchLogs}
          className="text-sm text-blue-600 hover:underline"
        >
          Refresh
        </button>
      </div>

      {error && (
        <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm mb-4">
          {error}
        </div>
      )}

      {logs.length === 0 ? (
        <p className="text-gray-500 text-center py-4">
          아직 실행 기록이 없습니다
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left">
                <th className="py-2 px-1 font-medium text-gray-600">Time</th>
                <th className="py-2 px-1 font-medium text-gray-600">Duration</th>
                <th className="py-2 px-1 font-medium text-gray-600">New</th>
                <th className="py-2 px-1 font-medium text-gray-600">Failed</th>
                <th className="py-2 px-1 font-medium text-gray-600">Status</th>
                <th className="py-2 px-1 font-medium text-gray-600">Trigger</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr
                  key={log.id}
                  className="border-b hover:bg-gray-50 transition-colors"
                >
                  <td className="py-2 px-1 text-gray-700">
                    {formatDate(log.startedAt)}
                  </td>
                  <td className="py-2 px-1 text-gray-600">
                    {formatDuration(log.duration)}
                  </td>
                  <td className="py-2 px-1">
                    <span className="font-medium text-green-600">
                      {log.newFeeds}
                    </span>
                  </td>
                  <td className="py-2 px-1">
                    <span
                      className={
                        log.failedChannels > 0
                          ? 'font-medium text-red-600'
                          : 'text-gray-400'
                      }
                    >
                      {log.failedChannels}
                    </span>
                  </td>
                  <td className="py-2 px-1">
                    <span
                      className={`px-2 py-0.5 rounded text-xs font-medium ${getStatusBadge(
                        log.status
                      )}`}
                    >
                      {log.status}
                    </span>
                  </td>
                  <td className="py-2 px-1 text-center" title={log.triggeredBy}>
                    {getTriggerIcon(log.triggeredBy)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
