import type { WeekQuery } from '@/lib/agenda-path'

export function QueryFields({ week, sucursal, profesional, estado }: WeekQuery & { week: string }) {
  return (
    <>
      <input type="hidden" name="week" value={week} />
      {sucursal ? <input type="hidden" name="sucursal" value={sucursal} /> : null}
      {profesional ? <input type="hidden" name="profesional" value={profesional} /> : null}
      {estado ? <input type="hidden" name="estado" value={estado} /> : null}
    </>
  )
}
