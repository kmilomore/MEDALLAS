import { RECOGNITION_TYPES, REVIEW_STATUSES } from '../types'

export type RequestFilters = {
  search: string
  comuna: string
  estado: string
  tipoReconocimiento: string
  dimension: string
  subdimension: string
}

export const EMPTY_FILTERS: RequestFilters = {
  search: '',
  comuna: '',
  estado: '',
  tipoReconocimiento: '',
  dimension: '',
  subdimension: '',
}

type FiltersPanelProps = {
  filters: RequestFilters
  comunas: string[]
  dimensiones: string[]
  subdimensiones: string[]
  onChange: (filters: RequestFilters) => void
  onReset: () => void
}

const selectClass =
  'w-full rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm font-medium text-navy-700 outline-none transition focus:border-royal-500 focus:bg-white focus:ring-2 focus:ring-royal-100'
const labelClass = 'mb-1 block text-[11px] font-bold uppercase tracking-wider text-neutral-500'

export default function FiltersPanel({ filters, comunas, dimensiones, subdimensiones, onChange, onReset }: FiltersPanelProps) {
  function update<K extends keyof RequestFilters>(key: K, value: RequestFilters[K]) {
    onChange({ ...filters, [key]: value })
  }

  function handleDimensionChange(value: string) {
    onChange({ ...filters, dimension: value, subdimension: '' })
  }

  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-extrabold text-navy-500">Filtros</h3>
        <button type="button" onClick={onReset} className="text-xs font-bold text-royal-500 hover:text-royal-700 hover:underline">
          Limpiar filtros
        </button>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <div className="xl:col-span-2">
          <label className={labelClass}>Buscar establecimiento o RBD</label>
          <input
            type="text"
            placeholder="Nombre, RBD o correo…"
            value={filters.search}
            onChange={(e) => update('search', e.target.value)}
            className={selectClass}
          />
        </div>

        <div>
          <label className={labelClass}>Comuna</label>
          <select className={selectClass} value={filters.comuna} onChange={(e) => update('comuna', e.target.value)}>
            <option value="">Todas</option>
            {comunas.map((comuna) => (
              <option key={comuna} value={comuna}>
                {comuna}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className={labelClass}>Estado de revisión</label>
          <select className={selectClass} value={filters.estado} onChange={(e) => update('estado', e.target.value)}>
            <option value="">Todos</option>
            {REVIEW_STATUSES.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className={labelClass}>Tipo de reconocimiento</label>
          <select
            className={selectClass}
            value={filters.tipoReconocimiento}
            onChange={(e) => update('tipoReconocimiento', e.target.value)}
          >
            <option value="">Todos</option>
            {RECOGNITION_TYPES.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className={labelClass}>Dimensión (PME)</label>
          <select className={selectClass} value={filters.dimension} onChange={(e) => handleDimensionChange(e.target.value)}>
            <option value="">Todas</option>
            {dimensiones.map((dimension) => (
              <option key={dimension} value={dimension}>
                {dimension}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className={labelClass}>Subdimensión (PME)</label>
          <select
            className={selectClass}
            value={filters.subdimension}
            onChange={(e) => update('subdimension', e.target.value)}
          >
            <option value="">Todas</option>
            {subdimensiones.map((subdimension) => (
              <option key={subdimension} value={subdimension}>
                {subdimension}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  )
}
