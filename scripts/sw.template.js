/* Ẹwà service worker. Generated into public/sw.js by scripts/build-sw.mjs; edit the template. */
const VERSION = '__VERSION__'
const SHELL = `ewa-shell-${VERSION}`
const PAGES = `ewa-pages-${VERSION}`
const STATIC = 'ewa-static'
const PHOTOS = 'ewa-photos'
const PRECACHE = ['/', '/shop', '/quiz', '/bag', '/offline', '/manifest.webmanifest', '/icons/icon-192.png']
const MAX_PHOTOS = 160

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(SHELL).then((c) => c.addAll(PRECACHE)))
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keep = new Set([SHELL, PAGES, STATIC, PHOTOS])
      for (const key of await caches.keys()) if (!keep.has(key)) await caches.delete(key)
      await self.clients.claim()
    })(),
  )
})

self.addEventListener('message', (event) => {
  if (event.data === 'skip-waiting') self.skipWaiting()
})

async function trim(cacheName, max) {
  const cache = await caches.open(cacheName)
  const keys = await cache.keys()
  for (const key of keys.slice(0, Math.max(0, keys.length - max))) await cache.delete(key)
}

async function cacheFirst(request, cacheName) {
  const cached = await caches.match(request)
  if (cached) return cached
  const response = await fetch(request)
  if (response.ok) {
    const cache = await caches.open(cacheName)
    cache.put(request, response.clone())
    if (cacheName === PHOTOS) trim(PHOTOS, MAX_PHOTOS)
  }
  return response
}

async function networkFirst(request) {
  try {
    const response = await fetch(request)
    if (response.ok) (await caches.open(PAGES)).put(request, response.clone())
    return response
  } catch {
    const cached = (await caches.match(request)) ?? (await caches.match(request.url.split('?')[0]))
    if (cached) return cached
    if (request.mode === 'navigate') return caches.match('/offline')
    return new Response(JSON.stringify({ error: 'offline' }), { status: 503, headers: { 'Content-Type': 'application/json' } })
  }
}

self.addEventListener('fetch', (event) => {
  const { request } = event
  if (request.method !== 'GET') return
  const url = new URL(request.url)
  if (url.origin !== self.location.origin) return

  if (url.pathname.startsWith('/_next/static/') || url.pathname.startsWith('/icons/')) {
    event.respondWith(cacheFirst(request, STATIC))
  } else if (url.pathname.startsWith('/photos/')) {
    event.respondWith(cacheFirst(request, PHOTOS))
  } else if (request.mode === 'navigate' || url.pathname.startsWith('/api/') || request.headers.get('RSC')) {
    event.respondWith(networkFirst(request))
  }
})
