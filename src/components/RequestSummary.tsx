import { useMemo } from 'react'
import type { Establishment, RecognitionItem } from '../types'
import {
  getEstablishmentComuna,
  getEstablishmentEmail,
  getEstablishmentName,
  getEstablishmentRbd,
  formatNumber,
} from '../utils/formatters'

type RequestSummaryProps = {
  establishment: Establishment
  items: RecognitionItem[]
  onBack: () => void
  onConfirm: () => void
  submitting: boolean
}

function describeType(item: RecognitionItem): string {
  if (item.tipo_reconocimiento === 'Otro' && item.tipo_reconocimiento_otro) {
    return `Otro (${item.tipo_reconocimiento_otro})`
  }
  return item.tipo_reconocimiento || '—'
}

export default function RequestSummary({ establishment, items, onBack, onConfirm, submitting }: RequestSummaryProps) {
  const totalsByType = useMemo(() => {
    const totals = new Map<string, { count: number; quantity: number }>()
    for (const item of items) {
      const key = describeType(item)
      const current = totals.get(key) ?? { count: 0, quantity: 0 }
      current.count += 1
      current.quantity += Number(item.cantidad) || 0
      totals.set(key, current)
    }
    return Array.from(totals.entries())
  }, [items])

  const totalsByAction = useMemo(() => {
    const totals = new Map<string, { count: number; quantity: number }>()
    for (const item of items) {
      const key = item.nombre_accion.trim() || '—'
      const current = totals.get(key) ?? { count: 0, quantity: 0 }
      current.count += 1
      current.quantity += Number(item.cantidad) || 0
      totals.set(key, current)
    }
    return Array.from(totals.entries())
  }, [items])

  const totalQuantity = items.reduce((sum, item) => sum + (Number(item.cantidad) || 0), 0)

  return (
    <section className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm sm:p-7">
      <div className="mb-5">
        <h2 className="text-lg font-extrabold tracking-tight text-navy-500">Resumen de la solicitud</h2>
        <p className="text-xs font-medium text-neutral-500">
          Revisa la información antes de confirmar el envío. Una vez enviada, la solicitud quedará registrada
          con estado "Recibido".
        </p>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 rounded-xl border border-neutral-200 bg-neutral-50/60 p-5 sm:grid-cols-2">
        <SummaryField label="Establecimiento" value={getEstablishmentName(establishment) || '—'} />
        <SummaryField label="RBD" value={getEstablishmentRbd(establishment) || '—'} />
        <SummaryField label="Comuna" value={getEstablishmentComuna(establishment) || '—'} />
        <SummaryField label="Correo electrónico" value={getEstablishmentEmail(establishment) || '—'} />
      </div>

      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
        <StatBlock label="Reconocimientos solicitados" value={String(items.length)} />
        <StatBlock label="Cantidad total" value={formatNumber(totalQuantity)} />
        <StatBlock label="Tipos distintos" value={String(totalsByType.length)} />
      </div>

      <div className="mb-6">
        <h3 className="mb-2 text-sm font-extrabold text-navy-500">Detalle por tipo de reconocimiento</h3>
        <div className="overflow-hidden rounded-lg border border-neutral-200">
          <table className="w-full text-left text-sm">
            <thead className="bg-neutral-100 text-xs font-bold uppercase tracking-wide text-neutral-600">
              <tr>
                <th className="px-4 py-2.5">Tipo</th>
                <th className="px-4 py-2.5">N.º de requerimientos</th>
                <th className="px-4 py-2.5">Cantidad total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200">
              {totalsByType.map(([type, totals]) => (
                <tr key={type}>
                  <td className="px-4 py-2.5 font-bold text-navy-700">{type}</td>
                  <td className="px-4 py-2.5 font-medium text-neutral-700">{totals.count}</td>
                  <td className="px-4 py-2.5 font-bold text-navy-700">{formatNumber(totals.quantity)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mb-2">
        <h3 className="mb-2 text-sm font-extrabold text-navy-500">Detalle por acción asociada</h3>
        <div className="overflow-hidden rounded-lg border border-neutral-200">
          <table className="w-full text-left text-sm">
            <thead className="bg-neutral-100 text-xs font-bold uppercase tracking-wide text-neutral-600">
              <tr>
                <th className="px-4 py-2.5">Acción asociada</th>
                <th className="px-4 py-2.5">N.º de requerimientos</th>
                <th className="px-4 py-2.5">Cantidad total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200">
              {totalsByAction.map(([action, totals]) => (
                <tr key={action}>
                  <td className="px-4 py-2.5 font-bold text-navy-700">{action}</td>
                  <td className="px-4 py-2.5 font-medium text-neutral-700">{totals.count}</td>
                  <td className="px-4 py-2.5 font-bold text-navy-700">{formatNumber(totals.quantity)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <button
          type="button"
          onClick={onBack}
          disabled={submitting}
          className="inline-flex items-center justify-center rounded-lg border border-navy-500 bg-white px-6 py-3 text-sm font-extrabold text-navy-500 transition hover:bg-navy-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          Volver a editar
        </button>
        <button
          type="button"
          onClick={onConfirm}
          disabled={submitting}
          className="inline-flex items-center justify-center rounded-lg bg-royal-500 px-6 py-3 text-sm font-extrabold text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.15)] transition hover:bg-royal-600 active:translate-y-px active:bg-royal-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting ? 'Enviando…' : 'Confirmar y enviar solicitud'}
        </button>
      </div>
    </section>
  )
}

function SummaryField({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <p className="text-[11px] font-bold uppercase tracking-wider text-neutral-500">{label}</p>
      <p className="mt-0.5 truncate text-sm font-bold text-navy-700" title={value}>
        {value}
      </p>
    </div>
  )
}

function StatBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-4 text-center shadow-sm">
      <p className="text-2xl font-extrabold tracking-tight text-navy-500">{value}</p>
      <p className="mt-1 text-[11px] font-bold uppercase tracking-wide text-neutral-500">{label}</p>
    </div>
  )
}
