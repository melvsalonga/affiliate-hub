'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

export interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  color?: 'primary' | 'secondary' | 'muted';
}

export interface LoadingProps {
  className?: string;
}

const spinnerSizes = {
  sm: 'h-4 w-4',
  md: 'h-6 w-6',
  lg: 'h-8 w-8',
  xl: 'h-12 w-12',
};

const spinnerColors = {
  primary: 'text-primary-500',
  secondary: 'text-secondary-500',
  muted: 'text-muted-foreground',
};

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  size = 'md', 
  className, 
  color = 'primary' 
}) => {
  return (
    <div className={cn('flex items-center justify-center', className)}>
      <Loader2 className={cn(
        'animate-spin',
        spinnerSizes[size],
        spinnerColors[color]
      )} />
    </div>
  );
};

export const LoadingCard: React.FC<LoadingProps> = ({ className }) => {
  return (
    <div className={cn(
      'bg-card border border-border rounded-xl overflow-hidden animate-pulse shadow-sm',
      className
    )}>
      <div className="h-48 bg-muted"></div>
      <div className="p-4 space-y-3">
        <div className="h-4 bg-muted rounded"></div>
        <div className="h-4 bg-muted rounded w-3/4"></div>
        <div className="h-6 bg-muted rounded w-1/2"></div>
        <div className="h-8 bg-muted rounded mt-4"></div>
      </div>
    </div>
  );
};

export const LoadingGrid: React.FC<LoadingProps & { count?: number }> = ({ 
  count = 8, 
  className 
}) => {
  return (
    <div className={cn(
      'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6',
      className
    )}>
      {Array.from({ length: count }).map((_, i) => (
        <LoadingCard key={i} />
      ))}
    </div>
  );
};

export const LoadingButton: React.FC<LoadingProps> = ({ className }) => {
  return (
    <div className={cn(
      'h-10 bg-muted rounded-lg animate-pulse',
      className
    )} />
  );
};

export const LoadingText: React.FC<LoadingProps & { lines?: number }> = ({ 
  lines = 3, 
  className 
}) => {
  return (
    <div className={cn('space-y-2', className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className={cn(
            'h-4 bg-muted rounded animate-pulse',
            i === lines - 1 && 'w-3/4'
          )}
        />
      ))}
    </div>
  );
};

export const LoadingPage: React.FC<LoadingProps> = ({ className }) => {
  return (
    <div className={cn('space-y-6 p-6', className)}>
      {/* Header */}
      <div className="space-y-2">
        <div className="h-8 bg-muted rounded w-1/3 animate-pulse"></div>
        <div className="h-4 bg-muted rounded w-1/2 animate-pulse"></div>
      </div>
      
      {/* Content */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-4">
          <LoadingText lines={5} />
          <LoadingCard />
        </div>
        <div className="space-y-4">
          <div className="h-32 bg-muted rounded-xl animate-pulse"></div>
          <LoadingText lines={3} />
        </div>
      </div>
    </div>
  );
};

export default LoadingSpinner;
