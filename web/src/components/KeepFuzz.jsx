import { useState, useEffect, useCallback } from 'react'
import { keepColor } from '../lib/keepFuzz.js'
import Slider from './Slider.jsx'
import ImageTile from './ImageTile.jsx'
import Spinner from './Spinner.jsx'

const ACCENT = '#0d9488'

export default function KeepFuzz({ imageData, preselectedColor }) {
  const [keepHex, setKeepHex] = useState('#ff0000')
  const [fuzz, setFuzz] = useState(60)
  const [saturation, setSaturation] = useState(30)
  const [contrast, setContrast] = useState(15)
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)

  // Accept color passed in from DominantColors tab
  useEffect(() => {
    if (preselectedColor) setKeepHex(preselectedColor)
  }, [preselectedColor])

  const run = useCallback(() => {
    if (!imageData) return
    setLoading(true)
    setResult(null)
    setTimeout(() => {
      try {
        const dataUrl = keepColor(imageData, keepHex, fuzz, saturation / 10, contrast / 10)
        setResult(dataUrl)
      } finally {
        setLoading(false)
      }
    }, 20)
  }, [imageData, keepHex, fuzz, saturation, contrast])

  if (!imageData) {
    return (
      <div className="text-center py-16 text-white/30">
        <p className="text-4xl mb-3">🎯</p>
        <p>Drop an image above to get started</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Controls */}
      <div className="bg-white/5 rounded-2xl p-5 flex flex-col gap-4 border border-white/10">
        {/* Color picker */}
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-white/70">Keep color</label>
          <div className="flex items-center gap-2">
            {/* Swatch + native picker */}
            <div
              className="w-10 h-10 rounded-xl ring-2 ring-white/20 flex-shrink-0 relative overflow-hidden cursor-pointer"
              style={{ backgroundColor: keepHex }}
              title="Click to open color picker"
            >
              <input
                type="color"
                value={keepHex}
                onChange={e => setKeepHex(e.target.value)}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
            </div>
            {/* Hex text input */}
            <input
              type="text"
              value={keepHex}
              onChange={e => {
                const v = e.target.value
                if (/^#[0-9a-fA-F]{0,6}$/.test(v)) setKeepHex(v)
              }}
              className="flex-1 bg-white/10 text-white font-mono text-sm px-3 py-2 rounded-xl border border-white/20 focus:outline-none focus:border-teal-400"
            />
          </div>
        </div>

        <Slider label="Fuzz (color tolerance)" value={fuzz} min={1} max={150} onChange={setFuzz} accent={ACCENT} />
        <Slider label="Saturation boost" value={saturation} min={10} max={80} step={1} onChange={setSaturation} accent={ACCENT} unit="×0.1" />
        <Slider label="Contrast boost"   value={contrast}   min={10} max={40} step={1} onChange={setContrast}   accent={ACCENT} unit="×0.1" />

        <button
          onClick={run}
          disabled={loading}
          className="mt-1 w-full py-2.5 rounded-xl font-semibold text-sm transition-all active:scale-[0.98] disabled:opacity-50"
          style={{ background: 'linear-gradient(135deg, #0d9488, #14b8a6)' }}
        >
          {loading ? 'Processing…' : 'Apply'}
        </button>
      </div>

      {loading && <Spinner color={ACCENT} />}
      {result && <ImageTile src={result} label="Color isolated" accentColor={ACCENT} />}
    </div>
  )
}
