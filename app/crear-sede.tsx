'use client'

import { useState, type FormEvent } from 'react'
import { postJson } from '@/lib/post-json'

export function CrearSede({ onDone }: { onDone: () => void }) {
  const [error, setError] = useState<string>()
  const [pending, setPending] = useState(false)

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    setPending(true)
    setError(undefined)
    try {
      await postJson('/api/branches', {
        name: String(form.get('name') ?? ''),
        address: String(form.get('address') ?? ''),
      })
      onDone()
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'No se pudo cargar la sucursal')
      setPending(false)
    }
  }

  return (
    <form className="stack" onSubmit={submit}>
      {error ? <p className="banner error">{error}</p> : null}
      <div className="form-row cols-2">
        <div className="field">
          <label htmlFor="branch-name">Nombre</label>
          <input id="branch-name" name="name" required minLength={2} autoFocus />
        </div>
        <div className="field">
          <label htmlFor="branch-address">Dirección</label>
          <input id="branch-address" name="address" required minLength={2} />
        </div>
      </div>
      <button type="submit" className="primary" disabled={pending}>
        {pending ? 'Guardando…' : 'Cargar sucursal'}
      </button>
    </form>
  )
}
