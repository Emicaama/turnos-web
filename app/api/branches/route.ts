import { redirect } from 'next/navigation'
import { agendaPath, contextFromForm } from '@/lib/agenda-path'
import { isJsonRequest, readJson, runJson, text } from '@/lib/json-reply'
import { apiFetch, apiTry, errorMessage } from '@/lib/upstream'

export async function POST(req: Request) {
  if (isJsonRequest(req)) {
    const body = await readJson(req)
    if (body instanceof Response) return body
    return runJson(() =>
      apiFetch('/branches', {
        method: 'POST',
        body: JSON.stringify({
          name: text(body, 'name'),
          address: text(body, 'address'),
        }),
      }),
    )
  }
  const form = await req.formData()
  const place = contextFromForm(form)
  const fail = (message: string): never => {
    redirect(agendaPath({ ...place, crear: 'sede', error: message }))
  }

  const res = await apiTry(
    '/branches',
    {
      method: 'POST',
      body: JSON.stringify({
        name: String(form.get('name') ?? '').trim(),
        address: String(form.get('address') ?? '').trim(),
      }),
    },
    fail,
  )

  if (res.status === 401) {
    redirect('/login?error=' + encodeURIComponent('Sesión vencida'))
  }
  if (!res.ok) fail(await errorMessage(res))
  redirect(agendaPath({ ...place, aviso: 'Sede cargada.' }))
}
