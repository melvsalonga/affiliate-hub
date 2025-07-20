import { wsManager } from './server'
import { realTimeAnalytics } from '@/lib/services/realtime-analytics'

let isInitialized = false

export function initializeWebSocketServer(server?: any) {
  if (isInitialized) {
    return
  }

  try {
    // Initialize WebSocket server if we have an HTTP server
    if (server) {
      wsManager.initialize(server)
    }

    // Start real-time analytics service
    realTimeAnalytics.start()

    isInitialized = true
    console.log('WebSocket services initialized successfully')
  } catch (error) {
    console.error('Failed to initialize WebSocket services:', error)
  }
}

export function shutdownWebSocketServer() {
  if (!isInitialized) {
    return
  }

  try {
    wsManager.shutdown()
    realTimeAnalytics.stop()
    
    isInitialized = false
    console.log('WebSocket services shut down successfully')
  } catch (error) {
    console.error('Failed to shutdown WebSocket services:', error)
  }
}

// Auto-initialize in development (client-side only)
if (process.env.NODE_ENV === 'development' && typeof window !== 'undefined') {
  // In development, we'll initialize without a server for now
  // The WebSocket will work through polling fallback
  realTimeAnalytics.start()
}