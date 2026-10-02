import { redirect } from 'next/navigation'
import { LoginForm } from '@/app/login/login-form'
import { getToken } from '@/lib/session'
import type { Me } from '@/lib/types'
import { ApiError, apiJson } from '@/lib/upstream'

export const dynamic = 'force-dynamic'

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const params = await searchParams
  const token = await getToken()
  if (token) {
    try {
      await apiJson<Me>('/users/me')
      redirect('/')
    } catch (error) {
      if (!(error instanceof ApiError) || error.status !== 401) throw error
    }
  }

  return (
    <main className="login">
      <LoginForm error={params.error} />
    </main>
  )
}
