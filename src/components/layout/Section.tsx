'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { Container, ContainerProps } from './Container';

export interface SectionProps extends React.HTMLAttributes<HTMLElement> {
  variant?: 'default' | 'primary' | 'secondary' | 'muted' | 'accent';
  spacing?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  containerProps?: Omit<ContainerProps, 'children'>;
  children: React.ReactNode;
}

const sectionVariants = {
  variant: {
    default: 'bg-background text-foreground',
    primary: 'bg-primary-50 dark:bg-primary-950/20 text-foreground',
    secondary: 'bg-secondary-50 dark:bg-secondary-950/20 text-foreground',
    muted: 'bg-muted text-muted-foreground',
    accent: 'bg-accent text-accent-foreground',
  },
  spacing: {
    none: 'py-0',
    sm: 'py-8',
    md: 'py-12',
    lg: 'py-16',
    xl: 'py-24',
  },
};

export const Section = React.forwardRef<HTMLElement, SectionProps>(
  ({ className, variant = 'default', spacing = 'md', containerProps, children, ...props }, ref) => {
    return (
      <section
        ref={ref}
        className={cn(
          sectionVariants.variant[variant],
          sectionVariants.spacing[spacing],
          className
        )}
        {...props}
      >
        <Container {...containerProps}>
          {children}
        </Container>
      </section>
    );
  }
);

Section.displayName = 'Section';