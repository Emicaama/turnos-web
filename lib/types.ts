export type Role = 'admin' | 'secretaria' | 'profesional'

export type AppointmentStatus =
  | 'programado'
  | 'en_sala_de_espera'
  | 'atendido'
  | 'cancelado'

export type Me = {
  id: string
  email: string
  name: string
  role: Role
  professionalId?: string
}

export type Branch = {
  id: string
  name: string
  address: string
  createdAt: string
  updatedAt: string
}

export type Specialty = {
  id: string
  name: string
  createdAt: string
  updatedAt: string
}

export type Patient = {
  id: string
  firstName: string
  lastName: string
  documentId: string
  email: string | null
  phone: string | null
  createdAt: string
  updatedAt: string
}

export type Professional = {
  id: string
  firstName: string
  lastName: string
  userId: string | null
  specialtyIds: string[]
  branchIds: string[]
  createdAt: string
  updatedAt: string
}

export type Availability = {
  id: string
  professionalId: string
  branchId: string
  weekday: number
  startTime: string
  endTime: string
  slotMinutes: number
  createdAt: string
  updatedAt: string
}

export type Appointment = {
  id: string
  patientId: string
  professionalId: string
  branchId: string
  startAt: string
  endAt: string
  status: AppointmentStatus
  entreturno: boolean
  acortado: boolean
  notes: string | null
  createdAt: string
  updatedAt: string
  promoted?: Appointment
}

export type BinnacleRecord = {
  id: string
  appointmentId: string
  authorName: string
  text: string
  createdAt: string
}

export type AgendaColumn = {
  professional: Professional
  appointments: Appointment[]
}
