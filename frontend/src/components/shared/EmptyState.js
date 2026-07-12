'use client';

import React from 'react';
import Button from './Button';

export default function EmptyState({
  title,
  description,
  icon: Icon,
  actionLabel,
  onAction,
  actionIcon
}) {
  return (
    <div className="flex flex-col items-center justify-center p-8 py-16 bg-white border border-hairline rounded-lg text-center shadow-sm">
      {Icon && (
        <div className="flex items-center justify-center w-12 h-12 rounded-full bg-surface text-steel mb-4 border border-hairline">
          <Icon className="w-6 h-6" />
        </div>
      )}
      <h3 className="text-base font-bold text-ink">{title}</h3>
      <p className="text-sm text-steel max-w-sm mt-1 mb-6">
        {description}
      </p>
      {actionLabel && onAction && (
        <Button variant="primary" onClick={onAction} icon={actionIcon}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
