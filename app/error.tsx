"use client"

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 p-6 bg-[#1a1440] text-white">
      <h1 className="text-lg font-bold text-center">Не удалось загрузить игру</h1>
      <p className="text-sm text-white/80 text-center max-w-md break-words">
        {error.message || "Неизвестная ошибка"}
      </p>
      <button
        type="button"
        onClick={() => reset()}
        className="rounded-xl bg-cyan-500 px-5 py-2.5 text-sm font-bold text-slate-950 hover:bg-cyan-400"
      >
        Попробовать снова
      </button>
    </div>
  )
}
