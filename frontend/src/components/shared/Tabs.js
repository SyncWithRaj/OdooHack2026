import React from 'react';

export default function Tabs({ tabs = [], activeTab, onChange }) {
  return (
    <div className="border-b border-hairline mb-6">
      <nav className="flex space-x-8" aria-label="Tabs">
        {tabs.map((tab) => {
          const isActive = tab.id === activeTab;
          return (
            <button
              key={tab.id}
              onClick={() => onChange(tab.id)}
              className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap cursor-pointer transition-all ${
                isActive
                  ? 'border-accent text-ink font-semibold'
                  : 'border-transparent text-steel hover:text-ink hover:border-steel/30'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </nav>
    </div>
  );
}
