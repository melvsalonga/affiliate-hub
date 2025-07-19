'use client'

import React, { useState, useEffect } from 'react'
import { X, Download, Smartphone, Zap, Wifi, Bell } from 'lucide-react'
import { usePWA } from '@/components/providers/PWAProvider'
import { TouchButton } from '@/components/mobile/TouchInteractions'
import { cn } from '@/lib/utils'

interface PWAInstallPromptProps {
  className?: string
  variant?: 'banner' | 'modal' | 'card'
  autoShow?: boolean
  showDelay?: number
}

export function PWAInstallPrompt({ 
  className, 
  variant = 'banner',
  autoShow = true,
  showDelay = 15000 
}: PWAInstallPromptProps) {
  const { canInstall, installPWA, isInstalled } = usePWA()
  const [isVisible, setIsVisible] = useState(false)
  const [isDismissed, setIsDismissed] = useState(false)

  useEffect(() => {
    if (isInstalled || isDismissed || !canInstall) {
      setIsVisible(false)
      return
    }

    // Check if user has dismissed this before
    const dismissed = localStorage.getItem('pwa-install-dismissed')
    const lastShown = localStorage.getItem('pwa-install-last-shown')
    const now = Date.now()

    if (dismissed === 'permanent') {
      return
    }

    // Don't show more than once per day
    if (lastShown && now - parseInt(lastShown) < 24 * 60 * 60 * 1000) {
      return
    }

    if (autoShow) {
      const timer = setTimeout(() => {
        setIsVisible(true)
        localStorage.setItem('pwa-install-last-shown', now.toString())
      }, showDelay)

      return () => clearTimeout(timer)
    }
  }, [canInstall, isInstalled, isDismissed, autoShow, showDelay])

  const handleInstall = async () => {
    const success = await installPWA()
    if (success) {
      setIsVisible(false)
    }
  }

  const handleDismiss = (permanent = false) => {
    setIsVisible(false)
    setIsDismissed(true)
    
    if (permanent) {
      localStorage.setItem('pwa-install-dismissed', 'permanent')
    } else {
      localStorage.setItem('pwa-install-dismissed', 'temporary')
    }
  }

  if (!canInstall || isInstalled || !isVisible) {
    return null
  }

  if (variant === 'modal') {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-md w-full p-6 shadow-2xl">
          <div className="flex justify-between items-start mb-4">
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center">
              <Smartphone className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <button
              onClick={() => handleDismiss()}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            Install LinkVault Pro
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Get the full app experience with faster loading, offline access, and push notifications for price alerts.
          </p>

          <div className="space-y-3 mb-6">
            <div className="flex items-center space-x-3 text-sm">
              <div className="w-8 h-8 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                <Zap className="w-4 h-4 text-green-600 dark:text-green-400" />
              </div>
              <span className="text-gray-700 dark:text-gray-300">Lightning fast performance</span>
            </div>
            <div className="flex items-center space-x-3 text-sm">
              <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                <Wifi className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              </div>
              <span className="text-gray-700 dark:text-gray-300">Works offline</span>
            </div>
            <div className="flex items-center space-x-3 text-sm">
              <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
                <Bell className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              </div>
              <span className="text-gray-700 dark:text-gray-300">Price drop notifications</span>
            </div>
          </div>

          <div className="flex space-x-3">
            <TouchButton
              onClick={handleInstall}
              className="flex-1"
            >
              <Download className="w-4 h-4 mr-2" />
              Install App
            </TouchButton>
            <TouchButton
              variant="outline"
              onClick={() => handleDismiss()}
              className="px-4"
            >
              Not now
            </TouchButton>
          </div>

          <button
            onClick={() => handleDismiss(true)}
            className="w-full text-center text-xs text-gray-500 dark:text-gray-400 mt-3 hover:text-gray-700 dark:hover:text-gray-300"
          >
            Don't show again
          </button>
        </div>
      </div>
    )
  }

  if (variant === 'card') {
    return (
      <div className={cn(
        'bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl p-6 shadow-lg',
        className
      )}>
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold">Install LinkVault Pro</h3>
              <p className="text-white/80 text-sm">Get the full app experience</p>
            </div>
          </div>
          <button
            onClick={() => handleDismiss()}
            className="text-white/60 hover:text-white/80"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex space-x-3">
          <TouchButton
            onClick={handleInstall}
            className="bg-white text-blue-600 hover:bg-gray-100 flex-1"
          >
            <Download className="w-4 h-4 mr-2" />
            Install
          </TouchButton>
          <TouchButton
            variant="outline"
            onClick={() => handleDismiss()}
            className="border-white/30 text-white hover:bg-white/10"
          >
            Later
          </TouchButton>
        </div>
      </div>
    )
  }

  // Default banner variant
  return (
    <div className={cn(
      'fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-4 shadow-lg z-40',
      'transform transition-transform duration-300',
      isVisible ? 'translate-y-0' : 'translate-y-full',
      className
    )}>
      <div className="flex items-center space-x-4">
        <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
          <Smartphone className="w-5 h-5 text-blue-600 dark:text-blue-400" />
        </div>
        
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-gray-900 dark:text-gray-100 text-sm">
            Install LinkVault Pro
          </h3>
          <p className="text-gray-600 dark:text-gray-400 text-xs">
            Faster loading, offline access, push notifications
          </p>
        </div>

        <div className="flex space-x-2">
          <TouchButton
            size="sm"
            onClick={handleInstall}
            className="text-xs"
          >
            <Download className="w-3 h-3 mr-1" />
            Install
          </TouchButton>
          <button
            onClick={() => handleDismiss()}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}

// Hook for programmatic install prompt
export function usePWAInstallPrompt() {
  const { canInstall, installPWA } = usePWA()
  const [isPromptVisible, setIsPromptVisible] = useState(false)

  const showPrompt = () => {
    if (canInstall) {
      setIsPromptVisible(true)
    }
  }

  const hidePrompt = () => {
    setIsPromptVisible(false)
  }

  const install = async () => {
    const success = await installPWA()
    if (success) {
      setIsPromptVisible(false)
    }
    return success
  }

  return {
    canInstall,
    isPromptVisible,
    showPrompt,
    hidePrompt,
    install
  }
}