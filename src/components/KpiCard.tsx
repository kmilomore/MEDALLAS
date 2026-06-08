type KpiCardProps = {
  label: string
  value: string | number
  hint?: string
  tone?: 'navy' | 'royal' | 'coral' | 'neutral'
}

const TONE_STYLES: Record<NonNullable<KpiCardProps['tone']>, string> = {
  navy: 'text-navy-500',
  royal: 'text-royal-500',
  coral: 'text-coral-600',
  neutral: 'text-neutral-700',
}

export default function KpiCard({ label, value, hint, tone = 'navy' }: KpiCardProps) {
  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm transition hover:shadow-md">
      <p className="text-[11px] font-bold uppercase tracking-wider text-neutral-500">{label}</p>
      <p className={`mt-1.5 text-[28px] font-extrabold leading-none tracking-tight ${TONE_STYLES[tone]}`}>{value}</p>
      {hint && <p className="mt-1.5 text-xs font-medium text-neutral-500">{hint}</p>}
    </div>
  )
}
