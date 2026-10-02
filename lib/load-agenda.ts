import { dayBounds } from '@/lib/clinic-time'
import type {
  AgendaColumn,
  Appointment,
  Availability,
  Branch,
  Me,
  Patient,
  Professional,
  Specialty,
} from '@/lib/types'
import { apiJson } from '@/lib/upstream'

export type AgendaData = {
  branches: Branch[]
  patients: Patient[]
  specialties: Specialty[]
  availability: Availability[]
  columns: AgendaColumn[]
  cancelled: Appointment[]
  unlinked: boolean
}

export async function loadAgenda(me: Me, startDay: string, endDay = startDay): Promise<AgendaData> {
  const range = new URLSearchParams({
    from: dayBounds(startDay).from,
    to: dayBounds(endDay).to,
  })
  const [branches, patients, specialties, professionals, availability] = await Promise.all([
    apiJson<Branch[]>('/branches'),
    apiJson<Patient[]>('/patients'),
    apiJson<Specialty[]>('/specialties'),
    apiJson<Professional[]>('/professionals'),
    apiJson<Availability[]>('/availability'),
  ])

  if (me.role === 'profesional' && !me.professionalId) {
    return {
      branches,
      patients,
      specialties,
      availability,
      columns: [],
      cancelled: [],
      unlinked: true,
    }
  }

  const roster = (
    me.role === 'profesional'
      ? professionals.filter((item) => item.id === me.professionalId)
      : professionals
  ).sort(
    (a, b) =>
      a.lastName.localeCompare(b.lastName, 'es') ||
      a.firstName.localeCompare(b.firstName, 'es'),
  )

  const columns = await Promise.all(
    roster.map(async (professional) => {
      const appointments = await apiJson<Appointment[]>(
        `/professionals/${professional.id}/agenda?${range.toString()}`,
      )
      return { professional, appointments }
    }),
  )

  return {
    branches,
    patients,
    specialties,
    availability,
    columns,
    cancelled: [],
    unlinked: false,
  }
}
