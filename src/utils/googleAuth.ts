import { jwtDecode } from 'jwt-decode'

/**
 * Inicio de sesión con Google mediante el flujo de redirección estándar de
 * OAuth 2.0 (el mismo enfoque que usa Supabase Auth: la página completa
 * navega a Google, el usuario inicia sesión allí y Google redirige de
 * vuelta con el token en el fragmento de la URL). Se evita así cualquier
 * ventana emergente (popup) o superposición.
 */

const GOOGLE_AUTH_ENDPOINT = 'https://accounts.google.com/o/oauth2/v2/auth'
const NONCE_STORAGE_KEY = 'medallas.google.nonce'

type GoogleIdTokenWithNonce = {
  nonce?: string
}

function getClientId(): string {
  return import.meta.env.VITE_GOOGLE_CLIENT_ID || ''
}

function generateNonce(): string {
  const bytes = new Uint8Array(16)
  crypto.getRandomValues(bytes)
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('')
}

export function isGoogleSignInConfigured(): boolean {
  return Boolean(getClientId())
}

/**
 * Redirige la página completa al consentimiento de Google. Al volver, Google
 * incluye el id_token en el fragmento de la URL (#id_token=...).
 */
export function startGoogleSignIn(): void {
  const clientId = getClientId()
  if (!clientId) return

  const nonce = generateNonce()
  sessionStorage.setItem(NONCE_STORAGE_KEY, nonce)

  const redirectUri = `${window.location.origin}/`
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'id_token',
    scope: 'openid email profile',
    nonce,
    prompt: 'select_account',
  })

  window.location.assign(`${GOOGLE_AUTH_ENDPOINT}?${params.toString()}`)
}

/**
 * Si la URL actual contiene un id_token entregado por Google tras la
 * redirección, lo valida contra el nonce emitido y lo retorna. Limpia el
 * fragmento de la URL en cualquier caso para no dejar el token expuesto.
 */
export function consumeGoogleRedirectCredential(): string | null {
  if (!window.location.hash || window.location.hash.indexOf('id_token=') === -1) {
    return null
  }

  const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''))
  const idToken = hashParams.get('id_token')

  const expectedNonce = sessionStorage.getItem(NONCE_STORAGE_KEY)
  sessionStorage.removeItem(NONCE_STORAGE_KEY)
  window.history.replaceState(null, '', window.location.pathname + window.location.search)

  if (!idToken || !expectedNonce) return null

  try {
    const payload = jwtDecode<GoogleIdTokenWithNonce>(idToken)
    if (payload.nonce !== expectedNonce) return null
  } catch {
    return null
  }

  return idToken
}
