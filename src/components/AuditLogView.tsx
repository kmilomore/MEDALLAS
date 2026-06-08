import { useEffect, useMemo, useState } from 'react'
import { getAuditoria } from '../services/gasApi'
import type { AuditEvent } from '../types'
import { formatDateTime } from '../utils/formatters'
import AlertMessage from './AlertMessage'
import LoadingSpinner from './LoadingSpinner'

const ROLE_STYLES: Record<string, string> = {
  admin: 'bg-royal-50 text-royal-700',
  director: 'bg-[#E3F5EB] text-[#1F8A5B]',
}

export default function AuditLogView() {
  const [eventos, setEventos] = useState<AuditEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [search, setSearch] = useState('')

  useEffect(() => {
    void loadEventos()
  }, [])

  async function loadEventos() {
    setLoading(true)
    setErrorMessage(null)
    try {
      const res = await getAuditoria()
      if (!res.success) throw new Error(res.message || 'No fue posible obtener el registro de auditoría.')
      setEventos(res.eventos ?? [])
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'No fue posible obtener el registro de auditoría.')
    } finally {
      setLoading(false)
    }
  }

  const filteredEventos = useMemo(() => {
    const term = search.trim().toLowerCase()
    if (!term) return eventos

    return eventos.filter((evento) => {
      const haystack = `${evento.correo_electronico} ${evento.nombre} ${evento.rol} ${evento.accion} ${evento.detalle}`.toLowerCase()
      return haystack.includes(term)
    })
  }, [eventos, search])

  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h2 className="text-base font-extrabold text-navy-500">
          Registro de auditoría
          <span className="ml-2 text-sm font-semibold text-neutral-500">
            ({filteredEventos.length} de {eventos.length})
          </span>
        </h2>
        <p className="text-sm font-medium text-neutral-500">
          Historial de quién ingresó al sistema, a qué hora y qué acciones realizó.
        </p>
      </div>

      <div className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por correo, nombre, rol, acción o detalle…"
          className="w-full rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm font-medium text-navy-700 outline-none transition focus:border-royal-500 focus:bg-white focus:ring-2 focus:ring-royal-100"
        />
      </div>

      {errorMessage && (
        <AlertMessage tone="error" title="Ocurrió un problema">
          {errorMessage}
        </AlertMessage>
      )}

      {loading ? (
        <LoadingSpinner label="Cargando registro de auditoría…" />
      ) : filteredEventos.length === 0 ? (
        <div className="rounded-2xl border border-neutral-200 bg-white p-10 text-center shadow-sm">
          <p className="text-sm font-semibold text-neutral-500">
            {eventos.length === 0
              ? 'Aún no hay eventos registrados en la auditoría.'
              : 'No hay eventos que coincidan con la búsqueda.'}
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px] text-left text-sm">
              <thead className="bg-neutral-100 text-xs font-bold uppercase tracking-wider text-neutral-600">
                <tr>
                  <th className="px-4 py-3">Fecha y hora</th>
                  <th className="px-4 py-3">Correo</th>
                  <th className="px-4 py-3">Nombre</th>
                  <th className="px-4 py-3">Rol</th>
                  <th className="px-4 py-3">Acción</th>
                  <th className="px-4 py-3">Detalle</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200">
                {filteredEventos.map((evento, index) => (
                  <tr key={`${evento.fecha_hora}-${index}`} className="hover:bg-neutral-50">
                    <td className="whitespace-nowrap px-4 py-3 font-mono text-xs font-bold text-navy-700">
                      {formatDateTime(evento.fecha_hora)}
                    </td>
                    <td className="max-w-[220px] truncate px-4 py-3 font-medium text-neutral-700" title={evento.correo_electronico}>
                      {evento.correo_electronico}
                    </td>
                    <td className="px-4 py-3 font-bold text-navy-700">{evento.nombre || '—'}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold ${
                          ROLE_STYLES[evento.rol] ?? 'bg-neutral-200 text-neutral-600'
                        }`}
                      >
                        <span className="h-1.5 w-1.5 rounded-full bg-current" />
                        {evento.rol || '—'}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-medium text-neutral-700">{evento.accion}</td>
                    <td className="max-w-[320px] truncate px-4 py-3 font-medium text-neutral-500" title={evento.detalle}>
                      {evento.detalle || '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </section>
  )
}
