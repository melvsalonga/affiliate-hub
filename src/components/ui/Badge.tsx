'use client';

import React from 'react';
import { cn } from '@/lib/utils';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
}

const badgeVariants = {
  variant: {
    default: 'bg-neutral-100 text-neutral-800 dark:bg-neutral-800 dark:text-neutral-200',
    primary: 'bg-primary-100 text-primary-800 dark:bg-primary-900/20 dark:text-primary-200',
    secondary: 'bg-secondary-100 text-secondary-800 dark:bg-secondary-900/20 dark:text-secondary-200',
    success: 'bg-success-100 text-success-800 dark:bg-success-900/20 dark:text-success-200',
    warning: 'bg-warning-100 text-warning-800 dark:bg-warning-900/20 dark:text-warning-200',
    error: 'bg-error-100 text-error-800 dark:bg-error-900/20 dark:text-error-200',
    outline: 'border border-border text-foreground bg-transparent',
  },
  size: {
    sm: 'px-2 py-0.5 text-xs font-medium',
    md: 'px-2.5 py-1 text-sm font-medium',
    lg: 'px-3 py-1.5 text-base font-medium',
  },
};

export const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant = 'default', size = 'md', children, ...props }, ref) => {
    return (
      <span
        ref={ref}
        className={cn(
          'inline-flex items-center rounded-full font-medium transition-colors',
          badgeVariants.variant[variant],
          badgeVariants.size[size],
          className
        )}
        {...props}
      >
        {children}
      </span>
    );
  }
);

Badge.displayName = 'Badge';