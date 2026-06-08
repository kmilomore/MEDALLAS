import { useEffect, useState } from 'react'
import type { Establishment, RecognitionItem as RecognitionItemType } from '../types'
import { emptyRecognitionItem } from '../utils/validators'
import AlertMessage from './AlertMessage'
import EstablishmentInfo from './EstablishmentInfo'
import RecognitionForm from './RecognitionForm'

type FormPreviewModalProps = {
  onClose: () => void
}

const SAMPLE_ESTABLISHMENT: Establishment = {
  nombre_establecimiento: 'Escuela Ejemplo G-32',
  rbd: '12345-6',
  comuna: 'San Fernando',
  director_nombre: 'Nombre de la directora o director',
  correo_electronico: 'directora.ejemplo@slepcolchagua.cl',
}

const PREVIEW_ITEM = emptyRecognitionItem()

export default function FormPreviewModal({ onClose }: FormPreviewModalProps) {
  const [interactiveMode, setInteractiveMode] = useState(false)
  const [testItems, setTestItems] = useState<RecognitionItemType[]>([emptyRecognitionItem()])
  const [testObservations, setTestObservations] = useState('')
  const [testMessage, setTestMessage] = useState<string | null>(null)

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  function handleToggleMode() {
    setInteractiveMode((prev) => !prev)
    setTestMessage(null)
  }

  function handleTestSubmit() {
    setTestMessage(
      'Esto es solo una prueba: revisa que los datos ingresados (incluida la selección de dimensión y subdimensión del PME) se vean correctos. No se generó ninguna solicitud real ni se guardó información.',
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy-900/60 px-4 py-8 backdrop-blur-sm">
      <div className="flex max-h-[85vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-neutral-200 bg-neutral-100 shadow-xl">
        <div className="flex shrink-0 items-center justify-between gap-4 border-b border-neutral-200 bg-white px-6 py-4">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-royal-500">
              {interactiveMode ? 'Modo de prueba · interactivo' : 'Vista previa · solo lectura'}
            </p>
            <h2 className="text-lg font-extrabold tracking-tight text-navy-500">Formulario de directoras y directores</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar vista previa"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-neutral-200 bg-white text-navy-500 transition hover:bg-neutral-50"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex flex-col gap-4 overflow-y-auto p-5 sm:p-6">
          {interactiveMode ? (
            <p className="rounded-xl border border-royal-500/25 bg-royal-50 px-4 py-3 text-xs font-medium leading-relaxed text-royal-700">
              Estás en <strong>modo de prueba interactivo</strong>: puedes completar el formulario igual que lo haría una
              directora o director, para verificar que las opciones (por ejemplo, la selección encadenada de dimensión y
              subdimensión del PME) funcionen correctamente. Nada de lo que ingreses aquí se guarda ni se envía como
              solicitud real.
            </p>
          ) : (
            <p className="rounded-xl border border-royal-500/25 bg-royal-50 px-4 py-3 text-xs font-medium leading-relaxed text-royal-700">
              Esta es una vista de referencia con datos de ejemplo: así es como las directoras y directores ven el
              formulario al ingresar al portal. Los campos están deshabilitados y no se puede enviar desde aquí.
            </p>
          )}

          <div>
            <button
              type="button"
              onClick={handleToggleMode}
              className="inline-flex items-center justify-center rounded-lg border border-royal-300 bg-white px-4 py-2 text-xs font-bold text-royal-700 transition hover:border-royal-500 hover:bg-royal-50"
            >
              {interactiveMode ? 'Volver a vista de solo lectura' : 'Probar el formulario de forma interactiva'}
            </button>
          </div>

          {testMessage && (
            <AlertMessage tone="info" title="Prueba completada" onClose={() => setTestMessage(null)}>
              {testMessage}
            </AlertMessage>
          )}

          {interactiveMode ? (
            <div className="flex flex-col gap-4">
              <EstablishmentInfo establishment={SAMPLE_ESTABLISHMENT} />
              <RecognitionForm
                items={testItems}
                onItemsChange={setTestItems}
                generalObservations={testObservations}
                onGeneralObservationsChange={setTestObservations}
                onSubmit={handleTestSubmit}
                errorMessage={null}
              />
            </div>
          ) : (
            <div className="pointer-events-none flex select-none flex-col gap-4" aria-hidden="true">
              <EstablishmentInfo establishment={SAMPLE_ESTABLISHMENT} />
              <RecognitionForm
                items={[PREVIEW_ITEM]}
                onItemsChange={() => {}}
                generalObservations=""
                onGeneralObservationsChange={() => {}}
                onSubmit={() => {}}
                errorMessage={null}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
