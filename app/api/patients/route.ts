import { apiFetch } from '@/lib/upstream'
import { jsonError, readJson, runJson, text } from '@/lib/json-reply'

export async function POST(req: Request) {
  const body = await readJson(req)
  if (body instanceof Response) return body

  const payload: Record<string, string> = {
    firstName: text(body, 'firstName'),
    lastName: text(body, 'lastName'),
    documentId: text(body, 'documentId'),
  }
  const email = text(body, 'email')
  const phone = text(body, 'phone')
  if (email) payload.email = email
  if (phone) payload.phone = phone

  if (payload.firstName.length < 2 || payload.lastName.length < 2) {
    return jsonError(400, 'Nombre y apellido, al menos 2 letras')
  }
  if (payload.documentId.length < 4) {
    return jsonError(400, 'El documento necesita al menos 4 caracteres')
  }

  return runJson(() =>
    apiFetch('/patients', { method: 'POST', body: JSON.stringify(payload) }),
  )
}
