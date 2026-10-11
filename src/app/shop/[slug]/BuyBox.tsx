'use client'

import { useEffect, useId, useRef, useState } from 'react'
import { Icon } from '@/components/Icon'
import { QuantityStepper } from '@/components/QuantityStepper'
import { Stars } from '@/components/Stars'
import { useToast } from '@/components/toast'
import { WishButton } from '@/components/WishButton'
import type { Product } from '@/data/types'
import { averageRating } from '@/lib/catalog'
import { formatNaira } from '@/lib/money'
import { useCart } from '@/stores/cart'
import { useUi } from '@/stores/ui'
import { ShadeMatcher } from './ShadeMatcher'
import styles from './product.module.css'

export function BuyBox({ product, brandName }: { product: Product; brandName: string }) {
  const firstInStock = product.variants.find((v) => v.stock > 0) ?? product.variants[0]!
  const [variantId, setVariantId] = useState(firstInStock.id)
  const [shadeId, setShadeId] = useState<string | null>(null)
  const [qty, setQty] = useState(1)
  const [shadeError, setShadeError] = useState(false)
  const [matcherOpen, setMatcherOpen] = useState(false)
  const [buttonVisible, setButtonVisible] = useState(true)
  const add = useCart((s) => s.add)
  const openBag = useUi((s) => s.openBag)
  const toast = useToast()
  const buttonRef = useRef<HTMLButtonElement>(null)
  const shadeGroup = useRef<HTMLFieldSetElement>(null)
  const ids = useId()

  const variant = product.variants.find((v) => v.id === variantId)!
  const shade = product.shades?.find((s) => s.id === shadeId)
  const soldOut = variant.stock === 0
  const rating = averageRating(product)

  useEffect(() => {
    const el = buttonRef.current
    if (!el) return
    const io = new IntersectionObserver(([entry]) => setButtonVisible(entry!.isIntersecting), { rootMargin: '0px 0px -40px 0px' })
    io.observe(el)
    return () => io.disconnect()
  }, [])

  const addToBag = () => {
    if (product.shades && !shade) {
      setShadeError(true)
      shadeGroup.current?.scrollIntoView({ block: 'center', behavior: 'smooth' })
      shadeGroup.current?.querySelector('input')?.focus()
      return
    }
    add({ slug: product.slug, variantId, shadeId: shade?.id, qty })
    toast(`Added ${product.name}${shade ? ` in ${shade.name}` : ''} to your bag`, {
      tone: 'ok',
      action: { label: 'View bag', onClick: openBag },
    })
    setQty(1)
  }

  return (
    <div className={styles.buy}>
      <p className={styles.brand}>{brandName}</p>
      <h1 className={`display ${styles.name}`}>{product.name}</h1>
      <p className={styles.tagline}>{product.tagline}</p>
      {product.reviews.length > 0 && (
        <a href="#reviews" className={styles.ratingLink}>
          <Stars value={rating} />
          <span>
            {rating.toFixed(1)} · {product.reviews.length} {product.reviews.length === 1 ? 'review' : 'reviews'}
          </span>
        </a>
      )}

      <p className={`${styles.price} num`} aria-live="polite">
        {formatNaira(variant.price)}
      </p>

      {product.variants.length > 1 && (
        <fieldset className={styles.group}>
          <legend>Size</legend>
          <div className={styles.variants}>
            {product.variants.map((v) => (
              <label key={v.id} className={styles.variant} data-soldout={v.stock === 0}>
                <input type="radio" name={`${ids}-variant`} value={v.id} checked={variantId === v.id} onChange={() => setVariantId(v.id)} />
                <span>{v.label}</span>
                <span className="num">{v.stock === 0 ? 'Sold out' : formatNaira(v.price)}</span>
              </label>
            ))}
          </div>
        </fieldset>
      )}

      {product.shades && (
        <fieldset ref={shadeGroup} className={styles.group} aria-describedby={shadeError ? `${ids}-shade-error` : undefined}>
          <legend>
            Shade{shade && <span className={styles.chosen}>: {shade.name}</span>}
          </legend>
          <div className={styles.shades}>
            {product.shades.map((s) => (
              <label key={s.id} className={styles.shade} title={s.name}>
                <input
                  type="radio"
                  name={`${ids}-shade`}
                  value={s.id}
                  checked={shadeId === s.id}
                  onChange={() => {
                    setShadeId(s.id)
                    setShadeError(false)
                  }}
                />
                <span className={styles.swatch} style={{ background: s.hex }} aria-hidden />
                <span className="sr-only">
                  {s.name}, {s.description}
                </span>
              </label>
            ))}
          </div>
          <p className={styles.shadeHelp}>
            {shade ? shade.description : 'Choose a shade.'}{' '}
            <button type="button" className="link-btn" onClick={() => setMatcherOpen(true)}>
              Help me choose
            </button>
          </p>
          {shadeError && (
            <p id={`${ids}-shade-error`} className="error" role="alert">
              Pick a shade first
            </p>
          )}
        </fieldset>
      )}

      <div className={styles.actions}>
        <QuantityStepper value={qty} onChange={setQty} max={Math.max(1, Math.min(10, variant.stock))} label="Quantity" />
        <button ref={buttonRef} type="button" className="btn btn-plum" onClick={addToBag} disabled={soldOut}>
          {soldOut ? 'Sold out' : 'Add to bag'}
        </button>
        <WishButton slug={product.slug} name={product.name} variant="inline" />
      </div>

      {!soldOut && variant.stock <= 10 && <p className={styles.low}>Only {variant.stock} left in this size</p>}

      <ul role="list" className={styles.facts}>
        <li>
          <Icon name="truck" size={18} /> Lagos same-day if you order by noon. 2 to 4 days elsewhere.
        </li>
        {product.fragranceFree && (
          <li>
            <Icon name="leaf" size={18} /> Fragrance-free
          </li>
        )}
        <li>
          <Icon name="info" size={18} /> {product.pregnancySafe ? 'Suitable during pregnancy' : 'Not for use during pregnancy or breastfeeding'}
        </li>
      </ul>

      {product.shades && (
        <ShadeMatcher
          open={matcherOpen}
          onClose={() => setMatcherOpen(false)}
          shades={product.shades}
          productName={product.name}
          onPick={(id) => {
            setShadeId(id)
            setShadeError(false)
            setMatcherOpen(false)
          }}
        />
      )}

      <div className={styles.sticky} data-visible={!buttonVisible} aria-hidden={buttonVisible}>
        <span>
          <span className={styles.stickyName}>{product.name}</span>
          <span className="num">{formatNaira(variant.price)}</span>
        </span>
        <button type="button" className="btn btn-plum" onClick={addToBag} disabled={soldOut} tabIndex={buttonVisible ? -1 : 0}>
          {soldOut ? 'Sold out' : 'Add to bag'}
        </button>
      </div>
    </div>
  )
}
