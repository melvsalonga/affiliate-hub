'use client'

import React, { useState, useEffect } from 'react'
import { Bell, BellOff, Settings, Check, X, AlertCircle } from 'lucide-react'
import { usePWA } from '@/components/providers/PWAProvider'
import { TouchButton } from '@/components/mobile/TouchInteractions'
import { notificationService, priceMonitoringService } from '@/lib/notifications/push-notifications'
import { cn } from '@/lib/utils'

interface NotificationPreferences {
  priceAlerts: boolean
  dealNotifications: boolean
  analyticsUpdates: boolean
  systemNotifications: boolean
  quietHours: {
    enabled: boolean
    start: string
    end: string
  }
}

interface PushNotificationManagerProps {
  className?: string
  showPreferences?: boolean
}

export function PushNotificationManager({ 
  className, 
  showPreferences = true 
}: PushNotificationManagerProps) {
  const { notificationPermission, hasNotificationSupport, enableNotifications, disableNotifications } = usePWA()
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    priceAlerts: true,
    dealNotifications: true,
    analyticsUpdates: false,
    systemNotifications: true,
    quietHours: {
      enabled: false,
      start: '22:00',
      end: '08:00'
    }
  })
  const [isLoading, setIsLoading] = useState(false)
  const [testNotificationSent, setTestNotificationSent] = useState(false)

  useEffect(() => {
    loadPreferences()
  }, [])

  const loadPreferences = async () => {
    try {
      const response = await fetch('/api/notifications/preferences')
      if (response.ok) {
        const data = await response.json()
        setPreferences(data.preferences || preferences)
      }
    } catch (error) {
      console.error('Failed to load notification preferences:', error)
    }
  }

  const savePreferences = async (newPreferences: NotificationPreferences) => {
    try {
      const response = await fetch('/api/notifications/preferences', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ preferences: newPreferences })
      })

      if (response.ok) {
        setPreferences(newPreferences)
      }
    } catch (error) {
      console.error('Failed to save notification preferences:', error)
    }
  }

  const handleEnableNotifications = async () => {
    setIsLoading(true)
    try {
      const success = await enableNotifications()
      if (success) {
        // Send welcome notification
        await notificationService.showNotification({
          title: '🎉 Notifications Enabled!',
          body: 'You\'ll now receive price alerts and deal notifications.',
          tag: 'welcome-notification'
        })
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleDisableNotifications = async () => {
    setIsLoading(true)
    try {
      await disableNotifications()
    } finally {
      setIsLoading(false)
    }
  }

  const handleTestNotification = async () => {
    try {
      await notificationService.showNotification({
        title: '🔔 Test Notification',
        body: 'This is a test notification from LinkVault Pro!',
        tag: 'test-notification',
        data: { type: 'test' }
      })
      setTestNotificationSent(true)
      setTimeout(() => setTestNotificationSent(false), 3000)
    } catch (error) {
      console.error('Failed to send test notification:', error)
    }
  }

  const updatePreference = (key: keyof NotificationPreferences, value: any) => {
    const newPreferences = { ...preferences, [key]: value }
    savePreferences(newPreferences)
  }

  if (!hasNotificationSupport) {
    return (
      <div className={cn('bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4', className)}>
        <div className="flex items-center space-x-2">
          <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
          <span className="text-yellow-800 dark:text-yellow-200 font-medium">
            Notifications not supported
          </span>
        </div>
        <p className="text-yellow-700 dark:text-yellow-300 text-sm mt-1">
          Your browser doesn't support push notifications.
        </p>
      </div>
    )
  }

  return (
    <div className={cn('space-y-6', className)}>
      {/* Notification Status */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            {notificationPermission === 'granted' ? (
              <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                <Bell className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
            ) : (
              <div className="w-10 h-10 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center">
                <BellOff className="w-5 h-5 text-gray-400" />
              </div>
            )}
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                Push Notifications
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {notificationPermission === 'granted' 
                  ? 'Enabled - You\'ll receive important updates'
                  : 'Disabled - Enable to get price alerts and deals'
                }
              </p>
            </div>
          </div>

          {notificationPermission === 'granted' ? (
            <TouchButton
              variant="outline"
              size="sm"
              onClick={handleDisableNotifications}
              disabled={isLoading}
            >
              Disable
            </TouchButton>
          ) : (
            <TouchButton
              onClick={handleEnableNotifications}
              disabled={isLoading}
              size="sm"
            >
              Enable
            </TouchButton>
          )}
        </div>

        {notificationPermission === 'granted' && (
          <div className="flex space-x-2">
            <TouchButton
              variant="outline"
              size="sm"
              onClick={handleTestNotification}
              className="flex-1"
            >
              {testNotificationSent ? (
                <>
                  <Check className="w-4 h-4 mr-2" />
                  Sent!
                </>
              ) : (
                'Test Notification'
              )}
            </TouchButton>
          </div>
        )}
      </div>

      {/* Notification Preferences */}
      {showPreferences && notificationPermission === 'granted' && (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center space-x-2 mb-4">
            <Settings className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            <h3 className="font-semibold text-gray-900 dark:text-gray-100">
              Notification Preferences
            </h3>
          </div>

          <div className="space-y-4">
            {/* Price Alerts */}
            <div className="flex items-center justify-between">
              <div>
                <label className="font-medium text-gray-900 dark:text-gray-100">
                  Price Alerts
                </label>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Get notified when prices drop below your target
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={preferences.priceAlerts}
                  onChange={(e) => updatePreference('priceAlerts', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
              </label>
            </div>

            {/* Deal Notifications */}
            <div className="flex items-center justify-between">
              <div>
                <label className="font-medium text-gray-900 dark:text-gray-100">
                  Deal Notifications
                </label>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Get notified about new deals and limited-time offers
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={preferences.dealNotifications}
                  onChange={(e) => updatePreference('dealNotifications', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
              </label>
            </div>

            {/* Analytics Updates */}
            <div className="flex items-center justify-between">
              <div>
                <label className="font-medium text-gray-900 dark:text-gray-100">
                  Analytics Updates
                </label>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Weekly performance summaries and insights
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={preferences.analyticsUpdates}
                  onChange={(e) => updatePreference('analyticsUpdates', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
              </label>
            </div>

            {/* System Notifications */}
            <div className="flex items-center justify-between">
              <div>
                <label className="font-medium text-gray-900 dark:text-gray-100">
                  System Notifications
                </label>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Important updates and maintenance notices
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={preferences.systemNotifications}
                  onChange={(e) => updatePreference('systemNotifications', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
              </label>
            </div>

            {/* Quiet Hours */}
            <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <label className="font-medium text-gray-900 dark:text-gray-100">
                    Quiet Hours
                  </label>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Pause notifications during specific hours
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={preferences.quietHours.enabled}
                    onChange={(e) => updatePreference('quietHours', {
                      ...preferences.quietHours,
                      enabled: e.target.checked
                    })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                </label>
              </div>

              {preferences.quietHours.enabled && (
                <div className="flex space-x-4">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      From
                    </label>
                    <input
                      type="time"
                      value={preferences.quietHours.start}
                      onChange={(e) => updatePreference('quietHours', {
                        ...preferences.quietHours,
                        start: e.target.value
                      })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      To
                    </label>
                    <input
                      type="time"
                      value={preferences.quietHours.end}
                      onChange={(e) => updatePreference('quietHours', {
                        ...preferences.quietHours,
                        end: e.target.value
                      })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Permission Denied Help */}
      {notificationPermission === 'denied' && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <X className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5" />
            <div>
              <h4 className="font-medium text-red-800 dark:text-red-200">
                Notifications Blocked
              </h4>
              <p className="text-red-700 dark:text-red-300 text-sm mt-1">
                You've blocked notifications for this site. To enable them:
              </p>
              <ol className="text-red-700 dark:text-red-300 text-sm mt-2 space-y-1 list-decimal list-inside">
                <li>Click the lock icon in your browser's address bar</li>
                <li>Change notifications from "Block" to "Allow"</li>
                <li>Refresh the page</li>
              </ol>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Compact notification toggle for headers/settings
export function NotificationToggle({ className }: { className?: string }) {
  const { notificationPermission, enableNotifications, disableNotifications } = usePWA()
  const [isLoading, setIsLoading] = useState(false)

  const handleToggle = async () => {
    setIsLoading(true)
    try {
      if (notificationPermission === 'granted') {
        await disableNotifications()
      } else {
        await enableNotifications()
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <TouchButton
      variant="ghost"
      size="sm"
      onClick={handleToggle}
      disabled={isLoading}
      className={cn('p-2', className)}
    >
      {notificationPermission === 'granted' ? (
        <Bell className="w-5 h-5 text-blue-600 dark:text-blue-400" />
      ) : (
        <BellOff className="w-5 h-5 text-gray-400" />
      )}
    </TouchButton>
  )
}