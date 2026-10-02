import { cookies } from 'next/headers'

export const SESSION_COOKIE = 'turnos_token'

const options = {
  httpOnly: true,
  sameSite: 'lax' as const,
  secure: false,
  path: '/',
}

export async function getToken(): Promise<string | undefined> {
  const jar = await cookies()
  return jar.get(SESSION_COOKIE)?.value
}

export async function setToken(token: string): Promise<void> {
  const jar = await cookies()
  jar.set(SESSION_COOKIE, token, { ...options, maxAge: 60 * 60 * 8 })
}

export async function clearToken(): Promise<void> {
  const jar = await cookies()
  jar.set(SESSION_COOKIE, '', { ...options, maxAge: 0 })
}
