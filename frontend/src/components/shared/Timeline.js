'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Wrench, ArrowRightLeft, UserCheck, CheckCircle2, AlertTriangle, Plus, Package, HelpCircle } from 'lucide-react';

const getEventIcon = (action) => {
  const normalized = action ? action.toLowerCase() : '';
  if (normalized.includes('allocat')) return { icon: UserCheck, color: 'text-status-allocated bg-status-allocated/10 border-status-allocated/20' };
  if (normalized.includes('maint') || normalized.includes('repair')) return { icon: Wrench, color: 'text-status-maintenance bg-status-maintenance/10 border-status-maintenance/20' };
  if (normalized.includes('return') || normalized.includes('check-in') || normalized.includes('checkin')) return { icon: CheckCircle2, color: 'text-status-available bg-status-available/10 border-status-available/20' };
  if (normalized.includes('creat') || normalized.includes('regist') || normalized.includes('new')) return { icon: Plus, color: 'text-status-available bg-status-available/10 border-status-available/20' };
  if (normalized.includes('transfer')) return { icon: ArrowRightLeft, color: 'text-status-reserved bg-status-reserved/10 border-status-reserved/20' };
  if (normalized.includes('lost') || normalized.includes('stolen') || normalized.includes('damage')) return { icon: AlertTriangle, color: 'text-status-lost bg-status-lost/10 border-status-lost/20' };
  if (normalized.includes('retir') || normalized.includes('dispos')) return { icon: Package, color: 'text-steel bg-surface border-hairline' };
  return { icon: HelpCircle, color: 'text-steel bg-surface border-hairline' };
};

export default function Timeline({ items }) {
  if (!items || items.length === 0) {
    return (
      <div className="text-center py-8 text-xs font-semibold uppercase tracking-wider text-steel bg-surface/50 border border-dashed border-hairline rounded-lg">
        No lifecycle history found.
      </div>
    );
  }

  return (
    <div className="flow-root">
      <ul role="list" className="-mb-8">
        {items.map((item, itemIdx) => {
          const actionText = item.action || item.details?.action || 'Lifecycle Event';
          const { icon: Icon, color: iconColors } = getEventIcon(actionText);
          const isLatest = itemIdx === 0;

          return (
            <motion.li 
              key={item.id || itemIdx}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.25, delay: Math.min(itemIdx * 0.04, 0.4) }}
            >
              <div className="relative pb-8">
                {itemIdx !== items.length - 1 ? (
                  <span 
                    className="absolute top-5 left-5 -ml-px h-full w-0.5 bg-hairline" 
                    aria-hidden="true" 
                  />
                ) : null}
                <div className="relative flex space-x-3.5">
                  <div className="relative">
                    <span className={`h-10 w-10 rounded-full border flex items-center justify-center relative z-10 transition-shadow premium-shadow ${iconColors}`}>
                      <Icon className="w-4.5 h-4.5" />
                    </span>
                    {isLatest && (
                      <span className="absolute -inset-0.5 rounded-full bg-accent/20 animate-ping opacity-60 z-0" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0 pt-1.5 flex justify-between space-x-4">
                    <div className="flex flex-col gap-1">
                      <p className="text-sm font-bold text-ink uppercase tracking-wider">
                        {actionText}
                      </p>
                      {item.details && (
                        <div className="mt-1 text-xs text-steel font-mono bg-surface p-2.5 rounded border border-hairline whitespace-pre-wrap max-w-xl">
                          {typeof item.details === 'object' 
                            ? JSON.stringify(item.details, null, 2) 
                            : item.details}
                        </div>
                      )}
                      {item.user && (
                        <p className="text-xs text-steel mt-0.5">
                          Triggered by <span className="font-semibold text-ink">{item.user.name}</span>
                        </p>
                      )}
                    </div>
                    <div className="text-right text-[11px] whitespace-nowrap text-steel font-mono uppercase">
                      {new Date(item.createdAt || item.timestamp).toLocaleString(undefined, { 
                        month: 'short', 
                        day: 'numeric', 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </motion.li>
          );
        })}
      </ul>
    </div>
  );
}
