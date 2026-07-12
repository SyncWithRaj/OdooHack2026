import React from 'react';
import Button from './Button';

export default function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
}) {
  return (
    <div className="flex flex-col items-center justify-center text-center p-8 border border-dashed border-hairline bg-surface-raised rounded-[10px] min-h-[300px]">
      {Icon && <Icon className="w-12 h-12 text-steel mb-4 opacity-60" />}
      <h3 className="text-lg font-semibold text-ink mb-1">{title}</h3>
      <p className="text-sm text-steel mb-6 max-w-sm">{description}</p>
      {actionLabel && onAction && (
        <Button variant="primary" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
