import { redirect } from 'next/navigation'
import { Desk } from '@/app/desk'
import { canReadBinnacle } from '@/lib/desk-rules'
import { clinicToday, isDay, shiftDay, sundayOf, weekDays, weekdayIndex } from '@/lib/clinic-time'
import { loadAgenda } from '@/lib/load-agenda'
import { getToken } from '@/lib/session'
import type { Appointment, AppointmentStatus, BinnacleRecord, Me } from '@/lib/types'
import { ApiError, apiJson } from '@/lib/upstream'

export const dynamic = 'force-dynamic'

const UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

const STATUSES = new Set<AppointmentStatus>(['programado', 'en_sala_de_espera', 'atendido'])

function one(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value
}

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const params = await searchParams
  const token = await getToken()
  if (!token) redirect('/login')

  let me: Me
  try {
    me = await apiJson<Me>('/users/me')
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) {
      redirect('/login?error=' + encodeURIComponent('Sesión vencida'))
    }
    throw error
  }

  const weekParam = one(params.week)
  const anchor = isDay(weekParam) ? weekParam : clinicToday()
  const week = sundayOf(anchor)
  const days = weekDays(week)
  const sucursal = one(params.sucursal)
  const profesional = one(params.profesional)
  const estadoRaw = one(params.estado)
  const estado = estadoRaw && STATUSES.has(estadoRaw as AppointmentStatus) ? (estadoRaw as AppointmentStatus) : undefined
  const turno = one(params.turno)
  const confirmCancel = one(params.cancelar) === '1'
  const today = clinicToday()
  const todayDow = weekdayIndex(today)
  const altaDay = todayDow === 0 || todayDow === 6 ? shiftDay(sundayOf(today), 1) : today

  let data
  try {
    data = await loadAgenda(me, week, shiftDay(week, 6))
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) {
      redirect('/login?error=' + encodeURIComponent('Sesión vencida'))
    }
    throw error
  }

  let opened: Appointment | null = null
  let openError: string | undefined
  let binnacle: BinnacleRecord[] = []
  if (turno && UUID.test(turno)) {
    try {
      opened = await apiJson<Appointment>(`/appointments/${turno}`)
      if (canReadBinnacle(me.role)) {
        binnacle = await apiJson<BinnacleRecord[]>(`/binnacle/${turno}`)
      }
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        redirect('/login?error=' + encodeURIComponent('Sesión vencida'))
      }
      openError = error instanceof Error ? error.message : 'No se pudo abrir el turno'
    }
  } else if (turno) {
    openError = 'Turno no encontrado'
  }

  return (
    <Desk
      me={me}
      week={week}
      days={days}
      data={data}
      sucursal={sucursal}
      profesional={profesional}
      estado={estado}
      opened={opened}
      openError={openError}
      binnacle={binnacle}
      confirmCancel={confirmCancel}
      error={one(params.error)}
      aviso={one(params.aviso)}
      altaDay={altaDay}
    />
  )
}
