'use client'

import { useState, type MouseEvent } from 'react'
import { useRouter } from 'next/navigation'
import { ActionBar } from '@/app/action-bar'
import { AltaForm } from '@/app/alta-form'
import { CrearProfesional } from '@/app/crear-profesional'
import { CrearSede } from '@/app/crear-sede'
import { Popup } from '@/app/popup'
import { WeekFilters } from '@/app/week-filters'
import { dayNumber, dowLabel } from '@/lib/clinic-time'
import type { Occupant } from '@/lib/slots'
import type { Availability, Branch, Patient, Professional, Specialty } from '@/lib/types'

export type GridBlock = {
  id: string
  href: string
  className: string
  top: number
  height: number
  start: string
  patient: string
  professional: string
}

export type GridPro = {
  id: string | null
  label: string
  title: string
  blocks: GridBlock[]
}

export type GridDay = {
  day: string
  weekend: boolean
  today: boolean
  pros: GridPro[]
}

export type AltaSeed = {
  day: string
  professionalId?: string
  hour?: number
}

type PopupName = 'turno' | 'sucursal' | 'profesional'

export function WeekBoard({
  weekTitle,
  prevHref,
  todayHref,
  nextHref,
  week,
  branches,
  filterProfessionals,
  sucursal,
  profesional,
  estado,
  showProfessional,
  create,
  catalog,
  blankDay,
  patients,
  professionals,
  specialties,
  availability,
  occupants,
  days,
  hours,
  row,
}: {
  weekTitle: string
  prevHref: string
  todayHref: string
  nextHref: string
  week: string
  branches: Branch[]
  filterProfessionals: Professional[]
  sucursal?: string
  profesional?: string
  estado?: string
  showProfessional: boolean
  create: boolean
  catalog: boolean
  blankDay: string
  patients: Patient[]
  professionals: Professional[]
  specialties: Specialty[]
  availability: Availability[]
  occupants: Occupant[]
  days: GridDay[]
  hours: number[]
  row: number
}) {
  const router = useRouter()
  const [popup, setPopup] = useState<PopupName | null>(null)
  const [seed, setSeed] = useState<AltaSeed | null>(null)
  const [altaKey, setAltaKey] = useState(0)

  function openBlank() {
    setSeed(null)
    setAltaKey((value) => value + 1)
    setPopup('turno')
  }

  function openGap(next: AltaSeed) {
    if (!create) return
    setSeed(next)
    setAltaKey((value) => value + 1)
    setPopup('turno')
  }

  function close() {
    setPopup(null)
  }

  function finishCatalog() {
    setPopup(null)
    router.refresh()
  }

  return (
    <>
      <div className="toolbar">
        <div className="week-lead">
          <div className="week-id">
            <p className="week-title">{weekTitle}</p>
            <nav className="week-seg" aria-label="Semana">
              <a href={prevHref}>Anterior</a>
              <a href={todayHref}>Hoy</a>
              <a href={nextHref}>Siguiente</a>
            </nav>
          </div>
          <WeekFilters
            week={week}
            branches={branches}
            professionals={filterProfessionals}
            sucursal={sucursal}
            profesional={profesional}
            estado={estado}
            showProfessional={showProfessional}
          />
        </div>
        <div className="toolbar-end">
          <ActionBar create={create} catalog={catalog} onTurno={openBlank} onSucursal={() => setPopup('sucursal')} onProfesional={() => setPopup('profesional')} />
          <div className="legend" aria-label="Estados">
            <span>
              <i className="swatch programado" /> Programado
            </span>
            <span>
              <i className="swatch sala" /> En sala de espera
            </span>
            <span>
              <i className="swatch atendido" /> Atendido
            </span>
            <span>
              <i className="swatch entre" /> Entreturno
            </span>
          </div>
        </div>
      </div>

      <div className="cal-wrap">
        <div className="cal" style={{ ['--row' as string]: `${row}px` }}>
          <div className="cal-corner" />
          <div className="day-heads">
            {days.map((day) => {
              const named = day.pros.filter((item) => item.label)
              const headClass = ['day-head', day.today ? 'is-today' : '', day.weekend ? 'is-weekend' : '']
                .filter(Boolean)
                .join(' ')
              return (
                <div key={day.day} className={headClass}>
                  <div className="day-label">
                    <span className="dow">{dowLabel(day.day)}</span>
                    <span className="day-num num">{dayNumber(day.day)}</span>
                  </div>
                  {named.length > 0 ? (
                    <div
                      className="pro-heads"
                      style={{ gridTemplateColumns: `repeat(${named.length}, minmax(0, 1fr))` }}
                    >
                      {named.map((item) => (
                        <span key={item.id} title={item.title}>
                          {item.label}
                        </span>
                      ))}
                    </div>
                  ) : null}
                </div>
              )
            })}
          </div>
          <div className="hours" style={{ height: gridSpan(hours, row) }}>
            {hours.map((hour) => (
              <div
                key={hour}
                className={hour === hours[hours.length - 1] ? 'hour-label num is-last' : 'hour-label num'}
                style={{ top: ((hour - hours[0]) / 60) * row }}
              >
                {pad(hour)}
              </div>
            ))}
          </div>
          <div className="day-body">
            {days.map((day) => {
              const named = day.pros.filter((item) => item.label)
              const columns = named.length > 0 ? named : day.pros.slice(0, 1)
              const colClass = ['day-col', day.today ? 'is-today' : '', day.weekend ? 'is-weekend' : '']
                .filter(Boolean)
                .join(' ')
              return (
                <div
                  key={day.day}
                  className={colClass}
                  style={{ gridTemplateColumns: `repeat(${Math.max(columns.length, 1)}, minmax(0, 1fr))` }}
                >
                  {columns.map((pro) => (
                    <GapColumn
                      key={pro.id ?? 'vacio'}
                      pro={pro}
                      book={create && !day.weekend}
                      hours={hours}
                      row={row}
                      day={day.day}
                      onGap={openGap}
                    />
                  ))}
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {popup === 'turno' && create ? (
        <Popup title="Nuevo turno" onClose={close} wide>
          <AltaForm
            key={altaKey}
            day={seed?.day ?? blankDay}
            professionalId={seed?.professionalId}
            hour={seed?.hour}
            preferBranch={sucursal}
            patients={patients}
            professionals={professionals}
            branches={branches}
            specialties={specialties}
            availability={availability}
            occupants={occupants}
          />
        </Popup>
      ) : null}
      {popup === 'sucursal' && catalog ? (
        <Popup title="Nueva sucursal" onClose={close}>
          <CrearSede onDone={finishCatalog} />
        </Popup>
      ) : null}
      {popup === 'profesional' && catalog ? (
        <Popup title="Nuevo profesional" onClose={close}>
          <CrearProfesional branches={branches} specialties={specialties} onDone={finishCatalog} />
        </Popup>
      ) : null}
    </>
  )
}

function pad(minutes: number): string {
  const hour = Math.floor(minutes / 60)
  const minute = minutes % 60
  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`
}

function gridSpan(hours: number[], row: number): number {
  if (hours.length < 2) return row
  return ((hours[hours.length - 1] - hours[0]) / 60) * row
}

function GapColumn({
  pro,
  book,
  hours,
  row,
  day,
  onGap,
}: {
  pro: GridPro
  book: boolean
  hours: number[]
  row: number
  day: string
  onGap: (seed: AltaSeed) => void
}) {
  const [hover, setHover] = useState<number | null>(null)
  const open = hours[0] ?? 0
  const close = hours[hours.length - 1] ?? open
  const slot = row / 2

  function indexAt(event: MouseEvent<HTMLDivElement>) {
    const rect = event.currentTarget.getBoundingClientRect()
    return Math.floor((event.clientY - rect.top) / slot)
  }

  function minuteAt(index: number) {
    const minute = open + index * 30
    if (minute < open || minute >= close) return null
    return minute
  }

  function free(minute: number) {
    const top = ((minute - open) / 60) * row
    return !pro.blocks.some((block) => block.top < top + slot - 2 && block.top + block.height > top + 2)
  }

  return (
    <div
      className={book ? 'pro-col can-book' : 'pro-col'}
      style={{ height: gridSpan(hours, row) }}
      onMouseMove={
        book
          ? (event) => {
              if ((event.target as HTMLElement).closest('a.block')) {
                setHover((current) => (current == null ? current : null))
                return
              }
              const minute = minuteAt(indexAt(event))
              const next = minute != null && free(minute) ? minute : null
              setHover((current) => (current === next ? current : next))
            }
          : undefined
      }
      onMouseLeave={book ? () => setHover(null) : undefined}
      onClick={
        book
          ? (event) => {
              if ((event.target as HTMLElement).closest('a.block')) return
              const minute = minuteAt(indexAt(event))
              if (minute == null) return
              onGap({ day, professionalId: pro.id ?? undefined, hour: minute })
            }
          : undefined
      }
    >
      {hover != null ? (
        <div className="slot-hover" style={{ top: ((hover - open) / 60) * row, height: slot - 2 }}>
          {pad(hover)}
        </div>
      ) : null}
      {pro.blocks.map((block) => (
        <a
          key={block.id}
          className={block.className}
          style={{ top: block.top, height: block.height }}
          href={block.href}
          onClick={(event) => event.stopPropagation()}
        >
          <strong>
            <time>{block.start}</time>
            {block.patient}
          </strong>
          <span>{block.professional}</span>
        </a>
      ))}
    </div>
  )
}
