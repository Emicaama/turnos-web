import { QueryFields } from '@/app/query-fields'
import { ReprogramarForm } from '@/app/reprogramar-form'
import { SubmitButton } from '@/app/submit-button'
import { agendaPath, type WeekQuery } from '@/lib/agenda-path'
import { formatClock, formatRange, formatStamp } from '@/lib/clinic-time'
import {
  canCancel,
  canEditNotes,
  canEntreturno,
  canReschedule,
  statusActions,
  statusLabel,
} from '@/lib/desk-rules'
import { entreturnoInstants, type Occupant } from '@/lib/slots'
import type {
  Appointment,
  Availability,
  BinnacleRecord,
  Branch,
  Patient,
  Professional,
  Role,
} from '@/lib/types'

function fullName(person?: { firstName: string; lastName: string }): string {
  if (!person) return 'Sin ficha'
  return `${person.firstName} ${person.lastName}`
}

export function Ficha({
  appointment,
  day,
  role,
  patient,
  professional,
  branch,
  patients,
  availability,
  occupants,
  binnacle,
  confirmCancel,
  place,
}: {
  appointment: Appointment
  day: string
  place: WeekQuery & { week: string }
  role: Role
  patient?: Patient
  professional?: Professional
  branch?: Branch
  patients: Patient[]
  availability: Availability[]
  occupants: Occupant[]
  binnacle: BinnacleRecord[]
  confirmCancel: boolean
}) {
  const back = agendaPath(place)
  const here = agendaPath({ ...place, turno: appointment.id })
  const actions = statusActions(role, appointment.status)
  const instants = canEntreturno(role, appointment.status)
    ? entreturnoInstants(appointment.startAt, appointment.endAt)
    : []

  return (
    <article className="stack">
      <a className="back" href={back}>
        Cerrar
      </a>
      <p className="ficha-time num">{formatRange(appointment.startAt, appointment.endAt)}</p>
      <h2>{fullName(patient)}</h2>
      <p className={`status ${appointment.status}`}>
        <i className={`dot ${appointment.status}`} aria-hidden="true" />
        {statusLabel(appointment.status)}
        {appointment.entreturno ? ' · Entreturno' : ''}
        {appointment.acortado ? ' · Acortado' : ''}
      </p>
      <dl className="facts">
        <div>
          <dt>Documento</dt>
          <dd className="num">{patient?.documentId ?? '—'}</dd>
        </div>
        <div>
          <dt>Profesional</dt>
          <dd>{fullName(professional)}</dd>
        </div>
        <div>
          <dt>Sede</dt>
          <dd>
            {branch?.name ?? 'Sede'}
            {branch?.address ? <span className="quiet"> · {branch.address}</span> : null}
          </dd>
        </div>
        {patient?.phone ? (
          <div>
            <dt>Teléfono</dt>
            <dd className="num">{patient.phone}</dd>
          </div>
        ) : null}
        {patient?.email ? (
          <div>
            <dt>Correo</dt>
            <dd>{patient.email}</dd>
          </div>
        ) : null}
      </dl>

      {appointment.notes ? <p className="note">{appointment.notes}</p> : null}

      {actions.length > 0 || canCancel(role, appointment.status) ? (
        <div className="actions">
          {actions.map((action) => (
            <form key={action.status} action={`/api/appointments/${appointment.id}`} method="post">
              <input type="hidden" name="action" value="status" />
              <input type="hidden" name="status" value={action.status} />
              <input type="hidden" name="day" value={day} />
              <QueryFields {...place} />
              <SubmitButton className="primary" pendingLabel="Guardando…">
                {action.label}
              </SubmitButton>
            </form>
          ))}
          {canCancel(role, appointment.status) && !confirmCancel ? (
            <a className="danger" href={`${here}&cancelar=1`}>
              Cancelar turno
            </a>
          ) : null}
        </div>
      ) : (
        <p className="quiet">
          {appointment.status === 'cancelado' ? 'Quedó cancelado.' : 'Este turno no avanza.'}
        </p>
      )}

      {confirmCancel && canCancel(role, appointment.status) ? (
        <form className="stack inset" action={`/api/appointments/${appointment.id}/cancel`} method="post">
          <input type="hidden" name="day" value={day} />
          <QueryFields {...place} />
          <p>Si hay alguien en la lista de este día, pasa a este horario.</p>
          <div className="actions">
            <SubmitButton className="danger" pendingLabel="Cancelando…">
              Confirmar cancelación
            </SubmitButton>
            <a className="ghost" href={here}>
              Volver
            </a>
          </div>
        </form>
      ) : null}

      {instants.length > 0 ? (
        <form className="stack inset" action="/api/appointments" method="post">
          <input type="hidden" name="day" value={day} />
          <QueryFields {...place} />
          <input type="hidden" name="entreturno" value="true" />
          <input type="hidden" name="fromTurno" value={appointment.id} />
          <input type="hidden" name="professionalId" value={appointment.professionalId} />
          <input type="hidden" name="branchId" value={appointment.branchId} />
          <input type="hidden" name="endAt" value={appointment.endAt} />
          <h3>Entreturno</h3>
          <p className="quiet">
            Acorta este turno. El paciente nuevo entra a las {instants.map((item) => item.label).join(' o ')} y
            sale a las {formatClock(appointment.endAt)}.
          </p>
          {instants.length === 1 ? (
            <input type="hidden" name="startAt" value={instants[0].startAt} />
          ) : (
            <div className="field">
              <label htmlFor="entre-start">Empieza</label>
              <select id="entre-start" name="startAt" required defaultValue={instants[0].startAt}>
                {instants.map((item) => (
                  <option key={item.startAt} value={item.startAt}>
                    {item.label}
                  </option>
                ))}
              </select>
            </div>
          )}
          <div className="field">
            <label htmlFor="entre-patient">Paciente</label>
            <select id="entre-patient" name="patientId" required defaultValue={patients.find((item) => item.id !== appointment.patientId)?.id ?? patients[0]?.id}>
              {patients.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.lastName}, {item.firstName} · {item.documentId}
                </option>
              ))}
            </select>
          </div>
          <SubmitButton className="ghost" pendingLabel="Guardando…">
            {instants.length === 1 ? `Meter entreturno a las ${instants[0].label}` : 'Meter entreturno'}
          </SubmitButton>
        </form>
      ) : null}

      {canReschedule(role, appointment.status) ? (
        <ReprogramarForm
          appointment={appointment}
          availability={availability}
          occupants={occupants}
          day={day}
          place={place}
        />
      ) : null}

      {canEditNotes(role) ? (
        <form className="stack inset" action={`/api/appointments/${appointment.id}`} method="post">
          <input type="hidden" name="action" value="notes" />
          <input type="hidden" name="day" value={day} />
          <QueryFields {...place} />
          <label htmlFor="ficha-notes">Nota</label>
          <textarea id="ficha-notes" name="notes" rows={2} defaultValue={appointment.notes ?? ''} />
          <SubmitButton className="ghost" pendingLabel="Guardando…">
            Guardar nota
          </SubmitButton>
        </form>
      ) : null}

      {role !== 'profesional' ? (
        <section>
          <h3>Bitácora</h3>
          {binnacle.length === 0 ? (
            <p className="quiet">Sin notas en la bitácora.</p>
          ) : (
            <ol className="bitacora">
              {binnacle.map((record) => (
                <li key={record.id}>
                  <time className="num" dateTime={record.createdAt}>
                    {formatStamp(record.createdAt)}
                  </time>
                  <span>
                    <strong>{record.authorName}</strong> {record.text}
                  </span>
                </li>
              ))}
            </ol>
          )}
        </section>
      ) : null}
    </article>
  )
}
