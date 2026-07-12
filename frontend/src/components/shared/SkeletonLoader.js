'use client';

import React from 'react';

export default function SkeletonLoader({ type = 'table', count = 3, className = '' }) {
  const renderSkeleton = () => {
    switch (type) {
      case 'card':
        return (
          <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 ${className}`}>
            {[...Array(count)].map((_, i) => (
              <div
                key={i}
                className="bg-white border border-hairline rounded-lg p-6 shadow-sm flex flex-col gap-4 animate-pulse"
              >
                <div className="flex items-center justify-between">
                  <div className="h-3 w-24 bg-hairline rounded" />
                  <div className="h-8 w-8 bg-hairline rounded" />
                </div>
                <div className="h-8 w-16 bg-hairline rounded mt-2" />
                <div className="h-3.5 w-32 bg-hairline rounded mt-1" />
              </div>
            ))}
          </div>
        );

      case 'table':
        return (
          <div className={`flex flex-col w-full bg-white border border-hairline rounded-lg overflow-hidden shadow-sm animate-pulse ${className}`}>
            <div className="h-10 bg-surface border-b border-hairline flex items-center px-6 gap-4">
              <div className="h-3 w-12 bg-hairline rounded" />
              <div className="h-3 w-32 bg-hairline rounded" />
              <div className="h-3 w-24 bg-hairline rounded" />
              <div className="h-3 w-16 bg-hairline rounded ml-auto" />
            </div>
            <div className="divide-y divide-hairline">
              {[...Array(count)].map((_, i) => (
                <div key={i} className="px-6 py-5 flex items-center gap-4">
                  <div className="h-6 w-16 bg-hairline rounded-full" />
                  <div className="flex flex-col gap-2 flex-1">
                    <div className="h-3.5 w-1/3 bg-hairline rounded" />
                    <div className="h-3 w-1/4 bg-hairline rounded" />
                  </div>
                  <div className="h-3.5 w-24 bg-hairline rounded" />
                  <div className="h-3.5 w-16 bg-hairline rounded" />
                  <div className="h-8 w-20 bg-hairline rounded ml-auto" />
                </div>
              ))}
            </div>
          </div>
        );

      case 'list':
        return (
          <div className={`flex flex-col gap-3 animate-pulse ${className}`}>
            {[...Array(count)].map((_, i) => (
              <div
                key={i}
                className="bg-white border border-hairline rounded-lg p-4 flex items-start gap-3 shadow-sm"
              >
                <div className="h-8 w-8 rounded-full bg-hairline shrink-0" />
                <div className="flex-1 flex flex-col gap-1.5 pt-0.5">
                  <div className="h-3 w-1/3 bg-hairline rounded" />
                  <div className="h-3 w-2/3 bg-hairline rounded" />
                  <div className="h-2 w-16 bg-hairline rounded mt-1" />
                </div>
              </div>
            ))}
          </div>
        );

      case 'chart':
        return (
          <div className={`bg-white border border-hairline p-6 rounded-lg shadow-sm flex flex-col gap-6 animate-pulse ${className}`}>
            <div className="flex items-center justify-between">
              <div className="h-4 w-36 bg-hairline rounded" />
              <div className="flex gap-2">
                <div className="h-7 w-20 bg-hairline rounded-full" />
                <div className="h-7 w-20 bg-hairline rounded-full" />
              </div>
            </div>
            <div className="h-64 w-full flex items-end gap-3 px-4 mt-4">
              {[...Array(12)].map((_, i) => {
                const heights = ['h-24', 'h-40', 'h-16', 'h-32', 'h-48', 'h-12', 'h-28', 'h-36', 'h-52', 'h-20', 'h-44', 'h-30'];
                return (
                  <div key={i} className={`flex-1 ${heights[i % heights.length]} bg-hairline/60 rounded-t`} />
                );
              })}
            </div>
          </div>
        );

      default:
        return <div className="h-20 bg-hairline rounded animate-pulse" />;
    }
  };

  return renderSkeleton();
}
