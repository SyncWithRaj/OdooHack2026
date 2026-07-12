'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Check } from 'lucide-react';

export default function WorkflowPipeline({ 
  steps = [], // array of { id, label, description, status: 'completed' | 'current' | 'upcoming', icon: Icon }
  className = '' 
}) {
  return (
    <div className={`w-full bg-white border border-hairline rounded-lg p-6 shadow-sm overflow-hidden ${className}`}>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative">
        
        {/* Connection Bar (Horizontal for desktop, hidden or vertical on mobile) */}
        <div className="absolute top-[26px] left-[5%] right-[5%] h-0.5 bg-hairline hidden md:block z-0">
          {/* Animated active path progress */}
          <motion.div 
            className="h-full bg-accent"
            initial={{ width: 0 }}
            animate={{ 
              width: `${
                Math.max(
                  0,
                  (steps.filter(s => s.status === 'completed').length / (steps.length - 1 || 1)) * 100
                )
              }%` 
            }}
            transition={{ duration: 0.8, ease: "easeInOut" }}
          />
        </div>

        {/* Steps */}
        {steps.map((step, idx) => {
          const Icon = step.icon;
          const isCompleted = step.status === 'completed';
          const isCurrent = step.status === 'current';
          
          return (
            <div 
              key={step.id || idx} 
              className="flex flex-row md:flex-col items-center md:text-center flex-1 relative z-10 gap-4 md:gap-2 group"
            >
              {/* Step Circle Container */}
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: idx * 0.1, duration: 0.4 }}
                className={`
                  w-12 h-12 rounded-full flex items-center justify-center border-2 shrink-0 transition-all duration-300 relative z-10
                  ${isCompleted 
                    ? 'bg-accent border-accent text-accent-ink shadow-sm' 
                    : isCurrent 
                      ? 'bg-white border-accent text-accent shadow-[0_0_14px_rgba(232,163,61,0.25)]' 
                      : 'bg-white border-hairline text-steel/40'}
                `}
              >
                {isCompleted ? (
                  <Check className="w-5 h-5 stroke-[3px]" />
                ) : Icon ? (
                  <Icon className={`w-4.5 h-4.5 ${isCurrent ? 'animate-pulse' : ''}`} />
                ) : (
                  <span className="font-mono text-sm font-bold">{idx + 1}</span>
                )}
              </motion.div>

              {/* Step Content */}
              <div className="flex flex-col md:items-center mt-1 md:mt-3 text-center">
                <span className={`
                  text-[10px] md:text-xs font-bold uppercase tracking-wider transition-colors duration-300
                  ${isCurrent ? 'text-accent' : isCompleted ? 'text-ink' : 'text-steel/60'}
                `}>
                  {step.label}
                </span>
                
                {step.description && (
                  <span className="text-[10px] text-steel font-medium mt-1 max-w-[150px] leading-relaxed block">
                    {step.description}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
