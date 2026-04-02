// ===============================
// SERVICE WORKER - SkyPulse v2.0
// ===============================

const CACHE_NAME = 'skypulse-v2.0';
const OFFLINE_URL = '/offline.html';

// Static assets to cache
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/offline.html',
  '/css/style.css',
  '/js/app.js',
  '/js/api.js',
  '/js/ui.js',
  '/js/utils.js',
  '/manifest.json',
  '/icons/icon-72x72.png',
  '/icons/icon-96x96.png',
  '/icons/icon-128x128.png',
  '/icons/icon-144x144.png',
  '/icons/icon-152x152.png',
  '/icons/icon-192x192.png',
  '/icons/icon-384x384.png',
  '/icons/icon-512x512.png'
];

// API endpoints to cache
const API_PATTERNS = [
  'open-meteo.com',
  'geocoding-api.open-meteo.com'
];

/**
 * Helper: Network request with timeout
 */
function timeoutFetch(request, timeout = 8000) {
  return Promise.race([
    fetch(request),
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Request timeout')), timeout)
    )
  ]);
}

/**
 * Install event - Cache static assets
 */
self.addEventListener('install', event => {
  console.log('[SW] Installing...');
  
  event.waitUntil(
    caches.open(CACHE_NAME).then(async cache => {
      try {
        await cache.addAll(STATIC_ASSETS);
        console.log('[SW] Static assets cached successfully');
      } catch (error) {
        console.error('[SW] Failed to cache assets:', error);
      }
    })
  );
  
  self.skipWaiting();
});

/**
 * Activate event - Clean up old caches
 */
self.addEventListener('activate', event => {
  console.log('[SW] Activating...');
  
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys
          .filter(key => key !== CACHE_NAME)
          .map(key => {
            console.log('[SW] Deleting old cache:', key);
            return caches.delete(key);
          })
      );
    })
  );
  
  self.clients.claim();
});

/**
 * Fetch event - Handle requests
 */
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  const isAPI = API_PATTERNS.some(pattern => url.hostname.includes(pattern));
  
  // API Requests - Network first with fallback
  if (isAPI) {
    event.respondWith(
      timeoutFetch(event.request, 8000)
        .then(response => {
          // Cache successful responses
          if (response && response.status === 200) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then(cache => {
              cache.put(event.request, responseClone);
            });
          }
          return response;
        })
        .catch(async () => {
          // Try cache on network failure
          const cached = await caches.match(event.request);
          if (cached) {
            return cached;
          }
          
          // Return offline JSON for API
          return new Response(
            JSON.stringify({ 
              error: 'You are offline. Please check your connection.',
              offline: true 
            }),
            {
              status: 503,
              statusText: 'Service Unavailable',
              headers: { 'Content-Type': 'application/json' }
            }
          );
        })
    );
  }
  
  // Static Assets - Cache first with offline fallback
  else {
    event.respondWith(
      caches.match(event.request).then(response => {
        if (response) {
          return response;
        }
        
        return fetch(event.request).catch(async () => {
          // Navigation requests get offline page
          if (event.request.mode === 'navigate') {
            const offlinePage = await caches.match(OFFLINE_URL);
            if (offlinePage) {
              return offlinePage;
            }
          }
          
          // Return generic response for other assets
          return new Response('Offline content not available', {
            status: 503,
            statusText: 'Service Unavailable'
          });
        });
      })
    );
  }
});

/**
 * Background sync for failed API requests
 */
self.addEventListener('sync', event => {
  if (event.tag === 'sync-weather') {
    event.waitUntil(syncWeatherData());
  }
});

async function syncWeatherData() {
  console.log('[SW] Background sync triggered');
  // Implement sync logic if needed
  // This could fetch latest weather data when back online
}

/**
 * Push notification support (optional)
 */
self.addEventListener('push', event => {
  const data = event.data.json();
  
  const options = {
    body: data.body || 'Weather update available',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-72x72.png',
    vibrate: [200, 100, 200],
    data: {
      url: data.url || '/'
    }
  };
  
  event.waitUntil(
    self.registration.showNotification('SkyPulse', options)
  );
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  
  event.waitUntil(
    clients.openWindow(event.notification.data.url || '/')
  );
});
