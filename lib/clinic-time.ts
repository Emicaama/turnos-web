/** America/Argentina/Buenos_Aires no usa horario de verano: UTC−3 fijo. */
export const CLINIC_TZ = 'America/Argentina/Buenos_Aires'
const OFFSET = '-03:00'

export function clinicToday(now = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: CLINIC_TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now)
}

export function clinicDayFromIso(iso: string): string {
  return clinicToday(new Date(iso))
}

export function shiftDay(day: string, delta: number): string {
  const [year, month, date] = day.split('-').map(Number)
  const utc = new Date(Date.UTC(year, month - 1, date))
  utc.setUTCDate(utc.getUTCDate() + delta)
  const y = utc.getUTCFullYear()
  const m = String(utc.getUTCMonth() + 1).padStart(2, '0')
  const d = String(utc.getUTCDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function dayBounds(day: string): { from: string; to: string } {
  return {
    from: `${day}T00:00:00.000${OFFSET}`,
    to: `${day}T23:59:59.999${OFFSET}`,
  }
}

export function weekdayIndex(day: string): number {
  const noon = new Date(`${day}T12:00:00.000${OFFSET}`)
  const name = new Intl.DateTimeFormat('en-US', {
    timeZone: CLINIC_TZ,
    weekday: 'short',
  }).format(noon)
  const map: Record<string, number> = {
    Sun: 0,
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6,
  }
  return map[name] ?? 0
}

export function weekdayName(day: string): string {
  const noon = new Date(`${day}T12:00:00.000${OFFSET}`)
  return new Intl.DateTimeFormat('es-AR', {
    timeZone: CLINIC_TZ,
    weekday: 'long',
  }).format(noon)
}

export function formatDayTitle(day: string): string {
  const noon = new Date(`${day}T12:00:00.000${OFFSET}`)
  const parts = new Intl.DateTimeFormat('es-AR', {
    timeZone: CLINIC_TZ,
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).formatToParts(noon)
  const weekday = parts.find((part) => part.type === 'weekday')?.value ?? ''
  const date = parts.find((part) => part.type === 'day')?.value ?? ''
  const month = parts.find((part) => part.type === 'month')?.value ?? ''
  const title = `${weekday} ${date} de ${month}`
  return title.charAt(0).toUpperCase() + title.slice(1)
}

const clockFormat = new Intl.DateTimeFormat('es-AR', {
  timeZone: CLINIC_TZ,
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
})

export function formatClock(iso: string): string {
  return clockFormat.format(new Date(iso))
}

export function formatRange(startIso: string, endIso: string): string {
  return `${formatClock(startIso)}–${formatClock(endIso)}`
}

export function formatStamp(iso: string): string {
  const date = new Intl.DateTimeFormat('es-AR', {
    timeZone: CLINIC_TZ,
    day: '2-digit',
    month: '2-digit',
  }).format(new Date(iso))
  return `${date} ${formatClock(iso)}`
}

export function isDay(value: string | undefined): value is string {
  return Boolean(value && /^\d{4}-\d{2}-\d{2}$/.test(value))
}

const DOW = ['DOM', 'LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB'] as const

export function sundayOf(day: string): string {
  return shiftDay(day, -weekdayIndex(day))
}

export function weekDays(sunday: string): string[] {
  return Array.from({ length: 7 }, (_, index) => shiftDay(sunday, index))
}

export function dowLabel(day: string): string {
  return DOW[weekdayIndex(day)] ?? ''
}

export function dayNumber(day: string): string {
  return String(Number(day.slice(8, 10)))
}

function monthName(day: string): { date: string; month: string; year: string } {
  const noon = new Date(`${day}T12:00:00.000${OFFSET}`)
  const parts = new Intl.DateTimeFormat('es-AR', {
    timeZone: CLINIC_TZ,
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).formatToParts(noon)
  return {
    date: parts.find((part) => part.type === 'day')?.value ?? '',
    month: parts.find((part) => part.type === 'month')?.value ?? '',
    year: parts.find((part) => part.type === 'year')?.value ?? '',
  }
}

export function formatWeekRange(sunday: string): string {
  const start = monthName(sunday)
  const end = monthName(shiftDay(sunday, 6))
  if (start.month === end.month && start.year === end.year) {
    return `${start.date} – ${end.date} de ${end.month} ${end.year}`
  }
  if (start.year === end.year) {
    return `${start.date} de ${start.month} – ${end.date} de ${end.month} ${end.year}`
  }
  return `${start.date} de ${start.month} ${start.year} – ${end.date} de ${end.month} ${end.year}`
}

export function clinicMinutes(iso: string): number {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: CLINIC_TZ,
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(new Date(iso))
  const hour = Number(parts.find((part) => part.type === 'hour')?.value ?? '0')
  const minute = Number(parts.find((part) => part.type === 'minute')?.value ?? '0')
  return (hour === 24 ? 0 : hour) * 60 + minute
}
