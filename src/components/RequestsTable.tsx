import { useState } from 'react'
import { REVIEW_STATUSES, type AdminRequest, type RequestDetail } from '../types'
import { formatDate, formatDateTime, formatNumber } from '../utils/formatters'
import LoadingSpinner from './LoadingSpinner'

type RequestsTableProps = {
  requests: AdminRequest[]
  detailsByRequest: Record<string, RequestDetail[]>
  loadingDetails: boolean
  onChangeStatus: (requestId: string, status: string) => void
  updatingRequestId: string | null
}

const STATUS_STYLES: Record<string, string> = {
  Recibido: 'bg-royal-50 text-royal-700',
  'En revisión': 'bg-[#FFF1D6] text-[#8A5400]',
  Validado: 'bg-[#E3F5EB] text-[#1F8A5B]',
  Observado: 'bg-coral-50 text-coral-700',
  Cerrado: 'bg-neutral-200 text-navy-500',
}

export default function RequestsTable({
  requests,
  detailsByRequest,
  loadingDetails,
  onChangeStatus,
  updatingRequestId,
}: RequestsTableProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null)

  if (requests.length === 0) {
    return (
      <div className="rounded-2xl border border-neutral-200 bg-white p-10 text-center shadow-sm">
        <p className="text-sm font-semibold text-neutral-500">
          No hay solicitudes que coincidan con los filtros seleccionados.
        </p>
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[920px] text-left text-sm">
          <thead className="bg-neutral-100 text-xs font-bold uppercase tracking-wider text-neutral-600">
            <tr>
              <th className="px-4 py-3">ID solicitud</th>
              <th className="px-4 py-3">Fecha de envío</th>
              <th className="px-4 py-3">Establecimiento</th>
              <th className="px-4 py-3">Comuna</th>
              <th className="px-4 py-3">Total reconocimientos</th>
              <th className="px-4 py-3">Estado</th>
              <th className="px-4 py-3 text-right">Detalle</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-200">
            {requests.map((request) => {
              const isExpanded = expandedId === request.id_solicitud
              const details = detailsByRequest[request.id_solicitud]

              return (
                <RequestRow
                  key={request.id_solicitud}
                  request={request}
                  isExpanded={isExpanded}
                  details={details}
                  loadingDetails={loadingDetails && isExpanded && !details}
                  onToggle={() => setExpandedId(isExpanded ? null : request.id_solicitud)}
                  onChangeStatus={onChangeStatus}
                  updating={updatingRequestId === request.id_solicitud}
                />
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

type RequestRowProps = {
  request: AdminRequest
  isExpanded: boolean
  details?: RequestDetail[]
  loadingDetails: boolean
  onToggle: () => void
  onChangeStatus: (requestId: string, status: string) => void
  updating: boolean
}

function RequestRow({ request, isExpanded, details, loadingDetails, onToggle, onChangeStatus, updating }: RequestRowProps) {
  return (
    <>
      <tr className={isExpanded ? 'bg-royal-50/40' : 'hover:bg-neutral-50'}>
        <td className="px-4 py-3 font-mono text-xs font-bold text-navy-700">{request.id_solicitud}</td>
        <td className="px-4 py-3 font-medium text-neutral-700">{formatDateTime(request.fecha_envio)}</td>
        <td className="px-4 py-3 font-bold text-navy-700">{request.nombre_establecimiento}</td>
        <td className="px-4 py-3 font-medium text-neutral-700">{request.comuna}</td>
        <td className="px-4 py-3 font-bold text-navy-700">{formatNumber(request.total_reconocimientos)}</td>
        <td className="px-4 py-3">
          <select
            value={request.estado_revision}
            disabled={updating}
            onChange={(e) => onChangeStatus(request.id_solicitud, e.target.value)}
            className={`rounded-full border-0 px-3 py-1.5 text-xs font-bold outline-none ring-1 ring-inset ring-black/5 ${STATUS_STYLES[request.estado_revision] ?? 'bg-neutral-100 text-navy-500'} ${updating ? 'opacity-60' : ''}`}
          >
            {REVIEW_STATUSES.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </td>
        <td className="px-4 py-3 text-right">
          <button
            type="button"
            onClick={onToggle}
            className="text-xs font-bold text-royal-500 transition hover:text-royal-700 hover:underline"
          >
            {isExpanded ? 'Ocultar' : 'Ver detalle'}
          </button>
        </td>
      </tr>

      {isExpanded && (
        <tr>
          <td colSpan={7} className="bg-neutral-50/70 px-4 py-4">
            {request.observaciones_generales && (
              <p className="mb-3 text-xs font-medium text-neutral-600">
                <span className="font-bold text-navy-500">Observaciones generales: </span>
                {request.observaciones_generales}
              </p>
            )}

            {loadingDetails && <LoadingSpinner label="Cargando detalle de la solicitud…" />}

            {!loadingDetails && details && details.length > 0 && (
              <div className="overflow-hidden rounded-lg border border-neutral-200 bg-white">
                <table className="w-full min-w-[760px] text-left text-xs">
                  <thead className="bg-neutral-100 font-bold uppercase tracking-wider text-neutral-600">
                    <tr>
                      <th className="px-3 py-2">Tipo</th>
                      <th className="px-3 py-2">Cantidad</th>
                      <th className="px-3 py-2">Dimensión</th>
                      <th className="px-3 py-2">Subdimensión</th>
                      <th className="px-3 py-2">Código PME</th>
                      <th className="px-3 py-2">Acción asociada</th>
                      <th className="px-3 py-2">Fecha estimada</th>
                      <th className="px-3 py-2">Observaciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-200">
                    {details.map((detail) => (
                      <tr key={detail.id_detalle}>
                        <td className="px-3 py-2 font-bold text-navy-700">
                          {detail.tipo_reconocimiento === 'Otro' && detail.tipo_reconocimiento_otro
                            ? `Otro (${detail.tipo_reconocimiento_otro})`
                            : detail.tipo_reconocimiento}
                        </td>
                        <td className="px-3 py-2 font-bold text-navy-700">{formatNumber(detail.cantidad)}</td>
                        <td className="px-3 py-2 font-medium text-neutral-700">{detail.dimension}</td>
                        <td className="px-3 py-2 font-medium text-neutral-700">
                          {detail.subdimension === 'Otro' && detail.subdimension_otro
                            ? `Otro (${detail.subdimension_otro})`
                            : detail.subdimension}
                        </td>
                        <td className="px-3 py-2 font-mono text-xs font-bold text-navy-700">{detail.codigo_pme || '—'}</td>
                        <td className="px-3 py-2 font-medium text-neutral-700">{detail.nombre_accion}</td>
                        <td className="px-3 py-2 font-medium text-neutral-700">{formatDate(detail.fecha_estimada_uso)}</td>
                        <td className="px-3 py-2 font-medium text-neutral-700">{detail.observaciones || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {!loadingDetails && details && details.length === 0 && (
              <p className="text-xs font-semibold text-neutral-500">Esta solicitud no registra detalle.</p>
            )}
          </td>
        </tr>
      )}
    </>
  )
}
