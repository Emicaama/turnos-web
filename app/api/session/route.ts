import { redirect } from 'next/navigation'
import { agendaPath } from '@/lib/agenda-path'
import { setToken } from '@/lib/session'
import { apiBase, errorMessage } from '@/lib/upstream'

export async function POST(req: Request) {
  const form = await req.formData()
  const email = String(form.get('email') ?? '').trim()
  const password = String(form.get('password') ?? '')

  let res: Response
  try {
    res = await fetch(`${apiBase()}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
      cache: 'no-store',
    })
  } catch {
    redirect('/login?error=' + encodeURIComponent('No se pudo hablar con la API'))
  }

  if (!res.ok) {
    const message = await errorMessage(res)
    redirect('/login?error=' + encodeURIComponent(message))
  }

  const data = (await res.json()) as { accessToken?: string }
  if (!data.accessToken) {
    redirect('/login?error=' + encodeURIComponent('La API no devolvió el token'))
  }
  await setToken(data.accessToken)
  redirect(agendaPath({}))
}
