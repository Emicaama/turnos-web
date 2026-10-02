import { Ficha } from '@/app/ficha'
import { SubmitButton } from '@/app/submit-button'
import { WeekBoard, type GridDay } from '@/app/week-board'
import { agendaPath, type WeekQuery } from '@/lib/agenda-path'
import {
  clinicDayFromIso,
  clinicMinutes,
  clinicToday,
  formatWeekRange,
  shiftDay,
  weekdayIndex,
} from '@/lib/clinic-time'
import { canCatalog, canCreate, roleLabel } from '@/lib/desk-rules'
import type { AgendaData } from '@/lib/load-agenda'
import type { Occupant } from '@/lib/slots'
import type { Appointment, BinnacleRecord, Me, Professional } from '@/lib/types'

const ROW = 64

function fold(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('es')
    .trim()
}

function columnName(professional: Professional): string {
  const initial = professional.firstName.trim().charAt(0)
  return initial ? `${professional.lastName} ${initial}.` : professional.lastName
}

function patientLine(patient?: { firstName: string; lastName: string }): string {
  if (!patient) return 'Sin ficha'
  return `${patient.lastName}, ${patient.firstName}`
}

function proLine(professional?: Professional): string {
  if (!professional) return ''
  return `${professional.lastName}, ${professional.firstName}`
}

function clockLabel(minutes: number): string {
  return `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`
}

function durationMinutes(appointment: Appointment): number {
  return (new Date(appointment.endAt).getTime() - new Date(appointment.startAt).getTime()) / 60000
}

function visualMinutes(appointment: Appointment, siblings: Appointment[]): number {
  const own = durationMinutes(appointment)
  if (!appointment.acortado) return own
  const endMs = new Date(appointment.endAt).getTime()
  const entre = siblings.find(
    (other) => other.entreturno && new Date(other.startAt).getTime() === endMs,
  )
  if (!entre) return own
  return own + durationMinutes(entre)
}

const DAY_OPEN = 6 * 60
const DAY_CLOSE = 20 * 60

export function Desk({
  me,
  week,
  days,
  data,
  sucursal,
  profesional,
  estado,
  opened,
  openError,
  binnacle,
  confirmCancel,
  error,
  aviso,
  altaDay,
}: {
  me: Me
  week: string
  days: string[]
  data: AgendaData
  sucursal?: string
  profesional?: string
  estado?: string
  opened: Appointment | null
  openError?: string
  binnacle: BinnacleRecord[]
  confirmCancel: boolean
  error?: string
  aviso?: string
  altaDay: string
}) {
  const today = clinicToday()
  const placeQuery: WeekQuery & { week: string } = { week, sucursal, profesional, estado }
  const patientsById = new Map(data.patients.map((item) => [item.id, item]))
  const branchesById = new Map(data.branches.map((item) => [item.id, item]))
  const professionalsById = new Map(data.columns.map((column) => [column.professional.id, column.professional]))
  const roster = data.columns
    .map((column) => column.professional)
    .filter((item) => {
      if (profesional && item.id !== profesional) return false
      if (sucursal && item.branchIds.length > 0 && !item.branchIds.includes(sucursal)) return false
      return true
    })
  const rosterIds = new Set(roster.map((item) => item.id))
  const appointments = data.columns
    .flatMap((column) => column.appointments)
    .filter((item) => rosterIds.has(item.professionalId))
    .filter((item) => (sucursal ? item.branchId === sucursal : true))
    .filter((item) => (estado ? item.status === estado : true))
  const bySlot = new Map<string, Appointment[]>()
  for (const item of appointments) {
    const key = `${clinicDayFromIso(item.startAt)}:${item.professionalId}`
    const list = bySlot.get(key) ?? []
    list.push(item)
    bySlot.set(key, list)
  }
  const grid = { start: DAY_OPEN, end: DAY_CLOSE }
  const hours: number[] = []
  for (let cursor = DAY_OPEN; cursor <= DAY_CLOSE; cursor += 60) hours.push(cursor)
  const occupants: Occupant[] = data.columns.flatMap((column) => column.appointments)
  const create = canCreate(me.role)
  const catalog = canCatalog(me.role)
  const drawer = Boolean(opened) || Boolean(openError)
  const role = roleLabel(me.role)
  const sameIdentity = fold(me.name) === fold(role)
  const gridDays: GridDay[] = days.map((day) => {
    const present = roster.filter((item) => (bySlot.get(`${day}:${item.id}`) ?? []).length > 0)
    const columns = present.length > 0 ? present : [null]
    return {
      day,
      weekend: weekdayIndex(day) === 0 || weekdayIndex(day) === 6,
      today: day === today,
      pros: columns.map((professional) => ({
        id: professional?.id ?? null,
        label: professional ? columnName(professional) : '',
        title: professional ? `${professional.lastName}, ${professional.firstName}` : '',
        blocks: professional
          ? (bySlot.get(`${day}:${professional.id}`) ?? []).map((appointment) => {
              const siblings = bySlot.get(`${day}:${professional.id}`) ?? []
              const start = clinicMinutes(appointment.startAt)
              const minutes = visualMinutes(appointment, siblings)
              const open = opened?.id === appointment.id
              return {
                id: appointment.id,
                href: agendaPath({ ...placeQuery, turno: appointment.id }),
                className: [
                  'block',
                  appointment.status,
                  appointment.entreturno ? 'is-entre' : '',
                  open ? 'is-open' : '',
                ]
                  .filter(Boolean)
                  .join(' '),
                top: ((start - grid.start) / 60) * ROW,
                height: Math.max((minutes / 60) * ROW - 2, 13),
                start: clockLabel(start),
                patient: patientLine(patientsById.get(appointment.patientId)),
                professional: proLine(professionalsById.get(appointment.professionalId)),
              }
            })
          : [],
      })),
    }
  })

  return (
    <div className={drawer ? 'week-app has-drawer' : 'week-app'}>
      <div className="week-main">
        <header className="topbar">
          <p className="brand-line">Agenda de turnos · Recepción · San Francisco</p>
          <div className="session">
            <span className="whoami">
              <strong>{me.name}</strong>
              {sameIdentity ? null : <span className="versalitas">{role}</span>}
            </span>
            <form action="/api/logout" method="post">
              <SubmitButton className="linkish" pendingLabel="Saliendo…">
                Salir
              </SubmitButton>
            </form>
          </div>
        </header>

        {error ? <p className="banner error">{error}</p> : null}
        {aviso ? <p className="banner ok">{aviso}</p> : null}
        {data.unlinked ? (
          <p className="role-note">Tu usuario no está vinculado a un profesional.</p>
        ) : null}

        <WeekBoard
          weekTitle={formatWeekRange(week)}
          prevHref={agendaPath({ ...placeQuery, week: shiftDay(week, -7) })}
          todayHref={agendaPath({ ...placeQuery, week: undefined })}
          nextHref={agendaPath({ ...placeQuery, week: shiftDay(week, 7) })}
          week={week}
          branches={data.branches}
          filterProfessionals={data.columns.map((column) => column.professional)}
          sucursal={sucursal}
          profesional={profesional}
          estado={estado}
          showProfessional={me.role !== 'profesional'}
          create={create}
          catalog={catalog}
          blankDay={altaDay}
          patients={data.patients}
          professionals={roster.length > 0 ? roster : data.columns.map((column) => column.professional)}
          specialties={data.specialties}
          availability={data.availability}
          occupants={occupants}
          days={gridDays}
          hours={hours}
          row={ROW}
        />
      </div>

      {drawer ? (
        <aside className="drawer">
          {openError ? <p className="banner error">{openError}</p> : null}
          {opened ? (
            <Ficha
              appointment={opened}
              day={clinicDayFromIso(opened.startAt)}
              place={placeQuery}
              role={me.role}
              patient={patientsById.get(opened.patientId)}
              professional={professionalsById.get(opened.professionalId)}
              branch={branchesById.get(opened.branchId)}
              patients={data.patients}
              availability={data.availability}
              occupants={occupants}
              binnacle={binnacle}
              confirmCancel={confirmCancel}
            />
          ) : null}
        </aside>
      ) : null}
    </div>
  )
}
