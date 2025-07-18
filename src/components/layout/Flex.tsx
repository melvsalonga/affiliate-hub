'use client';

import React from 'react';
import { cn } from '@/lib/utils';

export interface FlexProps extends React.HTMLAttributes<HTMLDivElement> {
  direction?: 'row' | 'col' | 'row-reverse' | 'col-reverse';
  align?: 'start' | 'center' | 'end' | 'stretch' | 'baseline';
  justify?: 'start' | 'center' | 'end' | 'between' | 'around' | 'evenly';
  wrap?: 'nowrap' | 'wrap' | 'wrap-reverse';
  gap?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  responsive?: {
    sm?: Partial<Pick<FlexProps, 'direction' | 'align' | 'justify' | 'wrap'>>;
    md?: Partial<Pick<FlexProps, 'direction' | 'align' | 'justify' | 'wrap'>>;
    lg?: Partial<Pick<FlexProps, 'direction' | 'align' | 'justify' | 'wrap'>>;
    xl?: Partial<Pick<FlexProps, 'direction' | 'align' | 'justify' | 'wrap'>>;
  };
  children: React.ReactNode;
}

const flexDirection = {
  row: 'flex-row',
  col: 'flex-col',
  'row-reverse': 'flex-row-reverse',
  'col-reverse': 'flex-col-reverse',
};

const flexAlign = {
  start: 'items-start',
  center: 'items-center',
  end: 'items-end',
  stretch: 'items-stretch',
  baseline: 'items-baseline',
};

const flexJustify = {
  start: 'justify-start',
  center: 'justify-center',
  end: 'justify-end',
  between: 'justify-between',
  around: 'justify-around',
  evenly: 'justify-evenly',
};

const flexWrap = {
  nowrap: 'flex-nowrap',
  wrap: 'flex-wrap',
  'wrap-reverse': 'flex-wrap-reverse',
};

const flexGaps = {
  none: 'gap-0',
  sm: 'gap-2',
  md: 'gap-4',
  lg: 'gap-6',
  xl: 'gap-8',
};

export const Flex = React.forwardRef<HTMLDivElement, FlexProps>(
  ({ 
    className, 
    direction = 'row', 
    align = 'start', 
    justify = 'start', 
    wrap = 'nowrap',
    gap = 'none',
    responsive,
    children, 
    ...props 
  }, ref) => {
    const responsiveClasses = responsive ? [
      responsive.sm?.direction && `sm:${flexDirection[responsive.sm.direction]}`,
      responsive.sm?.align && `sm:${flexAlign[responsive.sm.align]}`,
      responsive.sm?.justify && `sm:${flexJustify[responsive.sm.justify]}`,
      responsive.sm?.wrap && `sm:${flexWrap[responsive.sm.wrap]}`,
      responsive.md?.direction && `md:${flexDirection[responsive.md.direction]}`,
      responsive.md?.align && `md:${flexAlign[responsive.md.align]}`,
      responsive.md?.justify && `md:${flexJustify[responsive.md.justify]}`,
      responsive.md?.wrap && `md:${flexWrap[responsive.md.wrap]}`,
      responsive.lg?.direction && `lg:${flexDirection[responsive.lg.direction]}`,
      responsive.lg?.align && `lg:${flexAlign[responsive.lg.align]}`,
      responsive.lg?.justify && `lg:${flexJustify[responsive.lg.justify]}`,
      responsive.lg?.wrap && `lg:${flexWrap[responsive.lg.wrap]}`,
      responsive.xl?.direction && `xl:${flexDirection[responsive.xl.direction]}`,
      responsive.xl?.align && `xl:${flexAlign[responsive.xl.align]}`,
      responsive.xl?.justify && `xl:${flexJustify[responsive.xl.justify]}`,
      responsive.xl?.wrap && `xl:${flexWrap[responsive.xl.wrap]}`,
    ].filter(Boolean).join(' ') : '';

    return (
      <div
        ref={ref}
        className={cn(
          'flex',
          flexDirection[direction],
          flexAlign[align],
          flexJustify[justify],
          flexWrap[wrap],
          flexGaps[gap],
          responsiveClasses,
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Flex.displayName = 'Flex';