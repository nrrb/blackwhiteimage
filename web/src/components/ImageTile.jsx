export default function ImageTile({ src, label, accentColor = '#7c3aed' }) {
  const download = () => {
    const a = document.createElement('a')
    a.href = src
    a.download = label.toLowerCase().replace(/\s+/g, '_') + '.png'
    a.click()
  }

  return (
    <div className="rounded-xl overflow-hidden bg-white/5 border border-white/10 flex flex-col">
      <div className="checker flex-1 flex items-center justify-center p-3 min-h-32">
        <img
          src={src}
          alt={label}
          className="max-w-full max-h-64 object-contain rounded"
        />
      </div>
      <div className="flex items-center justify-between px-3 py-2 border-t border-white/10">
        <span className="text-xs text-white/60 font-medium">{label}</span>
        <button
          onClick={download}
          className="text-xs font-semibold px-3 py-1 rounded-lg transition-all active:scale-95"
          style={{
            backgroundColor: accentColor + '30',
            color: accentColor,
            border: `1px solid ${accentColor}50`,
          }}
        >
          Save ↓
        </button>
      </div>
    </div>
  )
}
