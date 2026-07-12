'use client';

import React, { useEffect, useRef } from 'react';
import { motion, animate } from 'framer-motion';

function CountUpNumber({ value }) {
  const ref = useRef(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    // Check if the value is numeric
    const numericValue = Number(value);
    if (isNaN(numericValue)) {
      node.textContent = value ?? '—';
      return;
    }

    const controls = animate(0, numericValue, {
      duration: 0.8,
      ease: 'easeOut',
      onUpdate(current) {
        node.textContent = Math.round(current);
      }
    });

    return () => controls.stop();
  }, [value]);

  return <span ref={ref} className="tabular-nums font-bold">0</span>;
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
      whileHover={{ y: -4, boxShadow: '0 10px 15px -3px rgba(0,0,0,0.05), 0 4px 6px -2px rgba(0,0,0,0.025)' }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className={`bg-white border border-hairline rounded-lg p-6 flex items-start justify-between relative overflow-hidden group hover:border-accent/40 transition-colors duration-200 ${className}`}
    >
      {/* Accent corner tick */}
      <div className="absolute top-0 right-0 w-2.5 h-2.5 bg-accent opacity-0 group-hover:opacity-100 transition-opacity" />

      {/* Decorative subtle pulse glow in background */}
      <div className="absolute -inset-10 bg-radial from-accent/3 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

      <div className="flex flex-col gap-2 relative z-10">
        <span className="text-[10px] font-bold uppercase tracking-wider text-steel font-mono">
          {title}
        </span>
        <span className="text-3xl font-extrabold font-display text-ink leading-none">
          <CountUpNumber value={value} />
        </span>
        
        {trend && (
          <div className="flex items-center gap-1.5 mt-1 text-xs">
            <span className={`font-semibold tracking-wide ${
              trend.type === 'up' ? 'text-status-available' : 
              trend.type === 'down' ? 'text-status-lost' : 'text-steel'
            }`}>
              {trend.label}
            </span>
          </div>
        )}
      </div>

      {Icon && (
        <div className="p-3 bg-surface border border-hairline rounded text-steel group-hover:text-accent group-hover:border-accent/30 group-hover:bg-accent/5 transition-colors relative z-10">
          <Icon className="w-5 h-5" />
        </div>
      )}
    </motion.div>
  );
}

