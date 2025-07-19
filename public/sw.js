const CACHE_NAME = 'linkvault-pro-v1'
const STATIC_CACHE = 'static-v1'
const DYNAMIC_CACHE = 'dynamic-v1'
const IMAGE_CACHE = 'images-v1'

// Assets to cache on install
const STATIC_ASSETS = [
  '/',
  '/manifest.json',
  '/offline',
  '/_next/static/css/app/layout.css',
  // Add other critical static assets
]

// API endpoints to cache
const API_CACHE_PATTERNS = [
  /^\/api\/products/,
  /^\/api\/categories/,
  /^\/api\/tags/,
]

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('Service Worker: Installing...')
  
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('Service Worker: Caching static assets')
        return cache.addAll(STATIC_ASSETS)
      })
      .then(() => {
        console.log('Service Worker: Static assets cached')
        return self.skipWaiting()
      })
      .catch((error) => {
        console.error('Service Worker: Failed to cache static assets', error)
      })
  )
})

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activating...')
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME && 
                cacheName !== STATIC_CACHE && 
                cacheName !== DYNAMIC_CACHE && 
                cacheName !== IMAGE_CACHE) {
              console.log('Service Worker: Deleting old cache', cacheName)
              return caches.delete(cacheName)
            }
          })
        )
      })
      .then(() => {
        console.log('Service Worker: Activated')
        return self.clients.claim()
      })
  )
})

// Fetch event - handle requests with different strategies
self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return
  }

  // Handle different types of requests
  if (request.destination === 'image') {
    event.respondWith(handleImageRequest(request))
  } else if (url.pathname.startsWith('/api/')) {
    event.respondWith(handleApiRequest(request))
  } else if (url.pathname.startsWith('/_next/static/')) {
    event.respondWith(handleStaticRequest(request))
  } else {
    event.respondWith(handlePageRequest(request))
  }
})

// Image caching strategy - Cache First
async function handleImageRequest(request) {
  try {
    const cache = await caches.open(IMAGE_CACHE)
    const cachedResponse = await cache.match(request)
    
    if (cachedResponse) {
      return cachedResponse
    }
    
    const networkResponse = await fetch(request)
    
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone())
    }
    
    return networkResponse
  } catch (error) {
    console.error('Service Worker: Image request failed', error)
    // Return a placeholder image or error response
    return new Response('Image not available', { status: 404 })
  }
}

// API caching strategy - Network First with fallback
async function handleApiRequest(request) {
  const url = new URL(request.url)
  
  // Check if this API should be cached
  const shouldCache = API_CACHE_PATTERNS.some(pattern => pattern.test(url.pathname))
  
  if (!shouldCache) {
    return fetch(request)
  }
  
  try {
    // Try network first
    const networkResponse = await fetch(request)
    
    if (networkResponse.ok) {
      const cache = await caches.open(DYNAMIC_CACHE)
      cache.put(request, networkResponse.clone())
    }
    
    return networkResponse
  } catch (error) {
    console.log('Service Worker: Network failed, trying cache', error)
    
    // Fallback to cache
    const cache = await caches.open(DYNAMIC_CACHE)
    const cachedResponse = await cache.match(request)
    
    if (cachedResponse) {
      return cachedResponse
    }
    
    // Return offline response for API requests
    return new Response(
      JSON.stringify({ 
        error: 'Offline', 
        message: 'This data is not available offline' 
      }),
      {
        status: 503,
        headers: { 'Content-Type': 'application/json' }
      }
    )
  }
}

// Static assets strategy - Cache First
async function handleStaticRequest(request) {
  try {
    const cache = await caches.open(STATIC_CACHE)
    const cachedResponse = await cache.match(request)
    
    if (cachedResponse) {
      return cachedResponse
    }
    
    const networkResponse = await fetch(request)
    
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone())
    }
    
    return networkResponse
  } catch (error) {
    console.error('Service Worker: Static request failed', error)
    return new Response('Resource not available', { status: 404 })
  }
}

// Page requests strategy - Stale While Revalidate
async function handlePageRequest(request) {
  try {
    const cache = await caches.open(DYNAMIC_CACHE)
    const cachedResponse = await cache.match(request)
    
    // Fetch from network in background
    const networkPromise = fetch(request).then((networkResponse) => {
      if (networkResponse.ok) {
        cache.put(request, networkResponse.clone())
      }
      return networkResponse
    })
    
    // Return cached version immediately if available
    if (cachedResponse) {
      return cachedResponse
    }
    
    // Otherwise wait for network
    return await networkPromise
  } catch (error) {
    console.error('Service Worker: Page request failed', error)
    
    // Try to serve offline page
    const cache = await caches.open(STATIC_CACHE)
    const offlinePage = await cache.match('/offline')
    
    if (offlinePage) {
      return offlinePage
    }
    
    return new Response('Page not available offline', { 
      status: 503,
      headers: { 'Content-Type': 'text/html' }
    })
  }
}

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  console.log('Service Worker: Background sync', event.tag)
  
  if (event.tag === 'background-sync') {
    event.waitUntil(doBackgroundSync())
  }
})

async function doBackgroundSync() {
  try {
    // Handle offline actions when back online
    console.log('Service Worker: Performing background sync')
    
    // Example: Send queued analytics data
    const queuedData = await getQueuedData()
    if (queuedData.length > 0) {
      await sendQueuedData(queuedData)
      await clearQueuedData()
    }
  } catch (error) {
    console.error('Service Worker: Background sync failed', error)
  }
}

// Push notifications
self.addEventListener('push', (event) => {
  console.log('Service Worker: Push received', event)
  
  const options = {
    body: event.data ? event.data.text() : 'New notification',
    icon: '/icon-192x192.png',
    badge: '/badge-72x72.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'explore',
        title: 'View',
        icon: '/icon-explore.png'
      },
      {
        action: 'close',
        title: 'Close',
        icon: '/icon-close.png'
      }
    ]
  }
  
  event.waitUntil(
    self.registration.showNotification('LinkVault Pro', options)
  )
})

// Notification click handling
self.addEventListener('notificationclick', (event) => {
  console.log('Service Worker: Notification clicked', event)
  
  event.notification.close()
  
  if (event.action === 'explore') {
    event.waitUntil(
      clients.openWindow('/')
    )
  }
})

// Helper functions for offline queue management
async function getQueuedData() {
  // Implementation would retrieve queued data from IndexedDB
  return []
}

async function sendQueuedData(data) {
  // Implementation would send queued data to server
  console.log('Sending queued data:', data)
}

async function clearQueuedData() {
  // Implementation would clear queued data from IndexedDB
  console.log('Clearing queued data')
}

// Cache management utilities
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting()
  }
  
  if (event.data && event.data.type === 'CACHE_URLS') {
    event.waitUntil(
      caches.open(DYNAMIC_CACHE)
        .then((cache) => cache.addAll(event.data.payload))
    )
  }
  
  if (event.data && event.data.type === 'CLEAR_CACHE') {
    event.waitUntil(
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => caches.delete(cacheName))
        )
      })
    )
  }
})