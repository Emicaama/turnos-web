import { getToken } from '@/lib/session'

export class ApiError extends Error {
  status: number

  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

export function apiBase(): string {
  const value = process.env['API_URL']
  if (!value) {
    throw new ApiError(500, 'Falta API_URL')
  }
  return value.replace(/\/$/, '')
}

export async function errorMessage(res: Response): Promise<string> {
  const fallback =
    res.status === 401
      ? 'Sesión vencida'
      : res.status === 403
        ? 'Sin permiso para eso'
        : res.status === 404
          ? 'No encontrado'
          : res.status === 409
            ? 'El turno acaba de ser ocupado'
            : 'No se pudo completar'
  try {
    const body = (await res.json()) as { message?: unknown }
    if (Array.isArray(body.message)) {
      return body.message.map(String).join('. ')
    }
    if (typeof body.message === 'string' && body.message.trim()) {
      return body.message
    }
  } catch {
    /* cuerpo vacío o no JSON */
  }
  return fallback
}

export async function apiFetch(path: string, init?: RequestInit): Promise<Response> {
  const token = await getToken()
  const headers = new Headers(init?.headers)
  if (token) headers.set('Authorization', `Bearer ${token}`)
  if (init?.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }
  try {
    return await fetch(`${apiBase()}/api/v1${path}`, {
      ...init,
      headers,
      cache: 'no-store',
    })
  } catch {
    throw new ApiError(502, 'No se pudo hablar con la API')
  }
}

export async function apiTry(
  path: string,
  init: RequestInit | undefined,
  onError: (message: string) => never,
): Promise<Response> {
  try {
    return await apiFetch(path, init)
  } catch (error) {
    const message = error instanceof ApiError ? error.message : 'No se pudo hablar con la API'
    onError(message)
    throw new Error(message)
  }
}

export async function apiJson<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await apiFetch(path, init)
  if (!res.ok) {
    throw new ApiError(res.status, await errorMessage(res))
  }
  return (await res.json()) as T
}
