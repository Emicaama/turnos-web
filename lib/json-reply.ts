import { ApiError, errorMessage } from '@/lib/upstream'

export function isJsonRequest(req: Request): boolean {
  return (req.headers.get('content-type') ?? '').includes('application/json')
}

export function jsonError(status: number, message: string): Response {
  return Response.json({ error: message }, { status })
}

export async function jsonFromUpstream(res: Response): Promise<Response> {
  if (res.status === 401) return jsonError(401, 'Sesión vencida')
  if (!res.ok) return jsonError(res.status, await errorMessage(res))
  return Response.json(await res.json(), { status: res.status })
}

export async function readJson(req: Request): Promise<Record<string, unknown> | Response> {
  try {
    const body = (await req.json()) as unknown
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      return jsonError(400, 'No se pudo leer el formulario')
    }
    return body as Record<string, unknown>
  } catch {
    return jsonError(400, 'No se pudo leer el formulario')
  }
}

export function text(body: Record<string, unknown>, key: string): string {
  const value = body[key]
  return typeof value === 'string' ? value.trim() : ''
}

export async function runJson(
  work: () => Promise<Response>,
): Promise<Response> {
  try {
    return await jsonFromUpstream(await work())
  } catch (error) {
    const message = error instanceof ApiError ? error.message : 'No se pudo hablar con la API'
    const status = error instanceof ApiError && error.status === 401 ? 401 : 502
    return jsonError(status, message)
  }
}
