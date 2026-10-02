'use client'

import { useState, type FormEvent } from 'react'
import { postJson } from '@/lib/post-json'
import type { Branch, Specialty } from '@/lib/types'

export function CrearProfesional({
  branches,
  specialties,
  onDone,
}: {
  branches: Branch[]
  specialties: Specialty[]
  onDone: () => void
}) {
  const [error, setError] = useState<string>()
  const [pending, setPending] = useState(false)

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const specialtyId = String(form.get('specialtyId') ?? '')
    const branchId = String(form.get('branchId') ?? '')
    setPending(true)
    setError(undefined)
    try {
      await postJson('/api/professionals', {
        firstName: String(form.get('firstName') ?? ''),
        lastName: String(form.get('lastName') ?? ''),
        specialtyIds: specialtyId ? [specialtyId] : undefined,
        branchIds: branchId ? [branchId] : undefined,
      })
      onDone()
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'No se pudo cargar el profesional')
      setPending(false)
    }
  }

  return (
    <form className="stack" onSubmit={submit}>
      {error ? <p className="banner error">{error}</p> : null}
      <div className="form-row cols-2">
        <div className="field">
          <label htmlFor="pro-first">Nombre</label>
          <input id="pro-first" name="firstName" required minLength={2} autoFocus />
        </div>
        <div className="field">
          <label htmlFor="pro-last">Apellido</label>
          <input id="pro-last" name="lastName" required minLength={2} />
        </div>
      </div>
      <div className="form-row cols-2">
        <div className="field">
          <label htmlFor="pro-specialty">Especialidad</label>
          <select id="pro-specialty" name="specialtyId" defaultValue="">
            <option value="">Sin especialidad</option>
            {specialties.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label htmlFor="pro-branch">Sucursal</label>
          <select id="pro-branch" name="branchId" defaultValue="">
            <option value="">Sin sucursal</option>
            {branches.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
        </div>
      </div>
      <button type="submit" className="primary" disabled={pending}>
        {pending ? 'Guardando…' : 'Cargar profesional'}
      </button>
    </form>
  )
}
