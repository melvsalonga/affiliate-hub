import { WebSocketServer, WebSocket } from 'ws'
import { IncomingMessage } from 'http'
import { parse } from 'url'
import { createClient } from '@/lib/supabase/server'

export interface WebSocketClient {
  id: string
  ws: WebSocket
  userId?: string
  subscriptions: Set<string>
  lastPing: number
}

export interface AnalyticsUpdate {
  type: 'analytics_update'
  data: {
    clicks: number
    conversions: number
    revenue: number
    timestamp: string
    productId?: string
    eventType: 'click' | 'conversion' | 'view'
  }
}

export interface NotificationUpdate {
  type: 'notification'
  data: {
    title: string
    message: string
    severity: 'info' | 'warning' | 'error' | 'success'
    timestamp: string
  }
}

export type WebSocketMessage = AnalyticsUpdate | NotificationUpdate

class WebSocketManager {
  private wss: WebSocketServer | null = null
  private clients: Map<string, WebSocketClient> = new Map()
  private pingInterval: NodeJS.Timeout | null = null

  initialize(server: any) {
    this.wss = new WebSocketServer({ 
      server,
      path: '/api/ws',
      verifyClient: this.verifyClient.bind(this)
    })

    this.wss.on('connection', this.handleConnection.bind(this))
    this.startPingInterval()

    console.log('WebSocket server initialized')
  }

  private async verifyClient(info: { origin: string; secure: boolean; req: IncomingMessage }) {
    try {
      // Basic origin verification
      const allowedOrigins = [
        'http://localhost:3000',
        'https://localhost:3000',
        process.env.NEXT_PUBLIC_SITE_URL
      ].filter(Boolean)

      if (allowedOrigins.length > 0 && !allowedOrigins.includes(info.origin)) {
        return false
      }

      return true
    } catch (error) {
      console.error('WebSocket verification error:', error)
      return false
    }
  }

  private async handleConnection(ws: WebSocket, request: IncomingMessage) {
    const clientId = this.generateClientId()
    const client: WebSocketClient = {
      id: clientId,
      ws,
      subscriptions: new Set(),
      lastPing: Date.now()
    }

    this.clients.set(clientId, client)

    // Parse query parameters for authentication
    const url = parse(request.url || '', true)
    const token = url.query.token as string

    if (token) {
      try {
        // Verify user token and set userId
        const supabase = await createClient()
        const { data: { user }, error } = await supabase.auth.getUser(token)
        
        if (user && !error) {
          client.userId = user.id
        }
      } catch (error) {
        console.error('WebSocket auth error:', error)
      }
    }

    // Set up message handlers
    ws.on('message', (data) => this.handleMessage(clientId, data))
    ws.on('close', () => this.handleDisconnection(clientId))
    ws.on('error', (error) => this.handleError(clientId, error))
    ws.on('pong', () => this.handlePong(clientId))

    // Send welcome message
    this.sendToClient(clientId, {
      type: 'notification',
      data: {
        title: 'Connected',
        message: 'Real-time analytics connected',
        severity: 'success',
        timestamp: new Date().toISOString()
      }
    })

    console.log(`WebSocket client connected: ${clientId}`)
  }

  private handleMessage(clientId: string, data: any) {
    try {
      const client = this.clients.get(clientId)
      if (!client) return

      const message = JSON.parse(data.toString())

      switch (message.type) {
        case 'subscribe':
          this.handleSubscription(clientId, message.channel)
          break
        case 'unsubscribe':
          this.handleUnsubscription(clientId, message.channel)
          break
        case 'ping':
          client.lastPing = Date.now()
          this.sendToClient(clientId, { type: 'pong', timestamp: Date.now() })
          break
        default:
          console.warn('Unknown WebSocket message type:', message.type)
      }
    } catch (error) {
      console.error('WebSocket message handling error:', error)
    }
  }

  private handleSubscription(clientId: string, channel: string) {
    const client = this.clients.get(clientId)
    if (!client) return

    client.subscriptions.add(channel)
    
    this.sendToClient(clientId, {
      type: 'notification',
      data: {
        title: 'Subscribed',
        message: `Subscribed to ${channel}`,
        severity: 'info',
        timestamp: new Date().toISOString()
      }
    })

    console.log(`Client ${clientId} subscribed to ${channel}`)
  }

  private handleUnsubscription(clientId: string, channel: string) {
    const client = this.clients.get(clientId)
    if (!client) return

    client.subscriptions.delete(channel)
    console.log(`Client ${clientId} unsubscribed from ${channel}`)
  }

  private handleDisconnection(clientId: string) {
    this.clients.delete(clientId)
    console.log(`WebSocket client disconnected: ${clientId}`)
  }

  private handleError(clientId: string, error: Error) {
    console.error(`WebSocket client error (${clientId}):`, error)
    this.clients.delete(clientId)
  }

  private handlePong(clientId: string) {
    const client = this.clients.get(clientId)
    if (client) {
      client.lastPing = Date.now()
    }
  }

  private startPingInterval() {
    this.pingInterval = setInterval(() => {
      const now = Date.now()
      const timeout = 30000 // 30 seconds

      for (const [clientId, client] of this.clients.entries()) {
        if (now - client.lastPing > timeout) {
          console.log(`Removing inactive client: ${clientId}`)
          client.ws.terminate()
          this.clients.delete(clientId)
        } else {
          try {
            client.ws.ping()
          } catch (error) {
            console.error(`Ping error for client ${clientId}:`, error)
            this.clients.delete(clientId)
          }
        }
      }
    }, 15000) // Check every 15 seconds
  }

  // Public methods for broadcasting updates
  public broadcastAnalyticsUpdate(update: AnalyticsUpdate) {
    this.broadcast('analytics', update)
  }

  public broadcastNotification(notification: NotificationUpdate) {
    this.broadcast('notifications', notification)
  }

  public sendToUser(userId: string, message: WebSocketMessage) {
    for (const client of this.clients.values()) {
      if (client.userId === userId) {
        this.sendToClient(client.id, message)
      }
    }
  }

  private broadcast(channel: string, message: WebSocketMessage) {
    for (const client of this.clients.values()) {
      if (client.subscriptions.has(channel)) {
        this.sendToClient(client.id, message)
      }
    }
  }

  private sendToClient(clientId: string, message: any) {
    const client = this.clients.get(clientId)
    if (!client || client.ws.readyState !== WebSocket.OPEN) {
      return
    }

    try {
      client.ws.send(JSON.stringify(message))
    } catch (error) {
      console.error(`Error sending message to client ${clientId}:`, error)
      this.clients.delete(clientId)
    }
  }

  private generateClientId(): string {
    return Math.random().toString(36).substring(2) + Date.now().toString(36)
  }

  public getConnectedClients(): number {
    return this.clients.size
  }

  public getClientsByChannel(channel: string): number {
    let count = 0
    for (const client of this.clients.values()) {
      if (client.subscriptions.has(channel)) {
        count++
      }
    }
    return count
  }

  public shutdown() {
    if (this.pingInterval) {
      clearInterval(this.pingInterval)
    }

    for (const client of this.clients.values()) {
      client.ws.close()
    }

    this.clients.clear()

    if (this.wss) {
      this.wss.close()
    }

    console.log('WebSocket server shutdown')
  }
}

export const wsManager = new WebSocketManager()