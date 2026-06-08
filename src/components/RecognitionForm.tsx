import type { RecognitionItem as RecognitionItemType } from '../types'
import { emptyRecognitionItem } from '../utils/validators'
import RecognitionItemBlock from './RecognitionItem'

type RecognitionFormProps = {
  items: RecognitionItemType[]
  onItemsChange: (items: RecognitionItemType[]) => void
  generalObservations: string
  onGeneralObservationsChange: (value: string) => void
  onSubmit: () => void
  errorMessage: string | null
}

export default function RecognitionForm({
  items,
  onItemsChange,
  generalObservations,
  onGeneralObservationsChange,
  onSubmit,
  errorMessage,
}: RecognitionFormProps) {
  function handleItemChange(index: number, patch: Partial<RecognitionItemType>) {
    const next = items.slice()
    next[index] = { ...next[index], ...patch }
    onItemsChange(next)
  }

  function handleAddItem() {
    onItemsChange([...items, emptyRecognitionItem()])
  }

  function handleRemoveItem(index: number) {
    if (items.length <= 1) return
    onItemsChange(items.filter((_, i) => i !== index))
  }

  return (
    <section className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm sm:p-7">
      <div className="mb-5">
        <h2 className="text-lg font-extrabold tracking-tight text-navy-500">Formulario de requerimientos</h2>
        <p className="text-xs font-medium text-neutral-500">
          Agrega uno o más reconocimientos requeridos por tu establecimiento. Todos los campos marcados con
          (*) son obligatorios.
        </p>
      </div>

      <div className="flex flex-col gap-4">
        {items.map((item, index) => (
          <RecognitionItemBlock
            key={index}
            index={index}
            item={item}
            canRemove={items.length > 1}
            onChange={handleItemChange}
            onRemove={handleRemoveItem}
          />
        ))}
      </div>

      <button
        type="button"
        onClick={handleAddItem}
        className="mt-4 inline-flex items-center gap-2 rounded-lg border border-dashed border-royal-300 bg-royal-50 px-4 py-2.5 text-sm font-bold text-royal-700 transition hover:border-royal-500 hover:bg-royal-100"
      >
        <span className="text-base leading-none">+</span> Agregar otro reconocimiento
      </button>

      <div className="mt-6 border-t border-neutral-200 pt-5">
        <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-neutral-600">
          Observaciones generales de la solicitud
        </label>
        <textarea
          rows={3}
          placeholder="Observaciones generales sobre esta solicitud (opcional)"
          value={generalObservations}
          onChange={(e) => onGeneralObservationsChange(e.target.value)}
          className="w-full resize-none rounded-lg border border-neutral-200 bg-neutral-50 px-3.5 py-2.5 text-sm font-medium text-navy-700 outline-none transition focus:border-royal-500 focus:bg-white focus:ring-2 focus:ring-royal-100"
        />
      </div>

      {errorMessage && (
        <p className="mt-4 rounded-lg border border-coral-500/30 bg-coral-50 px-4 py-2.5 text-sm font-semibold text-coral-700">
          {errorMessage}
        </p>
      )}

      <div className="mt-6 flex justify-end">
        <button
          type="button"
          onClick={onSubmit}
          className="inline-flex items-center justify-center rounded-lg bg-navy-500 px-6 py-3 text-sm font-extrabold text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.12)] transition hover:bg-navy-600 active:translate-y-px active:bg-navy-700"
        >
          Revisar resumen de la solicitud
        </button>
      </div>
    </section>
  )
}
