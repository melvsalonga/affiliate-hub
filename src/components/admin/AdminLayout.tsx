'use client';

import React, { useState } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { 
  LayoutDashboard,
  Package,
  Tags,
  FolderTree,
  BarChart3,
  Settings,
  Users,
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
  Bell,
  Search,
  Target,
  Link2,
  FileText,
  Zap,
  Webhook,
  Mail,
  Share2,
  Puzzle,
  Flag
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { useAuthContext } from '@/contexts/AuthContext';

interface AdminLayoutProps {
  children: React.ReactNode;
  title?: string;
  breadcrumbs?: Array<{ label: string; href?: string }>;
  actions?: React.ReactNode;
}

interface NavigationItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number;
  requiredRoles?: string[];
}

const navigationItems: NavigationItem[] = [
  { 
    href: '/admin', 
    label: 'Dashboard', 
    icon: LayoutDashboard,
    requiredRoles: ['ADMIN', 'EDITOR', 'VIEWER']
  },
  { 
    href: '/admin/products', 
    label: 'Products', 
    icon: Package,
    requiredRoles: ['ADMIN', 'EDITOR']
  },
  { 
    href: '/admin/categories', 
    label: 'Categories', 
    icon: FolderTree,
    requiredRoles: ['ADMIN', 'EDITOR']
  },
  { 
    href: '/admin/tags', 
    label: 'Tags', 
    icon: Tags,
    requiredRoles: ['ADMIN', 'EDITOR']
  },
  { 
    href: '/admin/links', 
    label: 'Link Management', 
    icon: Link2,
    requiredRoles: ['ADMIN', 'EDITOR']
  },
  { 
    href: '/admin/analytics', 
    label: 'Analytics', 
    icon: BarChart3,
    requiredRoles: ['ADMIN', 'EDITOR', 'VIEWER']
  },
  { 
    href: '/admin/competitive-intelligence', 
    label: 'Competitive Intelligence', 
    icon: Target,
    requiredRoles: ['ADMIN', 'EDITOR', 'VIEWER']
  },
  { 
    href: '/admin/content', 
    label: 'Content', 
    icon: FileText,
    requiredRoles: ['ADMIN', 'EDITOR']
  },
  { 
    href: '/admin/seo', 
    label: 'SEO', 
    icon: Zap,
    requiredRoles: ['ADMIN', 'EDITOR']
  },
  { 
    href: '/admin/email-marketing', 
    label: 'Email Marketing', 
    icon: Mail,
    requiredRoles: ['ADMIN', 'EDITOR']
  },
  { 
    href: '/admin/social-media', 
    label: 'Social Media', 
    icon: Share2,
    requiredRoles: ['ADMIN', 'EDITOR']
  },
  { 
    href: '/admin/webhooks', 
    label: 'Webhooks', 
    icon: Webhook,
    requiredRoles: ['ADMIN']
  },
  { 
    href: '/admin/plugins', 
    label: 'Plugins', 
    icon: Puzzle,
    requiredRoles: ['ADMIN']
  },
  { 
    href: '/admin/feature-flags', 
    label: 'Feature Flags', 
    icon: Flag,
    requiredRoles: ['ADMIN']
  },
  { 
    href: '/admin/users', 
    label: 'Users', 
    icon: Users,
    requiredRoles: ['ADMIN']
  },
  { 
    href: '/admin/settings', 
    label: 'Settings', 
    icon: Settings,
    requiredRoles: ['ADMIN']
  },
];

export const AdminLayout: React.FC<AdminLayoutProps> = ({
  children,
  title,
  breadcrumbs,
  actions
}) => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const { user } = useAuthContext();

  const isActive = (href: string) => {
    if (href === '/admin') {
      return pathname === '/admin';
    }
    return pathname.startsWith(href);
  };

  const hasAccess = (item: NavigationItem) => {
    if (!item.requiredRoles || !user?.role) return false;
    return item.requiredRoles.includes(user.role);
  };

  const filteredNavItems = navigationItems.filter(hasAccess);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Mobile menu overlay */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        'fixed inset-y-0 left-0 z-50 flex flex-col bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 transition-all duration-300',
        sidebarCollapsed ? 'w-16' : 'w-64',
        mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      )}>
        {/* Sidebar Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          {!sidebarCollapsed && (
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-primary-500 rounded-lg flex items-center justify-center">
                <Package className="w-5 h-5 text-white" />
              </div>
              <span className="text-lg font-semibold text-gray-900 dark:text-white">
                LinkVault Pro
              </span>
            </div>
          )}
          
          {/* Desktop collapse button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="hidden lg:flex h-8 w-8 p-0"
          >
            {sidebarCollapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </Button>

          {/* Mobile close button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setMobileMenuOpen(false)}
            className="lg:hidden h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {filteredNavItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={cn(
                  'flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200',
                  'hover:bg-gray-100 dark:hover:bg-gray-700',
                  active && 'bg-primary-100 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300',
                  sidebarCollapsed && 'justify-center'
                )}
              >
                <Icon className="h-5 w-5 flex-shrink-0" />
                {!sidebarCollapsed && (
                  <>
                    <span className="flex-1">{item.label}</span>
                    {item.badge && item.badge > 0 && (
                      <Badge variant="secondary" className="text-xs">
                        {item.badge}
                      </Badge>
                    )}
                  </>
                )}
              </Link>
            );
          })}
        </nav>

        {/* User info */}
        {!sidebarCollapsed && (
          <div className="p-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-primary-500 rounded-full flex items-center justify-center">
                <span className="text-sm font-medium text-white">
                  {user?.email?.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                  {user?.profile?.firstName || user?.email}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {user?.role}
                </p>
              </div>
            </div>
          </div>
        )}
      </aside>

      {/* Main content */}
      <div className={cn(
        'transition-all duration-300',
        sidebarCollapsed ? 'lg:ml-16' : 'lg:ml-64'
      )}>
        {/* Top bar */}
        <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              {/* Mobile menu button */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setMobileMenuOpen(true)}
                className="lg:hidden"
              >
                <Menu className="h-5 w-5" />
              </Button>

              {/* Breadcrumbs */}
              <div className="flex items-center space-x-2">
                {breadcrumbs ? (
                  <nav className="flex items-center space-x-2 text-sm">
                    {breadcrumbs.map((crumb, index) => (
                      <React.Fragment key={index}>
                        {index > 0 && (
                          <span className="text-gray-400 dark:text-gray-500">/</span>
                        )}
                        {crumb.href ? (
                          <Link
                            href={crumb.href}
                            className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                          >
                            {crumb.label}
                          </Link>
                        ) : (
                          <span className="text-gray-900 dark:text-white font-medium">
                            {crumb.label}
                          </span>
                        )}
                      </React.Fragment>
                    ))}
                  </nav>
                ) : title ? (
                  <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
                    {title}
                  </h1>
                ) : null}
              </div>
            </div>

            <div className="flex items-center space-x-4">
              {/* Search */}
              <div className="hidden md:block">
                <Input
                  placeholder="Search..."
                  leftIcon={<Search className="h-4 w-4" />}
                  className="w-64"
                />
              </div>

              {/* Notifications */}
              <Button variant="ghost" size="sm" className="relative">
                <Bell className="h-5 w-5" />
                <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                  3
                </span>
              </Button>

              {/* Actions */}
              {actions}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="p-6">
          {children}
        </main>
      </div>
    </div>
  );
};