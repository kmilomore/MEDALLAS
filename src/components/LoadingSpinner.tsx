type LoadingSpinnerProps = {
  label?: string
}

export default function LoadingSpinner({ label = 'Cargando…' }: LoadingSpinnerProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-10 text-navy-500">
      <span className="h-9 w-9 animate-spin rounded-full border-[3px] border-navy-100 border-t-royal-500" />
      <span className="text-sm font-semibold text-neutral-600">{label}</span>
    </div>
  )
}
