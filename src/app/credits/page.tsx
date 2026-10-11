import type { Metadata } from 'next'
import { Photo } from '@/components/Photo'
import credits from '@/data/photo-credits.json'
import styles from './credits.module.css'

export const metadata: Metadata = {
  title: 'Photo credits',
  description: 'Every photo on Ẹwà is a real photograph from Unsplash, used under the Unsplash License.',
}

const entries = Object.entries(credits as Record<string, { author: string; authorUrl: string; page: string }>)

export default function CreditsPage() {
  return (
    <div className={`wrap ${styles.page}`}>
      <p className="eyebrow">Credits</p>
      <h1 className={`display ${styles.title}`}>The photographs</h1>
      <p className={styles.lede}>
        Every image here is a real photograph from{' '}
        <a href="https://unsplash.com" rel="noreferrer">
          Unsplash
        </a>
        , used under the{' '}
        <a href="https://unsplash.com/license" rel="noreferrer">
          Unsplash License
        </a>
        . The brands and products are invented for this demo; the people and packaging in the photos have nothing to do with them.
      </p>
      <ul role="list" className={styles.grid}>
        {entries.map(([file, c]) => (
          <li key={file}>
            <Photo name={file.replace(/\.jpg$/, '')} alt="" sizes="(min-width: 900px) 16vw, 33vw" ratio={1} />
            <p>
              <a href={c.page} rel="noreferrer">
                Photo
              </a>{' '}
              by{' '}
              <a href={c.authorUrl} rel="noreferrer">
                {c.author}
              </a>
            </p>
          </li>
        ))}
      </ul>
    </div>
  )
}
