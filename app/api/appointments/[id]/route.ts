import { redirect } from 'next/navigation'
import { agendaPath, contextFromForm } from '@/lib/agenda-path'
import { clinicDayFromIso, isDay, sundayOf } from '@/lib/clinic-time'
import type { Appointment } from '@/lib/types'
import { apiTry, errorMessage } from '@/lib/upstream'

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params
  const form = await req.formData()
  const dayField = String(form.get('day') ?? '')
  const day = isDay(dayField) ? dayField : ''
  const action = String(form.get('action') ?? '')

  const fail = (message: string): never => {
    redirect(agendaPath({ ...contextFromForm(form), turno: id, error: message }))
  }

  const body = readBody(action, form, fail)
  const res = await apiTry(
    `/appointments/${id}`,
    { method: 'PATCH', body: JSON.stringify(body) },
    fail,
  )

  if (res.status === 401) {
    redirect('/login?error=' + encodeURIComponent('Sesión vencida'))
  }
  if (!res.ok) {
    fail(await errorMessage(res))
  }

  const updated = (await res.json()) as Appointment
  const promotedNote = updated.promoted
    ? ' El horario anterior pasó al primero de la lista de espera.'
    : ''

  if (action === 'reschedule') {
    redirect(
      agendaPath({
        ...contextFromForm(form, updated.startAt),
        week: sundayOf(clinicDayFromIso(updated.startAt)),
        turno: updated.id,
        aviso: `Reprogramado.${promotedNote}`,
      }),
    )
  }

  const aviso =
    action === 'notes'
      ? 'Nota guardada.'
      : body.status === 'en_sala_de_espera'
        ? 'Pasó a sala de espera.'
        : body.status === 'atendido'
          ? 'Quedó atendido.'
          : 'Listo.'

  redirect(
    agendaPath({
      ...contextFromForm(form, updated.startAt),
      week: sundayOf(day || clinicDayFromIso(updated.startAt)),
      turno: id,
      aviso,
    }),
  )
}

function readBody(
  action: string,
  form: FormData,
  fail: (message: string) => never,
): Record<string, string> {
  if (action === 'status') {
    return { status: String(form.get('status') ?? '') }
  }
  if (action === 'notes') {
    return { notes: String(form.get('notes') ?? '') }
  }
  if (action === 'reschedule') {
    const slot = String(form.get('slot') ?? '')
    const [startAt, endAt] = slot.split('|')
    if (!startAt || !endAt) {
      fail('Elegí un horario')
      throw new Error('Elegí un horario')
    }
    return { startAt, endAt }
  }
  fail('No entendí la acción')
  throw new Error('No entendí la acción')
}
