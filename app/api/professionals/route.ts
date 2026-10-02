import { redirect } from 'next/navigation'
import { agendaPath, contextFromForm } from '@/lib/agenda-path'
import { isJsonRequest, readJson, runJson, text } from '@/lib/json-reply'
import { apiFetch, apiTry, errorMessage } from '@/lib/upstream'

function ids(value: unknown): string[] | undefined {
  if (!Array.isArray(value)) return undefined
  const list = value.filter((item): item is string => typeof item === 'string' && item.length > 0)
  return list.length > 0 ? list : undefined
}

export async function POST(req: Request) {
  if (isJsonRequest(req)) {
    const body = await readJson(req)
    if (body instanceof Response) return body
    const payload: Record<string, unknown> = {
      firstName: text(body, 'firstName'),
      lastName: text(body, 'lastName'),
    }
    const specialtyIds = ids(body.specialtyIds)
    const branchIds = ids(body.branchIds)
    if (specialtyIds) payload.specialtyIds = specialtyIds
    if (branchIds) payload.branchIds = branchIds
    return runJson(() =>
      apiFetch('/professionals', { method: 'POST', body: JSON.stringify(payload) }),
    )
  }
  const form = await req.formData()
  const place = contextFromForm(form)
  const fail = (message: string): never => {
    redirect(agendaPath({ ...place, crear: 'profesional', error: message }))
  }

  const specialtyId = String(form.get('specialtyId') ?? '')
  const branchId = String(form.get('branchId') ?? '')
  const payload: Record<string, unknown> = {
    firstName: String(form.get('firstName') ?? '').trim(),
    lastName: String(form.get('lastName') ?? '').trim(),
  }
  if (specialtyId) payload.specialtyIds = [specialtyId]
  if (branchId) payload.branchIds = [branchId]

  const res = await apiTry('/professionals', { method: 'POST', body: JSON.stringify(payload) }, fail)

  if (res.status === 401) {
    redirect('/login?error=' + encodeURIComponent('Sesión vencida'))
  }
  if (!res.ok) fail(await errorMessage(res))
  redirect(agendaPath({ ...place, aviso: 'Profesional cargado.' }))
}
