import type { Metadata, Viewport } from 'next'
import { Hanken_Grotesk, Noto_Serif_Display } from 'next/font/google'
import './globals.css'

const display = Noto_Serif_Display({ subsets: ['latin', 'latin-ext', 'vietnamese'], style: ['normal', 'italic'], variable: '--font-serif', display: 'swap' })
const hanken = Hanken_Grotesk({ subsets: ['latin', 'latin-ext', 'vietnamese'], variable: '--font-hanken', display: 'swap' })

export const metadata: Metadata = {
  metadataBase: new URL('https://ewa-skin.vercel.app'),
  title: { default: 'Ẹwà · Skincare for melanin-rich skin', template: '%s · Ẹwà' },
  description:
    'A Lagos skincare shop for brown and deep skin. African-owned brands, honest percentages, sunscreen without the grey cast, and a routine quiz that tells you what to skip.',
  applicationName: 'Ẹwà',
  appleWebApp: { capable: true, title: 'Ẹwà', statusBarStyle: 'default' },
}

export const viewport: Viewport = {
  themeColor: '#faf8f5',
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en-NG" className={`${display.variable} ${hanken.variable}`}>
      <body>{children}</body>
    </html>
  )
}
