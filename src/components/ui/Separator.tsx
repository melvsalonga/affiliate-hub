'use client';

import React from 'react';
import { cn } from '@/lib/utils';

export interface SeparatorProps extends React.HTMLAttributes<HTMLDivElement> {
  orientation?: 'horizontal' | 'vertical';
  variant?: 'default' | 'dashed' | 'dotted';
  spacing?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
}

const separatorVariants = {
  orientation: {
    horizontal: 'w-full h-px',
    vertical: 'h-full w-px',
  },
  variant: {
    default: 'bg-border',
    dashed: 'border-t border-dashed border-border bg-transparent',
    dotted: 'border-t border-dotted border-border bg-transparent',
  },
  spacing: {
    none: '',
    sm: 'my-2',
    md: 'my-4',
    lg: 'my-6',
    xl: 'my-8',
  },
};

export const Separator = React.forwardRef<HTMLDivElement, SeparatorProps>(
  ({ className, orientation = 'horizontal', variant = 'default', spacing = 'md', ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          separatorVariants.orientation[orientation],
          variant === 'default' ? separatorVariants.variant.default : '',
          variant === 'dashed' ? separatorVariants.variant.dashed : '',
          variant === 'dotted' ? separatorVariants.variant.dotted : '',
          orientation === 'horizontal' && separatorVariants.spacing[spacing],
          orientation === 'vertical' && spacing !== 'none' && 'mx-4',
          className
        )}
        {...props}
      />
    );
  }
);

Separator.displayName = 'Separator';