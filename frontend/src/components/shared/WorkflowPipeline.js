'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Package, CheckCircle2, UserCheck, Wrench, Trash2 } from 'lucide-react';

export default function WorkflowPipeline({ assets = [], selectedStatus, onSelectStatus }) {
  // Compute counts for each node in the lifecycle
  const counts = {
    all: assets.length,
    available: assets.filter(a => a.status === 'available').length,
    in_use: assets.filter(a => a.status === 'allocated' || a.status === 'reserved').length,
    maintenance: assets.filter(a => a.status === 'under_maintenance' || a.status === 'under_maintenance_space').length,
    retired: assets.filter(a => ['retired', 'lost', 'disposed'].includes(a.status)).length,
  };

  const stages = [
    {
      id: 'all',
      name: 'Total Catalog',
      desc: 'All tracked assets',
      count: counts.all,
      icon: Package,
      statuses: '', // Empty means clear filter
      color: 'border-steel text-steel',
      activeColor: 'bg-steel/10 border-steel text-ink ring-2 ring-steel/20',
    },
    {
      id: 'available',
      name: 'Available',
      desc: 'Ready for allocation',
      count: counts.available,
      icon: CheckCircle2,
      statuses: 'available',
      color: 'border-status-available text-status-available',
      activeColor: 'bg-status-available/10 border-status-available text-status-available ring-2 ring-status-available/20',
    },
    {
      id: 'in_use',
      name: 'In Use',
      desc: 'Allocated or Reserved',
      count: counts.in_use,
      icon: UserCheck,
      statuses: 'allocated', // We can support filtering in tab
      color: 'border-status-allocated text-status-allocated',
      activeColor: 'bg-status-allocated/10 border-status-allocated text-status-allocated ring-2 ring-status-allocated/20',
    },
    {
      id: 'maintenance',
      name: 'In Repair',
      desc: 'Under maintenance',
      count: counts.maintenance,
      icon: Wrench,
      statuses: 'under_maintenance',
      color: 'border-status-maintenance text-status-maintenance',
      activeColor: 'bg-status-maintenance/10 border-status-maintenance text-status-maintenance ring-2 ring-status-maintenance/20',
    },
    {
      id: 'retired',
      name: 'Retired / Lost',
      desc: 'Written off / inactive',
      count: counts.retired,
      icon: Trash2,
      statuses: 'retired',
      color: 'border-status-retired text-status-retired',
      activeColor: 'bg-status-retired/10 border-status-retired text-status-retired ring-2 ring-status-retired/20',
    },
  ];

  return (
    <div className="w-full bg-white border border-hairline rounded-lg p-6 shadow-sm overflow-x-auto">
      <div className="flex flex-col gap-1.5 mb-6">
        <span className="text-[10px] font-bold uppercase tracking-wider text-steel">Interactive Lifecycle Pipeline</span>
        <h3 className="text-sm font-bold font-display text-ink uppercase tracking-wider">Asset Flow Process Diagram</h3>
        <p className="text-xs text-steel">Click on any workflow stage to filter the directory table by status.</p>
      </div>

      <div className="min-w-[700px] flex items-center justify-between relative px-4">
        {/* Background connector line */}
        <div className="absolute left-8 right-8 top-1/2 -translate-y-1/2 h-0.5 bg-hairline z-0" />

        {stages.map((stage, idx) => {
          const isSelected = selectedStatus === stage.statuses;
          const StageIcon = stage.icon;

          return (
            <div key={stage.id} className="flex flex-col items-center relative z-10 select-none">
              <button
                onClick={() => onSelectStatus(stage.statuses)}
                className={`w-14 h-14 rounded-full border-2 flex items-center justify-center transition-all duration-200 cursor-pointer bg-white group shadow-sm ${
                  isSelected ? stage.activeColor : 'border-hairline text-steel hover:border-accent/40'
                }`}
              >
                <motion.div
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  className="flex flex-col items-center"
                >
                  <StageIcon className="w-5 h-5 group-hover:text-accent transition-colors" />
                </motion.div>
              </button>

              {/* Pulsing indicator if count > 0 and not selected */}
              {stage.count > 0 && !isSelected && (
                <span className={`absolute top-0 right-0 w-3 h-3 rounded-full border border-white flex items-center justify-center text-[8px] font-bold text-white ${
                  stage.id === 'available' ? 'bg-status-available' :
                  stage.id === 'in_use' ? 'bg-status-allocated' :
                  stage.id === 'maintenance' ? 'bg-status-maintenance' :
                  stage.id === 'retired' ? 'bg-status-lost' : 'bg-steel'
                }`}>
                  {stage.count}
                </span>
              )}

              {/* Text label underneath */}
              <div className="text-center mt-3 flex flex-col gap-0.5">
                <span className={`text-xs font-bold uppercase tracking-wider ${isSelected ? 'text-ink' : 'text-steel'}`}>
                  {stage.name}
                </span>
                <span className="text-[10px] text-steel/60 font-medium">
                  {stage.count} assets
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
