'use client'

import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { Icon } from '@/components/Icon'
import { Photo } from '@/components/Photo'
import { useToast } from '@/components/toast'
import { brandById } from '@/data/brands'
import type { Concern, SkinType } from '@/data/types'
import { concernLabels, requireProduct } from '@/lib/catalog'
import { formatNaira } from '@/lib/money'
import { computeTotals, priceLines, ROUTINE_DISCOUNT } from '@/lib/pricing'
import { answersFromQuery, answersToQuery } from '@/lib/quizParams'
import { buildRoutine, routineProducts, type QuizAnswers, type RoutineStep } from '@/lib/routine'
import { useCart } from '@/stores/cart'
import { useUi } from '@/stores/ui'
import styles from './quiz.module.css'

type Draft = Partial<QuizAnswers>

const SKIN_OPTIONS: { id: SkinType; label: string; hint: string }[] = [
  { id: 'dry', label: 'Dry', hint: 'Tight after washing, flaky in harmattan' },
  { id: 'oily', label: 'Oily', hint: 'Shiny by midday, all over' },
  { id: 'combination', label: 'Combination', hint: 'Oily T-zone, normal or dry cheeks' },
  { id: 'normal', label: 'Normal', hint: 'Comfortable most days' },
  { id: 'sensitive', label: 'Sensitive', hint: 'Stings, itches or reacts easily' },
]

interface Step {
  key: keyof QuizAnswers
  title: string
  hint?: string
}

const STEPS: Step[] = [
  { key: 'skinType', title: 'How does your skin feel by the afternoon?' },
  { key: 'concerns', title: 'What would you most like to change?', hint: 'Pick up to three.' },
  { key: 'reactive', title: 'Do fragrance or acids usually irritate your skin?' },
  { key: 'sun', title: 'How much time do you spend outdoors in the day?' },
  { key: 'pregnant', title: 'Are you pregnant or breastfeeding?', hint: 'We use this only to leave out ingredients that aren’t recommended.' },
  { key: 'size', title: 'How many steps do you want?' },
]

export function Quiz() {
  const params = useSearchParams()
  const result = answersFromQuery(params)
  const [started, setStarted] = useState(false)
  if (result) return <Result answers={result} />
  if (!started) return <Intro onStart={() => setStarted(true)} />
  return <Questions />
}

function Intro({ onStart }: { onStart: () => void }) {
  return (
    <div className={`wrap ${styles.intro}`}>
      <div className={styles.introText}>
        <p className="eyebrow">Routine quiz</p>
        <h1 className={`display ${styles.title}`}>A routine that makes sense for your skin</h1>
        <p className={styles.lede}>Six questions, about two minutes. You’ll get a morning and a night routine, with the reason each product is there and nothing you don’t need.</p>
        <button type="button" className="btn btn-plum" onClick={onStart}>
          Start the quiz
          <Icon name="arrow" size={18} />
        </button>
        <p className="hint">Routines of three or more products are {ROUTINE_DISCOUNT * 100}% off.</p>
      </div>
      <Photo name="m-apply3" alt="A woman with deep brown skin smoothing cream across her cheek" sizes="(min-width: 900px) 40vw, 100vw" ratio={4 / 5} priority position="50% 30%" className={styles.introPhoto} />
    </div>
  )
}

function Questions() {
  const router = useRouter()
  const [i, setI] = useState(0)
  const [draft, setDraft] = useState<Draft>({ concerns: [] })
  const headingRef = useRef<HTMLHeadingElement>(null)
  const step = STEPS[i]!

  useEffect(() => {
    headingRef.current?.focus()
  }, [i])

  const answered = step.key === 'concerns' ? (draft.concerns?.length ?? 0) > 0 : draft[step.key] !== undefined

  const next = (d: Draft = draft) => {
    if (i < STEPS.length - 1) setI(i + 1)
    else router.push(`/quiz?${answersToQuery(d as QuizAnswers)}`, { scroll: true })
  }
  const choose = <K extends keyof QuizAnswers>(key: K, value: QuizAnswers[K]) => {
    const d = { ...draft, [key]: value }
    setDraft(d)
    // single-choice questions move on by themselves, after a beat so the choice registers
    setTimeout(() => next(d), 180)
  }

  const choice = <K extends keyof QuizAnswers>(key: K, value: QuizAnswers[K], label: string, hint?: string) => (
    <label className={styles.choice} key={String(value)}>
      <input type="radio" name={key} checked={draft[key] === value} onChange={() => choose(key, value)} />
      <span>
        <strong>{label}</strong>
        {hint && <span className="muted">{hint}</span>}
      </span>
    </label>
  )

  return (
    <div className={`wrap ${styles.questions}`}>
      <div className={styles.progress}>
        <button type="button" className={styles.back} onClick={() => setI(Math.max(0, i - 1))} disabled={i === 0} aria-label="Previous question">
          <Icon name="back" size={18} />
        </button>
        <div className={styles.bar} role="progressbar" aria-valuemin={1} aria-valuemax={STEPS.length} aria-valuenow={i + 1} aria-label={`Question ${i + 1} of ${STEPS.length}`}>
          <span style={{ width: `${((i + 1) / STEPS.length) * 100}%` }} />
        </div>
        <span className="num muted">
          {i + 1}/{STEPS.length}
        </span>
      </div>

      <fieldset className={styles.fieldset} key={step.key}>
        <legend>
          <h1 ref={headingRef} tabIndex={-1} className={`display ${styles.qTitle}`}>
            {step.title}
          </h1>
          {step.hint && <p className="muted">{step.hint}</p>}
        </legend>
        <div className={styles.choices}>
          {step.key === 'skinType' && SKIN_OPTIONS.map((o) => choice('skinType', o.id, o.label, o.hint))}
          {step.key === 'concerns' &&
            (Object.entries(concernLabels) as [Concern, string][]).map(([id, label]) => {
              const on = draft.concerns!.includes(id)
              const full = !on && draft.concerns!.length >= 3
              return (
                <label className={styles.choice} key={id} data-disabled={full}>
                  <input
                    type="checkbox"
                    checked={on}
                    disabled={full}
                    onChange={() => setDraft({ ...draft, concerns: on ? draft.concerns!.filter((c) => c !== id) : [...draft.concerns!, id] })}
                  />
                  <span>
                    <strong>{label}</strong>
                  </span>
                </label>
              )
            })}
          {step.key === 'reactive' && [choice('reactive', true, 'Yes, often'), choice('reactive', false, 'Rarely or never')]}
          {step.key === 'sun' && [
            choice('sun', 'indoors', 'Mostly indoors', 'Office, home, car'),
            choice('sun', 'some', 'A bit', 'School runs, errands, the odd market trip'),
            choice('sun', 'lots', 'A lot', 'Outdoors most of the day'),
          ]}
          {step.key === 'pregnant' && [choice('pregnant', true, 'Yes'), choice('pregnant', false, 'No')]}
          {step.key === 'size' && [
            choice('size', 'essentials', 'Just the essentials', 'Four in the morning, three at night'),
            choice('size', 'full', 'The full routine', 'Everything that would help'),
          ]}
        </div>
      </fieldset>

      {step.key === 'concerns' && (
        <button type="button" className="btn btn-plum" disabled={!answered} onClick={() => next()}>
          Continue
        </button>
      )}
    </div>
  )
}

function Result({ answers }: { answers: QuizAnswers }) {
  const routine = buildRoutine(answers)
  const slugs = routineProducts(routine)
  const addMany = useCart((s) => s.addMany)
  const openBag = useUi((s) => s.openBag)
  const toast = useToast()
  // one id per set of answers, so adding the same routine twice merges rather than duplicates
  const routineId = `quiz:${answersToQuery(answers)}`
  // tinted products need a shade; we ask rather than guess
  const [shades, setShades] = useState<Record<string, string>>({})
  const candidates = slugs.map((slug) => {
    const p = requireProduct(slug)
    const v = p.variants.find((x) => x.stock > 0) ?? p.variants[0]!
    return { slug, variantId: v.id, shadeId: p.shades ? shades[slug] : undefined, qty: 1, routineId, inStock: v.stock > 0 }
  })
  const available = candidates.filter((l) => l.inStock && (!requireProduct(l.slug).shades || l.shadeId)).map((l) => ({ slug: l.slug, variantId: l.variantId, shadeId: l.shadeId, qty: l.qty, routineId: l.routineId }))
  const totals = computeTotals(priceLines(available))
  const needShade = slugs.filter((s) => requireProduct(s).shades && !shades[s]).map(requireProduct)

  const addAll = () => {
    addMany(available)
    toast(`${available.length} products added. Routine saving applied in your bag.`, { tone: 'ok' })
    openBag()
  }

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href)
      toast('Link copied')
    } catch {
      toast('Couldn’t copy. The link is in your address bar.')
    }
  }

  return (
    <div className={`wrap ${styles.result}`}>
      <header className={styles.resultHead}>
        <p className="eyebrow">Your routine</p>
        <h1 className={`display ${styles.title}`}>
          {answers.concerns.length ? `For ${answers.concerns.map((c) => concernLabels[c].toLowerCase()).join(', ')}` : 'Your everyday routine'}
        </h1>
        <p className={styles.lede}>
          {slugs.length} products for {answers.skinType} skin, morning and night.
        </p>
        <div className={styles.resultActions}>
          <button type="button" className="btn btn-plum" onClick={addAll} disabled={available.length === 0}>
            Add {available.length === slugs.length ? `all ${slugs.length}` : `${available.length} of ${slugs.length}`} to bag · <span className="num">{formatNaira(totals.subtotal)}</span>
          </button>
          <button type="button" className="btn btn-ghost" onClick={copy}>
            Copy link
          </button>
          <Link href="/quiz" className="link-btn">
            Start over
          </Link>
        </div>
        {totals.routineSavings > 0 && <p className={styles.saving}>Includes {formatNaira(totals.routineSavings)} routine saving.</p>}
        {needShade.length > 0 && <p className="hint">Pick a shade for {needShade.map((p) => p.name).join(' and ')} below to include it.</p>}
      </header>

      <div className={styles.columns}>
        <RoutineColumn title="Morning" icon="sun" steps={routine.am} shades={shades} onShade={(slug, id) => setShades({ ...shades, [slug]: id })} />
        <RoutineColumn title="Night" icon="moon" steps={routine.pm} shades={shades} onShade={(slug, id) => setShades({ ...shades, [slug]: id })} />
      </div>

      {routine.notes.length > 0 && (
        <aside className={styles.notes} aria-labelledby="notes-title">
          <h2 id="notes-title" className={styles.notesTitle}>
            Good to know
          </h2>
          <ul>
            {routine.notes.map((n) => (
              <li key={n}>{n}</li>
            ))}
          </ul>
        </aside>
      )}
    </div>
  )
}

interface ColumnProps {
  title: string
  icon: 'sun' | 'moon'
  steps: RoutineStep[]
  shades: Record<string, string>
  onShade: (slug: string, shadeId: string) => void
}

function RoutineColumn({ title, icon, steps, shades, onShade }: ColumnProps) {
  return (
    <section aria-labelledby={`r-${title}`} className={styles.column}>
      <h2 id={`r-${title}`} className={styles.columnTitle}>
        <Icon name={icon} size={20} /> {title}
      </h2>
      <ol className={styles.steps}>
        {steps.map((s, n) => {
          const p = requireProduct(s.slug)
          return (
            <li key={s.step + s.slug} className={styles.step}>
              <Link href={`/shop/${p.slug}`} className={styles.stepPhoto} tabIndex={-1} aria-hidden>
                <Photo name={p.photos[0]!.name} alt="" sizes="96px" ratio={1} />
              </Link>
              <div>
                <p className={styles.stepLabel}>
                  <span className="num">{n + 1}</span> {s.step}
                </p>
                <p className={styles.stepName}>
                  <Link href={`/shop/${p.slug}`}>{p.name}</Link>
                </p>
                <p className="muted">{brandById(p.brandId).name}</p>
                <p className={styles.why}>{s.why}</p>
                {p.shades && (
                  <fieldset className={styles.shadePick}>
                    <legend className="sr-only">Shade of {p.name}</legend>
                    {p.shades.map((sh) => (
                      <label key={sh.id} title={sh.name}>
                        <input type="radio" name={`${title}-${p.slug}-shade`} checked={shades[p.slug] === sh.id} onChange={() => onShade(p.slug, sh.id)} />
                        <span style={{ background: sh.hex }} aria-hidden />
                        <span className="sr-only">{sh.name}</span>
                      </label>
                    ))}
                    <span className="hint">{p.shades.find((sh) => sh.id === shades[p.slug])?.name ?? 'Choose a shade'}</span>
                  </fieldset>
                )}
              </div>
            </li>
          )
        })}
      </ol>
    </section>
  )
}
