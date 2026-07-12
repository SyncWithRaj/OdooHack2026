import React from 'react';
import { X } from 'lucide-react';
import Button from './Button';

export default function Modal({
  isOpen,
  onClose,
  title,
  children,
  footer,
  maxWidthClass = 'max-w-md',
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/50 backdrop-blur-xs">
      <div className={`w-full ${maxWidthClass} bg-surface-raised border border-hairline rounded-[10px] shadow-xl overflow-hidden flex flex-col max-h-[90vh]`}>
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-hairline bg-surface">
          <h3 className="font-semibold text-ink font-display text-base uppercase tracking-wider">{title}</h3>
          <button
            onClick={onClose}
            className="p-1 hover:bg-steel/15 text-steel hover:text-ink rounded-[4px] cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="px-6 py-4 overflow-y-auto flex-1">
          {children}
        </div>

        {/* Modal Footer */}
        {footer && (
          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-hairline bg-surface">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
