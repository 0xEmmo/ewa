import type { Shade, Undertone } from '@/data/types'

export interface SkinProfile {
  depth: 1 | 2 | 3 | 4 | 5
  undertone: Undertone
}

function distance(s: Shade, me: SkinProfile) {
  const toneGap = s.undertone === me.undertone ? 0 : s.undertone === 'neutral' || me.undertone === 'neutral' ? 0.5 : 1
  return Math.abs(s.depth - me.depth) * 2 + toneGap
}

/** Closest shade first; ties go to the deeper shade, which reads more natural than a too-light one. */
export function rankShades(shades: Shade[], me: SkinProfile): Shade[] {
  return [...shades].sort((a, b) => distance(a, me) - distance(b, me) || b.depth - a.depth)
}

export const depthLabels: Record<SkinProfile['depth'], string> = {
  1: 'Fair to light',
  2: 'Light brown',
  3: 'Medium brown',
  4: 'Deep brown',
  5: 'Deepest',
}
