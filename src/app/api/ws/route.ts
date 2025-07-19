import { NextRequest } from 'next/server'
import { wsManager } from '@/lib/websocket/server'

export async function GET(request: NextRequest) {
  // This endpoint is handled by the WebSocket server
  // The actual WebSocket upgrade is handled in the custom server
  return new Response('WebSocket endpoint - use ws:// or wss:// protocol', {
    status: 426,
    headers: {
      'Upgrade': 'websocket'
    }
  })
}

// Export WebSocket manager for use in other parts of the application
export { wsManager }