import { Icon } from './Icon'
import styles from './Stars.module.css'

export function Stars({ value, size = 14, count }: { value: number; size?: number; count?: number }) {
  const rounded = Math.round(value * 2) / 2
  return (
    <span className={styles.stars}>
      <span className={styles.row} role="img" aria-label={`Rated ${value.toFixed(1)} out of 5`}>
        {Array.from({ length: 5 }, (_, i) => (
          <Icon key={i} name="star" size={size} filled={i + 1 <= rounded} className={i + 0.5 === rounded ? styles.half : undefined} />
        ))}
      </span>
      {count !== undefined && <span className={styles.count}>({count})</span>}
    </span>
  )
}
