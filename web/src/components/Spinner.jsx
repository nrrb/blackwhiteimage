export default function Spinner({ color = '#7c3aed' }) {
  return (
    <div className="flex flex-col items-center gap-3 py-12">
      <div
        className="w-10 h-10 rounded-full border-4 border-t-transparent animate-spin"
        style={{ borderColor: `${color}44`, borderTopColor: color }}
      />
      <p className="text-sm text-white/50">Processing…</p>
    </div>
  )
}
