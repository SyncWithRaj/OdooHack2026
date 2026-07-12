'use client';

import React from 'react';

const statusConfig = {
  asset: {
    available: { bg: 'bg-status-available/10', text: 'text-status-available', border: 'border-status-available/20' },
    allocated: { bg: 'bg-status-allocated/10', text: 'text-status-allocated', border: 'border-status-allocated/20' },
    reserved: { bg: 'bg-status-reserved/10', text: 'text-status-reserved', border: 'border-status-reserved/20' },
    under_maintenance: { bg: 'bg-status-maintenance/10', text: 'text-status-maintenance', border: 'border-status-maintenance/20' },
    under_maintenance_space: { bg: 'bg-status-maintenance/10', text: 'text-status-maintenance', border: 'border-status-maintenance/20', key: 'under maintenance' },
    lost: { bg: 'bg-status-lost/10', text: 'text-status-lost', border: 'border-status-lost/20' },
    retired: { bg: 'bg-status-retired/10', text: 'text-status-retired', border: 'border-status-retired/20' },
    disposed: { bg: 'bg-status-disposed/10', text: 'text-status-disposed', border: 'border-status-disposed/20' }
  },
  booking: {
    upcoming: { bg: 'bg-status-allocated/10', text: 'text-status-allocated', border: 'border-status-allocated/20' },
    ongoing: { bg: 'bg-status-available/10', text: 'text-status-available', border: 'border-status-available/20' },
    completed: { bg: 'bg-status-retired/10', text: 'text-status-retired', border: 'border-status-retired/20' },
    cancelled: { bg: 'bg-status-lost/10', text: 'text-status-lost', border: 'border-status-lost/20' }
  },
  maintenance: {
    pending: { bg: 'bg-status-maintenance/10', text: 'text-status-maintenance', border: 'border-status-maintenance/20' },
    approved: { bg: 'bg-status-allocated/10', text: 'text-status-allocated', border: 'border-status-allocated/20' },
    rejected: { bg: 'bg-status-lost/10', text: 'text-status-lost', border: 'border-status-lost/20' },
    technician_assigned: { bg: 'bg-status-reserved/10', text: 'text-status-reserved', border: 'border-status-reserved/20' },
    technician_assigned_space: { bg: 'bg-status-reserved/10', text: 'text-status-reserved', border: 'border-status-reserved/20', key: 'technician assigned' },
    in_progress: { bg: 'bg-amber-100', text: 'text-amber-800', border: 'border-amber-200' },
    in_progress_space: { bg: 'bg-amber-100', text: 'text-amber-800', border: 'border-amber-200', key: 'in progress' },
    resolved: { bg: 'bg-status-available/10', text: 'text-status-available', border: 'border-status-available/20' }
  },
  transfer: {
    requested: { bg: 'bg-status-maintenance/10', text: 'text-status-maintenance', border: 'border-status-maintenance/20' },
    approved: { bg: 'bg-status-allocated/10', text: 'text-status-allocated', border: 'border-status-allocated/20' },
    rejected: { bg: 'bg-status-lost/10', text: 'text-status-lost', border: 'border-status-lost/20' },
    reallocated: { bg: 'bg-status-available/10', text: 'text-status-available', border: 'border-status-available/20' },
    reallocated_space: { bg: 'bg-status-available/10', text: 'text-status-available', border: 'border-status-available/20', key: 're-allocated' }
  },
  audit: {
    unverified: { bg: 'bg-status-retired/10', text: 'text-status-retired', border: 'border-status-retired/20' },
    verified: { bg: 'bg-status-available/10', text: 'text-status-available', border: 'border-status-available/20' },
    missing: { bg: 'bg-status-lost/10', text: 'text-status-lost', border: 'border-status-lost/20' },
    damaged: { bg: 'bg-status-maintenance/10', text: 'text-status-maintenance', border: 'border-status-maintenance/20' }
  }
};

export default function StatusBadge({ domain, status }) {
  if (!status) return null;
  
  const normalizedStatus = status.toLowerCase().replace(/[\s-]/g, '_');
  const group = statusConfig[domain] || {};
  let config = group[normalizedStatus];

  // Fallback for custom statuses or formatting issues
  if (!config) {
    // Try matching by checking if the custom status contains any of the keys
    const matchKey = Object.keys(group).find(key => 
      key === normalizedStatus || 
      (group[key].key && group[key].key.toLowerCase().replace(/[\s-]/g, '_') === normalizedStatus)
    );
    config = matchKey ? group[matchKey] : { bg: 'bg-gray-100', text: 'text-gray-800', border: 'border-gray-200' };
  }

  const label = status.replace(/_/g, ' ');

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${config.bg} ${config.text} ${config.border} capitalize`}>
      {label}
    </span>
  );
}
