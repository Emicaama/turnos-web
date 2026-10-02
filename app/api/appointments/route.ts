import { redirect } from 'next/navigation'
import { agendaPath, contextFromForm } from '@/lib/agenda-path'
import { clinicDayFromIso, isDay, sundayOf } from '@/lib/clinic-time'
import { isJsonRequest, jsonError, readJson, runJson, text } from '@/lib/json-reply'
import { apiFetch, apiTry, errorMessage } from '@/lib/upstream'

export async function POST(req: Request) {
  if (isJsonRequest(req)) return createFromJson(req)
  const form = await req.formData()
  const dayField = String(form.get('day') ?? '')
  const entreturno = form.get('entreturno') === 'true'
  const fromTurno = String(form.get('fromTurno') ?? '')
  const notes = String(form.get('notes') ?? '').trim()
  const slot = String(form.get('slot') ?? '')
  let startAt = String(form.get('startAt') ?? '')
  let endAt = String(form.get('endAt') ?? '')
  if (slot.includes('|')) {
    const [slotStart, slotEnd] = slot.split('|')
    startAt = slotStart
    endAt = slotEnd
  }

  const backDay = isDay(dayField) ? dayField : clinicDayFromIso(startAt || new Date().toISOString())
  const fail = (message: string): never => {
    redirect(
      agendaPath({
        ...contextFromForm(form, startAt || undefined),
        alta: entreturno ? undefined : '1',
        turno: entreturno ? fromTurno || undefined : undefined,
        error: message,
      }),
    )
  }

  if (!startAt || !endAt) {
    fail('Elegí un horario')
  }

  const payload: Record<string, unknown> = {
    patientId: String(form.get('patientId') ?? ''),
    professionalId: String(form.get('professionalId') ?? ''),
    branchId: String(form.get('branchId') ?? ''),
    startAt,
    endAt,
  }
  if (notes) payload.notes = notes
  if (entreturno) payload.entreturno = true

  const res = await apiTry(
    '/appointments',
    { method: 'POST', body: JSON.stringify(payload) },
    fail,
  )

  if (res.status === 401) {
    redirect('/login?error=' + encodeURIComponent('Sesión vencida'))
  }
  if (!res.ok) {
    fail(await errorMessage(res))
  }

  const data = (await res.json()) as {
    result?: string
    appointment?: { id?: string; startAt?: string }
  }
  if (data.result === 'lista_de_espera') {
    redirect(
      agendaPath({
        ...contextFromForm(form, startAt || undefined),
        aviso: 'No había hueco. Quedó en lista de espera.',
      }),
    )
  }

  const id = data.appointment?.id
  const when = data.appointment?.startAt ? clinicDayFromIso(data.appointment.startAt) : backDay
  redirect(
    agendaPath({
      ...contextFromForm(form, data.appointment?.startAt),
      week: sundayOf(when),
      turno: id,
      aviso: entreturno
        ? 'Quedó el entreturno. El turno de antes se acortó.'
        : 'Quedó programado.',
    }),
  )
}

async function createFromJson(req: Request) {
  const body = await readJson(req)
  if (body instanceof Response) return body

  const startAt = text(body, 'startAt')
  const endAt = text(body, 'endAt')
  if (!startAt || !endAt) return jsonError(400, 'Elegí un horario')

  const payload: Record<string, unknown> = {
    patientId: text(body, 'patientId'),
    professionalId: text(body, 'professionalId'),
    branchId: text(body, 'branchId'),
    startAt,
    endAt,
  }
  const notes = text(body, 'notes')
  if (notes) payload.notes = notes

  return runJson(() => apiFetch('/appointments', { method: 'POST', body: JSON.stringify(payload) }))
}
