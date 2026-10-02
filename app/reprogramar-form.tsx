'use client'

import { useState } from 'react'
import { QueryFields } from '@/app/query-fields'
import { SubmitButton } from '@/app/submit-button'
import type { WeekQuery } from '@/lib/agenda-path'
import { clinicDayFromIso, isDay, weekdayName } from '@/lib/clinic-time'
import { isSlotTaken, slotKey, slotsFor, type Occupant } from '@/lib/slots'
import type { Appointment, Availability } from '@/lib/types'

export function ReprogramarForm({
  appointment,
  availability,
  occupants,
  day,
  place,
}: {
  appointment: Appointment
  availability: Availability[]
  occupants: Occupant[]
  day: string
  place: WeekQuery & { week: string }
}) {
  const [when, setWhen] = useState(clinicDayFromIso(appointment.startAt))
  const [slotPick, setSlotPick] = useState('')
  const slots = (isDay(when)
    ? slotsFor(when, appointment.professionalId, appointment.branchId, availability)
    : []
  ).filter(
    (slot) =>
      new Date(slot.startAt).getTime() !== new Date(appointment.startAt).getTime() ||
      new Date(slot.endAt).getTime() !== new Date(appointment.endAt).getTime(),
  )
  const chosen =
    slots.find((slot) => slotKey(slot) === slotPick) ??
    slots.find((slot) => !isSlotTaken(slot, appointment.professionalId, appointment.branchId, occupants, appointment.id)) ??
    slots[0]
  const chosenKey = chosen ? slotKey(chosen) : ''

  return (
    <form className="stack inset" action={`/api/appointments/${appointment.id}`} method="post">
      <input type="hidden" name="action" value="reschedule" />
      <input type="hidden" name="day" value={day} />
      <QueryFields {...place} />
      <h3>Reprogramar</h3>
      <p className="quiet">Cancela este horario y abre otro en la franja. Solo desde programado.</p>
      <div className="field">
        <label htmlFor="repro-day">Día</label>
        <input
          id="repro-day"
          type="date"
          value={when}
          onChange={(event) => {
            setWhen(event.target.value)
            setSlotPick('')
          }}
        />
      </div>
      <div className="field">
        <label htmlFor="repro-slot">Horario</label>
        {slots.length === 0 ? (
          <p className="quiet">No hay otra franja ese {when ? weekdayName(when) : 'día'}.</p>
        ) : (
          <select
            id="repro-slot"
            name="slot"
            required
            value={chosenKey}
            onChange={(event) => setSlotPick(event.target.value)}
          >
            {slots.map((slot) => {
              const taken = isSlotTaken(
                slot,
                appointment.professionalId,
                appointment.branchId,
                occupants,
                appointment.id,
              )
              return (
                <option key={slotKey(slot)} value={slotKey(slot)}>
                  {slot.label}
                  {taken ? ' · ocupado' : ''}
                </option>
              )
            })}
          </select>
        )}
      </div>
      {slots.length > 0 ? (
        <SubmitButton className="ghost" pendingLabel="Reprogramando…">
          Reprogramar
        </SubmitButton>
      ) : null}
    </form>
  )
}
