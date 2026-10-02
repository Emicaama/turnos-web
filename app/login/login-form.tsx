'use client'

import { SubmitButton } from '@/app/submit-button'

export function LoginForm({ error }: { error?: string }) {
  return (
    <form className="slip" action="/api/session" method="post">
      <p className="kicker">Mostrador</p>
      <h1>Turnos</h1>
      <p className="lede">Entrá con tu usuario de secretaría.</p>
      {error ? <p className="banner error">{error}</p> : null}
      <div className="field">
        <label htmlFor="email">Correo</label>
        <input id="email" name="email" type="email" autoComplete="username" required />
      </div>
      <div className="field">
        <label htmlFor="password">Clave</label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          minLength={8}
          required
        />
      </div>
      <SubmitButton className="primary" pendingLabel="Entrando…">
        Entrar
      </SubmitButton>
    </form>
  )
}
