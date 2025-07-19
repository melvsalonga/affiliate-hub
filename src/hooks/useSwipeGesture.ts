'use client'

import { useState, useCallback, useRef, useEffect } from 'react'

export interface SwipeGestureOptions {
  onSwipeLeft?: () => void
  onSwipeRight?: () => void
  onSwipeUp?: () => void
  onSwipeDown?: () => void
  threshold?: number
  preventDefaultTouchmoveEvent?: boolean
  trackMouse?: boolean
}

export interface SwipeGestureHandlers {
  onTouchStart: (e: React.TouchEvent) => void
  onTouchMove: (e: React.TouchEvent) => void
  onTouchEnd: () => void
  onMouseDown?: (e: React.MouseEvent) => void
  onMouseMove?: (e: React.MouseEvent) => void
  onMouseUp?: () => void
  onMouseLeave?: () => void
}

export function useSwipeGesture(options: SwipeGestureOptions = {}): SwipeGestureHandlers {
  const {
    onSwipeLeft,
    onSwipeRight,
    onSwipeUp,
    onSwipeDown,
    threshold = 50,
    preventDefaultTouchmoveEvent = false,
    trackMouse = false
  } = options

  const [touchStart, setTouchStart] = useState<{ x: number; y: number } | null>(null)
  const [touchEnd, setTouchEnd] = useState<{ x: number; y: number } | null>(null)
  const [isMouseDown, setIsMouseDown] = useState(false)

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    setTouchEnd(null)
    setTouchStart({
      x: e.targetTouches[0].clientX,
      y: e.targetTouches[0].clientY
    })
  }, [])

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (preventDefaultTouchmoveEvent) {
      e.preventDefault()
    }
    setTouchEnd({
      x: e.targetTouches[0].clientX,
      y: e.targetTouches[0].clientY
    })
  }, [preventDefaultTouchmoveEvent])

  const handleTouchEnd = useCallback(() => {
    if (!touchStart || !touchEnd) return

    const distanceX = touchStart.x - touchEnd.x
    const distanceY = touchStart.y - touchEnd.y
    const isLeftSwipe = distanceX > threshold
    const isRightSwipe = distanceX < -threshold
    const isUpSwipe = distanceY > threshold
    const isDownSwipe = distanceY < -threshold

    // Determine if horizontal or vertical swipe is more significant
    if (Math.abs(distanceX) > Math.abs(distanceY)) {
      // Horizontal swipe
      if (isLeftSwipe && onSwipeLeft) {
        onSwipeLeft()
      } else if (isRightSwipe && onSwipeRight) {
        onSwipeRight()
      }
    } else {
      // Vertical swipe
      if (isUpSwipe && onSwipeUp) {
        onSwipeUp()
      } else if (isDownSwipe && onSwipeDown) {
        onSwipeDown()
      }
    }

    // Reset
    setTouchStart(null)
    setTouchEnd(null)
  }, [touchStart, touchEnd, threshold, onSwipeLeft, onSwipeRight, onSwipeUp, onSwipeDown])

  // Mouse event handlers for desktop testing
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (!trackMouse) return
    setIsMouseDown(true)
    setTouchEnd(null)
    setTouchStart({
      x: e.clientX,
      y: e.clientY
    })
  }, [trackMouse])

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!trackMouse || !isMouseDown) return
    setTouchEnd({
      x: e.clientX,
      y: e.clientY
    })
  }, [trackMouse, isMouseDown])

  const handleMouseUp = useCallback(() => {
    if (!trackMouse) return
    setIsMouseDown(false)
    handleTouchEnd()
  }, [trackMouse, handleTouchEnd])

  const handleMouseLeave = useCallback(() => {
    if (!trackMouse) return
    setIsMouseDown(false)
    setTouchStart(null)
    setTouchEnd(null)
  }, [trackMouse])

  const handlers: SwipeGestureHandlers = {
    onTouchStart: handleTouchStart,
    onTouchMove: handleTouchMove,
    onTouchEnd: handleTouchEnd
  }

  if (trackMouse) {
    handlers.onMouseDown = handleMouseDown
    handlers.onMouseMove = handleMouseMove
    handlers.onMouseUp = handleMouseUp
    handlers.onMouseLeave = handleMouseLeave
  }

  return handlers
}

// Hook for pull-to-refresh functionality
export function usePullToRefresh(onRefresh: () => Promise<void> | void, threshold = 100) {
  const [isPulling, setIsPulling] = useState(false)
  const [pullDistance, setPullDistance] = useState(0)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const startY = useRef<number | null>(null)

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    // Only start pull-to-refresh if at the top of the page
    if (window.scrollY === 0) {
      startY.current = e.touches[0].clientY
    }
  }, [])

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (startY.current === null || window.scrollY > 0) return

    const currentY = e.touches[0].clientY
    const distance = currentY - startY.current

    if (distance > 0) {
      e.preventDefault()
      setIsPulling(true)
      setPullDistance(Math.min(distance, threshold * 1.5))
    }
  }, [threshold])

  const handleTouchEnd = useCallback(async () => {
    if (pullDistance >= threshold && !isRefreshing) {
      setIsRefreshing(true)
      try {
        await onRefresh()
      } finally {
        setIsRefreshing(false)
      }
    }
    
    setIsPulling(false)
    setPullDistance(0)
    startY.current = null
  }, [pullDistance, threshold, onRefresh, isRefreshing])

  return {
    isPulling,
    pullDistance,
    isRefreshing,
    handlers: {
      onTouchStart: handleTouchStart,
      onTouchMove: handleTouchMove,
      onTouchEnd: handleTouchEnd
    }
  }
}

// Hook for long press gesture
export function useLongPress(
  onLongPress: () => void,
  options: {
    threshold?: number
    onStart?: () => void
    onFinish?: () => void
    onCancel?: () => void
  } = {}
) {
  const { threshold = 400, onStart, onFinish, onCancel } = options
  const [isLongPressing, setIsLongPressing] = useState(false)
  const timeout = useRef<NodeJS.Timeout>()
  const target = useRef<EventTarget>()

  const start = useCallback((event: React.TouchEvent | React.MouseEvent) => {
    if (onStart) onStart()
    target.current = event.target
    setIsLongPressing(true)
    
    timeout.current = setTimeout(() => {
      onLongPress()
      if (onFinish) onFinish()
      setIsLongPressing(false)
    }, threshold)
  }, [onLongPress, onStart, onFinish, threshold])

  const clear = useCallback((shouldTriggerOnFinish = true) => {
    timeout.current && clearTimeout(timeout.current)
    if (shouldTriggerOnFinish && onFinish) onFinish()
    setIsLongPressing(false)
  }, [onFinish])

  const cancel = useCallback(() => {
    clear(false)
    if (onCancel) onCancel()
  }, [clear, onCancel])

  return {
    isLongPressing,
    handlers: {
      onTouchStart: start,
      onTouchEnd: clear,
      onTouchCancel: cancel,
      onMouseDown: start,
      onMouseUp: clear,
      onMouseLeave: cancel
    }
  }
}