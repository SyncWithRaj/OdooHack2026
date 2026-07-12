import React from 'react';

export default function KPICard({ label, value, trend, trendType = 'neutral', icon: Icon, onClick }) {
  const trendColor = {
    up: 'text-status-available',
    down: 'text-status-lost',
    neutral: 'text-steel',
  };

  return (
    <div
      onClick={onClick}
      className={`p-6 bg-surface-raised border border-hairline rounded-[10px] shadow-sm flex flex-col justify-between ${onClick ? 'cursor-pointer hover:border-accent transition-all' : ''}`}
    >
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm font-medium text-steel">{label}</span>
        {Icon && <Icon className="w-5 h-5 text-steel" />}
      </div>
      <div>
        <h3 className="text-3xl font-bold font-display text-ink tracking-tight mb-2">
          {value}
        </h3>
        {trend && (
          <span className={`text-xs font-mono font-medium ${trendColor[trendType]}`}>
            {trend}
          </span>
        )}
      </div>
    </div>
  );
}
