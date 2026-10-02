'use client'

import type { Branch, Professional } from '@/lib/types'

export function WeekFilters({
  week,
  branches,
  professionals,
  sucursal,
  profesional,
  estado,
  showProfessional,
}: {
  week: string
  branches: Branch[]
  professionals: Professional[]
  sucursal?: string
  profesional?: string
  estado?: string
  showProfessional: boolean
}) {
  return (
    <form className="filters" action="/" method="get">
      <input type="hidden" name="week" value={week} />
      <label className="filter">
        <span>Sucursal</span>
        <select name="sucursal" defaultValue={sucursal ?? ''} onChange={(event) => event.currentTarget.form?.requestSubmit()}>
          <option value="">Todas</option>
          {branches.map((branch) => (
            <option key={branch.id} value={branch.id}>
              {branch.name}
            </option>
          ))}
        </select>
      </label>
      {showProfessional ? (
        <label className="filter">
          <span>Profesional</span>
          <select
            name="profesional"
            defaultValue={profesional ?? ''}
            onChange={(event) => event.currentTarget.form?.requestSubmit()}
          >
            <option value="">Todos</option>
            {professionals.map((item) => (
              <option key={item.id} value={item.id}>
                {item.lastName}, {item.firstName}
              </option>
            ))}
          </select>
        </label>
      ) : null}
      <label className="filter">
        <span>Estado</span>
        <select name="estado" defaultValue={estado ?? ''} onChange={(event) => event.currentTarget.form?.requestSubmit()}>
          <option value="">Todos</option>
          <option value="programado">Programado</option>
          <option value="en_sala_de_espera">En sala de espera</option>
          <option value="atendido">Atendido</option>
        </select>
      </label>
    </form>
  )
}
