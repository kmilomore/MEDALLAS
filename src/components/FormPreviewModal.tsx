import { useEffect } from 'react'
import type { Establishment } from '../types'
import { emptyRecognitionItem } from '../utils/validators'
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
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-navy-900/60 px-4 py-8 backdrop-blur-sm sm:items-center">
      <div className="w-full max-w-3xl rounded-2xl border border-neutral-200 bg-neutral-100 shadow-xl">
        <div className="flex items-center justify-between gap-4 rounded-t-2xl border-b border-neutral-200 bg-white px-6 py-4">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-royal-500">Vista previa · solo lectura</p>
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

        <div className="flex flex-col gap-4 p-5 sm:p-6">
          <p className="rounded-xl border border-royal-500/25 bg-royal-50 px-4 py-3 text-xs font-medium leading-relaxed text-royal-700">
            Esta es una vista de referencia con datos de ejemplo: así es como las directoras y directores ven el
            formulario al ingresar al portal. Los campos están deshabilitados y no se puede enviar desde aquí.
          </p>

          <fieldset disabled className="contents">
            <EstablishmentInfo establishment={SAMPLE_ESTABLISHMENT} />
            <RecognitionForm
              items={[PREVIEW_ITEM]}
              onItemsChange={() => {}}
              generalObservations=""
              onGeneralObservationsChange={() => {}}
              onSubmit={() => {}}
              errorMessage={null}
            />
          </fieldset>
        </div>
      </div>
    </div>
  )
}
