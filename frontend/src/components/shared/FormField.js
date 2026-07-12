import React from 'react';

export default function FormField({
  label,
  type = 'text',
  name,
  value,
  onChange,
  placeholder,
  required = false,
  error,
  helperText,
  options = [], // for 'select'
  rows = 3, // for 'textarea'
  className = '',
  ...props
}) {
  const inputBaseClass = `w-full bg-surface-raised border rounded-[6px] px-3 py-2 text-sm text-ink placeholder:text-steel/50 focus:outline-none focus:ring-1 focus:ring-accent focus:border-accent ${
    error ? 'border-status-lost' : 'border-hairline hover:border-steel/50'
  }`;

  return (
    <div className={`mb-4 flex flex-col gap-1.5 ${className}`}>
      {label && (
        <label className="text-xs font-semibold text-ink uppercase tracking-wider">
          {label} {required && <span className="text-status-lost">*</span>}
        </label>
      )}

      {type === 'select' ? (
        <select
          name={name}
          value={value}
          onChange={onChange}
          required={required}
          className={`${inputBaseClass} cursor-pointer`}
          {...props}
        >
          {placeholder && <option value="">{placeholder}</option>}
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      ) : type === 'textarea' ? (
        <textarea
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          rows={rows}
          className={inputBaseClass}
          {...props}
        />
      ) : type === 'file' ? (
        <input
          type="file"
          name={name}
          onChange={onChange}
          required={required}
          className="text-sm text-steel file:mr-4 file:py-2 file:px-4 file:rounded-[6px] file:border-0 file:text-xs file:font-semibold file:bg-accent/10 file:text-accent-ink hover:file:bg-accent/20 cursor-pointer"
          {...props}
        />
      ) : (
        <input
          type={type}
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          className={inputBaseClass}
          {...props}
        />
      )}

      {error ? (
        <span className="text-xs font-mono font-medium text-status-lost">{error}</span>
      ) : (
        helperText && <span className="text-xs text-steel">{helperText}</span>
      )}
    </div>
  );
}
