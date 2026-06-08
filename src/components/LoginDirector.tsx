import { useState } from 'react'
import logoSlep from '../assets/logo-slep-colchagua.webp'
import { isValidEmail } from '../utils/validators'
import AlertMessage from './AlertMessage'
import LoadingSpinner from './LoadingSpinner'

type LoginDirectorProps = {
  onSubmitEmail: (email: string) => Promise<void> | void
  loading: boolean
  errorMessage: string | null
}

export default function LoginDirector({ onSubmitEmail, loading, errorMessage }: LoginDirectorProps) {
  const [email, setEmail] = useState('')
  const [touched, setTouched] = useState(false)

  const showFormatError = touched && email.trim() !== '' && !isValidEmail(email)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setTouched(true)
    if (!isValidEmail(email)) return
    await onSubmitEmail(email.trim())
  }

  return (
    <div className="flex min-h-[100svh] w-full items-center justify-center bg-gradient-to-br from-navy-500 via-navy-600 to-royal-700 px-4 py-10">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-white p-8 shadow-2xl sm:p-10">
        <div className="mb-7 flex flex-col items-center text-center">
          <img src={logoSlep} alt="SLEP Colchagua" className="mb-5 h-16 w-auto object-contain" />
          <h1 className="text-2xl font-extrabold leading-tight tracking-tight text-navy-500 sm:text-[28px]">
            Levantamiento de Necesidades de Reconocimientos
          </h1>
          <p className="mt-2 text-sm font-bold uppercase tracking-[0.12em] text-royal-500">
            Servicio Local de Educación Pública Colchagua
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
          <div>
            <label htmlFor="director-email" className="mb-1.5 block text-sm font-bold text-navy-500">
              Correo electrónico institucional
            </label>
            <input
              id="director-email"
              type="email"
              autoComplete="email"
              placeholder="director@slepcolchagua.cl"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onBlur={() => setTouched(true)}
              className="w-full rounded-lg border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm font-medium text-navy-700 outline-none transition focus:border-royal-500 focus:bg-white focus:ring-2 focus:ring-royal-100"
              disabled={loading}
            />
            {showFormatError && (
              <p className="mt-1.5 text-xs font-semibold text-coral-600">
                Ingresa un correo electrónico con formato válido.
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="mt-1 inline-flex items-center justify-center rounded-lg bg-royal-500 px-5 py-3 text-sm font-extrabold text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.15)] transition hover:bg-royal-600 active:translate-y-px active:bg-royal-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? 'Validando…' : 'Ingresar'}
          </button>
        </form>

        {loading && <LoadingSpinner label="Verificando correo en la base de establecimientos…" />}

        {!loading && errorMessage && (
          <div className="mt-4">
            <AlertMessage tone="error" title="No fue posible validar el correo">
              {errorMessage}
            </AlertMessage>
          </div>
        )}

        <p className="mt-7 text-center text-xs font-medium leading-relaxed text-neutral-500">
          Ingresa con el correo electrónico institucional registrado como director o directora del
          establecimiento. No se requiere contraseña en esta versión.
        </p>
      </div>
    </div>
  )
}
