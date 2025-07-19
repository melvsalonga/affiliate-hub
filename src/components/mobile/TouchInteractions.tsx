'use client'

import React, { useState, useRef, useEffect } from 'react'
import { useSwipeGesture, usePullToRefresh, useLongPress } from '@/hooks/useSwipeGesture'
import { cn } from '@/lib/utils'

interface TouchInteractionsProps {
  children: React.ReactNode
  className?: string
  onSwipeLeft?: () => void
  onSwipeRight?: () => void
  onSwipeUp?: () => void
  onSwipeDown?: () => void
  onPullToRefresh?: () => Promise<void> | void
  onLongPress?: () => void
  enableSwipe?: boolean
  enablePullToRefresh?: boolean
  enableLongPress?: boolean
  swipeThreshold?: number
  longPressThreshold?: number
}

export function TouchInteractions({
  children,
  className,
  onSwipeLeft,
  onSwipeRight,
  onSwipeUp,
  onSwipeDown,
  onPullToRefresh,
  onLongPress,
  enableSwipe = true,
  enablePullToRefresh = false,
  enableLongPress = false,
  swipeThreshold = 50,
  longPressThreshold = 400
}: TouchInteractionsProps) {
  const swipeHandlers = useSwipeGesture(
    enableSwipe
      ? {
          onSwipeLeft,
          onSwipeRight,
          onSwipeUp,
          onSwipeDown,
          threshold: swipeThreshold
        }
      : {}
  )

  const pullToRefreshHandlers = usePullToRefresh(
    onPullToRefresh || (() => {}),
    100
  )

  const longPressHandlers = useLongPress(
    onLongPress || (() => {}),
    { threshold: longPressThreshold }
  )

  const combinedHandlers = {
    onTouchStart: (e: React.TouchEvent) => {
      if (enableSwipe) swipeHandlers.onTouchStart(e)
      if (enablePullToRefresh) pullToRefreshHandlers.handlers.onTouchStart(e)
      if (enableLongPress) longPressHandlers.handlers.onTouchStart(e)
    },
    onTouchMove: (e: React.TouchEvent) => {
      if (enableSwipe) swipeHandlers.onTouchMove(e)
      if (enablePullToRefresh) pullToRefreshHandlers.handlers.onTouchMove(e)
    },
    onTouchEnd: (e: React.TouchEvent) => {
      if (enableSwipe) swipeHandlers.onTouchEnd()
      if (enablePullToRefresh) pullToRefreshHandlers.handlers.onTouchEnd()
      if (enableLongPress) longPressHandlers.handlers.onTouchEnd(e)
    },
    onTouchCancel: (e: React.TouchEvent) => {
      if (enableLongPress) longPressHandlers.handlers.onTouchCancel?.(e)
    }
  }

  return (
    <div className={cn('touch-manipulation', className)} {...combinedHandlers}>
      {enablePullToRefresh && (
        <PullToRefreshIndicator
          isPulling={pullToRefreshHandlers.isPulling}
          pullDistance={pullToRefreshHandlers.pullDistance}
          isRefreshing={pullToRefreshHandlers.isRefreshing}
        />
      )}
      {children}
      {enableLongPress && longPressHandlers.isLongPressing && (
        <LongPressIndicator />
      )}
    </div>
  )
}

interface PullToRefreshIndicatorProps {
  isPulling: boolean
  pullDistance: number
  isRefreshing: boolean
}

function PullToRefreshIndicator({ isPulling, pullDistance, isRefreshing }: PullToRefreshIndicatorProps) {
  const opacity = Math.min(pullDistance / 100, 1)
  const rotation = (pullDistance / 100) * 360

  return (
    <div
      className={cn(
        'fixed top-0 left-1/2 transform -translate-x-1/2 z-50 transition-all duration-200',
        'bg-white dark:bg-gray-800 rounded-full shadow-lg border p-3',
        isPulling || isRefreshing ? 'translate-y-4' : '-translate-y-full'
      )}
      style={{ opacity }}
    >
      <div
        className={cn(
          'w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full',
          isRefreshing ? 'animate-spin' : ''
        )}
        style={{ transform: `rotate(${rotation}deg)` }}
      />
    </div>
  )
}

function LongPressIndicator() {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-20 flex items-center justify-center z-50 pointer-events-none">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-lg">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    </div>
  )
}

// Swipeable card component for product lists
interface SwipeableCardProps {
  children: React.ReactNode
  onSwipeLeft?: () => void
  onSwipeRight?: () => void
  leftAction?: {
    icon: React.ReactNode
    label: string
    color: string
  }
  rightAction?: {
    icon: React.ReactNode
    label: string
    color: string
  }
  className?: string
}

export function SwipeableCard({
  children,
  onSwipeLeft,
  onSwipeRight,
  leftAction,
  rightAction,
  className
}: SwipeableCardProps) {
  const [swipeOffset, setSwipeOffset] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const startX = useRef<number | null>(null)

  const handleTouchStart = (e: React.TouchEvent) => {
    startX.current = e.touches[0].clientX
    setIsDragging(true)
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (startX.current === null) return

    const currentX = e.touches[0].clientX
    const diff = currentX - startX.current
    setSwipeOffset(Math.max(-150, Math.min(150, diff)))
  }

  const handleTouchEnd = () => {
    setIsDragging(false)
    
    if (Math.abs(swipeOffset) > 75) {
      if (swipeOffset > 0 && onSwipeRight) {
        onSwipeRight()
      } else if (swipeOffset < 0 && onSwipeLeft) {
        onSwipeLeft()
      }
    }
    
    setSwipeOffset(0)
    startX.current = null
  }

  return (
    <div className={cn('relative overflow-hidden', className)}>
      {/* Left action */}
      {rightAction && (
        <div
          className={cn(
            'absolute left-0 top-0 h-full flex items-center justify-center px-6 text-white font-medium',
            rightAction.color,
            'transform transition-transform duration-200'
          )}
          style={{
            transform: `translateX(${Math.min(0, swipeOffset - 150)}px)`,
            width: '150px'
          }}
        >
          <div className="flex flex-col items-center space-y-1">
            {rightAction.icon}
            <span className="text-xs">{rightAction.label}</span>
          </div>
        </div>
      )}

      {/* Right action */}
      {leftAction && (
        <div
          className={cn(
            'absolute right-0 top-0 h-full flex items-center justify-center px-6 text-white font-medium',
            leftAction.color,
            'transform transition-transform duration-200'
          )}
          style={{
            transform: `translateX(${Math.max(0, swipeOffset + 150)}px)`,
            width: '150px'
          }}
        >
          <div className="flex flex-col items-center space-y-1">
            {leftAction.icon}
            <span className="text-xs">{leftAction.label}</span>
          </div>
        </div>
      )}

      {/* Main content */}
      <div
        className={cn(
          'bg-white dark:bg-gray-800 transition-transform duration-200',
          isDragging ? 'duration-0' : 'duration-200'
        )}
        style={{ transform: `translateX(${swipeOffset}px)` }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {children}
      </div>
    </div>
  )
}

// Touch-optimized button with haptic feedback
interface TouchButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  hapticFeedback?: boolean
}

export function TouchButton({
  children,
  variant = 'primary',
  size = 'md',
  hapticFeedback = true,
  className,
  onClick,
  ...props
}: TouchButtonProps) {
  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    // Provide haptic feedback on supported devices
    if (hapticFeedback && 'vibrate' in navigator) {
      navigator.vibrate(10)
    }
    
    if (onClick) {
      onClick(e)
    }
  }

  const baseClasses = 'touch-manipulation select-none transition-all duration-150 active:scale-95'
  
  const variantClasses = {
    primary: 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg active:shadow-md',
    secondary: 'bg-gray-600 hover:bg-gray-700 text-white shadow-lg active:shadow-md',
    outline: 'border-2 border-blue-600 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20',
    ghost: 'text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20'
  }
  
  const sizeClasses = {
    sm: 'px-3 py-2 text-sm min-h-[36px]',
    md: 'px-4 py-3 text-base min-h-[44px]',
    lg: 'px-6 py-4 text-lg min-h-[52px]'
  }

  return (
    <button
      className={cn(
        baseClasses,
        variantClasses[variant],
        sizeClasses[size],
        'rounded-lg font-medium',
        className
      )}
      onClick={handleClick}
      {...props}
    >
      {children}
    </button>
  )
}

// Touch-optimized slider/carousel
interface TouchSliderProps {
  children: React.ReactNode[]
  className?: string
  showDots?: boolean
  autoPlay?: boolean
  autoPlayInterval?: number
}

export function TouchSlider({
  children,
  className,
  showDots = true,
  autoPlay = false,
  autoPlayInterval = 3000
}: TouchSliderProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const autoPlayRef = useRef<NodeJS.Timeout>()

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % children.length)
  }

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev - 1 + children.length) % children.length)
  }

  const goToSlide = (index: number) => {
    setCurrentIndex(index)
  }

  // Auto-play functionality
  useEffect(() => {
    if (autoPlay && !isDragging) {
      autoPlayRef.current = setInterval(nextSlide, autoPlayInterval)
      return () => {
        if (autoPlayRef.current) {
          clearInterval(autoPlayRef.current)
        }
      }
    }
  }, [autoPlay, autoPlayInterval, isDragging])

  const swipeHandlers = useSwipeGesture({
    onSwipeLeft: nextSlide,
    onSwipeRight: prevSlide,
    threshold: 50
  })

  return (
    <div className={cn('relative overflow-hidden', className)}>
      <div
        className="flex transition-transform duration-300 ease-out"
        style={{ transform: `translateX(-${currentIndex * 100}%)` }}
        {...swipeHandlers}
        onTouchStart={(e) => {
          setIsDragging(true)
          swipeHandlers.onTouchStart(e)
        }}
        onTouchEnd={() => {
          setIsDragging(false)
          swipeHandlers.onTouchEnd()
        }}
      >
        {children.map((child, index) => (
          <div key={index} className="w-full flex-shrink-0">
            {child}
          </div>
        ))}
      </div>

      {showDots && children.length > 1 && (
        <div className="flex justify-center space-x-2 mt-4">
          {children.map((_, index) => (
            <button
              key={index}
              className={cn(
                'w-2 h-2 rounded-full transition-all duration-200',
                index === currentIndex
                  ? 'bg-blue-600 w-6'
                  : 'bg-gray-300 dark:bg-gray-600'
              )}
              onClick={() => goToSlide(index)}
            />
          ))}
        </div>
      )}
    </div>
  )
}