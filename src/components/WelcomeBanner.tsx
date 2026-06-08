type WelcomeBannerProps = {
  name: string | null
  email: string
}

function getInitials(name: string | null, email: string): string {
  const source = name?.trim() || email
  const parts = source.split(/[\s@.]+/).filter(Boolean)
  const initials = parts.slice(0, 2).map((part) => part[0]?.toUpperCase() ?? '')
  return initials.join('') || '?'
}

export default function WelcomeBanner({ name, email }: WelcomeBannerProps) {
  return (
    <section className="flex items-center gap-4 rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm sm:p-6">
      <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-royal-50 text-base font-extrabold text-royal-600">
        {getInitials(name, email)}
      </span>
      <div className="min-w-0">
        <p className="text-[11px] font-bold uppercase tracking-wider text-neutral-500">Bienvenido(a)</p>
        <h2 className="truncate text-lg font-extrabold tracking-tight text-navy-500" title={name ?? email}>
          {name ?? email}
        </h2>
        {name && (
          <p className="truncate text-xs font-medium text-neutral-500" title={email}>
            {email}
          </p>
        )}
      </div>
    </section>
  )
}
