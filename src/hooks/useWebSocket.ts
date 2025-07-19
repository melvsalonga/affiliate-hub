'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { useAuth } from '@/hooks/useAuth'

export interface WebSocketMessage {
  type: string
  data: any
  timestamp?: string
}

export interface UseWebSocketOptions {
  url?: string
  reconnectInterval?: number
  maxReconnectAttempts?: number
  onMessage?: (message: WebSocketMessage) => void
  onConnect?: () => void
  onDisconnect?: () => void
  onError?: (error: Event) => void
}

export interface UseWebSocketReturn {
  isConnected: boolean
  isConnecting: boolean
  error: string | null
  send: (message: any) => void
  subscribe: (channel: string) => void
  unsubscribe: (channel: string) => void
  lastMessage: WebSocketMessage | null
  connectionAttempts: number
}

export function useWebSocket(options: UseWebSocketOptions = {}): UseWebSocketReturn {
  const {
    url = '/api/ws',
    reconnectInterval = 3000,
    maxReconnectAttempts = 5,
    onMessage,
    onConnect,
    onDisconnect,
    onError
  } = options

  const { user } = useAuth()
  const wsRef = useRef<WebSocket | null>(null)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const subscriptionsRef = useRef<Set<string>>(new Set())

  const [isConnected, setIsConnected] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null)
  const [connectionAttempts, setConnectionAttempts] = useState(0)

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      return
    }

    setIsConnecting(true)
    setError(null)

    try {
      // Build WebSocket URL
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
      const host = window.location.host
      let wsUrl = `${protocol}//${host}${url}`

      // Add authentication token if user is logged in
      if (user) {
        const params = new URLSearchParams()
        // In a real implementation, you'd get the actual token
        // For now, we'll use a placeholder
        params.append('token', 'user-token')
        wsUrl += `?${params.toString()}`
      }

      const ws = new WebSocket(wsUrl)
      wsRef.current = ws

      ws.onopen = () => {
        setIsConnected(true)
        setIsConnecting(false)
        setConnectionAttempts(0)
        setError(null)
        
        // Resubscribe to channels
        subscriptionsRef.current.forEach(channel => {
          ws.send(JSON.stringify({ type: 'subscribe', channel }))
        })

        onConnect?.()
      }

      ws.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data)
          setLastMessage(message)
          onMessage?.(message)
        } catch (err) {
          console.error('Failed to parse WebSocket message:', err)
        }
      }

      ws.onclose = (event) => {
        setIsConnected(false)
        setIsConnecting(false)
        wsRef.current = null

        if (!event.wasClean && connectionAttempts < maxReconnectAttempts) {
          setConnectionAttempts(prev => prev + 1)
          reconnectTimeoutRef.current = setTimeout(() => {
            connect()
          }, reconnectInterval)
        }

        onDisconnect?.()
      }

      ws.onerror = (event) => {
        setError('WebSocket connection error')
        setIsConnecting(false)
        onError?.(event)
      }

    } catch (err) {
      setError('Failed to create WebSocket connection')
      setIsConnecting(false)
    }
  }, [url, user, connectionAttempts, maxReconnectAttempts, reconnectInterval, onConnect, onMessage, onDisconnect, onError])

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
      reconnectTimeoutRef.current = null
    }

    if (wsRef.current) {
      wsRef.current.close()
      wsRef.current = null
    }

    setIsConnected(false)
    setIsConnecting(false)
    setConnectionAttempts(0)
  }, [])

  const send = useCallback((message: any) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message))
    } else {
      console.warn('WebSocket is not connected')
    }
  }, [])

  const subscribe = useCallback((channel: string) => {
    subscriptionsRef.current.add(channel)
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      send({ type: 'subscribe', channel })
    }
  }, [send])

  const unsubscribe = useCallback((channel: string) => {
    subscriptionsRef.current.delete(channel)
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      send({ type: 'unsubscribe', channel })
    }
  }, [send])

  // Connect on mount
  useEffect(() => {
    connect()
    return disconnect
  }, [connect, disconnect])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect()
    }
  }, [disconnect])

  return {
    isConnected,
    isConnecting,
    error,
    send,
    subscribe,
    unsubscribe,
    lastMessage,
    connectionAttempts
  }
}