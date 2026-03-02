'use client'

interface SpoilerToggleProps {
  revealed: boolean
  onToggle: () => void
  label?: string
}

export function SpoilerToggle({ revealed, onToggle, label }: SpoilerToggleProps) {
  return (
    <button
      onClick={onToggle}
      className={`text-sm px-4 py-2 rounded-lg font-semibold transition-colors ${
        revealed
          ? 'bg-zinc-700 text-zinc-300 hover:bg-zinc-600'
          : 'bg-red-600 text-white hover:bg-red-700'
      }`}
    >
      {revealed ? (label ?? '🙈 Hide Results') : (label ?? '👁️ Reveal Result')}
    </button>
  )
}
