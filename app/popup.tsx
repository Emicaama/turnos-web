'use client'

import { useEffect, type ReactNode } from 'react'

export function Popup({
  title,
  onClose,
  stacked,
  wide,
  children,
}: {
  title: string
  onClose: () => void
  stacked?: boolean
  wide?: boolean
  children: ReactNode
}) {
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key !== 'Escape') return
      if (stacked) event.stopImmediatePropagation()
      onClose()
    }
    window.addEventListener('keydown', onKey, Boolean(stacked))
    return () => window.removeEventListener('keydown', onKey, Boolean(stacked))
  }, [onClose, stacked])

  return (
    <div
      className={stacked ? 'veil stacked' : 'veil'}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <div className={wide ? 'popup wide' : 'popup'} role="dialog" aria-modal="true" aria-labelledby={stacked ? 'popup-title-top' : 'popup-title'}>
        <button type="button" className="popup-close" onClick={onClose}>
          Cerrar
        </button>
        <h2 id={stacked ? 'popup-title-top' : 'popup-title'}>{title}</h2>
        {children}
      </div>
    </div>
  )
}
