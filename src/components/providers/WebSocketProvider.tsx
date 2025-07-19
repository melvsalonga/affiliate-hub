'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { useWebSocket } from '@/hooks/useWebSocket'
import { useAuth } from '@/hooks/useAuth'

interface WebSocketContextType {
  isConnected: boolean
  isConnecting: boolean
  error: string | null
  send: (message: any) => void
  subscribe: (channel: string) => void
  unsubscribe: (channel: string) => void
  connectionAttempts: number
}

const WebSocketContext = createContext<WebSocketContextType | null>(null)

export function useWebSocketContext() {
  const context = useContext(WebSocketContext)
  if (!context) {
    throw new Error('useWebSocketContext must be used within a WebSocketProvider')
  }
  return context
}

interface WebSocketProviderProps {
  children: React.ReactNode
}

export function WebSocketProvider({ children }: WebSocketProviderProps) {
  const { user } = useAuth()
  const [shouldConnect, setShouldConnect] = useState(false)

  // Only connect WebSocket when user is authenticated
  useEffect(() => {
    setShouldConnect(!!user)
  }, [user])

  const webSocket = useWebSocket({
    onConnect: () => {
      console.log('Global WebSocket connected')
    },
    onDisconnect: () => {
      console.log('Global WebSocket disconnected')
    },
    onError: (error) => {
      console.error('Global WebSocket error:', error)
    }
  })

  // Don't render WebSocket context if user is not authenticated
  if (!shouldConnect) {
    return <>{children}</>
  }

  return (
    <WebSocketContext.Provider value={webSocket}>
      {children}
    </WebSocketContext.Provider>
  )
}