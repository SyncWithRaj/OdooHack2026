'use client';

import React, { useState } from 'react';
import { ArrowUpDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import EmptyState from './EmptyState';

export default function DataTable({
  columns = [], // { key, label, sortable, render }
  data = [],
  loading = false,
  emptyTitle = 'No data available',
  emptyDescription = 'There is no data to display at this moment.',
  emptyIcon,
  emptyActionLabel,
  emptyOnAction,
  emptyActionIcon,
  // Sorting (local if no onSort provided)
  onSort,
  // Pagination
  pagination = false,
  totalItems = 0,
  itemsPerPage = 10,
  currentPage = 1,
  onPageChange
}) {
  const [sortKey, setSortKey] = useState('');
  const [sortOrder, setSortOrder] = useState('asc'); // asc | desc

  const handleSort = (key, sortable) => {
    if (!sortable) return;
    
    let order = 'asc';
    if (sortKey === key) {
      order = sortOrder === 'asc' ? 'desc' : 'asc';
    }
    
    setSortKey(key);
    setSortOrder(order);

    if (onSort) {
      onSort(key, order);
    }
  };

  // Local sorting if onSort isn't defined
  const sortedData = React.useMemo(() => {
    if (onSort || !sortKey) return data;
    
    return [...data].sort((a, b) => {
      const aVal = a[sortKey];
      const bVal = b[sortKey];
      
      if (aVal === bVal) return 0;
      if (aVal === null || aVal === undefined) return 1;
      if (bVal === null || bVal === undefined) return -1;
      
      const comparison = typeof aVal === 'string' 
          ? aVal.localeCompare(bVal) 
          : aVal - bVal;
        
      return sortOrder === 'asc' ? comparison : -comparison;
    });
  }, [data, sortKey, sortOrder, onSort]);

  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;

  return (
    <div className="flex flex-col w-full bg-white border border-hairline rounded-lg overflow-hidden shadow-sm">
      <div className="overflow-x-auto w-full">
        <table className="min-w-full divide-y divide-hairline">
          <thead className="bg-surface">
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key}
                  scope="col"
                  className={`px-6 py-3.5 text-left text-xs font-bold uppercase tracking-wider text-steel ${
                    col.sortable ? 'cursor-pointer select-none hover:text-ink' : ''
                  }`}
                  onClick={() => handleSort(col.key, col.sortable)}
                >
                  <div className="flex items-center gap-1.5">
                    {col.label}
                    {col.sortable && (
                      <ArrowUpDown className={`w-3.5 h-3.5 ${
                        sortKey === col.key ? 'text-accent' : 'text-steel/50'
                      }`} />
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-hairline">
            {loading ? (
              <tr>
                <td colSpan={columns.length} className="px-6 py-12 text-center">
                  <div className="inline-flex items-center justify-center gap-2.5 text-sm text-steel">
                    <div className="w-5 h-5 rounded-full border-2 border-accent border-t-transparent animate-spin" />
                    <span>Loading details...</span>
                  </div>
                </td>
              </tr>
            ) : sortedData.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="p-0">
                  <EmptyState
                    title={emptyTitle}
                    description={emptyDescription}
                    icon={emptyIcon}
                    actionLabel={emptyActionLabel}
                    onAction={emptyOnAction}
                    actionIcon={emptyActionIcon}
                  />
                </td>
              </tr>
            ) : (
              <AnimatePresence mode="popLayout">
                {sortedData.map((row, rowIdx) => (
                  <motion.tr 
                    key={row.id || rowIdx} 
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    transition={{ duration: 0.18, delay: Math.min(rowIdx * 0.025, 0.25) }}
                    className="hover:bg-surface/50 transition-colors duration-150"
                  >
                    {columns.map((col) => (
                      <td key={col.key} className="px-6 py-4 whitespace-nowrap text-sm text-ink font-sans">
                        {col.render ? col.render(row) : row[col.key] ?? '—'}
                      </td>
                    ))}
                  </motion.tr>
                ))}
              </AnimatePresence>
            )}
          </tbody>
        </table>
      </div>

      {pagination && totalPages > 1 && (
        <div className="bg-surface px-6 py-3 flex items-center justify-between border-t border-hairline">
          <div className="text-xs text-steel">
            Page <span className="font-semibold text-ink">{currentPage}</span> of{' '}
            <span className="font-semibold text-ink">{totalPages}</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="p-1 border border-hairline rounded bg-white text-steel hover:bg-surface hover:text-ink disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="p-1 border border-hairline rounded bg-white text-steel hover:bg-surface hover:text-ink disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
