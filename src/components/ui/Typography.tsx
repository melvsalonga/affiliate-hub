'use client';

import React from 'react';
import { cn } from '@/lib/utils';

export interface TypographyProps extends React.HTMLAttributes<HTMLElement> {
  variant?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'body1' | 'body2' | 'caption' | 'overline';
  component?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'p' | 'span' | 'div';
  color?: 'default' | 'primary' | 'secondary' | 'muted' | 'success' | 'warning' | 'error';
  align?: 'left' | 'center' | 'right' | 'justify';
  weight?: 'light' | 'normal' | 'medium' | 'semibold' | 'bold';
  children: React.ReactNode;
}

const typographyVariants = {
  variant: {
    h1: 'text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight',
    h2: 'text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight',
    h3: 'text-2xl md:text-3xl lg:text-4xl font-semibold tracking-tight',
    h4: 'text-xl md:text-2xl lg:text-3xl font-semibold tracking-tight',
    h5: 'text-lg md:text-xl lg:text-2xl font-semibold',
    h6: 'text-base md:text-lg lg:text-xl font-semibold',
    body1: 'text-base leading-relaxed',
    body2: 'text-sm leading-relaxed',
    caption: 'text-xs leading-normal',
    overline: 'text-xs font-medium uppercase tracking-wider',
  },
  color: {
    default: 'text-foreground',
    primary: 'text-primary-600 dark:text-primary-400',
    secondary: 'text-secondary-600 dark:text-secondary-400',
    muted: 'text-muted-foreground',
    success: 'text-success-600 dark:text-success-400',
    warning: 'text-warning-600 dark:text-warning-400',
    error: 'text-error-600 dark:text-error-400',
  },
  align: {
    left: 'text-left',
    center: 'text-center',
    right: 'text-right',
    justify: 'text-justify',
  },
  weight: {
    light: 'font-light',
    normal: 'font-normal',
    medium: 'font-medium',
    semibold: 'font-semibold',
    bold: 'font-bold',
  },
};

const defaultComponents = {
  h1: 'h1',
  h2: 'h2',
  h3: 'h3',
  h4: 'h4',
  h5: 'h5',
  h6: 'h6',
  body1: 'p',
  body2: 'p',
  caption: 'span',
  overline: 'span',
} as const;

export const Typography = React.forwardRef<HTMLElement, TypographyProps>(
  ({ 
    className, 
    variant = 'body1', 
    component, 
    color = 'default', 
    align = 'left',
    weight,
    children, 
    ...props 
  }, ref) => {
    const Component = component || defaultComponents[variant] || 'p';
    
    return React.createElement(
      Component,
      {
        ref,
        className: cn(
          typographyVariants.variant[variant],
          typographyVariants.color[color],
          typographyVariants.align[align],
          weight && typographyVariants.weight[weight],
          className
        ),
        ...props,
      },
      children
    );
  }
);

Typography.displayName = 'Typography';

// Convenience components
export const Heading1 = React.forwardRef<HTMLHeadingElement, Omit<TypographyProps, 'variant'>>(
  (props, ref) => <Typography ref={ref} variant="h1" component="h1" {...props} />
);
Heading1.displayName = 'Heading1';

export const Heading2 = React.forwardRef<HTMLHeadingElement, Omit<TypographyProps, 'variant'>>(
  (props, ref) => <Typography ref={ref} variant="h2" component="h2" {...props} />
);
Heading2.displayName = 'Heading2';

export const Heading3 = React.forwardRef<HTMLHeadingElement, Omit<TypographyProps, 'variant'>>(
  (props, ref) => <Typography ref={ref} variant="h3" component="h3" {...props} />
);
Heading3.displayName = 'Heading3';

export const Heading4 = React.forwardRef<HTMLHeadingElement, Omit<TypographyProps, 'variant'>>(
  (props, ref) => <Typography ref={ref} variant="h4" component="h4" {...props} />
);
Heading4.displayName = 'Heading4';

export const Heading5 = React.forwardRef<HTMLHeadingElement, Omit<TypographyProps, 'variant'>>(
  (props, ref) => <Typography ref={ref} variant="h5" component="h5" {...props} />
);
Heading5.displayName = 'Heading5';

export const Heading6 = React.forwardRef<HTMLHeadingElement, Omit<TypographyProps, 'variant'>>(
  (props, ref) => <Typography ref={ref} variant="h6" component="h6" {...props} />
);
Heading6.displayName = 'Heading6';

export const Body1 = React.forwardRef<HTMLParagraphElement, Omit<TypographyProps, 'variant'>>(
  (props, ref) => <Typography ref={ref} variant="body1" component="p" {...props} />
);
Body1.displayName = 'Body1';

export const Body2 = React.forwardRef<HTMLParagraphElement, Omit<TypographyProps, 'variant'>>(
  (props, ref) => <Typography ref={ref} variant="body2" component="p" {...props} />
);
Body2.displayName = 'Body2';

export const Caption = React.forwardRef<HTMLSpanElement, Omit<TypographyProps, 'variant'>>(
  (props, ref) => <Typography ref={ref} variant="caption" component="span" {...props} />
);
Caption.displayName = 'Caption';

export const Overline = React.forwardRef<HTMLSpanElement, Omit<TypographyProps, 'variant'>>(
  (props, ref) => <Typography ref={ref} variant="overline" component="span" {...props} />
);
Overline.displayName = 'Overline';