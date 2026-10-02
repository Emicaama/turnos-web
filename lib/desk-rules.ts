import type { AppointmentStatus, Role } from '@/lib/types'

const ALLOWED: Record<AppointmentStatus, AppointmentStatus[]> = {
  programado: ['en_sala_de_espera', 'cancelado'],
  en_sala_de_espera: ['atendido', 'cancelado'],
  atendido: [],
  cancelado: [],
}

export function canCreate(role: Role): boolean {
  return role === 'secretaria' || role === 'admin'
}

export function canCatalog(role: Role): boolean {
  return role === 'admin'
}

export function canReschedule(role: Role, status: AppointmentStatus): boolean {
  return canCreate(role) && status === 'programado'
}

export function canEditNotes(role: Role): boolean {
  return canCreate(role)
}

export function canReadBinnacle(role: Role): boolean {
  return canCreate(role)
}

export function statusActions(
  role: Role,
  status: AppointmentStatus,
): { status: AppointmentStatus; label: string }[] {
  const next = ALLOWED[status]
  if (role === 'profesional') {
    return next.includes('atendido')
      ? [{ status: 'atendido', label: 'Marcar atendido' }]
      : []
  }
  if (!canCreate(role)) return []
  return next
    .filter((item) => item !== 'cancelado')
    .map((item) => ({
      status: item,
      label: item === 'en_sala_de_espera' ? 'Pasar a sala' : 'Marcar atendido',
    }))
}

export function canCancel(role: Role, status: AppointmentStatus): boolean {
  return canCreate(role) && ALLOWED[status].includes('cancelado')
}

export function canEntreturno(role: Role, status: AppointmentStatus): boolean {
  return canCreate(role) && (status === 'programado' || status === 'en_sala_de_espera')
}

export function statusLabel(status: AppointmentStatus): string {
  switch (status) {
    case 'programado':
      return 'Programado'
    case 'en_sala_de_espera':
      return 'En sala'
    case 'atendido':
      return 'Atendido'
    case 'cancelado':
      return 'Cancelado'
  }
}

export function roleLabel(role: Role): string {
  switch (role) {
    case 'secretaria':
      return 'Secretaría'
    case 'admin':
      return 'Administración'
    case 'profesional':
      return 'Profesional'
  }
}
