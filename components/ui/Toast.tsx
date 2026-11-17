// components/ui/Toast.tsx
import React, { useEffect } from 'react';
import { Icons } from './Icons';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info';
  title: string;
  description?: string;
}

interface ToastProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export const ToastContainer: React.FC<ToastProps> = ({ toasts, onDismiss }) => {
  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onDismiss={onDismiss} />
      ))}
    </div>
  );
};

const ToastItem: React.FC<{ toast: ToastMessage; onDismiss: (id: string) => void }> = ({ toast, onDismiss }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onDismiss(toast.id);
    }, 4000);
    return () => clearTimeout(timer);
  }, [toast.id, onDismiss]);

  const borderColors = {
    success: 'border-emerald-500/40 bg-emerald-950/90 text-emerald-200 dark:bg-emerald-950/90',
    error: 'border-rose-500/40 bg-rose-950/90 text-rose-200 dark:bg-rose-950/90',
    info: 'border-indigo-500/40 bg-indigo-950/90 text-indigo-200 dark:bg-indigo-950/90',
  };

  const iconColors = {
    success: 'text-emerald-400',
    error: 'text-rose-400',
    info: 'text-indigo-400',
  };

  return (
    <div
      className={`pointer-events-auto p-4 rounded-xl border shadow-xl backdrop-blur-md flex items-start gap-3 transition-all animate-in fade-in slide-in-from-bottom-2 ${borderColors[toast.type]}`}
    >
      <div className={`mt-0.5 shrink-0 ${iconColors[toast.type]}`}>
        {toast.type === 'success' && <Icons.Check className="w-5 h-5" />}
        {toast.type === 'error' && <Icons.AlertTriangle className="w-5 h-5" />}
        {toast.type === 'info' && <Icons.HelpCircle className="w-5 h-5" />}
      </div>
      <div className="flex-1 text-xs">
        <div className="font-semibold text-white">{toast.title}</div>
        {toast.description && <div className="text-slate-300 mt-0.5">{toast.description}</div>}
      </div>
      <button
        onClick={() => onDismiss(toast.id)}
        className="text-slate-400 hover:text-white transition-colors"
      >
        <Icons.X className="w-4 h-4" />
      </button>
    </div>
  );
};
