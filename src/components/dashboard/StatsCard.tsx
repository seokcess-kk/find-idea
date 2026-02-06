'use client';

interface StatsCardProps {
  title: string;
  value: number | string;
  description?: string;
  icon?: React.ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
  };
}

export function StatsCard({ title, value, description, icon, trend }: StatsCardProps) {
  return (
    <div className="bg-white rounded-lg border p-4">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-500">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
          {description && (
            <p className="text-xs text-gray-400 mt-1">{description}</p>
          )}
        </div>
        {icon && (
          <div className="text-gray-400">{icon}</div>
        )}
      </div>
      {trend && (
        <div className="mt-2 flex items-center text-xs">
          <span className={trend.isPositive ? 'text-green-600' : 'text-red-600'}>
            {trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value)}%
          </span>
          <span className="text-gray-400 ml-1">vs last week</span>
        </div>
      )}
    </div>
  );
}
