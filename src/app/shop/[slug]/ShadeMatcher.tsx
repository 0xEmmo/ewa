'use client'

import { useState } from 'react'
import { Dialog } from '@/components/Dialog'
import type { Shade, Undertone } from '@/data/types'
import { depthLabels, rankShades, type SkinProfile } from '@/lib/shades'
import styles from './product.module.css'

const DEPTH_SWATCH: Record<SkinProfile['depth'], string> = { 1: '#d9b08c', 2: '#b07a52', 3: '#8a5a3b', 4: '#64402a', 5: '#3f2618' }
const TONES: { id: Undertone; label: string; hint: string }[] = [
  { id: 'warm', label: 'Warm', hint: 'Gold jewellery flatters you; veins look greenish' },
  { id: 'neutral', label: 'Neutral', hint: 'Both gold and silver work; hard to tell' },
  { id: 'cool', label: 'Cool', hint: 'Silver flatters you; veins look blue or purple' },
]

export function ShadeMatcher({
  open,
  onClose,
  shades,
  productName,
  onPick,
}: {
  open: boolean
  onClose: () => void
  shades: Shade[]
  productName: string
  onPick: (id: string) => void
}) {
  const [depth, setDepth] = useState<SkinProfile['depth'] | null>(null)
  const [undertone, setUndertone] = useState<Undertone | null>(null)
  const match = depth && undertone ? rankShades(shades, { depth, undertone })[0] : null

  return (
    <Dialog open={open} onClose={onClose} title="Find your shade">
      <div className={styles.matcher}>
        <fieldset>
          <legend>1. Which is closest to your skin?</legend>
          <div className={styles.depths}>
            {([1, 2, 3, 4, 5] as const).map((d) => (
              <label key={d} className={styles.depth}>
                <input type="radio" name="depth" checked={depth === d} onChange={() => setDepth(d)} />
                <span className={styles.depthSwatch} style={{ background: DEPTH_SWATCH[d] }} aria-hidden />
                <span>{depthLabels[d]}</span>
              </label>
            ))}
          </div>
        </fieldset>
        <fieldset>
          <legend>2. What’s your undertone?</legend>
          <div className={styles.tones}>
            {TONES.map((t) => (
              <label key={t.id} className={styles.tone}>
                <input type="radio" name="undertone" checked={undertone === t.id} onChange={() => setUndertone(t.id)} />
                <span>
                  <strong>{t.label}</strong>
                  <span className="muted">{t.hint}</span>
                </span>
              </label>
            ))}
          </div>
        </fieldset>
        <div className={styles.match} aria-live="polite">
          {match ? (
            <>
              <span className={styles.matchSwatch} style={{ background: match.hex }} aria-hidden />
              <div>
                <p className="eyebrow">Your {productName} shade</p>
                <p className={styles.matchName}>{match.name}</p>
                <p className="muted">{match.description}</p>
              </div>
              <button type="button" className="btn btn-plum" onClick={() => onPick(match.id)}>
                Use {match.name}
              </button>
            </>
          ) : (
            <p className="muted">Answer both and we’ll suggest a shade. If you’re between two, go deeper.</p>
          )}
        </div>
      </div>
    </Dialog>
  )
}
