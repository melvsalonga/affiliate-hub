'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Home, Search, Heart, Bell, User, ShoppingBag } from 'lucide-react';

export interface MobileNavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number;
}

export interface MobileNavigationProps {
  items?: MobileNavItem[];
  className?: string;
}

const defaultItems: MobileNavItem[] = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/search', label: 'Search', icon: Search },
  { href: '/favorites', label: 'Favorites', icon: Heart },
  { href: '/alerts', label: 'Alerts', icon: Bell },
  { href: '/profile', label: 'Profile', icon: User },
];

export const MobileNavigation: React.FC<MobileNavigationProps> = ({
  items = defaultItems,
  className,
}) => {
  const pathname = usePathname();

  return (
    <nav className={cn(
      'fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border',
      'md:hidden', // Hide on desktop
      className
    )}>
      <div className="flex items-center justify-around px-2 py-2">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-col items-center justify-center px-3 py-2 rounded-lg transition-all duration-200 relative',
                'min-w-0 flex-1 text-center',
                isActive 
                  ? 'text-primary-600 bg-primary-50 dark:bg-primary-900/20 dark:text-primary-400' 
                  : 'text-muted-foreground hover:text-foreground hover:bg-accent'
              )}
            >
              <div className="relative">
                <Icon className={cn(
                  'h-5 w-5 transition-transform duration-200',
                  isActive && 'scale-110'
                )} />
                {item.badge && item.badge > 0 && (
                  <span className="absolute -top-2 -right-2 h-4 w-4 bg-error-500 text-white text-xs rounded-full flex items-center justify-center font-medium">
                    {item.badge > 9 ? '9+' : item.badge}
                  </span>
                )}
              </div>
              <span className={cn(
                'text-xs font-medium mt-1 truncate w-full',
                isActive && 'text-primary-600 dark:text-primary-400'
              )}>
                {item.label}
              </span>
              {isActive && (
                <div className="absolute -top-0.5 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-primary-500 rounded-full" />
              )}
            </Link>
          );
        })}
      </div>
      
      {/* Safe area padding for devices with home indicator */}
      <div className="h-safe-area-inset-bottom" />
    </nav>
  );
};

export default MobileNavigation;