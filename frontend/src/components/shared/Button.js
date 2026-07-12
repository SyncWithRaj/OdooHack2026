'use client';

import React from 'react';
import { Loader2 } from 'lucide-react';

export default function Button({
  children,
  type = 'button',
  variant = 'primary', // primary | secondary | ghost | destructive
  loading = false,
  disabled = false,
  className = '',
  icon: Icon,
  onClick,
  ...props
}) {
  const baseStyle = "inline-flex items-center justify-center font-medium rounded-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent disabled:opacity-50 disabled:cursor-not-allowed text-sm px-4 py-2";
  
  const variants = {
    primary: "bg-accent text-accent-ink hover:bg-accent/90 shadow-sm",
    secondary: "bg-white border border-hairline text-ink hover:bg-surface shadow-sm",
    ghost: "text-steel hover:bg-surface hover:text-ink",
    destructive: "bg-status-lost text-white hover:bg-status-lost/95 shadow-sm focus:ring-status-lost"
  };

  return (
    <button
      type={type}
      disabled={disabled || loading}
      onClick={onClick}
      className={`${baseStyle} ${variants[variant]} ${className}`}
      {...props}
    >
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin mr-2" />
      ) : Icon ? (
        <Icon className="w-4 h-4 mr-2" />
      ) : null}
      {children}
    </button>
  );
}
