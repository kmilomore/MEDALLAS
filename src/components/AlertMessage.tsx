type AlertTone = 'success' | 'error' | 'info' | 'warning'

type AlertMessageProps = {
  tone: AlertTone
  title?: string
  children: React.ReactNode
  onClose?: () => void
}

const TONE_STYLES: Record<AlertTone, string> = {
  success: 'bg-[#E3F5EB] text-[#1F8A5B] border-[#1F8A5B]/25',
  error: 'bg-coral-50 text-coral-700 border-coral-500/30',
  info: 'bg-royal-50 text-royal-700 border-royal-500/25',
  warning: 'bg-[#FFF1D6] text-[#8A5400] border-[#8A5400]/25',
}

export default function AlertMessage({ tone, title, children, onClose }: AlertMessageProps) {
  return (
    <div className={`flex items-start gap-3 rounded-xl border px-4 py-3.5 text-sm ${TONE_STYLES[tone]}`}>
      <div className="flex-1">
        {title && <p className="mb-0.5 font-extrabold">{title}</p>}
        <p className="leading-relaxed font-medium">{children}</p>
      </div>
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          aria-label="Cerrar mensaje"
          className="shrink-0 rounded-md px-1.5 py-0.5 text-base font-bold leading-none opacity-60 transition hover:opacity-100"
        >
          ×
        </button>
      )}
    </div>
  )
}
