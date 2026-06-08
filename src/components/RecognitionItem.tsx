import {
  RECOGNITION_TYPES,
  type PmeOption,
  type RecognitionItem as RecognitionItemType,
} from '../types'

type RecognitionItemProps = {
  index: number
  item: RecognitionItemType
  pmeOptions: PmeOption[]
  canRemove: boolean
  onChange: (index: number, patch: Partial<RecognitionItemType>) => void
  onRemove: (index: number) => void
}

const inputClass =
  'w-full rounded-lg border border-neutral-200 bg-neutral-50 px-3.5 py-2.5 text-sm font-medium text-navy-700 outline-none transition focus:border-royal-500 focus:bg-white focus:ring-2 focus:ring-royal-100'
const labelClass = 'mb-1.5 block text-xs font-bold uppercase tracking-wide text-neutral-600'

export default function RecognitionItem({ index, item, pmeOptions, canRemove, onChange, onRemove }: RecognitionItemProps) {
  const dimensions = Array.from(new Set(pmeOptions.map((option) => option.dimension)))
  const subdimensions = pmeOptions.filter((option) => option.dimension === item.dimension)

  function handleDimensionChange(value: string) {
    onChange(index, { dimension: value, subdimension: '', codigo_pme: '' })
  }

  function handleSubdimensionChange(value: string) {
    const match = subdimensions.find((option) => option.subdimension === value)
    onChange(index, { subdimension: value, codigo_pme: match ? match.codigo : '' })
  }

  return (
    <div className="rounded-xl border border-neutral-200 bg-neutral-50/60 p-5">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="inline-flex items-center gap-2 text-sm font-extrabold text-navy-500">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-navy-500 text-xs text-white">
            {index + 1}
          </span>
          Reconocimiento #{index + 1}
        </h3>
        {canRemove && (
          <button
            type="button"
            onClick={() => onRemove(index)}
            className="text-xs font-bold text-coral-600 transition hover:text-coral-700 hover:underline"
          >
            Eliminar
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className={labelClass}>Tipo de reconocimiento *</label>
          <select
            className={inputClass}
            value={item.tipo_reconocimiento}
            onChange={(e) => onChange(index, { tipo_reconocimiento: e.target.value as RecognitionItemType['tipo_reconocimiento'] })}
          >
            <option value="">Selecciona una opción</option>
            {RECOGNITION_TYPES.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
          {item.tipo_reconocimiento === 'Otro' && (
            <input
              type="text"
              placeholder="Especifica el tipo de reconocimiento"
              value={item.tipo_reconocimiento_otro}
              onChange={(e) => onChange(index, { tipo_reconocimiento_otro: e.target.value })}
              className={`${inputClass} mt-2`}
            />
          )}
        </div>

        <div>
          <label className={labelClass}>Cantidad requerida *</label>
          <input
            type="number"
            min={1}
            step={1}
            placeholder="Ej: 50"
            value={item.cantidad}
            onChange={(e) =>
              onChange(index, { cantidad: e.target.value === '' ? '' : Number(e.target.value) })
            }
            className={inputClass}
          />
        </div>

        <div>
          <label className={labelClass}>Dimensión asociada (PME) *</label>
          <select
            className={inputClass}
            value={item.dimension}
            onChange={(e) => handleDimensionChange(e.target.value)}
          >
            <option value="">Selecciona una opción</option>
            {dimensions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className={labelClass}>Subdimensión asociada (PME) *</label>
          <select
            className={inputClass}
            value={item.subdimension}
            disabled={!item.dimension}
            onChange={(e) => handleSubdimensionChange(e.target.value)}
          >
            <option value="">{item.dimension ? 'Selecciona una opción' : 'Primero selecciona una dimensión'}</option>
            {subdimensions.map((option) => (
              <option key={option.codigo} value={option.subdimension}>
                {option.codigo} · {option.subdimension}
              </option>
            ))}
          </select>
        </div>

        <div className="sm:col-span-2">
          <label className={labelClass}>Nombre de la acción asociada *</label>
          <input
            type="text"
            placeholder="Ej: Encuentro deportivo escolar"
            value={item.nombre_accion}
            onChange={(e) => onChange(index, { nombre_accion: e.target.value })}
            className={inputClass}
          />
        </div>

        <div className="sm:col-span-2">
          <label className={labelClass}>Descripción o justificación</label>
          <textarea
            rows={2}
            placeholder="Describe brevemente el contexto o la justificación del requerimiento"
            value={item.descripcion}
            onChange={(e) => onChange(index, { descripcion: e.target.value })}
            className={`${inputClass} resize-none`}
          />
        </div>

        <div>
          <label className={labelClass}>Fecha estimada de uso</label>
          <input
            type="date"
            value={item.fecha_estimada_uso}
            onChange={(e) => onChange(index, { fecha_estimada_uso: e.target.value })}
            className={inputClass}
          />
        </div>

        <div>
          <label className={labelClass}>Observaciones</label>
          <input
            type="text"
            placeholder="Observaciones adicionales (opcional)"
            value={item.observaciones}
            onChange={(e) => onChange(index, { observaciones: e.target.value })}
            className={inputClass}
          />
        </div>
      </div>
    </div>
  )
}
