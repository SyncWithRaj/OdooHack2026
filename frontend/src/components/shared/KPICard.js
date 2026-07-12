'use client';

import React, { useEffect, useState } from 'react';
import { motion, animate } from 'framer-motion';

function AnimatedCounter({ value }) {
  const [displayValue, setDisplayValue] = useState(value);
  const numericVal = typeof value === 'number' ? value : parseFloat(String(value).replace(/[^0-9.]/g, ''));
  const isNumeric = typeof value === 'number' || (!isNaN(numericVal) && String(value).match(/[0-9]+/));

  useEffect(() => {
    if (!isNumeric || numericVal === 0) {
      setDisplayValue(value);
      return;
    }
    const count = animate(0, numericVal, {
      duration: 0.8,
      ease: 'easeOut',
      onUpdate: (latest) => {
        if (typeof value === 'number') {
          setDisplayValue(Math.round(latest));
        } else {
          const rounded = Math.round(latest);
          const formatted = String(value).replace(/[0-9]+/, rounded);
          setDisplayValue(formatted);
        }
      }
    });
    return () => count.stop();
  }, [numericVal, value, isNumeric]);

  return <span>{displayValue}</span>;
}

export default function KPICard({
  title,
  value,
  icon: Icon,
  trend, // { label: string, type: 'up' | 'down' | 'neutral' }
  className = ''
}) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -3, transition: { duration: 0.15 } }}
      className={`bg-white border border-hairline rounded-lg p-6 shadow-sm flex items-start justify-between relative overflow-hidden group hover:border-accent/30 hover:shadow-md transition-all duration-200 ${className}`}
    >
      {/* Accent corner tick */}
      <div className="absolute top-0 right-0 w-2 h-2 bg-accent opacity-0 group-hover:opacity-100 transition-opacity" />

      <div className="flex flex-col gap-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-steel">
          {title}
        </span>
        <span className="text-3xl font-bold font-display text-ink leading-none">
          {value !== undefined && value !== null ? (
            <AnimatedCounter value={value} />
          ) : (
            '—'
          )}
        </span>
        
        {trend && (
          <div className="flex items-center gap-1.5 mt-1 text-xs">
            <span className={`font-semibold ${
              trend.type === 'up' ? 'text-status-available' : 
              trend.type === 'down' ? 'text-status-lost' : 'text-steel'
            }`}>
              {trend.label}
            </span>
          </div>
        )}
      </div>

      {Icon && (
        <div className="p-3 bg-surface border border-hairline rounded text-steel group-hover:text-accent group-hover:border-accent/20 transition-colors">
          <Icon className="w-5 h-5" />
        </div>
      )}
    </motion.div>
  );
}
