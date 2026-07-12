import React from 'react';

export default function AssetTagChip({ tag }) {
  if (!tag) return null;
  return (
    <span
      className="inline-flex items-center justify-center px-2 py-0.5 text-xs font-mono font-semibold text-accent-ink bg-surface-raised border border-accent rounded-[4px] shadow-sm relative overflow-hidden"
      style={{
        clipPath: 'polygon(4px 0, 100% 0, 100% 100%, 0 100%, 0 4px)',
        paddingLeft: '10px' // adjust for clipped corner
      }}
    >
      <span className="absolute left-[1px] top-[1px] w-1.5 h-1.5 bg-accent rounded-full"></span>
      {tag}
    </span>
  );
}
