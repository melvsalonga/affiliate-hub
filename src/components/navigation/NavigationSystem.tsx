'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { 
  Home, 
  Search, 
  Heart, 
  Bell, 
  User, 
  Settings,
  BarChart3,
  Package,
  Users,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';

export interface NavigationItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number;
  children?: NavigationItem[];
  adminOnly?: boolean;
}

export interface NavigationSystemProps {
  items?: NavigationItem[];
  className?: string;
  showSidebar?: boolean;
  collapsible?: boolean;
}

const defaultItems: NavigationItem[] = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/search', label: 'Search', icon: Search },
  { href: '/favorites', label: 'Favorites', icon: Heart },
  { href: '/alerts', label: 'Alerts', icon: Bell },
  { href: '/profile', label: 'Profile', icon: User },
  { 
    href: '/admin', 
    label: 'Admin', 
    icon: Settings,
    adminOnly: true,
    children: [
      { href: '/admin/dashboard', label: 'Dashboard', icon: BarChart3, adminOnly: true },
      { href: '/admin/products', label: 'Products', icon: Package, adminOnly: true },
      { href: '/admin/users', label: 'Users', icon: Users, adminOnly: true },
    ]
  },
];

// Desktop Sidebar Navigation
export const SidebarNavigation: React.FC<NavigationSystemProps> = ({
  items = defaultItems,
  className,
  collapsible = true,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [expandedItems, setExpandedItems] = useState<string[]>([]);
  const pathname = usePathname();

  const toggleExpanded = (href: string) => {
    setExpandedItems(prev => 
      prev.includes(href) 
        ? prev.filter(item => item !== href)
        : [...prev, href]
    );
  };

  const isActive = (href: string) => {
    if (href === '/') {
      return pathname === '/';
    }
    return pathname.startsWith(href);
  };

  const hasActiveChild = (item: NavigationItem) => {
    return item.children?.some(child => isActive(child.href)) || false;
  };

  return (
    <aside className={cn(
      'hidden md:flex flex-col bg-card border-r border-border transition-all duration-300',
      isCollapsed ? 'w-16' : 'w-64',
      className
    )}>
      {/* Sidebar Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between">
          {!isCollapsed && (
            <h2 className="text-lg font-semibold text-card-foreground">
              Navigation
            </h2>
          )}
          {collapsible && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="h-8 w-8 p-0"
            >
              {isCollapsed ? (
                <ChevronRight className="h-4 w-4" />
              ) : (
                <ChevronLeft className="h-4 w-4" />
              )}
            </Button>
          )}
        </div>
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 p-4 space-y-2">
        {items.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);
          const hasChildren = item.children && item.children.length > 0;
          const isExpanded = expandedItems.includes(item.href);
          const childActive = hasActiveChild(item);

          return (
            <div key={item.href}>
              {/* Main Item */}
              <div className="relative">
                {hasChildren ? (
                  <button
                    onClick={() => toggleExpanded(item.href)}
                    className={cn(
                      'w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200',
                      'hover:bg-accent hover:text-accent-foreground',
                      (active || childActive) && 'bg-primary-100 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300',
                      isCollapsed && 'justify-center'
                    )}
                  >
                    <div className="flex items-center space-x-3">
                      <Icon className="h-4 w-4 flex-shrink-0" />
                      {!isCollapsed && (
                        <>
                          <span>{item.label}</span>
                          {item.badge && item.badge > 0 && (
                            <Badge variant="secondary" className="ml-auto">
                              {item.badge}
                            </Badge>
                          )}
                        </>
                      )}
                    </div>
                    {!isCollapsed && hasChildren && (
                      <ChevronRight className={cn(
                        'h-4 w-4 transition-transform duration-200',
                        isExpanded && 'rotate-90'
                      )} />
                    )}
                  </button>
                ) : (
                  <Link
                    href={item.href}
                    className={cn(
                      'flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200',
                      'hover:bg-accent hover:text-accent-foreground',
                      active && 'bg-primary-100 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300',
                      isCollapsed && 'justify-center'
                    )}
                  >
                    <Icon className="h-4 w-4 flex-shrink-0" />
                    {!isCollapsed && (
                      <>
                        <span>{item.label}</span>
                        {item.badge && item.badge > 0 && (
                          <Badge variant="secondary" className="ml-auto">
                            {item.badge}
                          </Badge>
                        )}
                      </>
                    )}
                  </Link>
                )}
              </div>

              {/* Child Items */}
              {hasChildren && isExpanded && !isCollapsed && (
                <div className="ml-4 mt-2 space-y-1 border-l border-border pl-4">
                  {item.children!.map((child) => {
                    const ChildIcon = child.icon;
                    const childActive = isActive(child.href);

                    return (
                      <Link
                        key={child.href}
                        href={child.href}
                        className={cn(
                          'flex items-center space-x-3 px-3 py-2 rounded-lg text-sm transition-all duration-200',
                          'hover:bg-accent hover:text-accent-foreground',
                          childActive && 'bg-primary-100 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300'
                        )}
                      >
                        <ChildIcon className="h-4 w-4" />
                        <span>{child.label}</span>
                        {child.badge && child.badge > 0 && (
                          <Badge variant="secondary" className="ml-auto">
                            {child.badge}
                          </Badge>
                        )}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>
    </aside>
  );
};

// Mobile Bottom Navigation
export const MobileNavigation: React.FC<NavigationSystemProps> = ({
  items = defaultItems.filter(item => !item.adminOnly).slice(0, 5), // Show only main items
  className,
}) => {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === '/') {
      return pathname === '/';
    }
    return pathname.startsWith(href);
  };

  return (
    <nav className={cn(
      'fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border md:hidden',
      className
    )}>
      <div className="flex items-center justify-around px-2 py-2">
        {items.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-col items-center justify-center px-3 py-2 rounded-lg transition-all duration-200 relative',
                'min-w-0 flex-1 text-center',
                active 
                  ? 'text-primary-600 bg-primary-50 dark:bg-primary-900/20 dark:text-primary-400' 
                  : 'text-muted-foreground hover:text-foreground hover:bg-accent'
              )}
            >
              <div className="relative">
                <Icon className={cn(
                  'h-5 w-5 transition-transform duration-200',
                  active && 'scale-110'
                )} />
                {item.badge && item.badge > 0 && (
                  <span className="absolute -top-2 -right-2 h-4 w-4 bg-error-500 text-white text-xs rounded-full flex items-center justify-center font-medium">
                    {item.badge > 9 ? '9+' : item.badge}
                  </span>
                )}
              </div>
              <span className={cn(
                'text-xs font-medium mt-1 truncate w-full',
                active && 'text-primary-600 dark:text-primary-400'
              )}>
                {item.label}
              </span>
              {active && (
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

// Combined Navigation System
export const NavigationSystem: React.FC<NavigationSystemProps> = (props) => {
  return (
    <>
      <SidebarNavigation {...props} />
      <MobileNavigation {...props} />
    </>
  );
};

export default NavigationSystem;