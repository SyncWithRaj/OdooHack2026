'use client';

import React from 'react';

export default function AssetTagChip({ tag }) {
  if (!tag) return null;
  return (
    <div className="inline-flex items-center relative pl-3.5 pr-2 py-0.5 bg-white border border-accent rounded-[4px] shadow-sm select-all">
      {/* Small stamped notch/hole on the left to simulate a physical tag */}
      <div className="absolute left-[3px] top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-surface border border-accent/40" />
      <span className="font-mono text-xs font-semibold text-ink tracking-wider">
        {tag}
      </span>
    </div>
  );
}
