import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Ẹwà · Skincare for melanin-rich skin',
    short_name: 'Ẹwà',
    description: 'African-owned skincare for brown and deep skin, with a routine quiz and shade matching.',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    background_color: '#faf8f5',
    theme_color: '#faf8f5',
    categories: ['shopping', 'beauty', 'lifestyle'],
    icons: [
      { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
      { src: '/icons/maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
    shortcuts: [
      { name: 'Your bag', url: '/bag', icons: [{ src: '/icons/icon-192.png', sizes: '192x192' }] },
      { name: 'Routine quiz', url: '/quiz', icons: [{ src: '/icons/icon-192.png', sizes: '192x192' }] },
      { name: 'Orders', url: '/orders', icons: [{ src: '/icons/icon-192.png', sizes: '192x192' }] },
    ],
  }
}
