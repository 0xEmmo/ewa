import Link from 'next/link'
import { brands } from '@/data/brands'
import styles from './Footer.module.css'

export function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={`wrap ${styles.grid}`}>
        <div className={styles.about}>
          <p className={styles.mark}>Ẹwà</p>
          <p>
            Skincare for brown and deep skin, from brands that started here. Ẹwà means beauty in Yorùbá.
          </p>
          <p className={styles.small}>
            A portfolio project by Emmanuel Balogun. The brands, products and prices are made up and nothing is charged.
            Photos are real and <Link href="/credits">credited here</Link>.
          </p>
        </div>
        <nav aria-label="Shop">
          <p className="eyebrow">Shop</p>
          <ul role="list">
            <li><Link href="/shop">Everything</Link></li>
            <li><Link href="/shop?category=protect">Sunscreen</Link></li>
            <li><Link href="/shop?concern=dark-spots">For dark marks</Link></li>
            <li><Link href="/shop?category=lips">Lips</Link></li>
            <li><Link href="/quiz">Routine quiz</Link></li>
          </ul>
        </nav>
        <nav aria-label="Brands">
          <p className="eyebrow">Brands</p>
          <ul role="list">
            {brands.map((b) => (
              <li key={b.id}>
                <Link href={`/shop?brand=${b.id}`}>{b.name}</Link>
              </li>
            ))}
          </ul>
        </nav>
        <nav aria-label="Account">
          <p className="eyebrow">You</p>
          <ul role="list">
            <li><Link href="/orders">Orders</Link></li>
            <li><Link href="/wishlist">Wishlist</Link></li>
            <li><Link href="/bag">Bag</Link></li>
            <li><Link href="/credits">Photo credits</Link></li>
          </ul>
        </nav>
      </div>
    </footer>
  )
}
