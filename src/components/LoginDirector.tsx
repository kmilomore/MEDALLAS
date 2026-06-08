import { GoogleLogin } from '@react-oauth/google'
import logoSlep from '../assets/logo-slep-colchagua.webp'
import AlertMessage from './AlertMessage'
import LoadingSpinner from './LoadingSpinner'

type LoginDirectorProps = {
  onCredential: (credential: string) => void
  loading: boolean
  errorMessage: string | null
}

const GOOGLE_CLIENT_ID_CONFIGURED = Boolean(import.meta.env.VITE_GOOGLE_CLIENT_ID)

export default function LoginDirector({ onCredential, loading, errorMessage }: LoginDirectorProps) {
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

        <div className="flex flex-col items-center gap-3">
          {GOOGLE_CLIENT_ID_CONFIGURED ? (
            <div className={loading ? 'pointer-events-none opacity-60' : ''}>
              <GoogleLogin
                shape="pill"
                theme="filled_blue"
                text="signin_with"
                onSuccess={(response) => {
                  if (response.credential) onCredential(response.credential)
                }}
                onError={() => undefined}
              />
            </div>
          ) : (
            <AlertMessage tone="error" title="Falta configurar el inicio de sesión con Google">
              Define la variable de entorno VITE_GOOGLE_CLIENT_ID con el ID de cliente OAuth (Google Cloud Console)
              para habilitar el ingreso institucional con Google.
            </AlertMessage>
          )}
        </div>

        {loading && <LoadingSpinner label="Verificando tu cuenta institucional…" />}

        {!loading && errorMessage && (
          <div className="mt-4">
            <AlertMessage tone="error" title="No fue posible iniciar sesión">
              {errorMessage}
            </AlertMessage>
          </div>
        )}

        <p className="mt-7 text-center text-xs font-medium leading-relaxed text-neutral-500">
          Ingresa con tu cuenta de Google institucional. Validaremos tu correo electrónico contra la base de datos de
          establecimientos o de usuarios administradores. No se requiere contraseña adicional.
        </p>
      </div>
    </div>
  )
}
