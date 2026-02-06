'use client';

import { useState, useEffect } from 'react';

interface SchedulerStatus {
  enabled: boolean;
  cronExpression: string;
  timezone: string;
  isRunning: boolean;
  lastRun: {
    id: string;
    startedAt: string;
    completedAt: string | null;
    status: string;
    newFeeds: number;
    failedChannels: number;
  } | null;
  nextRun: string | null;
  presets: Array<{
    label: string;
    value: string;
    description: string;
  }>;
}

export function SchedulerPanel() {
  const [status, setStatus] = useState<SchedulerStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [triggering, setTriggering] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 상태 로드
  useEffect(() => {
    fetchStatus();
  }, []);

  const fetchStatus = async () => {
    try {
      setError(null);
      const res = await fetch('/api/scheduler');
      if (!res.ok) throw new Error('Failed to fetch status');
      const data = await res.json();
      setStatus(data);
    } catch (err) {
      console.error('Failed to fetch scheduler status:', err);
      setError('스케줄러 상태를 불러올 수 없습니다');
    } finally {
      setLoading(false);
    }
  };

  // 활성화/비활성화 토글
  const toggleEnabled = async () => {
    if (!status) return;

    setUpdating(true);
    setError(null);
    try {
      const res = await fetch('/api/scheduler', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: !status.enabled }),
      });

      if (!res.ok) throw new Error('Failed to toggle');
      await fetchStatus();
    } catch (err) {
      console.error('Failed to toggle scheduler:', err);
      setError('스케줄러 상태 변경에 실패했습니다');
    } finally {
      setUpdating(false);
    }
  };

  // 스케줄 변경
  const changeSchedule = async (cronExpression: string) => {
    setUpdating(true);
    setError(null);
    try {
      const res = await fetch('/api/scheduler', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cronExpression }),
      });

      if (!res.ok) throw new Error('Failed to change schedule');
      await fetchStatus();
    } catch (err) {
      console.error('Failed to change schedule:', err);
      setError('스케줄 변경에 실패했습니다');
    } finally {
      setUpdating(false);
    }
  };

  // 수동 실행
  const triggerNow = async () => {
    setTriggering(true);
    setError(null);
    try {
      const res = await fetch('/api/scheduler/trigger', {
        method: 'POST',
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to trigger');
      }

      await fetchStatus();
    } catch (err) {
      console.error('Failed to trigger scheduler:', err);
      setError(err instanceof Error ? err.message : '수동 실행에 실패했습니다');
    } finally {
      setTriggering(false);
    }
  };

  // 날짜 포맷
  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleString('ko-KR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-2/3"></div>
        </div>
      </div>
    );
  }

  if (!status) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <p className="text-red-500">{error || '스케줄러 정보를 불러올 수 없습니다'}</p>
        <button
          onClick={fetchStatus}
          className="mt-2 text-blue-600 hover:underline"
        >
          다시 시도
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <span>⏰</span> Auto Scheduler
      </h3>

      {/* 에러 메시지 */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* 상태 표시 */}
      <div className="mb-4 flex items-center gap-3">
        <span className="text-gray-600">Status:</span>
        <span
          className={`px-2 py-1 rounded text-sm font-medium ${
            status.enabled
              ? 'bg-green-100 text-green-800'
              : 'bg-gray-100 text-gray-600'
          }`}
        >
          {status.enabled ? '🟢 Active' : '🔴 Inactive'}
        </span>
        {status.isRunning && (
          <span className="px-2 py-1 rounded text-sm bg-blue-100 text-blue-800 animate-pulse">
            Running...
          </span>
        )}
      </div>

      {/* 스케줄 선택 */}
      <div className="mb-4">
        <label className="block text-sm text-gray-600 mb-2">Schedule:</label>
        <select
          value={status.cronExpression}
          onChange={(e) => changeSchedule(e.target.value)}
          disabled={updating}
          className="w-full p-2 border rounded-lg disabled:opacity-50 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          {status.presets.map((preset) => (
            <option key={preset.value} value={preset.value}>
              {preset.label} ({preset.description})
            </option>
          ))}
        </select>
      </div>

      {/* 실행 정보 */}
      <div className="mb-4 text-sm text-gray-600 space-y-1 bg-gray-50 p-3 rounded-lg">
        <p>
          <span className="font-medium">Last Run:</span>{' '}
          {formatDate(status.lastRun?.startedAt ?? null)}
          {status.lastRun && (
            <span
              className={`ml-2 px-1.5 py-0.5 rounded text-xs ${
                status.lastRun.status === 'success'
                  ? 'bg-green-100 text-green-700'
                  : status.lastRun.status === 'partial'
                  ? 'bg-yellow-100 text-yellow-700'
                  : status.lastRun.status === 'running'
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-red-100 text-red-700'
              }`}
            >
              {status.lastRun.status}
            </span>
          )}
        </p>
        <p>
          <span className="font-medium">Next Run:</span>{' '}
          {status.enabled ? formatDate(status.nextRun) : 'Disabled'}
        </p>
        {status.lastRun && (
          <p>
            <span className="font-medium">Last Result:</span>{' '}
            {status.lastRun.newFeeds} new feeds
            {status.lastRun.failedChannels > 0 && (
              <span className="text-red-600">
                , {status.lastRun.failedChannels} failed
              </span>
            )}
          </p>
        )}
      </div>

      {/* 액션 버튼 */}
      <div className="flex gap-3">
        <button
          onClick={toggleEnabled}
          disabled={updating}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            status.enabled
              ? 'bg-red-100 text-red-700 hover:bg-red-200'
              : 'bg-green-100 text-green-700 hover:bg-green-200'
          } disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          {updating ? '...' : status.enabled ? 'Disable' : 'Enable'}
        </button>

        <button
          onClick={triggerNow}
          disabled={triggering || status.isRunning}
          className="px-4 py-2 rounded-lg font-medium bg-blue-100 text-blue-700 hover:bg-blue-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {triggering || status.isRunning ? 'Running...' : 'Run Now'}
        </button>

        <button
          onClick={fetchStatus}
          disabled={loading}
          className="px-4 py-2 rounded-lg font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 disabled:opacity-50"
        >
          Refresh
        </button>
      </div>
    </div>
  );
}
