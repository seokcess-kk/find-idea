'use client';

import { useEffect, useState } from 'react';
import type { Channel } from '@/types';

export default function SettingsPage() {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [stats, setStats] = useState<Record<string, unknown>>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchChannels();
  }, []);

  const fetchChannels = async () => {
    try {
      const response = await fetch('/api/channels');
      const data = await response.json();
      setChannels(data.channels);
      setStats(data.stats);
    } catch (error) {
      console.error('Failed to fetch channels:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleChannel = async (id: string) => {
    try {
      await fetch('/api/channels', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, isActive: true }),
      });
      fetchChannels();
    } catch (error) {
      console.error('Failed to toggle channel:', error);
    }
  };

  const handleExport = (type: string, format: string) => {
    window.open(`/api/export?type=${type}&format=${format}`, '_blank');
  };

  const categoryLabels: Record<string, string> = {
    direct_needs: 'Direct Needs',
    trends: 'Trends & Competition',
    builders: 'Builder Communities',
    insights: 'Strategic Insights',
  };

  if (isLoading) {
    return <div className="text-center py-8">Loading...</div>;
  }

  // Group channels by category
  const groupedChannels = channels.reduce(
    (acc, ch) => {
      if (!acc[ch.category]) acc[ch.category] = [];
      acc[ch.category].push(ch);
      return acc;
    },
    {} as Record<string, Channel[]>
  );

  return (
    <div className="max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Settings</h2>

      {/* Stats */}
      <div className="bg-white rounded-lg border p-6 mb-6">
        <h3 className="font-medium text-gray-900 mb-4">Channel Statistics</h3>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>Total Channels: {(stats as { total?: number }).total || 0}</div>
          <div>Active Channels: {(stats as { active?: number }).active || 0}</div>
        </div>
      </div>

      {/* Channels by Category */}
      {Object.entries(groupedChannels).map(([category, chList]) => (
        <div key={category} className="bg-white rounded-lg border p-6 mb-4">
          <h3 className="font-medium text-gray-900 mb-4">
            {categoryLabels[category] || category}
          </h3>
          <div className="space-y-3">
            {chList.map((ch) => (
              <div
                key={ch.id}
                className="flex items-center justify-between py-2 border-b last:border-0"
              >
                <div className="flex items-center gap-3">
                  <span className="px-2 py-0.5 bg-gray-100 text-gray-700 text-xs font-medium rounded">
                    {ch.shortCode}
                  </span>
                  <span className="font-medium">{ch.name}</span>
                  {ch.fetchStatus === 'failed' && (
                    <span className="text-xs text-red-600">⚠️ Error</span>
                  )}
                </div>
                <div className="flex items-center gap-4">
                  {ch.lastFetchedAt && (
                    <span className="text-xs text-gray-500">
                      Last: {new Date(ch.lastFetchedAt).toLocaleDateString()}
                    </span>
                  )}
                  <button
                    onClick={() => toggleChannel(ch.id)}
                    className={`px-3 py-1 text-xs rounded ${
                      ch.isActive
                        ? 'bg-green-100 text-green-700'
                        : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {ch.isActive ? 'Active' : 'Inactive'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* Export */}
      <div className="bg-white rounded-lg border p-6">
        <h3 className="font-medium text-gray-900 mb-4">Export Data</h3>
        <div className="flex gap-4">
          <button
            onClick={() => handleExport('feeds', 'json')}
            className="px-4 py-2 border rounded-md hover:bg-gray-50"
          >
            Export Feeds (JSON)
          </button>
          <button
            onClick={() => handleExport('ideas', 'json')}
            className="px-4 py-2 border rounded-md hover:bg-gray-50"
          >
            Export Ideas (JSON)
          </button>
          <button
            onClick={() => handleExport('feeds', 'csv')}
            className="px-4 py-2 border rounded-md hover:bg-gray-50"
          >
            Export Feeds (CSV)
          </button>
          <button
            onClick={() => handleExport('ideas', 'csv')}
            className="px-4 py-2 border rounded-md hover:bg-gray-50"
          >
            Export Ideas (CSV)
          </button>
        </div>
      </div>
    </div>
  );
}
