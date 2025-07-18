'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'success' | 'warning';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  loading?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
  children: React.ReactNode;
}

const buttonVariants = {
  variant: {
    primary: 'bg-primary-500 hover:bg-primary-600 active:bg-primary-700 text-white shadow-md hover:shadow-lg transform hover:scale-105 active:scale-95',
    secondary: 'bg-secondary-500 hover:bg-secondary-600 active:bg-secondary-700 text-white shadow-md hover:shadow-lg transform hover:scale-105 active:scale-95',
    outline: 'border-2 border-primary-500 text-primary-500 hover:bg-primary-500 hover:text-white hover:border-primary-500 active:bg-primary-600',
    ghost: 'text-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900/20 hover:text-primary-600 active:bg-primary-100 dark:active:bg-primary-900/30',
    danger: 'bg-error-500 hover:bg-error-600 active:bg-error-700 text-white shadow-md hover:shadow-lg transform hover:scale-105 active:scale-95',
    success: 'bg-success-500 hover:bg-success-600 active:bg-success-700 text-white shadow-md hover:shadow-lg transform hover:scale-105 active:scale-95',
    warning: 'bg-warning-500 hover:bg-warning-600 active:bg-warning-700 text-white shadow-md hover:shadow-lg transform hover:scale-105 active:scale-95',
  },
  size: {
    xs: 'px-2 py-1 text-xs font-medium',
    sm: 'px-3 py-1.5 text-sm font-medium',
    md: 'px-4 py-2 text-base font-medium',
    lg: 'px-6 py-3 text-lg font-semibold',
    xl: 'px-8 py-4 text-xl font-semibold',
  },
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ 
    className, 
    variant = 'primary', 
    size = 'md', 
    loading = false, 
    icon, 
    iconPosition = 'left',
    fullWidth = false,
    children, 
    disabled, 
    ...props 
  }, ref) => {
    const iconElement = loading ? (
      <Loader2 className="h-4 w-4 animate-spin" />
    ) : icon ? (
      <span className="flex items-center">{icon}</span>
    ) : null;

    return (
      <button
        className={cn(
          // Base styles
          'inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-all duration-200',
          'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2',
          'disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none',
          // Variant styles
          buttonVariants.variant[variant],
          // Size styles
          buttonVariants.size[size],
          // Full width
          fullWidth && 'w-full',
          className
        )}
        disabled={disabled || loading}
        ref={ref}
        {...props}
      >
        {iconElement && iconPosition === 'left' && iconElement}
        {children}
        {iconElement && iconPosition === 'right' && iconElement}
      </button>
    );
  }
);

Button.displayName = 'Button';