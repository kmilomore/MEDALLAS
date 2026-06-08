import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { createRequest } from '../services/gasApi'
import type { RecognitionItem } from '../types'
import { emptyRecognitionItem, validateRequest } from '../utils/validators'
import { getEstablishmentName } from '../utils/formatters'
import logoSlep from '../assets/logo-slep-colchagua.webp'
import { useAuth } from '../context/AuthContext'
import LoginDirector from './LoginDirector'
import EstablishmentInfo from './EstablishmentInfo'
import RecognitionForm from './RecognitionForm'
import RequestSummary from './RequestSummary'
import AlertMessage from './AlertMessage'

type Step = 'form' | 'summary' | 'success'

export default function DirectorPortal() {
  const { auth, signInWithGoogleCredential, signOut } = useAuth()

  const [step, setStep] = useState<Step>('form')
  const [items, setItems] = useState<RecognitionItem[]>([emptyRecognitionItem()])
  const [generalObservations, setGeneralObservations] = useState('')
  const [formError, setFormError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [requestId, setRequestId] = useState<string | null>(null)

  useEffect(() => {
    if (auth.status !== 'authenticated') {
      setStep('form')
      setItems([emptyRecognitionItem()])
      setGeneralObservations('')
      setFormError(null)
      setSubmitError(null)
      setRequestId(null)
    }
  }, [auth.status])

  function handleGoToSummary() {
    const error = validateRequest(auth.establishment, items)
    if (error) {
      setFormError(error)
      return
    }
    setFormError(null)
    setStep('summary')
  }

  async function handleConfirmSubmit() {
    if (!auth.establishment) return
    setSubmitting(true)
    setSubmitError(null)
    try {
      const res = await createRequest(auth.establishment, generalObservations, items)
      if (res.success) {
        setRequestId(res.requestId ?? null)
        setStep('success')
      } else {
        setSubmitError(
          res.message ||
            'No fue posible registrar la solicitud. Intente nuevamente o contacte al administrador.',
        )
      }
    } catch {
      setSubmitError('No fue posible conectar con el sistema. Intente nuevamente o contacte al administrador.')
    } finally {
      setSubmitting(false)
    }
  }

  function handleRestart() {
    setStep('form')
    setItems([emptyRecognitionItem()])
    setGeneralObservations('')
    setFormError(null)
    setSubmitError(null)
    setRequestId(null)
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

  if (auth.role === 'admin') {
    return <AdminAccountNotice email={auth.email} name={auth.name} onSignOut={signOut} />
  }

  const establishment = auth.establishment!

  return (
    <div className="min-h-[100svh] bg-neutral-100">
      <header className="border-b border-neutral-200 bg-white">
        <div className="mx-auto flex max-w-4xl items-center gap-4 px-4 py-4 sm:px-6">
          <img src={logoSlep} alt="SLEP Colchagua" className="h-10 w-auto object-contain" />
          <div>
            <h1 className="text-base font-extrabold leading-tight text-navy-500 sm:text-lg">
              Levantamiento de Necesidades de Reconocimientos
            </h1>
            <p className="text-xs font-bold uppercase tracking-wider text-royal-500">
              Servicio Local de Educación Pública Colchagua
            </p>
          </div>
          <div className="ml-auto flex items-center gap-4">
            <Link to="/admin" className="hidden text-xs font-bold text-neutral-400 hover:text-royal-500 sm:inline">
              Panel administrativo
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
        </div>
      </header>

      <main className="mx-auto flex max-w-4xl flex-col gap-6 px-4 py-8 sm:px-6">
        {step === 'success' ? (
          <SuccessScreen establishmentName={getEstablishmentName(establishment)} requestId={requestId} onRestart={handleRestart} />
        ) : (
          <>
            <EstablishmentInfo establishment={establishment} />

            {step === 'form' && (
              <RecognitionForm
                items={items}
                onItemsChange={setItems}
                generalObservations={generalObservations}
                onGeneralObservationsChange={setGeneralObservations}
                onSubmit={handleGoToSummary}
                errorMessage={formError}
              />
            )}

            {step === 'summary' && (
              <>
                {submitError && <AlertMessage tone="error" title="No fue posible enviar la solicitud">{submitError}</AlertMessage>}
                <RequestSummary
                  establishment={establishment}
                  items={items}
                  onBack={() => setStep('form')}
                  onConfirm={handleConfirmSubmit}
                  submitting={submitting}
                />
              </>
            )}
          </>
        )}
      </main>
    </div>
  )
}

type SuccessScreenProps = {
  establishmentName: string
  requestId: string | null
  onRestart: () => void
}

function SuccessScreen({ establishmentName, requestId, onRestart }: SuccessScreenProps) {
  return (
    <div className="flex flex-col items-center rounded-2xl border border-neutral-200 bg-white p-10 text-center shadow-sm">
      <span className="mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-[#E3F5EB] text-[#1F8A5B]">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="h-8 w-8">
          <path d="M20 6 9 17l-5-5" />
        </svg>
      </span>
      <h2 className="text-xl font-extrabold tracking-tight text-navy-500 sm:text-2xl">
        Su solicitud ha sido registrada correctamente
      </h2>
      <p className="mt-3 max-w-lg text-sm font-medium leading-relaxed text-neutral-600">
        Muchas gracias por contribuir al levantamiento territorial de necesidades de reconocimientos para los
        establecimientos educacionales{establishmentName ? ` de ${establishmentName}` : ''}.
      </p>
      {requestId && (
        <p className="mt-4 rounded-lg bg-neutral-100 px-4 py-2 font-mono text-xs font-bold text-navy-700">
          ID de solicitud: {requestId}
        </p>
      )}
      <button
        type="button"
        onClick={onRestart}
        className="mt-7 inline-flex items-center justify-center rounded-lg border border-navy-500 bg-white px-6 py-3 text-sm font-extrabold text-navy-500 transition hover:bg-navy-50"
      >
        Registrar otra solicitud
      </button>
    </div>
  )
}

type AdminAccountNoticeProps = {
  email: string
  name: string | null
  onSignOut: () => void
}

function AdminAccountNotice({ email, name, onSignOut }: AdminAccountNoticeProps) {
  return (
    <div className="flex min-h-[100svh] w-full items-center justify-center bg-neutral-100 px-4 py-10">
      <div className="w-full max-w-md rounded-2xl border border-neutral-200 bg-white p-8 text-center shadow-sm">
        <h1 className="text-lg font-extrabold text-navy-500">Cuenta con perfil administrador</h1>
        <p className="mt-3 text-sm font-medium leading-relaxed text-neutral-600">
          {name ? `${name}, tu` : 'Tu'} cuenta ({email}) está registrada como usuaria o usuario administrador, no como
          directora o director de un establecimiento. Dirígete al panel administrativo para revisar las solicitudes
          recibidas.
        </p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link
            to="/admin"
            className="inline-flex items-center justify-center rounded-lg bg-royal-500 px-5 py-3 text-sm font-extrabold text-white transition hover:bg-royal-600"
          >
            Ir al panel administrativo
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
