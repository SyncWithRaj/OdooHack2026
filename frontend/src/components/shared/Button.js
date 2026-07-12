import React from 'react';

export default function Button({
  children,
  variant = 'primary',
  type = 'button',
  onClick,
  disabled = false,
  className = '',
  ...props
}) {
  const baseStyles = 'inline-flex items-center justify-center font-medium transition-all focus:outline-none focus:ring-2 focus:ring-accent/50 rounded-[6px] px-4 py-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer';
  
  const variants = {
    primary: 'bg-accent hover:bg-accent/90 text-accent-ink font-semibold shadow-sm',
    secondary: 'border border-hairline hover:bg-surface text-ink font-medium',
    ghost: 'hover:bg-steel/10 text-steel hover:text-ink font-medium',
    destructive: 'bg-status-lost hover:bg-status-lost/90 text-white font-medium shadow-sm focus:ring-status-lost/50',
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${baseStyles} ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
