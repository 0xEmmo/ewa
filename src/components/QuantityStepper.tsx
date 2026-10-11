'use client'

import { Icon } from './Icon'
import styles from './QuantityStepper.module.css'

interface Props {
  value: number
  onChange: (n: number) => void
  max?: number
  label: string
  size?: 'sm' | 'md'
}

export function QuantityStepper({ value, onChange, max = 10, label, size = 'md' }: Props) {
  return (
    <div className={styles.stepper} data-size={size} role="group" aria-label={label}>
      <button type="button" onClick={() => onChange(value - 1)} disabled={value <= 1} aria-label="Decrease quantity">
        <Icon name="minus" size={16} />
      </button>
      <output aria-live="polite" className="num">
        {value}
      </output>
      <button type="button" onClick={() => onChange(value + 1)} disabled={value >= max} aria-label="Increase quantity">
        <Icon name="plus" size={16} />
      </button>
    </div>
  )
}
