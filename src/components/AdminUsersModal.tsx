import { useEffect, useState } from 'react'
import { createAdmin, deleteAdmin, getAdmins } from '../services/gasApi'
import type { Establishment } from '../types'
import AlertMessage from './AlertMessage'
import LoadingSpinner from './LoadingSpinner'

type AdminUsersModalProps = {
  onClose: () => void
}

const EMAIL_KEY = 'CORREO ELECTRONICO'
const NAME_KEY = 'NOMBRE'
const ROLE_KEY = 'CARGO'
const ACTIVE_KEY = 'ACTIVO'

const inputClass =
  'w-full rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm font-medium text-navy-700 outline-none transition focus:border-royal-500 focus:bg-white focus:ring-2 focus:ring-royal-100'
const labelClass = 'mb-1 block text-[11px] font-bold uppercase tracking-wider text-neutral-500'

function field(admin: Establishment, key: string): string {
  const value = admin[key]
  return value === null || value === undefined ? '' : String(value)
}

export default function AdminUsersModal({ onClose }: AdminUsersModalProps) {
  const [admins, setAdmins] = useState<Establishment[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [role, setRole] = useState('')
  const [active, setActive] = useState('Sí')
  const [submitting, setSubmitting] = useState(false)
  const [formMessage, setFormMessage] = useState<{ tone: 'success' | 'error'; text: string } | null>(null)
  const [removingEmail, setRemovingEmail] = useState<string | null>(null)

  useEffect(() => {
    void loadAdmins()
  }, [])

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  async function loadAdmins() {
    setLoading(true)
    setLoadError(null)
    try {
      const res = await getAdmins()
      if (!res.success) throw new Error(res.message || 'No fue posible obtener la lista de usuarios administradores.')
      setAdmins(res.admins ?? [])
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : 'No fue posible obtener la lista de usuarios administradores.')
    } finally {
      setLoading(false)
    }
  }

  async function handleAddAdmin(event: React.FormEvent) {
    event.preventDefault()
    const trimmedEmail = email.trim()
    if (!trimmedEmail) {
      setFormMessage({ tone: 'error', text: 'Debes indicar el correo electrónico institucional de la persona.' })
      return
    }

    setSubmitting(true)
    setFormMessage(null)
    try {
      const res = await createAdmin({
        [EMAIL_KEY]: trimmedEmail,
        [NAME_KEY]: name.trim(),
        [ROLE_KEY]: role.trim(),
        [ACTIVE_KEY]: active,
      })

      if (!res.success) {
        setFormMessage({ tone: 'error', text: res.message || 'No fue posible agregar al usuario administrador.' })
        return
      }

      setFormMessage({ tone: 'success', text: res.message || 'Usuario administrador agregado correctamente.' })
      setEmail('')
      setName('')
      setRole('')
      setActive('Sí')
      await loadAdmins()
    } catch {
      setFormMessage({ tone: 'error', text: 'No fue posible conectar con el sistema. Intenta nuevamente.' })
    } finally {
      setSubmitting(false)
    }
  }

  async function handleRemoveAdmin(adminEmail: string) {
    if (!adminEmail) return
    setRemovingEmail(adminEmail)
    setLoadError(null)
    try {
      const res = await deleteAdmin(adminEmail)
      if (!res.success) throw new Error(res.message || 'No fue posible eliminar al usuario administrador.')
      setAdmins((prev) => prev.filter((admin) => field(admin, EMAIL_KEY) !== adminEmail))
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : 'No fue posible eliminar al usuario administrador.')
    } finally {
      setRemovingEmail(null)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy-900/60 px-4 py-8 backdrop-blur-sm">
      <div className="flex max-h-[85vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-neutral-200 bg-neutral-100 shadow-xl">
        <div className="flex shrink-0 items-center justify-between gap-4 border-b border-neutral-200 bg-white px-6 py-4">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-royal-500">Panel administrativo</p>
            <h2 className="text-lg font-extrabold tracking-tight text-navy-500">Usuarios administradores</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar gestión de usuarios"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-neutral-200 bg-white text-navy-500 transition hover:bg-neutral-50"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex flex-col gap-5 overflow-y-auto p-5 sm:p-6">
          <form onSubmit={handleAddAdmin} className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
            <h3 className="mb-3 text-sm font-extrabold text-navy-500">Agregar usuario administrador</h3>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className={labelClass}>Correo electrónico institucional (*)</label>
                <input
                  type="email"
                  required
                  placeholder="nombre.apellido@slepcolchagua.cl"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Nombre</label>
                <input type="text" value={name} onChange={(e) => setName(e.target.value)} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Cargo</label>
                <input type="text" value={role} onChange={(e) => setRole(e.target.value)} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Estado</label>
                <select value={active} onChange={(e) => setActive(e.target.value)} className={inputClass}>
                  <option value="Sí">Activo</option>
                  <option value="No">Inactivo</option>
                </select>
              </div>
            </div>

            {formMessage && (
              <div className="mt-3">
                <AlertMessage tone={formMessage.tone === 'success' ? 'success' : 'error'}>{formMessage.text}</AlertMessage>
              </div>
            )}

            <div className="mt-4 flex justify-end">
              <button
                type="submit"
                disabled={submitting}
                className="inline-flex items-center justify-center rounded-lg bg-royal-500 px-5 py-2.5 text-sm font-extrabold text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.12)] transition hover:bg-royal-600 active:translate-y-px active:bg-royal-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submitting ? 'Agregando…' : 'Agregar usuario'}
              </button>
            </div>
          </form>

          <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
            <h3 className="mb-3 text-sm font-extrabold text-navy-500">
              Usuarios con acceso al panel
              <span className="ml-2 text-sm font-semibold text-neutral-500">({admins.length})</span>
            </h3>

            {loadError && (
              <div className="mb-3">
                <AlertMessage tone="error" title="Ocurrió un problema">{loadError}</AlertMessage>
              </div>
            )}

            {loading ? (
              <LoadingSpinner label="Cargando usuarios administradores…" />
            ) : admins.length === 0 ? (
              <p className="text-sm font-medium text-neutral-500">Aún no hay usuarios administradores registrados.</p>
            ) : (
              <div className="overflow-hidden rounded-lg border border-neutral-200">
                <table className="w-full text-left text-xs">
                  <thead className="bg-neutral-100 font-bold uppercase tracking-wider text-neutral-600">
                    <tr>
                      <th className="px-3 py-2">Correo electrónico</th>
                      <th className="px-3 py-2">Nombre</th>
                      <th className="px-3 py-2">Cargo</th>
                      <th className="px-3 py-2">Estado</th>
                      <th className="px-3 py-2 text-right">Acción</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-200">
                    {admins.map((admin) => {
                      const adminEmail = field(admin, EMAIL_KEY)
                      const isActive = /^s/i.test(field(admin, ACTIVE_KEY) || 'sí')
                      return (
                        <tr key={adminEmail}>
                          <td className="px-3 py-2 font-bold text-navy-700">{adminEmail}</td>
                          <td className="px-3 py-2 font-medium text-neutral-700">{field(admin, NAME_KEY) || '—'}</td>
                          <td className="px-3 py-2 font-medium text-neutral-700">{field(admin, ROLE_KEY) || '—'}</td>
                          <td className="px-3 py-2">
                            <span
                              className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold ${
                                isActive ? 'bg-[#E3F5EB] text-[#1F8A5B]' : 'bg-neutral-200 text-neutral-600'
                              }`}
                            >
                              <span className="h-1.5 w-1.5 rounded-full bg-current" />
                              {isActive ? 'Activo' : 'Inactivo'}
                            </span>
                          </td>
                          <td className="px-3 py-2 text-right">
                            <button
                              type="button"
                              onClick={() => handleRemoveAdmin(adminEmail)}
                              disabled={removingEmail === adminEmail}
                              className="text-xs font-bold text-coral-600 transition hover:text-coral-700 hover:underline disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              {removingEmail === adminEmail ? 'Eliminando…' : 'Eliminar'}
                            </button>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
