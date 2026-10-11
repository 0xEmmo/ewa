'use client'

import { useRef, useState } from 'react'
import { Photo } from '@/components/Photo'
import styles from './product.module.css'

/** Thumbnails on desktop; a swipeable strip with dots on phones. */
export function Gallery({ photos, name }: { photos: { name: string; alt: string }[]; name: string }) {
  const [active, setActive] = useState(0)
  const strip = useRef<HTMLDivElement>(null)

  const show = (i: number) => {
    setActive(i)
    const el = strip.current?.children[i] as HTMLElement | undefined
    el?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'start' })
  }

  return (
    <div className={styles.gallery}>
      <div
        ref={strip}
        className={styles.strip}
        tabIndex={0}
        role="region"
        aria-label={`${name} photos`}
        onScroll={(e) => {
          const el = e.currentTarget
          const i = Math.round(el.scrollLeft / el.clientWidth)
          if (i !== active) setActive(i)
        }}
      >
        {photos.map((p, i) => (
          <figure key={p.name} className={styles.slide} aria-hidden={i !== active ? true : undefined}>
            <Photo name={p.name} alt={p.alt} sizes="(min-width: 900px) 50vw, 100vw" ratio={4 / 5} priority={i === 0} />
          </figure>
        ))}
      </div>
      {photos.length > 1 && (
        <>
          <ul role="list" className={styles.thumbs}>
            {photos.map((p, i) => (
              <li key={p.name}>
                <button type="button" onClick={() => show(i)} aria-label={`Show photo ${i + 1} of ${photos.length}`} aria-current={i === active}>
                  <Photo name={p.name} alt="" sizes="88px" ratio={1} />
                </button>
              </li>
            ))}
          </ul>
          <div className={styles.dots} aria-hidden>
            {photos.map((p, i) => (
              <span key={p.name} data-active={i === active} />
            ))}
          </div>
        </>
      )}
    </div>
  )
}
