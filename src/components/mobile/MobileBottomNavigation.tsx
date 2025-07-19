'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  Home, 
  Search, 
  Heart, 
  BarChart3, 
  User, 
  Plus,
  ShoppingBag,
  TrendingUp,
  Settings
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { usePWA } from '@/components/providers/PWAProvider'
import { PWAStatusIndicator } from '@/components/pwa/PWAStatus'

interface NavigationItem {
  id: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  href: string
  badge?: number
  requiresAuth?: boolean
}

const publicNavItems: NavigationItem[] = [
  {
    id: 'home',
    label: 'Home',
    icon: Home,
    href: '/'
  },
  {
    id: 'products',
    label: 'Products',
    icon: Search,
    href: '/products'
  },
  {
    id: 'deals',
    label: 'Deals',
    icon: TrendingUp,
    href: '/deals'
  },
  {
    id: 'wishlist',
    label: 'Wishlist',
    icon: Heart,
    href: '/wishlist'
  }
]

const adminNavItems: NavigationItem[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: BarChart3,
    href: '/admin'
  },
  {
    id: 'products',
    label: 'Products',
    icon: ShoppingBag,
    href: '/admin/products'
  },
  {
    id: 'analytics',
    label: 'Analytics',
    icon: TrendingUp,
    href: '/admin/analytics'
  },
  {
    id: 'settings',
    label: 'Settings',
    icon: Settings,
    href: '/admin/settings'
  }
]

interface MobileBottomNavigationProps {
  variant?: 'public' | 'admin'
  className?: string
}

export function MobileBottomNavigation({ 
  variant = 'public', 
  className 
}: MobileBottomNavigationProps) {
  const pathname = usePathname()
  const { isOnline } = usePWA()
  const [isVisible, setIsVisible] = useState(true)
  const [lastScrollY, setLastScrollY] = useState(0)

  const navItems = variant === 'admin' ? adminNavItems : publicNavItems

  // Auto-hide on scroll down, show on scroll up
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY
      
      if (currentScrollY > lastScrollY && currentScrollY > 100) {
        setIsVisible(false)
      } else {
        setIsVisible(true)
      }
      
      setLastScrollY(currentScrollY)
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [lastScrollY])

  // Haptic feedback for navigation
  const handleNavClick = () => {
    if ('vibrate' in navigator) {
      navigator.vibrate(10)
    }
  }

  return (
    <>
      {/* Spacer to prevent content from being hidden behind fixed nav */}
      <div className="h-16 md:hidden" />
      
      <nav className={cn(
        'fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 z-50 md:hidden',
        'transform transition-transform duration-300 ease-in-out',
        isVisible ? 'translate-y-0' : 'translate-y-full',
        !isOnline && 'border-t-2 border-t-red-500',
        className
      )}>
        {/* Offline indicator */}
        {!isOnline && (
          <div className="absolute -top-6 left-0 right-0 bg-red-500 text-white text-xs text-center py-1">
            <div className="flex items-center justify-center space-x-2">
              <span>Offline</span>
              <PWAStatusIndicator />
            </div>
          </div>
        )}

        <div className="flex items-center justify-around px-2 py-2">
          {navItems.map((item) => {
            const isActive = pathname === item.href || 
              (item.href !== '/' && pathname.startsWith(item.href))
            
            return (
              <Link
                key={item.id}
                href={item.href}
                onClick={handleNavClick}
                className={cn(
                  'flex flex-col items-center justify-center px-3 py-2 rounded-lg transition-all duration-200',
                  'min-w-[60px] relative',
                  'active:scale-95 touch-manipulation',
                  isActive
                    ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
                )}
              >
                <div className="relative">
                  <item.icon className={cn(
                    'w-5 h-5 mb-1',
                    isActive && 'scale-110'
                  )} />
                  
                  {/* Badge */}
                  {item.badge && item.badge > 0 && (
                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                      {item.badge > 99 ? '99+' : item.badge}
                    </div>
                  )}
                </div>
                
                <span className={cn(
                  'text-xs font-medium',
                  isActive && 'font-semibold'
                )}>
                  {item.label}
                </span>

                {/* Active indicator */}
                {isActive && (
                  <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-blue-600 dark:bg-blue-400 rounded-full" />
                )}
              </Link>
            )
          })}
        </div>

        {/* Safe area padding for devices with home indicator */}
        <div className="pb-safe" />
      </nav>
    </>
  )
}

// Floating Action Button for quick actions
interface FloatingActionButtonProps {
  onClick?: () => void
  icon?: React.ComponentType<{ className?: string }>
  label?: string
  className?: string
}

export function FloatingActionButton({ 
  onClick, 
  icon: Icon = Plus, 
  label = 'Add',
  className 
}: FloatingActionButtonProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  const handleClick = () => {
    if ('vibrate' in navigator) {
      navigator.vibrate(50)
    }
    
    if (onClick) {
      onClick()
    }
  }

  return (
    <div className={cn(
      'fixed bottom-20 right-4 z-40 md:bottom-6',
      className
    )}>
      <button
        onClick={handleClick}
        onMouseEnter={() => setIsExpanded(true)}
        onMouseLeave={() => setIsExpanded(false)}
        className={cn(
          'w-14 h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg',
          'flex items-center justify-center transition-all duration-200',
          'active:scale-95 touch-manipulation',
          'hover:shadow-xl focus:outline-none focus:ring-4 focus:ring-blue-300 dark:focus:ring-blue-800',
          isExpanded && 'w-auto px-4'
        )}
      >
        <Icon className="w-6 h-6" />
        {isExpanded && label && (
          <span className="ml-2 text-sm font-medium whitespace-nowrap">
            {label}
          </span>
        )}
      </button>
    </div>
  )
}

// Quick actions menu
interface QuickAction {
  id: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  onClick: () => void
  color?: string
}

interface QuickActionsMenuProps {
  actions: QuickAction[]
  isOpen: boolean
  onClose: () => void
  className?: string
}

export function QuickActionsMenu({ 
  actions, 
  isOpen, 
  onClose, 
  className 
}: QuickActionsMenuProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }

    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 md:hidden">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Menu */}
      <div className={cn(
        'absolute bottom-0 left-0 right-0 bg-white dark:bg-gray-900 rounded-t-2xl p-6',
        'transform transition-transform duration-300',
        isOpen ? 'translate-y-0' : 'translate-y-full',
        className
      )}>
        {/* Handle */}
        <div className="w-12 h-1 bg-gray-300 dark:bg-gray-600 rounded-full mx-auto mb-6" />
        
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Quick Actions
        </h3>
        
        <div className="grid grid-cols-3 gap-4">
          {actions.map((action) => (
            <button
              key={action.id}
              onClick={() => {
                action.onClick()
                onClose()
                if ('vibrate' in navigator) {
                  navigator.vibrate(30)
                }
              }}
              className={cn(
                'flex flex-col items-center justify-center p-4 rounded-xl',
                'bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700',
                'transition-colors duration-200 active:scale-95',
                action.color
              )}
            >
              <action.icon className="w-6 h-6 mb-2" />
              <span className="text-sm font-medium text-center">
                {action.label}
              </span>
            </button>
          ))}
        </div>
        
        {/* Safe area padding */}
        <div className="pb-safe mt-4" />
      </div>
    </div>
  )
}