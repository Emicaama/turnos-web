import { redirect } from 'next/navigation'
import { clearToken } from '@/lib/session'

export async function POST() {
  await clearToken()
  redirect('/login')
}
