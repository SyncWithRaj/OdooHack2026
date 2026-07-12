import React from 'react';
import { Search, X } from 'lucide-react';

export default function SearchBar({
  value,
  onChange,
  placeholder = 'Search...',
  filters = [],
  activeFilters = {},
  onFilterChange,
}) {
  const handleChipClick = (filterKey, filterValue) => {
    const isCurrentlyActive = activeFilters[filterKey] === filterValue;
    const newFilters = { ...activeFilters };
    
    if (isCurrentlyActive) {
      delete newFilters[filterKey];
    } else {
      newFilters[filterKey] = filterValue;
    }
    
    onFilterChange(newFilters);
  };

  const clearAllFilters = () => {
    onFilterChange({});
  };

  const hasActiveFilters = Object.keys(activeFilters).length > 0;

  return (
    <div className="w-full flex flex-col gap-3">
      {/* Search Input Box */}
      <div className="relative w-full">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-steel opacity-60" />
        </div>
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full pl-10 pr-4 py-2.5 bg-surface-raised border border-hairline rounded-[6px] text-sm text-ink placeholder:text-steel/50 focus:outline-none focus:ring-1 focus:ring-accent focus:border-accent shadow-sm"
        />
        {value && (
          <button
            onClick={() => onChange('')}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-steel hover:text-ink cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Filter Chips list */}
      {filters.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          {filters.map((filterGroup) => (
            <div key={filterGroup.key} className="flex items-center gap-1 bg-surface border border-hairline px-2 py-1 rounded-[4px] text-xs">
              <span className="font-semibold text-steel uppercase tracking-wider text-[10px] mr-1">
                {filterGroup.label}:
              </span>
              <div className="flex gap-1.5">
                {filterGroup.options.map((option) => {
                  const isActive = activeFilters[filterGroup.key] === option.value;
                  return (
                    <button
                      key={option.value}
                      onClick={() => handleChipClick(filterGroup.key, option.value)}
                      className={`px-2 py-0.5 rounded-[4px] font-mono cursor-pointer transition-all border ${
                        isActive
                          ? 'bg-accent/15 text-accent-ink border-accent font-semibold'
                          : 'bg-surface-raised text-steel border-hairline hover:text-ink hover:border-steel/50'
                      }`}
                    >
                      {option.label}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}

          {hasActiveFilters && (
            <button
              onClick={clearAllFilters}
              className="text-xs font-mono font-medium text-status-lost hover:underline ml-2 cursor-pointer"
            >
              Clear Filters
            </button>
          )}
        </div>
      )}
    </div>
  );
}
