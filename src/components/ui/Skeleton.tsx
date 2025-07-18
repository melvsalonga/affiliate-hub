'use client';

import React from 'react';
import { cn } from '@/lib/utils';

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'circular' | 'rectangular' | 'text';
  width?: string | number;
  height?: string | number;
  lines?: number;
}

export const Skeleton = React.forwardRef<HTMLDivElement, SkeletonProps>(
  ({ className, variant = 'default', width, height, lines = 1, ...props }, ref) => {
    const baseClasses = "animate-pulse bg-muted";
    
    const variantClasses = {
      default: "rounded-md",
      circular: "rounded-full",
      rectangular: "rounded-none",
      text: "rounded-sm h-4",
    };

    if (variant === 'text' && lines > 1) {
      return (
        <div className="space-y-2" ref={ref} {...props}>
          {Array.from({ length: lines }).map((_, index) => (
            <div
              key={index}
              className={cn(
                baseClasses,
                variantClasses.text,
                index === lines - 1 && "w-3/4", // Last line is shorter
                className
              )}
              style={{ width: index === lines - 1 ? undefined : width, height }}
            />
          ))}
        </div>
      );
    }

    return (
      <div
        ref={ref}
        className={cn(
          baseClasses,
          variantClasses[variant],
          className
        )}
        style={{ width, height }}
        {...props}
      />
    );
  }
);

Skeleton.displayName = 'Skeleton';

// Preset skeleton components for common use cases
export const ProductCardSkeleton = () => (
  <div className="space-y-4 p-4 border border-border rounded-xl">
    <Skeleton variant="rectangular" className="w-full h-48" />
    <div className="space-y-2">
      <Skeleton variant="text" className="w-full" />
      <Skeleton variant="text" className="w-3/4" />
    </div>
    <div className="flex justify-between items-center">
      <Skeleton variant="text" className="w-20 h-6" />
      <Skeleton variant="rectangular" className="w-24 h-8 rounded-lg" />
    </div>
  </div>
);

export const HeaderSkeleton = () => (
  <div className="h-20 border-b border-border bg-background">
    <div className="container mx-auto px-4 h-full flex items-center justify-between">
      <div className="flex items-center space-x-3">
        <Skeleton variant="circular" width={48} height={48} />
        <div className="space-y-1">
          <Skeleton variant="text" width={120} height={20} />
          <Skeleton variant="text" width={80} height={12} />
        </div>
      </div>
      <div className="hidden md:flex items-center space-x-4">
        <Skeleton variant="rectangular" width={300} height={40} className="rounded-xl" />
        <Skeleton variant="circular" width={36} height={36} />
      </div>
    </div>
  </div>
);

export const AnalyticsCardSkeleton = () => (
  <div className="p-6 border border-border rounded-xl space-y-4">
    <div className="flex items-center justify-between">
      <Skeleton variant="text" width={100} height={16} />
      <Skeleton variant="circular" width={24} height={24} />
    </div>
    <Skeleton variant="text" width={80} height={32} />
    <Skeleton variant="rectangular" width="100%" height={100} className="rounded-md" />
  </div>
);