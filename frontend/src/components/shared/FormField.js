'use client';

import React from 'react';

export default function FormField({
  label,
  id,
  type = 'text',
  error,
  helperText,
  required = false,
  className = '',
  children,
  ...props
}) {
  const isTextarea = type === 'textarea';
  const isSelect = type === 'select';
  
  const inputBaseStyle = "block w-full px-3 py-2 border border-hairline bg-white rounded-md text-ink text-sm shadow-sm placeholder-steel/50 focus:outline-none focus:ring-1 focus:ring-accent focus:border-accent disabled:bg-surface disabled:text-steel/50 transition-colors";
  const errorStyle = error ? "border-status-lost focus:ring-status-lost focus:border-status-lost" : "";

  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      {label && (
        <label htmlFor={id} className="text-xs font-semibold uppercase tracking-wider text-steel">
          {label}
          {required && <span className="text-status-lost ml-1">*</span>}
        </label>
      )}
      
      {isTextarea ? (
        <textarea
          id={id}
          required={required}
          className={`${inputBaseStyle} ${errorStyle} min-h-[80px] resize-y`}
          {...props}
        />
      ) : isSelect ? (
        <select
          id={id}
          required={required}
          className={`${inputBaseStyle} ${errorStyle}`}
          {...props}
        >
          {children}
        </select>
      ) : (
        <input
          id={id}
          type={type}
          required={required}
          className={`${inputBaseStyle} ${errorStyle}`}
          {...props}
        />
      )}

      {error ? (
        <p className="text-xs font-medium text-status-lost">{error}</p>
      ) : helperText ? (
        <p className="text-xs text-steel">{helperText}</p>
      ) : null}
    </div>
  );
}
