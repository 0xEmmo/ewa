import credits from '@/data/photo-credits.json'
import meta from '@/data/photo-meta.json'

export type PhotoMeta = { ratio: number; widths: number[]; tint: string; blur: string }
const photos = meta as Record<string, PhotoMeta>

export function photoMeta(name: string): PhotoMeta {
  const m = photos[name]
  if (!m) throw new Error(`Unknown photo: ${name}`)
  return m
}

export const photoUrl = (name: string, width: number, format: 'avif' | 'webp' = 'webp') => `/photos/${name}-${width}.${format}`

export interface Credit {
  author: string
  authorUrl: string
  page: string
}

export const creditFor = (name: string): Credit | undefined => (credits as Record<string, Credit>)[`${name}.jpg`]
export const allCredits = () => Object.entries(credits as Record<string, Credit>).map(([file, c]) => ({ name: file.replace(/\.jpg$/, ''), ...c }))
