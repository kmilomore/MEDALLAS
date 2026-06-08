import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import {
  getDashboardStats,
  getRequestDetails,
  getRequests,
  updateRequestStatus,
} from '../services/gasApi'
import type { AdminRequest, DashboardStats, RequestDetail } from '../types'
import { buildConsolidatedCsv, downloadCsv, type ConsolidatedRow } from '../utils/csvExport'
import { formatNumber } from '../utils/formatters'
import { useAuth } from '../context/AuthContext'
import AlertMessage from './AlertMessage'
import FiltersPanel, { EMPTY_FILTERS, type RequestFilters } from './FiltersPanel'
import KpiCard from './KpiCard'
import LoadingSpinner from './LoadingSpinner'
import LoginDirector from './LoginDirector'
import RequestsTable from './RequestsTable'

const CHART_COLORS = ['#006BB9', '#25306B', '#FF1D3D', '#56A6DE', '#1F8A5B', '#8A5400', '#7B85B6', '#94081B']

export default function AdminDashboard() {
  const { auth, signInWithGoogleCredential, signOut } = useAuth()

  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [requests, setRequests] = useState<AdminRequest[]>([])
  const [detailsByRequest, setDetailsByRequest] = useState<Record<string, RequestDetail[]>>({})
  const [loading, setLoading] = useState(true)
  const [loadingDetails, setLoadingDetails] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [updatingRequestId, setUpdatingRequestId] = useState<string | null>(null)
  const [filters, setFilters] = useState<RequestFilters>(EMPTY_FILTERS)

  useEffect(() => {
    if (auth.status === 'authenticated' && auth.role === 'admin') {
      void loadAll()
    }
  }, [auth.status, auth.role])

  async function loadAll() {
    setLoading(true)
    setErrorMessage(null)
    try {
      const [statsRes, requestsRes] = await Promise.all([getDashboardStats(), getRequests()])

      if (!statsRes.success) throw new Error(statsRes.message || 'No fue posible obtener los indicadores.')
      if (!requestsRes.success) throw new Error(requestsRes.message || 'No fue posible obtener las solicitudes.')

      setStats(statsRes.stats)
      const requestList = requestsRes.requests ?? []
      setRequests(requestList)
      setLoading(false)

      await loadAllDetails(requestList)
    } catch (error) {
      setLoading(false)
      setErrorMessage(error instanceof Error ? error.message : 'No fue posible cargar el panel administrativo.')
    }
  }

  async function loadAllDetails(requestList: AdminRequest[]) {
    if (requestList.length === 0) return
    setLoadingDetails(true)
    try {
      const entries = await Promise.all(
        requestList.map(async (request) => {
          const res = await getRequestDetails(request.id_solicitud)
          return [request.id_solicitud, res.success ? res.details ?? [] : []] as const
        }),
      )
      setDetailsByRequest(Object.fromEntries(entries))
    } catch {
      // El detalle es complementario: si falla, la tabla sigue siendo usable a nivel de solicitud.
    } finally {
      setLoadingDetails(false)
    }
  }

  async function handleChangeStatus(requestId: string, status: string) {
    setUpdatingRequestId(requestId)
    try {
      const res = await updateRequestStatus(requestId, status)
      if (!res.success) throw new Error(res.message || 'No fue posible actualizar el estado.')
      setRequests((prev) =>
        prev.map((request) => (request.id_solicitud === requestId ? { ...request, estado_revision: status } : request)),
      )
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'No fue posible actualizar el estado de la solicitud.')
    } finally {
      setUpdatingRequestId(null)
    }
  }

  const consolidatedRows = useMemo<ConsolidatedRow[]>(() => {
    const rows: ConsolidatedRow[] = []
    for (const request of requests) {
      const details = detailsByRequest[request.id_solicitud] ?? []
      for (const detail of details) {
        rows.push({ request, detail })
      }
    }
    return rows
  }, [requests, detailsByRequest])

  const comunas = useMemo(() => {
    const set = new Set(requests.map((r) => r.comuna).filter(Boolean))
    return Array.from(set).sort((a, b) => a.localeCompare(b, 'es'))
  }, [requests])

  const filteredRequests = useMemo(() => {
    const search = filters.search.trim().toLowerCase()

    return requests.filter((request) => {
      if (filters.comuna && request.comuna !== filters.comuna) return false
      if (filters.estado && request.estado_revision !== filters.estado) return false

      if (search) {
        const haystack = `${request.nombre_establecimiento} ${request.rbd} ${request.correo_electronico}`.toLowerCase()
        if (!haystack.includes(search)) return false
      }

      const needsDetailFilter = filters.tipoReconocimiento || filters.dimension || filters.subdimension
      if (needsDetailFilter) {
        const details = detailsByRequest[request.id_solicitud] ?? []
        const matchesDetail = details.some((detail) => {
          if (filters.tipoReconocimiento && detail.tipo_reconocimiento !== filters.tipoReconocimiento) return false
          if (filters.dimension && detail.dimension !== filters.dimension) return false
          if (filters.subdimension && detail.subdimension !== filters.subdimension) return false
          return true
        })
        if (!matchesDetail) return false
      }

      return true
    })
  }, [requests, detailsByRequest, filters])

  const filteredConsolidatedRows = useMemo(() => {
    const filteredIds = new Set(filteredRequests.map((r) => r.id_solicitud))
    return consolidatedRows.filter((row) => filteredIds.has(row.request.id_solicitud))
  }, [consolidatedRows, filteredRequests])

  const tipoChartData = useMemo(() => buildCountChartData(stats?.totalPorTipo), [stats])
  const comunaChartData = useMemo(() => buildCountChartData(stats?.totalPorComuna), [stats])
  const dimensionChartData = useMemo(() => buildCountChartData(stats?.totalPorDimension), [stats])

  const tableByEstablishment = useMemo(() => buildEstablishmentSummary(consolidatedRows), [consolidatedRows])
  const tableByType = useMemo(() => buildTypeSummary(consolidatedRows), [consolidatedRows])

  function handleExportCsv() {
    const csv = buildConsolidatedCsv(filteredConsolidatedRows)
    const today = new Date().toISOString().slice(0, 10)
    downloadCsv(`solicitudes_reconocimientos_${today}.csv`, csv)
  }

  if (auth.status === 'signedOut' || auth.status === 'checking' || auth.status === 'unauthorized') {
    return (
      <LoginDirector
        onCredential={signInWithGoogleCredential}
        loading={auth.status === 'checking'}
        errorMessage={auth.status === 'unauthorized' ? auth.message : null}
      />
    )
  }

  if (auth.role !== 'admin') {
    return <NotAuthorizedScreen email={auth.email} onSignOut={signOut} />
  }

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-8 sm:px-6 lg:px-8">
      <header className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex flex-col gap-1">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-royal-500">Panel administrativo</p>
          <h1 className="text-2xl font-extrabold tracking-tight text-navy-500 sm:text-3xl">
            Levantamiento de Necesidades de Reconocimientos
          </h1>
          <p className="text-sm font-medium text-neutral-500">
            Servicio Local de Educación Pública Colchagua · consolidado territorial de solicitudes
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Link to="/" className="text-xs font-bold text-neutral-400 transition hover:text-royal-500">
            Portal de directores
          </Link>
          <button
            type="button"
            onClick={signOut}
            className="text-xs font-bold text-neutral-400 transition hover:text-coral-600"
            title={auth.email}
          >
            Cerrar sesión
          </button>
        </div>
      </header>

      {errorMessage && <AlertMessage tone="error" title="Ocurrió un problema">{errorMessage}</AlertMessage>}

      {loading ? (
        <LoadingSpinner label="Cargando indicadores y solicitudes…" />
      ) : (
        <>
          {stats && (
            <section className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
              <KpiCard label="Establecimientos" value={formatNumber(stats.totalEstablecimientos)} tone="navy" />
              <KpiCard label="Respondieron" value={formatNumber(stats.establecimientosQueRespondieron)} tone="royal" />
              <KpiCard label="Pendientes" value={formatNumber(stats.establecimientosPendientes)} tone="coral" />
              <KpiCard label="% de avance" value={`${stats.porcentajeAvance}%`} tone="navy" />
              <KpiCard label="Reconocimientos solicitados" value={formatNumber(stats.totalReconocimientos)} tone="royal" />
              <KpiCard label="Solicitudes recibidas" value={formatNumber(requests.length)} tone="navy" />
              <KpiCard label="Total medallas" value={formatNumber(stats.totalPorTipo['Medallas'] ?? 0)} tone="neutral" />
              <KpiCard label="Total galvanos" value={formatNumber(stats.totalPorTipo['Galvanos'] ?? 0)} tone="neutral" />
              <KpiCard label="Total diplomas" value={formatNumber(stats.totalPorTipo['Diplomas'] ?? 0)} tone="neutral" />
              <KpiCard label="Total trofeos" value={formatNumber(stats.totalPorTipo['Trofeos'] ?? 0)} tone="neutral" />
              <KpiCard label="Total certificados" value={formatNumber(stats.totalPorTipo['Certificados'] ?? 0)} tone="neutral" />
              <KpiCard
                label="Otros reconocimientos"
                value={formatNumber(stats.totalPorTipo['Reconocimientos especiales'] ?? 0)}
                tone="neutral"
              />
            </section>
          )}

          <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <ChartCard title="Reconocimientos por tipo">
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={tipoChartData} margin={{ top: 8, right: 8, left: -16, bottom: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#DDE3EC" />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fontWeight: 600 }} interval={0} angle={-25} textAnchor="end" height={70} />
                  <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="value" name="Cantidad" fill="#006BB9" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard title="Solicitudes por comuna">
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={comunaChartData} margin={{ top: 8, right: 8, left: -16, bottom: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#DDE3EC" />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fontWeight: 600 }} interval={0} angle={-25} textAnchor="end" height={70} />
                  <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="value" name="Solicitudes" fill="#25306B" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard title="Distribución por dimensión">
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie data={dimensionChartData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label={(entry) => entry.name}>
                    {dimensionChartData.map((entry, index) => (
                      <Cell key={entry.name} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend wrapperStyle={{ fontSize: 11, fontWeight: 600 }} />
                </PieChart>
              </ResponsiveContainer>
            </ChartCard>
          </section>

          <FiltersPanel filters={filters} comunas={comunas} onChange={setFilters} onReset={() => setFilters(EMPTY_FILTERS)} />

          <section className="flex flex-col gap-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-base font-extrabold text-navy-500">
                Solicitudes recibidas
                <span className="ml-2 text-sm font-semibold text-neutral-500">
                  ({filteredRequests.length} de {requests.length})
                </span>
              </h2>
              <button
                type="button"
                onClick={handleExportCsv}
                disabled={filteredConsolidatedRows.length === 0}
                className="inline-flex items-center gap-2 rounded-lg border border-navy-500 bg-white px-4 py-2 text-xs font-extrabold text-navy-500 transition hover:bg-navy-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Exportar CSV consolidado
              </button>
            </div>

            <RequestsTable
              requests={filteredRequests}
              detailsByRequest={detailsByRequest}
              loadingDetails={loadingDetails}
              onChangeStatus={handleChangeStatus}
              updatingRequestId={updatingRequestId}
            />
          </section>

          <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <ConsolidatedTable
              title="Tabla consolidada por establecimiento"
              columns={['Establecimiento', 'Comuna', 'Solicitudes', 'Reconocimientos', 'Cantidad total']}
              rows={tableByEstablishment.map((row) => [
                row.nombre,
                row.comuna,
                formatNumber(row.solicitudes),
                formatNumber(row.reconocimientos),
                formatNumber(row.cantidad),
              ])}
            />
            <ConsolidatedTable
              title="Tabla consolidada por tipo de reconocimiento"
              columns={['Tipo de reconocimiento', 'N.º de requerimientos', 'Cantidad total']}
              rows={tableByType.map((row) => [row.tipo, formatNumber(row.requerimientos), formatNumber(row.cantidad)])}
            />
          </section>
        </>
      )}
    </div>
  )
}

function buildCountChartData(record?: Record<string, number>): { name: string; value: number }[] {
  if (!record) return []
  return Object.entries(record)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
}

function buildEstablishmentSummary(rows: ConsolidatedRow[]) {
  const map = new Map<string, { nombre: string; comuna: string; solicitudes: Set<string>; reconocimientos: number; cantidad: number }>()

  for (const { request, detail } of rows) {
    const current = map.get(request.rbd) ?? {
      nombre: request.nombre_establecimiento,
      comuna: request.comuna,
      solicitudes: new Set<string>(),
      reconocimientos: 0,
      cantidad: 0,
    }
    current.solicitudes.add(request.id_solicitud)
    current.reconocimientos += 1
    current.cantidad += Number(detail.cantidad) || 0
    map.set(request.rbd, current)
  }

  return Array.from(map.values())
    .map((entry) => ({
      nombre: entry.nombre,
      comuna: entry.comuna,
      solicitudes: entry.solicitudes.size,
      reconocimientos: entry.reconocimientos,
      cantidad: entry.cantidad,
    }))
    .sort((a, b) => b.cantidad - a.cantidad)
}

function buildTypeSummary(rows: ConsolidatedRow[]) {
  const map = new Map<string, { requerimientos: number; cantidad: number }>()

  for (const { detail } of rows) {
    const tipo =
      detail.tipo_reconocimiento === 'Otro' && detail.tipo_reconocimiento_otro
        ? `Otro (${detail.tipo_reconocimiento_otro})`
        : detail.tipo_reconocimiento
    const current = map.get(tipo) ?? { requerimientos: 0, cantidad: 0 }
    current.requerimientos += 1
    current.cantidad += Number(detail.cantidad) || 0
    map.set(tipo, current)
  }

  return Array.from(map.entries())
    .map(([tipo, totals]) => ({ tipo, ...totals }))
    .sort((a, b) => b.cantidad - a.cantidad)
}

type NotAuthorizedScreenProps = {
  email: string
  onSignOut: () => void
}

function NotAuthorizedScreen({ email, onSignOut }: NotAuthorizedScreenProps) {
  return (
    <div className="flex min-h-[100svh] w-full items-center justify-center bg-neutral-100 px-4 py-10">
      <div className="w-full max-w-md rounded-2xl border border-neutral-200 bg-white p-8 text-center shadow-sm">
        <h1 className="text-lg font-extrabold text-navy-500">No tienes permisos de administrador</h1>
        <p className="mt-3 text-sm font-medium leading-relaxed text-neutral-600">
          Tu cuenta ({email}) no está registrada en la hoja de usuarios administradores. Si necesitas acceso al panel
          administrativo, solicita que tu correo institucional sea agregado a esa planilla.
        </p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-lg bg-royal-500 px-5 py-3 text-sm font-extrabold text-white transition hover:bg-royal-600"
          >
            Ir al portal de directores
          </Link>
          <button
            type="button"
            onClick={onSignOut}
            className="inline-flex items-center justify-center rounded-lg border border-navy-500 px-5 py-3 text-sm font-extrabold text-navy-500 transition hover:bg-navy-50"
          >
            Cerrar sesión
          </button>
        </div>
      </div>
    </div>
  )
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
      <h3 className="mb-2 text-sm font-extrabold text-navy-500">{title}</h3>
      {children}
    </div>
  )
}

function ConsolidatedTable({ title, columns, rows }: { title: string; columns: string[]; rows: (string | number)[][] }) {
  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
      <h3 className="mb-3 text-sm font-extrabold text-navy-500">{title}</h3>
      {rows.length === 0 ? (
        <p className="text-sm font-medium text-neutral-500">Aún no hay datos disponibles.</p>
      ) : (
        <div className="max-h-80 overflow-auto rounded-lg border border-neutral-200">
          <table className="w-full text-left text-xs">
            <thead className="sticky top-0 bg-neutral-100 font-bold uppercase tracking-wider text-neutral-600">
              <tr>
                {columns.map((column) => (
                  <th key={column} className="px-3 py-2">
                    {column}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200">
              {rows.map((row, i) => (
                <tr key={i}>
                  {row.map((cell, j) => (
                    <td key={j} className={`px-3 py-2 ${j === 0 ? 'font-bold text-navy-700' : 'font-medium text-neutral-700'}`}>
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
