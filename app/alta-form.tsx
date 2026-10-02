'use client'

import { useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { Popup } from '@/app/popup'
import { clinicMinutes, isDay, weekdayName } from '@/lib/clinic-time'
import { postJson } from '@/lib/post-json'
import { isSlotTaken, slotKey, slotsFor, type Occupant, type SlotChoice } from '@/lib/slots'
import type { Availability, Branch, Patient, Professional, Specialty } from '@/lib/types'

function person(item: { firstName: string; lastName: string }): string {
  return `${item.lastName}, ${item.firstName}`
}

function matchesDocument(patient: Patient, query: string): boolean {
  const needle = query.trim().toLowerCase()
  if (!needle) return true
  return patient.documentId.toLowerCase().includes(needle)
}

function slotInHour(slots: SlotChoice[], hour: number | undefined): SlotChoice | undefined {
  if (hour == null) return undefined
  return slots.find((slot) => {
    const minutes = clinicMinutes(slot.startAt)
    return minutes >= hour && minutes < hour + 30
  })
}

export function AltaForm({
  day: initialDay,
  professionalId: initialProfessionalId,
  hour,
  preferBranch,
  patients,
  professionals,
  branches,
  specialties,
  availability,
  occupants,
}: {
  day: string
  professionalId?: string
  hour?: number
  preferBranch?: string
  patients: Patient[]
  professionals: Professional[]
  branches: Branch[]
  specialties: Specialty[]
  availability: Availability[]
  occupants: Occupant[]
}) {
  const router = useRouter()
  const seeded = professionals.some((item) => item.id === initialProfessionalId)
    ? initialProfessionalId
    : professionals[0]?.id ?? ''
  const [day, setDay] = useState(initialDay)
  const [added, setAdded] = useState<Patient[]>([])
  const [patientOpen, setPatientOpen] = useState(false)
  const [dni, setDni] = useState('')
  const [specialtyId, setSpecialtyId] = useState('')
  const [professionalId, setProfessionalId] = useState(seeded ?? '')
  const [branchPick, setBranchPick] = useState(initialBranch(seeded, preferBranch, professionals, branches))
  const [slotPick, setSlotPick] = useState('')
  const [notes, setNotes] = useState('')
  const [error, setError] = useState<string>()
  const [result, setResult] = useState<string>()
  const [pending, setPending] = useState(false)

  const roster = [...patients, ...added.filter((item) => !patients.some((known) => known.id === item.id))]
  const [patientId, setPatientId] = useState(roster[0]?.id ?? '')
  const shownPatients = roster.filter((item) => matchesDocument(item, dni))
  const chosenPatient = shownPatients.some((item) => item.id === patientId) ? patientId : ''

  const branchId = branches.some((item) => item.id === branchPick) ? branchPick : (branches[0]?.id ?? '')
  const doctors = professionals.filter((item) => {
    if (specialtyId && !item.specialtyIds.includes(specialtyId)) return false
    if (branchId && item.branchIds.length > 0 && !item.branchIds.includes(branchId)) return false
    return true
  })
  const doctorId = doctors.some((item) => item.id === professionalId) ? professionalId : (doctors[0]?.id ?? '')

  const slots = doctorId && branchId ? slotsFor(day, doctorId, branchId, availability) : []
  const chosen =
    slots.find((slot) => slotKey(slot) === slotPick) ??
    slotInHour(slots, hour) ??
    slots.find((slot) => !isSlotTaken(slot, doctorId, branchId, occupants)) ??
    slots[0]
  const chosenKey = chosen ? slotKey(chosen) : ''

  function closePatient() {
    setPatientOpen(false)
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!chosen || !chosenPatient || !doctorId) return
    setPending(true)
    setError(undefined)
    setResult(undefined)
    try {
      const data = await postJson<{ result?: string }>('/api/appointments', {
        patientId: chosenPatient,
        professionalId: doctorId,
        branchId,
        startAt: chosen.startAt,
        endAt: chosen.endAt,
        notes: notes.trim() || undefined,
      })
      setResult(
        data.result === 'lista_de_espera'
          ? 'No había hueco. Quedó en lista de espera.'
          : 'Quedó programado.',
      )
      router.refresh()
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'No se pudo guardar el turno')
    } finally {
      setPending(false)
    }
  }

  return (
    <>
      <form className="stack form-grid" onSubmit={submit}>
        {error ? <p className="banner error">{error}</p> : null}
        {result ? <p className="banner ok">{result}</p> : null}
        {professionals.length === 0 ? (
          <p className="quiet">Falta un profesional en el catálogo.</p>
        ) : (
          <>
            <div className="form-row cols-patient">
              <div className="field">
                <label htmlFor="alta-dni">Buscar por DNI</label>
                <input
                  id="alta-dni"
                  value={dni}
                  onChange={(event) => setDni(event.target.value)}
                  autoComplete="off"
                />
              </div>
              <div className="field">
                <label htmlFor="patientId">Paciente</label>
                {shownPatients.length === 0 ? (
                  <p className="quiet">Ningún paciente con ese documento.</p>
                ) : (
                  <select
                    id="patientId"
                    required
                    value={chosenPatient}
                    onChange={(event) => setPatientId(event.target.value)}
                  >
                    {chosenPatient ? null : <option value="">Elegí un paciente</option>}
                    {shownPatients.map((patient) => (
                      <option key={patient.id} value={patient.id}>
                        {person(patient)} · {patient.documentId}
                      </option>
                    ))}
                  </select>
                )}
              </div>
              <button type="button" className="ghost" onClick={() => setPatientOpen(true)}>
                Nuevo paciente
              </button>
            </div>
            <div className="form-row cols-2">
              <div className="field">
                <label htmlFor="alta-specialty">Especialidad</label>
                <select
                  id="alta-specialty"
                  value={specialtyId}
                  onChange={(event) => {
                    setSpecialtyId(event.target.value)
                    setSlotPick('')
                  }}
                >
                  <option value="">Todas</option>
                  {specialties.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label htmlFor="branchId">Sucursal</label>
                <select
                  id="branchId"
                  required
                  value={branchId}
                  onChange={(event) => {
                    setBranchPick(event.target.value)
                    setSlotPick('')
                  }}
                >
                  {branches.map((branch) => (
                    <option key={branch.id} value={branch.id}>
                      {branch.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="form-row cols-fecha">
              <div className="field">
                <label htmlFor="professionalId">Doctor</label>
                {doctors.length === 0 ? (
                  <p className="quiet">Ningún profesional con esa especialidad en esa sucursal.</p>
                ) : (
                  <select
                    id="professionalId"
                    required
                    value={doctorId}
                    onChange={(event) => {
                      setProfessionalId(event.target.value)
                      setSlotPick('')
                    }}
                  >
                    {doctors.map((item) => (
                      <option key={item.id} value={item.id}>
                        {person(item)}
                      </option>
                    ))}
                  </select>
                )}
              </div>
              <div className="field">
                <label htmlFor="alta-day">Fecha</label>
                <input
                  id="alta-day"
                  type="date"
                  value={day}
                  onChange={(event) => {
                    setDay(event.target.value)
                    setSlotPick('')
                  }}
                />
              </div>
              <div className="field">
                <label htmlFor="slot">Horario</label>
                {slots.length === 0 ? (
                  <p className="quiet">
                    {isDay(day) ? `No atiende en esa sede este ${weekdayName(day)}.` : 'Elegí un día.'}
                  </p>
                ) : (
                  <select id="slot" required value={chosenKey} onChange={(event) => setSlotPick(event.target.value)}>
                    {slots.map((slot) => {
                      const taken = isSlotTaken(slot, doctorId, branchId, occupants)
                      return (
                        <option key={slotKey(slot)} value={slotKey(slot)}>
                          {slot.label}
                          {taken ? ' · ocupado, pasa a lista' : ''}
                        </option>
                      )
                    })}
                  </select>
                )}
              </div>
            </div>
            <div className="field">
              <label htmlFor="notes">Notas</label>
              <textarea id="notes" rows={2} value={notes} onChange={(event) => setNotes(event.target.value)} />
            </div>
            {slots.length > 0 && chosenPatient && doctorId ? (
              <button type="submit" className="primary" disabled={pending}>
                {pending ? 'Guardando…' : 'Confirmar turno'}
              </button>
            ) : null}
          </>
        )}
      </form>
      {patientOpen ? (
        <PatientPopup
          onClose={closePatient}
          onCreated={(patient) => {
            setAdded((current) => [...current, patient])
            setPatientId(patient.id)
            setDni('')
            closePatient()
          }}
        />
      ) : null}
    </>
  )
}

function initialBranch(
  professionalId: string | undefined,
  preferBranch: string | undefined,
  professionals: Professional[],
  branches: Branch[],
): string {
  const professional = professionals.find((item) => item.id === professionalId)
  const serves = (id: string) =>
    !professional || professional.branchIds.length === 0 || professional.branchIds.includes(id)
  if (preferBranch && branches.some((item) => item.id === preferBranch) && serves(preferBranch)) {
    return preferBranch
  }
  if (professional && professional.branchIds.length > 0) {
    const match = branches.find((item) => professional.branchIds.includes(item.id))
    if (match) return match.id
  }
  return branches[0]?.id ?? ''
}

function PatientPopup({
  onClose,
  onCreated,
}: {
  onClose: () => void
  onCreated: (patient: Patient) => void
}) {
  const [error, setError] = useState<string>()
  const [pending, setPending] = useState(false)

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    setPending(true)
    setError(undefined)
    try {
      const patient = await postJson<Patient>('/api/patients', {
        firstName: String(form.get('firstName') ?? ''),
        lastName: String(form.get('lastName') ?? ''),
        documentId: String(form.get('documentId') ?? ''),
        email: String(form.get('email') ?? ''),
        phone: String(form.get('phone') ?? ''),
      })
      onCreated(patient)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'No se pudo cargar el paciente')
      setPending(false)
    }
  }

  return (
    <Popup title="Nuevo paciente" onClose={onClose} stacked wide>
      <form className="stack form-grid" onSubmit={submit}>
        {error ? <p className="banner error">{error}</p> : null}
        <div className="form-row cols-2">
          <div className="field">
            <label htmlFor="pac-first">Nombre</label>
            <input id="pac-first" name="firstName" required minLength={2} autoFocus />
          </div>
          <div className="field">
            <label htmlFor="pac-last">Apellido</label>
            <input id="pac-last" name="lastName" required minLength={2} />
          </div>
        </div>
        <div className="field">
          <label htmlFor="pac-doc">Documento</label>
          <input id="pac-doc" name="documentId" required minLength={4} />
        </div>
        <div className="form-row cols-2">
          <div className="field">
            <label htmlFor="pac-email">Email</label>
            <input id="pac-email" name="email" type="email" />
          </div>
          <div className="field">
            <label htmlFor="pac-phone">Teléfono</label>
            <input id="pac-phone" name="phone" />
          </div>
        </div>
        <button type="submit" className="primary" disabled={pending}>
          {pending ? 'Guardando…' : 'Cargar paciente'}
        </button>
      </form>
    </Popup>
  )
}
