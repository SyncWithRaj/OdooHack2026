import React from 'react';

export default function StatusBadge({ domain, status }) {
  if (!status) return null;

  // Normalize status value
  const s = status.toString().toLowerCase().replace(/[\s_-]+/g, '_');

  let text = status;
  let bgClass = 'bg-gray-100 text-gray-800';
  let dotClass = 'bg-gray-400';

  if (domain === 'asset') {
    switch (s) {
      case 'available':
        text = 'Available';
        bgClass = 'bg-status-available/10 text-status-available border border-status-available/20';
        dotClass = 'bg-status-available';
        break;
      case 'allocated':
        text = 'Allocated';
        bgClass = 'bg-status-allocated/10 text-status-allocated border border-status-allocated/20';
        dotClass = 'bg-status-allocated';
        break;
      case 'reserved':
        text = 'Reserved';
        bgClass = 'bg-status-reserved/10 text-status-reserved border border-status-reserved/20';
        dotClass = 'bg-status-reserved';
        break;
      case 'under_maintenance':
        text = 'Under Maintenance';
        bgClass = 'bg-status-maintenance/10 text-status-maintenance border border-status-maintenance/20';
        dotClass = 'bg-status-maintenance';
        break;
      case 'lost':
        text = 'Lost';
        bgClass = 'bg-status-lost/10 text-status-lost border border-status-lost/20';
        dotClass = 'bg-status-lost';
        break;
      case 'retired':
        text = 'Retired';
        bgClass = 'bg-status-retired/10 text-status-retired border border-status-retired/20';
        dotClass = 'bg-status-retired';
        break;
      case 'disposed':
        text = 'Disposed';
        bgClass = 'bg-status-disposed/10 text-status-disposed border border-status-disposed/20';
        dotClass = 'bg-status-disposed';
        break;
      default:
        break;
    }
  } else if (domain === 'booking') {
    switch (s) {
      case 'upcoming':
        text = 'Upcoming';
        bgClass = 'bg-status-upcoming/10 text-status-upcoming border border-status-upcoming/20';
        dotClass = 'bg-status-upcoming';
        break;
      case 'ongoing':
        text = 'Ongoing';
        bgClass = 'bg-status-ongoing/10 text-status-ongoing border border-status-ongoing/20';
        dotClass = 'bg-status-ongoing';
        break;
      case 'completed':
        text = 'Completed';
        bgClass = 'bg-status-completed/10 text-status-completed border border-status-completed/20';
        dotClass = 'bg-status-completed';
        break;
      case 'cancelled':
        text = 'Cancelled';
        bgClass = 'bg-status-cancelled/10 text-status-cancelled border border-status-cancelled/20';
        dotClass = 'bg-status-cancelled';
        break;
      default:
        break;
    }
  } else if (domain === 'maintenance') {
    switch (s) {
      case 'pending':
        text = 'Pending';
        bgClass = 'bg-status-pending/10 text-status-pending border border-status-pending/20';
        dotClass = 'bg-status-pending';
        break;
      case 'approved':
        text = 'Approved';
        bgClass = 'bg-status-approved/10 text-status-approved border border-status-approved/20';
        dotClass = 'bg-status-approved';
        break;
      case 'rejected':
        text = 'Rejected';
        bgClass = 'bg-status-rejected/10 text-status-rejected border border-status-rejected/20';
        dotClass = 'bg-status-rejected';
        break;
      case 'technician_assigned':
        text = 'Technician Assigned';
        bgClass = 'bg-status-tech-assigned/10 text-status-tech-assigned border border-status-tech-assigned/20';
        dotClass = 'bg-status-tech-assigned';
        break;
      case 'in_progress':
        text = 'In Progress';
        bgClass = 'bg-status-in-progress/10 text-status-in-progress border border-status-in-progress/20';
        dotClass = 'bg-status-in-progress';
        break;
      case 'resolved':
        text = 'Resolved';
        bgClass = 'bg-status-resolved/10 text-status-resolved border border-status-resolved/20';
        dotClass = 'bg-status-resolved';
        break;
      default:
        break;
    }
  } else if (domain === 'transfer') {
    switch (s) {
      case 'requested':
        text = 'Requested';
        bgClass = 'bg-status-requested/10 text-status-requested border border-status-requested/20';
        dotClass = 'bg-status-requested';
        break;
      case 'approved':
        text = 'Approved';
        bgClass = 'bg-status-approved/10 text-status-approved border border-status-approved/20';
        dotClass = 'bg-status-approved';
        break;
      case 'reallocated':
      case 're_allocated':
        text = 'Re-allocated';
        bgClass = 'bg-status-reallocated/10 text-status-reallocated border border-status-reallocated/20';
        dotClass = 'bg-status-reallocated';
        break;
      case 'rejected':
        text = 'Rejected';
        bgClass = 'bg-status-rejected/10 text-status-rejected border border-status-rejected/20';
        dotClass = 'bg-status-rejected';
        break;
      default:
        break;
    }
  } else if (domain === 'audit') {
    switch (s) {
      case 'verified':
        text = 'Verified';
        bgClass = 'bg-status-verified/10 text-status-verified border border-status-verified/20';
        dotClass = 'bg-status-verified';
        break;
      case 'missing':
        text = 'Missing';
        bgClass = 'bg-status-missing/10 text-status-missing border border-status-missing/20';
        dotClass = 'bg-status-missing';
        break;
      case 'damaged':
        text = 'Damaged';
        bgClass = 'bg-status-damaged/10 text-status-damaged border border-status-damaged/20';
        dotClass = 'bg-status-damaged';
        break;
      case 'unverified':
        text = 'Unverified';
        bgClass = 'bg-gray-100 text-gray-500 border border-gray-200';
        dotClass = 'bg-gray-400';
        break;
      case 'open':
        text = 'Open';
        bgClass = 'bg-accent/10 text-accent-ink border border-accent/20';
        dotClass = 'bg-accent';
        break;
      case 'closed':
        text = 'Closed';
        bgClass = 'bg-status-retired/10 text-status-retired border border-status-retired/20';
        dotClass = 'bg-status-retired';
        break;
      default:
        break;
    }
  }

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-[4px] text-xs font-mono font-medium ${bgClass}`}>
      <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${dotClass}`}></span>
      {text}
    </span>
  );
}
