'use client';

import React from 'react';

export default function Timeline({ items }) {
  if (!items || items.length === 0) {
    return (
      <div className="text-center py-6 text-sm text-steel">
        No lifecycle history found.
      </div>
    );
  }

  return (
    <div className="flow-root">
      <ul role="list" className="-mb-8">
        {items.map((item, itemIdx) => (
          <li key={item.id || itemIdx}>
            <div className="relative pb-8">
              {itemIdx !== items.length - 1 ? (
                <span 
                  className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-hairline" 
                  aria-hidden="true" 
                />
              ) : null}
              <div className="relative flex space-x-3">
                <div>
                  <span className="h-8 w-8 rounded-full bg-surface border border-hairline flex items-center justify-center text-xs font-bold text-steel">
                    {items.length - itemIdx}
                  </span>
                </div>
                <div className="flex-1 min-w-0 pt-1.5 flex justify-between space-x-4">
                  <div>
                    <p className="text-sm font-semibold text-ink">
                      {item.action || item.details?.action || 'Lifecycle Event'}
                    </p>
                    {item.details && (
                      <div className="mt-1 text-xs text-steel font-mono bg-surface p-2 rounded border border-hairline whitespace-pre-wrap">
                        {typeof item.details === 'object' 
                          ? JSON.stringify(item.details, null, 2) 
                          : item.details}
                      </div>
                    )}
                    {item.user && (
                      <p className="mt-0.5 text-xs text-steel">
                        By <span className="font-semibold">{item.user.name}</span>
                      </p>
                    )}
                  </div>
                  <div className="text-right text-xs whitespace-nowrap text-steel font-mono">
                    {new Date(item.createdAt || item.timestamp).toLocaleString()}
                  </div>
                </div>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
