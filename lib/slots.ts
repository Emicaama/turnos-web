import { clinicDayFromIso, weekdayIndex } from '@/lib/clinic-time'
import type { Availability } from '@/lib/types'

export type SlotChoice = {
  startAt: string
  endAt: string
  label: string
}

const OFFSET = '-03:00'

function toMinutes(hm: string): number {
  const [hour, minute] = hm.split(':').map(Number)
  return hour * 60 + minute
}

function fromMinutes(total: number): string {
  const hour = Math.floor(total / 60)
  const minute = total % 60
  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`
}

export function buildSlots(
  day: string,
  startTime: string,
  endTime: string,
  slotMinutes: number,
): SlotChoice[] {
  const start = toMinutes(startTime)
  const end = toMinutes(endTime)
  if (!Number.isFinite(start) || !Number.isFinite(end) || slotMinutes < 5) {
    return []
  }
  const slots: SlotChoice[] = []
  for (let cursor = start; cursor + slotMinutes <= end; cursor += slotMinutes) {
    const finish = cursor + slotMinutes
    const startHm = fromMinutes(cursor)
    const endHm = fromMinutes(finish)
    slots.push({
      startAt: `${day}T${startHm}:00.000${OFFSET}`,
      endAt: `${day}T${endHm}:00.000${OFFSET}`,
      label: `${startHm}–${endHm}`,
    })
  }
  return slots
}

export function slotsFor(
  day: string,
  professionalId: string,
  branchId: string,
  availability: Availability[],
): SlotChoice[] {
  const weekday = weekdayIndex(day)
  const windows = availability.filter(
    (row) =>
      row.professionalId === professionalId &&
      row.branchId === branchId &&
      row.weekday === weekday,
  )
  const byStart = new Map<string, SlotChoice>()
  for (const window of windows) {
    for (const slot of buildSlots(day, window.startTime, window.endTime, window.slotMinutes)) {
      byStart.set(slot.startAt, slot)
    }
  }
  return [...byStart.values()].sort((a, b) => a.startAt.localeCompare(b.startAt))
}

export type Occupant = {
  id: string
  professionalId: string
  branchId: string
  startAt: string
  endAt: string
  status: string
}

export function isSlotTaken(
  slot: { startAt: string; endAt: string },
  professionalId: string,
  branchId: string,
  occupants: Occupant[],
  ignoreId?: string,
): boolean {
  const start = new Date(slot.startAt).getTime()
  const end = new Date(slot.endAt).getTime()
  return occupants.some((item) => {
    if (ignoreId && item.id === ignoreId) return false
    if (item.professionalId !== professionalId || item.branchId !== branchId) return false
    if (item.status !== 'programado' && item.status !== 'en_sala_de_espera') return false
    return start < new Date(item.endAt).getTime() && end > new Date(item.startAt).getTime()
  })
}

export function slotKey(slot: { startAt: string; endAt: string }): string {
  return `${slot.startAt}|${slot.endAt}`
}

/** Inicios :15 o :45 estrictamente adentro del turno. El fin es el del turno que se acorta. */
export function entreturnoInstants(
  startIso: string,
  endIso: string,
): { startAt: string; label: string }[] {
  const startMs = new Date(startIso).getTime()
  const endMs = new Date(endIso).getTime()
  if (!(startMs < endMs)) return []
  const days = [clinicDayFromIso(startIso)]
  const endDay = clinicDayFromIso(endIso)
  if (endDay !== days[0]) days.push(endDay)
  const found: { startAt: string; label: string }[] = []
  for (const day of days) {
    for (let hour = 0; hour < 24; hour++) {
      for (const minute of [15, 45]) {
        const hh = String(hour).padStart(2, '0')
        const mm = String(minute).padStart(2, '0')
        const startAt = `${day}T${hh}:${mm}:00.000${OFFSET}`
        const ms = new Date(startAt).getTime()
        if (ms > startMs && ms < endMs) {
          found.push({ startAt, label: `${hh}:${mm}` })
        }
      }
    }
  }
  return found
}
