'use client'

export function ActionBar({
  create,
  catalog,
  onTurno,
  onSucursal,
  onProfesional,
}: {
  create: boolean
  catalog: boolean
  onTurno: () => void
  onSucursal: () => void
  onProfesional: () => void
}) {
  if (!create && !catalog) return null
  return (
    <div className="toolbar-actions">
      {catalog ? (
        <button type="button" className="ghost" onClick={onSucursal}>
          Sucursal
        </button>
      ) : null}
      {catalog ? (
        <button type="button" className="ghost" onClick={onProfesional}>
          Profesional
        </button>
      ) : null}
      {create ? (
        <button type="button" className="primary" onClick={onTurno}>
          + Nuevo turno
        </button>
      ) : null}
    </div>
  )
}
