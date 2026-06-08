import type { Establishment } from '../types'
import { pickEstablishmentFields } from '../utils/formatters'

type EstablishmentInfoProps = {
  establishment: Establishment
}

export default function EstablishmentInfo({ establishment }: EstablishmentInfoProps) {
  const fields = pickEstablishmentFields(establishment)

  return (
    <section className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm sm:p-7">
      <div className="mb-5 flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-royal-50 text-royal-500">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
            <path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z" />
            <path d="M10 6h4M10 10h4M10 14h4M10 18h4" />
          </svg>
        </span>
        <div>
          <h2 className="text-lg font-extrabold tracking-tight text-navy-500">Datos del establecimiento</h2>
          <p className="text-xs font-medium text-neutral-500">
            Información cargada automáticamente desde la base oficial de establecimientos.
          </p>
        </div>
      </div>

      {fields.length === 0 ? (
        <p className="text-sm font-medium text-neutral-500">
          No se encontraron datos adicionales para este establecimiento.
        </p>
      ) : (
        <dl className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
          {fields.map(([label, value]) => (
            <div key={label} className="min-w-0">
              <dt className="text-[11px] font-bold uppercase tracking-wider text-neutral-500">{label}</dt>
              <dd className="mt-0.5 truncate text-sm font-bold text-navy-700" title={value}>
                {value}
              </dd>
            </div>
          ))}
        </dl>
      )}
    </section>
  )
}
