import { registrarEvento } from '../services/gasApi'

type AuditActor = {
  email: string
  name: string | null
  role: string | null
}

/**
 * Registra un evento de auditoría a partir de los datos de la sesión activa.
 * Es deliberadamente "fire-and-forget": los errores se silencian para que
 * un fallo al registrar nunca interrumpa el flujo principal del usuario
 * (mismo criterio que ya se usa para el detalle complementario en AdminDashboard).
 */
export function logEvent(actor: AuditActor, accion: string, detalle?: string): void {
  if (!actor.email) return

  void registrarEvento({
    email: actor.email,
    nombre: actor.name,
    rol: actor.role ?? '',
    accion,
    detalle,
  }).catch(() => {})
}
