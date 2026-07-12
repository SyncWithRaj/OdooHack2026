import React, { createContext, useContext, useState, useCallback } from 'react';
import { X, CheckCircle, AlertTriangle, AlertCircle, Info } from 'lucide-react';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'success', duration = 4000) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);

    setTimeout(() => {
      removeToast(id);
    }, duration);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ showToast: addToast }}>
      {children}
      {/* Toast Container */}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full">
        {toasts.map((toast) => {
          let icon = <Info className="w-5 h-5 text-blue-500" />;
          let bgClass = 'bg-surface-raised border-l-4 border-blue-500';

          if (toast.type === 'success') {
            icon = <CheckCircle className="w-5 h-5 text-status-available" />;
            bgClass = 'bg-surface-raised border-l-4 border-status-available';
          } else if (toast.type === 'warning') {
            icon = <AlertTriangle className="w-5 h-5 text-status-maintenance" />;
            bgClass = 'bg-surface-raised border-l-4 border-status-maintenance';
          } else if (toast.type === 'error') {
            icon = <AlertCircle className="w-5 h-5 text-status-lost" />;
            bgClass = 'bg-surface-raised border-l-4 border-status-lost';
          }

          return (
            <div
              key={toast.id}
              className={`flex items-start justify-between p-4 rounded-[6px] border border-hairline shadow-lg transition-all duration-300 animate-slide-in ${bgClass}`}
            >
              <div className="flex items-center gap-3">
                {icon}
                <span className="text-sm font-medium text-ink">{toast.message}</span>
              </div>
              <button
                onClick={() => removeToast(toast.id)}
                className="p-1 hover:bg-steel/15 text-steel hover:text-ink rounded-[4px] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
