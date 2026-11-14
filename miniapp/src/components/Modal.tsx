import React, { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { IcX } from './ui'

/* ---------- umumiy modal tizimi ----------
 * Mobil: pastdan chiqadigan sheet (sichqoncha ustiga surib yopishga hojat yo'q),
 * Desktop: ekran markazidagi oyna. Fokus qamovi, Escape, tan ichi aylanish,
 * tananing skroll qulfi (pozitsiya yo'qolmaydi), har ikki mavzuda ishlaydi. */
export default function Modal({ open, onClose, title, children, foot, width = 520, closeLabel }: {
  open: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
  foot?: React.ReactNode
  width?: number
  closeLabel?: string
}) {
  const panelRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!open) return
    const prevOverflow = document.body.style.overflow
    const prevScrollY = window.scrollY
    document.body.style.overflow = 'hidden'
    const prevFocus = document.activeElement as HTMLElement | null
    const id = requestAnimationFrame(() => {
      const el = panelRef.current
      const first = (el?.querySelector<HTMLElement>('[data-autofocus]') ||
        el?.querySelector<HTMLElement>('button, [href], input, select, textarea')) || null
      first?.focus()
    })
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { e.stopPropagation(); onClose(); return }
      if (e.key !== 'Tab' || !panelRef.current) return
      const items = Array.from(panelRef.current.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      )).filter(x => !x.hasAttribute('disabled') && x.offsetParent !== null)
      if (!items.length) return
      const firstEl = items[0]
      const lastEl = items[items.length - 1]
      if (e.shiftKey && document.activeElement === firstEl) { e.preventDefault(); lastEl.focus() }
      else if (!e.shiftKey && document.activeElement === lastEl) { e.preventDefault(); firstEl.focus() }
    }
    document.addEventListener('keydown', onKey, true)
    return () => {
      document.removeEventListener('keydown', onKey, true)
      cancelAnimationFrame(id)
      document.body.style.overflow = prevOverflow
      if (Math.abs(window.scrollY - prevScrollY) > 2) window.scrollTo(0, prevScrollY)
      try { prevFocus?.focus?.() } catch {}
    }
  }, [open, onClose])

  if (!open) return null
  return createPortal(
    <div className="fixed inset-0 z-[80]" role="dialog" aria-modal="true" aria-label={title}>
      <div className="absolute inset-0 bg-black/45 backdrop-blur-[2px] anim-fade" onClick={onClose} />
      <div className="absolute inset-0 flex items-end lg:items-center lg:justify-center pointer-events-none px-0 lg:px-4">
        <div
          ref={panelRef}
          style={{ maxWidth: width ? `${width}px` : undefined }}
          className="anim-modal pointer-events-auto w-full max-h-[92dvh] lg:max-h-[86vh] flex flex-col
            bg-[var(--sheet)] text-[var(--ink)] rounded-t-[26px] lg:rounded-[26px]
            shadow-[0_-24px_70px_rgba(6,12,40,.45)] lg:shadow-[0_30px_80px_rgba(6,12,40,.4)]
            overscroll-contain"
        >
          <div className="pt-2.5 pb-1 lg:hidden">
            <div className="w-10 h-1.5 rounded-full bg-[var(--line2)] mx-auto" />
          </div>
          <div className="flex items-center justify-between px-5 pt-2 pb-1.5 lg:pt-5">
            <h2 className="text-[17px] lg:text-[18px] font-extrabold leading-tight">{title}</h2>
            <button
              onClick={onClose}
              aria-label={closeLabel || title}
              className="press w-9 h-9 rounded-full bg-[var(--panel)] border border-[var(--line2)] grid place-items-center text-[var(--mut2)] focus-ring active:scale-90 transition-transform shrink-0"
            >
              <IcX s={15} />
            </button>
          </div>
          <div className="overflow-y-auto no-scrollbar px-5 py-3 flex-1 overscroll-contain">{children}</div>
          {foot && (
            <div className="px-5 pt-2 pb-1" style={{ paddingBottom: 'calc(14px + var(--sab))' }}>{foot}</div>
          )}
        </div>
      </div>
    </div>,
    document.body
  )
}
