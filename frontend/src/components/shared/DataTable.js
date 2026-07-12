import React, { useState } from 'react';
import { ArrowUpDown, ChevronLeft, ChevronRight, MoreVertical } from 'lucide-react';
import Button from './Button';

export default function DataTable({
  columns = [],
  data = [],
  onRowClick,
  rowActions = [], // array of { label, onClick, disabled }
  emptyState,
  pageSize = 10,
}) {
  const [currentPage, setCurrentPage] = useState(1);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });

  // Handle Sorting
  const requestSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const sortedData = React.useMemo(() => {
    let sortableItems = [...data];
    if (sortConfig.key !== null) {
      sortableItems.sort((a, b) => {
        const valA = a[sortConfig.key];
        const valB = b[sortConfig.key];
        
        if (valA === undefined || valB === undefined) return 0;
        
        if (typeof valA === 'string') {
          return sortConfig.direction === 'asc'
            ? valA.localeCompare(valB)
            : valB.localeCompare(valA);
        }
        
        return sortConfig.direction === 'asc' ? valA - valB : valB - valA;
      });
    }
    return sortableItems;
  }, [data, sortConfig]);

  // Handle Pagination
  const totalPages = Math.ceil(sortedData.length / pageSize);
  const paginatedData = React.useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedData.slice(start, start + pageSize);
  }, [sortedData, currentPage, pageSize]);

  // Dropdown menu state
  const [activeMenu, setActiveMenu] = useState(null);

  const toggleMenu = (e, index) => {
    e.stopPropagation();
    setActiveMenu(activeMenu === index ? null : index);
  };

  React.useEffect(() => {
    const closeMenus = () => setActiveMenu(null);
    document.addEventListener('click', closeMenus);
    return () => document.removeEventListener('click', closeMenus);
  }, []);

  if (data.length === 0) {
    return emptyState || <div className="text-center py-12 text-steel">No data available</div>;
  }

  return (
    <div className="w-full flex flex-col gap-4">
      <div className="w-full overflow-x-auto border border-hairline rounded-[10px] bg-surface-raised shadow-sm">
        <table className="min-w-full divide-y divide-hairline">
          <thead className="bg-surface">
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key}
                  onClick={() => col.sortable && requestSort(col.key)}
                  className={`px-6 py-4 text-left text-xs font-semibold text-steel uppercase tracking-wider ${
                    col.sortable ? 'cursor-pointer hover:text-ink select-none' : ''
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    {col.label}
                    {col.sortable && <ArrowUpDown className="w-3.5 h-3.5" />}
                  </div>
                </th>
              ))}
              {rowActions.length > 0 && <th className="relative px-6 py-4" />}
            </tr>
          </thead>
          <tbody className="divide-y divide-hairline bg-surface-raised">
            {paginatedData.map((row, idx) => (
              <tr
                key={row.id || idx}
                onClick={() => onRowClick && onRowClick(row)}
                className={`transition-colors ${
                  onRowClick ? 'hover:bg-surface/50 cursor-pointer' : ''
                }`}
              >
                {columns.map((col) => (
                  <td key={col.key} className="px-6 py-4 text-sm text-ink whitespace-nowrap">
                    {col.render ? col.render(row[col.key], row) : row[col.key]}
                  </td>
                ))}
                {rowActions.length > 0 && (
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium relative">
                    <button
                      onClick={(e) => toggleMenu(e, idx)}
                      className="p-1 hover:bg-steel/10 text-steel hover:text-ink rounded-[4px] cursor-pointer"
                    >
                      <MoreVertical className="w-4 h-4" />
                    </button>
                    {activeMenu === idx && (
                      <div className="absolute right-6 mt-1 w-48 bg-surface-raised border border-hairline rounded-[6px] shadow-lg z-10 py-1">
                        {rowActions.map((action, actionIdx) => {
                          const isDisabled = typeof action.disabled === 'function' ? action.disabled(row) : action.disabled;
                          return (
                            <button
                              key={actionIdx}
                              disabled={isDisabled}
                              onClick={(e) => {
                                e.stopPropagation();
                                setActiveMenu(null);
                                action.onClick(row);
                              }}
                              className="w-full text-left px-4 py-2 text-xs font-medium text-ink hover:bg-surface disabled:opacity-50 disabled:hover:bg-transparent cursor-pointer"
                            >
                              {action.label}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-2">
          <span className="text-xs text-steel font-mono">
            Page {currentPage} of {totalPages} ({data.length} records)
          </span>
          <div className="flex gap-2">
            <Button
              variant="secondary"
              className="!py-1.5 !px-2.5"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((c) => Math.max(c - 1, 1))}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button
              variant="secondary"
              className="!py-1.5 !px-2.5"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((c) => Math.min(c + 1, totalPages))}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
