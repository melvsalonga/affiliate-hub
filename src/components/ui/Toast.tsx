'use client';

import React, { useEffect, useState, createContext, useContext } from 'react';
import { cn } from '@/lib/utils';
import { CheckCircle, XCircle, Info, AlertTriangle, X } from 'lucide-react';

export interface ToastProps {
  id: string;
  title?: string;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface ToastItemProps extends ToastProps {
  onClose: (id: string) => void;
}

const ToastItem: React.FC<ToastItemProps> = ({
  id,
  title,
  message,
  type,
  duration = 5000,
  action,
  onClose,
}) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(() => onClose(id), 300);
    }, duration);

    return () => clearTimeout(timer);
  }, [id, duration, onClose]);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => onClose(id), 300);
  };

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-success-500" />;
      case 'error':
        return <XCircle className="h-5 w-5 text-error-500" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-warning-500" />;
      case 'info':
        return <Info className="h-5 w-5 text-primary-500" />;
    }
  };

  const getStyles = () => {
    switch (type) {
      case 'success':
        return 'border-success-200 bg-success-50 dark:bg-success-900/20 dark:border-success-800';
      case 'error':
        return 'border-error-200 bg-error-50 dark:bg-error-900/20 dark:border-error-800';
      case 'warning':
        return 'border-warning-200 bg-warning-50 dark:bg-warning-900/20 dark:border-warning-800';
      case 'info':
        return 'border-primary-200 bg-primary-50 dark:bg-primary-900/20 dark:border-primary-800';
    }
  };

  return (
    <div
      className={cn(
        'pointer-events-auto w-full max-w-sm overflow-hidden rounded-xl border shadow-lg transition-all duration-300',
        'transform-gpu',
        isVisible 
          ? 'translate-x-0 opacity-100 scale-100' 
          : 'translate-x-full opacity-0 scale-95',
        getStyles()
      )}
    >
      <div className="p-4">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            {getIcon()}
          </div>
          <div className="ml-3 w-0 flex-1">
            {title && (
              <p className="text-sm font-semibold text-foreground">
                {title}
              </p>
            )}
            <p className={cn(
              "text-sm text-muted-foreground",
              !title && "text-foreground"
            )}>
              {message}
            </p>
            {action && (
              <div className="mt-3">
                <button
                  onClick={action.onClick}
                  className={cn(
                    "text-sm font-medium underline-offset-4 hover:underline",
                    type === 'success' && "text-success-600 dark:text-success-400",
                    type === 'error' && "text-error-600 dark:text-error-400",
                    type === 'warning' && "text-warning-600 dark:text-warning-400",
                    type === 'info' && "text-primary-600 dark:text-primary-400"
                  )}
                >
                  {action.label}
                </button>
              </div>
            )}
          </div>
          <div className="ml-4 flex flex-shrink-0">
            <button
              onClick={handleClose}
              className="inline-flex rounded-md text-muted-foreground hover:text-foreground focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Toast Context
interface ToastContextType {
  addToast: (toast: Omit<ToastProps, 'id'>) => void;
  removeToast: (id: string) => void;
  toasts: ToastProps[];
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastProps[]>([]);

  const addToast = (toast: Omit<ToastProps, 'id'>) => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts(prev => [...prev, { ...toast, id }]);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  return (
    <ToastContext.Provider value={{ addToast, removeToast, toasts }}>
      {children}
      <ToastContainer toasts={toasts} onClose={removeToast} />
    </ToastContext.Provider>
  );
};

// Toast Container Component
interface ToastContainerProps {
  toasts: ToastProps[];
  onClose: (id: string) => void;
}

const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, onClose }) => {
  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 pointer-events-none">
      {toasts.map(toast => (
        <ToastItem
          key={toast.id}
          {...toast}
          onClose={onClose}
        />
      ))}
    </div>
  );
};

// Toast Hook
export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }

  const { addToast } = context;

  return {
    toast: addToast,
    success: (message: string, options?: Partial<Omit<ToastProps, 'id' | 'type' | 'message'>>) =>
      addToast({ message, type: 'success', ...options }),
    error: (message: string, options?: Partial<Omit<ToastProps, 'id' | 'type' | 'message'>>) =>
      addToast({ message, type: 'error', ...options }),
    info: (message: string, options?: Partial<Omit<ToastProps, 'id' | 'type' | 'message'>>) =>
      addToast({ message, type: 'info', ...options }),
    warning: (message: string, options?: Partial<Omit<ToastProps, 'id' | 'type' | 'message'>>) =>
      addToast({ message, type: 'warning', ...options }),
  };
};
