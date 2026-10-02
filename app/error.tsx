'use client'

export default function Error({
  error,
  reset,
}: {
  error: Error
  reset: () => void
}) {
  return (
    <main className="login">
      <div className="slip">
        <p className="kicker">Mostrador</p>
        <h1>No se pudo armar la agenda</h1>
        <p className="lede">{error.message}</p>
        <button className="primary" type="button" onClick={reset}>
          Reintentar
        </button>
      </div>
    </main>
  )
}
