import { redirect } from 'next/navigation'
import { agendaPath, contextFromForm } from '@/lib/agenda-path'
import type { Appointment } from '@/lib/types'
import { apiTry, errorMessage } from '@/lib/upstream'

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params
  const form = await req.formData()
  const fail = (message: string): never => {
    redirect(agendaPath({ ...contextFromForm(form), turno: id, error: message }))
  }

  const res = await apiTry(`/appointments/${id}/cancel`, { method: 'POST' }, fail)

  if (res.status === 401) {
    redirect('/login?error=' + encodeURIComponent('Sesión vencida'))
  }
  if (!res.ok) {
    fail(await errorMessage(res))
  }

  const updated = (await res.json()) as Appointment
  const aviso = updated.promoted
    ? 'Quedó cancelado. El horario pasó al primero de la lista de espera.'
    : 'Quedó cancelado.'
  redirect(agendaPath({ ...contextFromForm(form), aviso }))
}
