import { clinicDayFromIso, isDay, sundayOf } from '@/lib/clinic-time'

const STATUSES = new Set(['programado', 'en_sala_de_espera', 'atendido'])

export type WeekQuery = {
  week?: string
  sucursal?: string
  profesional?: string
  estado?: string
}

function cleanId(value: FormDataEntryValue | null): string | undefined {
  const text = String(value ?? '')
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(text)
    ? text
    : undefined
}

export function contextFromForm(form: FormData, fallbackIso?: string): WeekQuery {
  const rawWeek = String(form.get('week') ?? '')
  const rawDay = String(form.get('day') ?? '')
  const estado = String(form.get('estado') ?? '')
  let week: string | undefined
  if (isDay(rawWeek)) week = sundayOf(rawWeek)
  else if (isDay(rawDay)) week = sundayOf(rawDay)
  else if (fallbackIso) week = sundayOf(clinicDayFromIso(fallbackIso))
  return {
    week,
    sucursal: cleanId(form.get('sucursal')),
    profesional: cleanId(form.get('profesional')),
    estado: STATUSES.has(estado) ? estado : undefined,
  }
}

export function agendaPath(params: object): string {
  const query = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (typeof value === 'string' && value) query.set(key, value)
  }
  const text = query.toString()
  return text ? `/?${text}` : '/'
}
