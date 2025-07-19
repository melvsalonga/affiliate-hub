'use client'

import React, { useState, useEffect } from 'react'
import { 
  Bell, 
  X, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle,
  CheckCircle,
  Info,
  Zap
} from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'
import { useWebSocket } from '@/hooks/useWebSocket'

interface RealTimeNotification {
  id: string
  title: string
  message: string
  severity: 'info' | 'warning' | 'error' | 'success'
  timestamp: string
  read: boolean
}

interface RealTimeNotificationsProps {
  className?: string
  maxNotifications?: number
}

export function RealTimeNotifications({ 
  className, 
  maxNotifications = 10 
}: RealTimeNotificationsProps) {
  const [notifications, setNotifications] = useState<RealTimeNotification[]>([])
  const [isExpanded, setIsExpanded] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)

  const { isConnected, subscribe, unsubscribe, lastMessage } = useWebSocket()

  // Subscribe to notifications channel
  useEffect(() => {
    if (isConnected) {
      subscribe('notifications')
    }

    return () => {
      if (isConnected) {
        unsubscribe('notifications')
      }
    }
  }, [isConnected, subscribe, unsubscribe])

  // Handle incoming notifications
  useEffect(() => {
    if (!lastMessage || lastMessage.type !== 'notification') return

    const notificationData = lastMessage.data
    const newNotification: RealTimeNotification = {
      id: Math.random().toString(36).substr(2, 9),
      title: notificationData.title,
      message: notificationData.message,
      severity: notificationData.severity,
      timestamp: notificationData.timestamp,
      read: false
    }

    setNotifications(prev => {
      const updated = [newNotification, ...prev].slice(0, maxNotifications)
      return updated
    })

    setUnreadCount(prev => prev + 1)
  }, [lastMessage, maxNotifications])

  const markAsRead = (id: string) => {
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === id 
          ? { ...notification, read: true }
          : notification
      )
    )
    setUnreadCount(prev => Math.max(0, prev - 1))
  }

  const markAllAsRead = () => {
    setNotifications(prev => 
      prev.map(notification => ({ ...notification, read: true }))
    )
    setUnreadCount(0)
  }

  const removeNotification = (id: string) => {
    setNotifications(prev => {
      const notification = prev.find(n => n.id === id)
      if (notification && !notification.read) {
        setUnreadCount(count => Math.max(0, count - 1))
      }
      return prev.filter(n => n.id !== id)
    })
  }

  const clearAll = () => {
    setNotifications([])
    setUnreadCount(0)
  }

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-600" />
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-yellow-600" />
      case 'error':
        return <AlertTriangle className="w-4 h-4 text-red-600" />
      default:
        return <Info className="w-4 h-4 text-blue-600" />
    }
  }

  const getSeverityColors = (severity: string) => {
    switch (severity) {
      case 'success':
        return 'border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20'
      case 'warning':
        return 'border-yellow-200 dark:border-yellow-800 bg-yellow-50 dark:bg-yellow-900/20'
      case 'error':
        return 'border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20'
      default:
        return 'border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20'
    }
  }

  return (
    <div className={cn('relative', className)}>
      {/* Notification Bell */}
      <div className="relative">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsExpanded(!isExpanded)}
          className="relative"
        >
          <Bell className="w-4 h-4" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Button>

        {/* Connection Status Indicator */}
        <div className={cn(
          'absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-white dark:border-gray-800',
          isConnected ? 'bg-green-500' : 'bg-red-500'
        )} />
      </div>

      {/* Notifications Panel */}
      {isExpanded && (
        <Card className="absolute top-12 right-0 w-96 max-h-96 overflow-hidden z-50 shadow-lg">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Zap className="w-5 h-5 text-blue-600" />
                <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                  Real-Time Alerts
                </h3>
              </div>
              <div className="flex items-center space-x-2">
                {notifications.length > 0 && (
                  <>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={markAllAsRead}
                      className="text-xs"
                    >
                      Mark all read
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={clearAll}
                      className="text-xs"
                    >
                      Clear all
                    </Button>
                  </>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsExpanded(false)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>

          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-6 text-center">
                <Bell className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-500 dark:text-gray-400 text-sm">
                  No real-time notifications yet
                </p>
                <p className="text-gray-400 dark:text-gray-500 text-xs mt-1">
                  {isConnected ? 'Connected and waiting for updates' : 'Connecting...'}
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={cn(
                      'p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors',
                      !notification.read && 'bg-blue-50 dark:bg-blue-900/10'
                    )}
                  >
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0 mt-0.5">
                        {getSeverityIcon(notification.severity)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                            {notification.title}
                          </p>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeNotification(notification.id)}
                            className="p-1 h-auto"
                          >
                            <X className="w-3 h-3" />
                          </Button>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          {notification.message}
                        </p>
                        <div className="flex items-center justify-between mt-2">
                          <p className="text-xs text-gray-500 dark:text-gray-500">
                            {new Date(notification.timestamp).toLocaleTimeString()}
                          </p>
                          {!notification.read && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => markAsRead(notification.id)}
                              className="text-xs p-1 h-auto"
                            >
                              Mark read
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Connection Status Footer */}
          <div className="p-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center space-x-2">
                <div className={cn(
                  'w-2 h-2 rounded-full',
                  isConnected ? 'bg-green-500' : 'bg-red-500'
                )} />
                <span className="text-gray-600 dark:text-gray-400">
                  {isConnected ? 'Live connection active' : 'Connection lost'}
                </span>
              </div>
              <span className="text-gray-500 dark:text-gray-500">
                {notifications.length} notifications
              </span>
            </div>
          </div>
        </Card>
      )}
    </div>
  )
}