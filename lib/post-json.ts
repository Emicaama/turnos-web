export async function postJson<T>(url: string, body: unknown): Promise<T> {
  let res: Response
  try {
    res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(body),
    })
  } catch {
    throw new Error('No se pudo hablar con la API')
  }

  const data = (await res.json().catch(() => ({}))) as { error?: string }
  if (res.status === 401) {
    window.location.assign('/login?error=' + encodeURIComponent(data.error || 'Sesión vencida'))
    throw new Error(data.error || 'Sesión vencida')
  }
  if (!res.ok) {
    throw new Error(data.error || 'No se pudo completar')
  }
  return data as T
}
