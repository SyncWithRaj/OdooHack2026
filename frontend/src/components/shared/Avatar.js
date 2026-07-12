import React from 'react';

export default function Avatar({ name, size = 'md', className = '' }) {
  const getInitials = (n) => {
    if (!n) return '?';
    const parts = n.split(' ');
    if (parts.length > 1) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return n[0].toUpperCase();
  };

  const sizes = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-14 h-14 text-lg font-semibold',
  };

  return (
    <div
      className={`rounded-full bg-accent/20 text-accent-ink font-mono font-medium flex items-center justify-center border border-accent/30 select-none shadow-inner ${sizes[size]} ${className}`}
      title={name}
    >
      {getInitials(name)}
    </div>
  );
}
