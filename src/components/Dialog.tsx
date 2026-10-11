'use client'

import { useEffect, useId, useRef, type ReactNode } from 'react'
import { Icon } from './Icon'
import styles from './Dialog.module.css'

interface Props {
  open: boolean
  onClose: () => void
  title: string
  children: ReactNode
  /** centre: modal; right/left: drawer; top: search panel. Centre turns into a bottom sheet on phones. */
  placement?: 'centre' | 'right' | 'left' | 'top'
  hideTitle?: boolean
  footer?: ReactNode
}

/**
 * Native <dialog> gives the focus trap, Escape and inert background for free.
 * Focus returns to whatever opened it.
 */
export function Dialog({ open, onClose, title, children, placement = 'centre', hideTitle = false, footer }: Props) {
  const ref = useRef<HTMLDialogElement>(null)
  const opener = useRef<Element | null>(null)
  const titleId = useId()

  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    if (open && !dialog.open) {
      opener.current = document.activeElement
      dialog.showModal()
      document.documentElement.style.overflow = 'hidden'
    } else if (!open && dialog.open) {
      dialog.close()
      document.documentElement.style.overflow = ''
      if (opener.current instanceof HTMLElement) opener.current.focus()
    }
  }, [open])

  // Close if the route hides this component (Next keeps recent pages mounted).
  useEffect(
    () => () => {
      document.documentElement.style.overflow = ''
    },
    [],
  )

  return (
    <dialog
      ref={ref}
      className={styles.dialog}
      data-placement={placement}
      aria-labelledby={titleId}
      onCancel={(e) => {
        e.preventDefault()
        onClose()
      }}
      onClick={(e) => {
        if (e.target === ref.current) onClose()
      }}
    >
      {open && (
        <div className={styles.inner}>
          <header className={styles.head}>
            <h2 id={titleId} className={hideTitle ? 'sr-only' : styles.title}>
              {title}
            </h2>
            <button type="button" className={styles.close} onClick={onClose} aria-label="Close">
              <Icon name="close" />
            </button>
          </header>
          <div className={styles.body}>{children}</div>
          {footer && <footer className={styles.foot}>{footer}</footer>}
        </div>
      )}
    </dialog>
  )
}
