import { useState, useEffect, useCallback } from 'react'
import { findDominantColors } from '../lib/colorCluster.js'
import Slider from './Slider.jsx'
import Spinner from './Spinner.jsx'

const ACCENT = '#d97706'

export default function DominantColors({ imageData, onColorSelect }) {
  const [nColors, setNColors] = useState(2)
  const [saturation, setSaturation] = useState(30)
  const [contrast, setContrast] = useState(15)
  const [results, setResults] = useState(null)
  const [loading, setLoading] = useState(false)

  const run = useCallback(async () => {
    if (!imageData) return
    setLoading(true)
    setResults(null)
    try {
      const colors = await findDominantColors(imageData, nColors, saturation / 10, contrast / 10)
      setResults(colors)
    } finally {
      setLoading(false)
    }
  }, [imageData, nColors, saturation, contrast])

  useEffect(() => {
    if (imageData) run()
  }, [imageData]) // eslint-disable-line react-hooks/exhaustive-deps

  if (!imageData) {
    return (
      <div className="text-center py-16 text-white/30">
        <p className="text-4xl mb-3">🎨</p>
        <p>Drop an image above to get started</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Controls */}
      <div className="bg-white/5 rounded-2xl p-5 flex flex-col gap-4 border border-white/10">
        <Slider label="Number of colors" value={nColors} min={2} max={10} onChange={setNColors} accent={ACCENT} />
        <Slider label="Saturation boost" value={saturation} min={10} max={80} step={1} onChange={setSaturation} accent={ACCENT} unit="×0.1" />
        <Slider label="Contrast boost"   value={contrast}   min={10} max={40} step={1} onChange={setContrast}   accent={ACCENT} unit="×0.1" />

        <button
          onClick={run}
          disabled={loading}
          className="mt-1 w-full py-2.5 rounded-xl font-semibold text-sm transition-all active:scale-[0.98] disabled:opacity-50"
          style={{ background: 'linear-gradient(135deg, #d97706, #f59e0b)' }}
        >
          {loading ? 'Clustering…' : 'Find Colors'}
        </button>
      </div>

      {loading && <Spinner color={ACCENT} />}

      {results && (
        <div className="flex flex-col gap-3">
          <p className="text-xs text-white/40 uppercase tracking-wider font-semibold px-1">
            Click a swatch to use it in Keep + Fuzz
          </p>
          {results.map((c, i) => (
            <button
              key={i}
              onClick={() => onColorSelect(c.hex)}
              className="flex items-center gap-4 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-amber-500/40 rounded-2xl p-4 text-left transition-all active:scale-[0.99] group"
            >
              {/* Swatch */}
              <div
                className="w-14 h-14 rounded-xl flex-shrink-0 shadow-lg ring-2 ring-white/10 group-hover:ring-amber-400/40 transition-all"
                style={{ backgroundColor: c.hex }}
              />

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-white truncate">{c.name}</p>
                <p className="text-sm text-white/50 mt-0.5 font-mono">{c.hex}</p>
              </div>

              {/* Bar + pct */}
              <div className="flex flex-col items-end gap-1 flex-shrink-0">
                <span className="text-sm font-bold tabular-nums" style={{ color: '#fcd34d' }}>
                  {c.pct.toFixed(1)}%
                </span>
                <div className="w-20 h-2 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${c.pct}%`, backgroundColor: c.hex }}
                  />
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
