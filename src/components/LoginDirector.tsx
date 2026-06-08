import logoSlep from '../assets/logo-slep-colchagua.webp'
import { isGoogleSignInConfigured } from '../utils/googleAuth'
import AlertMessage from './AlertMessage'
import LoadingSpinner from './LoadingSpinner'

type LoginDirectorProps = {
  onSignIn: () => void
  loading: boolean
  errorMessage: string | null
}

const GOOGLE_CLIENT_ID_CONFIGURED = isGoogleSignInConfigured()

export default function LoginDirector({ onSignIn, loading, errorMessage }: LoginDirectorProps) {
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

        {GOOGLE_CLIENT_ID_CONFIGURED ? (
          <button
            type="button"
            onClick={onSignIn}
            disabled={loading}
            className="flex w-full items-center justify-center gap-3 rounded-lg border border-neutral-200 bg-white px-5 py-3 text-sm font-bold text-navy-700 shadow-sm transition hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <GoogleMark />
            {loading ? 'Conectando con Google…' : 'Ingresar con Google'}
          </button>
        ) : (
          <AlertMessage tone="error" title="Falta configurar el inicio de sesión con Google">
            Define la variable de entorno VITE_GOOGLE_CLIENT_ID con el ID de cliente OAuth (Google Cloud Console)
            para habilitar el ingreso institucional con Google.
          </AlertMessage>
        )}

        {loading && <LoadingSpinner label="Verificando tu cuenta institucional…" />}

        {!loading && errorMessage && (
          <div className="mt-4">
            <AlertMessage tone="error" title="No fue posible iniciar sesión">
              {errorMessage}
            </AlertMessage>
          </div>
        )}

        <p className="mt-7 text-center text-xs font-medium leading-relaxed text-neutral-500">
          Ingresa con tu cuenta de Google institucional. Serás redirigido o redirigida a la página de inicio de sesión
          de Google y luego de regreso a esta aplicación. Validaremos tu correo electrónico contra la base de datos de
          establecimientos o de usuarios administradores. No se requiere contraseña adicional.
        </p>
      </div>
    </div>
  )
}

function GoogleMark() {
  return (
    <svg viewBox="0 0 48 48" className="h-5 w-5" aria-hidden="true">
      <path
        fill="#FFC107"
        d="M43.6 20.5h-1.9V20.4H24v7.2h11.3c-1.6 4.7-6 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.1-5.1C33.6 6.1 29 4.4 24 4.4 12.9 4.4 4 13.3 4 24.4s8.9 20 20 20c11.5 0 19.1-8.1 19.1-19.6 0-1.3-.1-2.2-.5-4.3z"
      />
      <path
        fill="#FF3D00"
        d="m6.3 14.7 5.9 4.3C13.8 15.4 18.6 12.4 24 12.4c3.1 0 5.9 1.2 8 3.1l5.1-5.1C33.6 6.1 29 4.4 24 4.4c-7.4 0-13.8 4.2-17.1 10.3z"
      />
      <path
        fill="#4CAF50"
        d="M24 44.4c5 0 9.5-1.7 12.9-4.6l-6-5c-1.9 1.4-4.4 2.2-7 2.2-5.3 0-9.7-3.3-11.3-8l-6 4.6c3.2 6.3 9.7 10.8 17.4 10.8z"
      />
      <path
        fill="#1976D2"
        d="M43.6 20.5h-1.9V20.4H24v7.2h11.3c-.8 2.2-2.2 4.1-4.1 5.4l6 5c-.4.4 6.7-4.9 6.7-15.2 0-1.3-.1-2.2-.5-4.3z"
      />
    </svg>
  )
}
