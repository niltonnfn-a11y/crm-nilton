'use client'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-slate-50 p-6 text-center">
      <p className="text-slate-700">
        Não foi possível carregar esta página. Verifique sua conexão e tente novamente.
      </p>
      <button onClick={() => reset()} className="rounded bg-slate-900 px-4 py-2 text-sm text-white">
        Tentar novamente
      </button>
    </div>
  )
}
