import Link from 'next/link'
import { Photo } from '@/components/Photo'
import { ProductCard } from '@/components/ProductCard'
import { brands } from '@/data/brands'
import { products } from '@/data/products'
import { concernLabels, emptyFilters, filterProducts, requireProduct } from '@/lib/catalog'
import type { Concern } from '@/data/types'
import { formatNaira } from '@/lib/money'
import styles from './home.module.css'

const CONCERNS: Concern[] = ['dark-spots', 'dryness', 'breakouts', 'oiliness', 'sensitivity', 'texture']

export default function Home() {
  const bestsellers = filterProducts(products, emptyFilters).slice(0, 4)
  const spf = requireProduct('sheer-mineral-sunscreen-spf-50')
  const serum = requireProduct('even-tone-serum')

  return (
    <>
      <section className={`wrap ${styles.hero}`} aria-labelledby="hero-title">
        <div className={styles.heroCopy}>
          <p className="eyebrow">Lagos · Nairobi · Tamale</p>
          <h1 id="hero-title" className={`display ${styles.heroTitle}`}>
            Skincare made for <em>more melanin</em>, by people who have it.
          </h1>
          <p className={styles.lede}>
            Eighteen products from five African brands. Clear percentages, sunscreen that doesn’t turn grey on you, and
            nothing that promises to make you lighter.
          </p>
          <div className={styles.ctas}>
            <Link href="/shop" className="btn btn-plum">
              Shop the edit
            </Link>
            <Link href="/quiz" className="btn btn-ghost">
              Build my routine
            </Link>
          </div>
        </div>
        <figure className={styles.heroMedia}>
          <Photo name="m-hero" alt="A young woman with short hair and deep brown skin, looking past the camera" sizes="(min-width: 900px) 46vw, 100vw" ratio={4 / 5} priority position="50% 20%" />
          <Link href={`/shop/${serum.slug}`} className={styles.callout}>
            <span className="eyebrow">Bestseller</span>
            <span className={styles.calloutName}>{serum.name}</span>
            <span className="num">{formatNaira(serum.variants[0]!.price)}</span>
          </Link>
        </figure>
      </section>

      <section className={`wrap ${styles.concerns}`} aria-labelledby="concern-title">
        <h2 id="concern-title" className={`display ${styles.h2}`}>
          Start with what’s bothering you
        </h2>
        <ol role="list" className={styles.concernList}>
          {CONCERNS.map((c, i) => {
            const count = products.filter((p) => p.concerns.includes(c)).length
            return (
              <li key={c}>
                <Link href={`/shop?concern=${c}`}>
                  <span className={`${styles.index} num`}>{String(i + 1).padStart(2, '0')}</span>
                  <span className={styles.concernName}>{concernLabels[c]}</span>
                  <span className={styles.concernCount}>{count} products</span>
                </Link>
              </li>
            )
          })}
        </ol>
      </section>

      <section className={`wrap ${styles.rail}`} aria-labelledby="best-title">
        <div className={styles.railHead}>
          <h2 id="best-title" className={`display ${styles.h2}`}>
            What people reorder
          </h2>
          <Link href="/shop?sort=rating" className={styles.more}>
            See all
          </Link>
        </div>
        <ul role="list" className={styles.railList}>
          {bestsellers.map((p) => (
            <li key={p.slug}>
              <ProductCard product={p} sizes="(min-width: 1100px) 25vw, 70vw" />
            </li>
          ))}
        </ul>
      </section>

      <section className={styles.quiz} aria-labelledby="quiz-title">
        <div className={`wrap ${styles.quizInner}`}>
          <Photo name="m-apply2" alt="A smiling woman pressing a dropper of serum to her cheek" sizes="(min-width: 900px) 40vw, 100vw" ratio={4 / 5} className={styles.quizPhoto} />
          <div className={styles.quizCopy}>
            <p className="eyebrow">Six questions · about a minute</p>
            <h2 id="quiz-title" className={`display ${styles.h2}`}>
              Not sure what goes with what?
            </h2>
            <p>
              Tell us your skin type, what you want to change and how much time you have. We’ll put together a morning and
              night routine, explain why each step is there, and leave out what you don’t need. Add the whole routine and
              save 10%.
            </p>
            <ul role="list" className={styles.quizPoints}>
              <li>Keeps strong acids away from reactive skin</li>
              <li>Pregnancy-safe if you ask for it</li>
              <li>Never more than one active at night</li>
            </ul>
            <Link href="/quiz" className="btn btn-light">
              Start the quiz
            </Link>
          </div>
        </div>
      </section>

      <section className={`wrap ${styles.shades}`} aria-labelledby="shade-title">
        <div className={styles.shadeCopy}>
          <p className="eyebrow">{spf.name}</p>
          <h2 id="shade-title" className={`display ${styles.h2}`}>
            Mineral sunscreen, minus the purple cast.
          </h2>
          <p>
            Zinc oxide protects well and is gentle on sensitive skin, but on brown skin it usually looks chalky. Zuri tint
            theirs in three shades so it disappears. Not sure which? The shade matcher on the product page will tell you.
          </p>
          <Link href={`/shop/${spf.slug}`} className="btn">
            Find my shade
          </Link>
        </div>
        <ul role="list" className={styles.shadeList}>
          {spf.shades!.map((s, i) => (
            <li key={s.id}>
              <Photo name={['m-glow', 'm-rich1', 'm-deep3'][i]!} alt="" sizes="(min-width: 900px) 18vw, 33vw" ratio={3 / 4} position="50% 25%" />
              <span className={styles.swatch} style={{ background: s.hex }} aria-hidden />
              <span className={styles.shadeName}>{s.name}</span>
              <span className={styles.shadeDesc}>{s.description}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className={`wrap ${styles.brands}`} aria-labelledby="brands-title">
        <h2 id="brands-title" className={`display ${styles.h2}`}>
          Five brands we’d use ourselves
        </h2>
        <div className={styles.brandGrid}>
          <figure className={styles.brandPhoto}>
            <Photo name="m-sheatree" alt="Clusters of green fruit ripening on a branch" sizes="(min-width: 900px) 30vw, 100vw" ratio={3 / 4} />
            <figcaption>Tamale Shea Co. buys straight from the women who pick.</figcaption>
          </figure>
          <ul role="list" className={styles.brandList}>
            {brands.map((b) => (
              <li key={b.id}>
                <Link href={`/shop?brand=${b.id}`}>
                  <span className={styles.brandName}>{b.name}</span>
                  <span className={styles.brandMeta}>
                    {b.city}, since {b.founded}
                  </span>
                </Link>
                <p>{b.story}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </>
  )
}
