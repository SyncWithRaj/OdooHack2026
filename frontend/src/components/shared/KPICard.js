'use client';

import React from 'react';

export default function KPICard({
  title,
  value,
  icon: Icon,
  trend, // { label: string, type: 'up' | 'down' | 'neutral' }
  className = ''
}) {
  return (
    <div className={`bg-white border border-hairline rounded-lg p-6 shadow-sm flex items-start justify-between relative overflow-hidden group hover:border-accent/40 transition-colors duration-200 ${className}`}>
      {/* Accent corner tick */}
      <div className="absolute top-0 right-0 w-2 h-2 bg-accent opacity-0 group-hover:opacity-100 transition-opacity" />

      <div className="flex flex-col gap-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-steel">
          {title}
        </span>
        <span className="text-3xl font-bold font-display text-ink leading-none">
          {value ?? '—'}
        </span>
        
        {trend && (
          <div className="flex items-center gap-1.5 mt-1 text-xs">
            <span className={`font-semibold ${
              trend.type === 'up' ? 'text-status-available' : 
              trend.type === 'down' ? 'text-status-lost' : 'text-steel'
            }`}>
              {trend.label}
            </span>
          </div>
        )}
      </div>

      {Icon && (
        <div className="p-3 bg-surface border border-hairline rounded text-steel group-hover:text-accent group-hover:border-accent/20 transition-colors">
          <Icon className="w-5 h-5" />
        </div>
      )}
    </div>
  );
}
