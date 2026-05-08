import { useState, useEffect, useCallback } from 'react'
import { bwConvert } from '../lib/bwConvert.js'
import Slider from './Slider.jsx'
import ImageTile from './ImageTile.jsx'
import Spinner from './Spinner.jsx'

const ACCENT = '#7c3aed'

export default function BWConverter({ imageData }) {
  const [threshold, setThreshold] = useState(50)
  const [despeckle, setDespeckle] = useState(true)
  const [results, setResults] = useState(null)
  const [loading, setLoading] = useState(false)

  const run = useCallback(() => {
    if (!imageData) return
    setLoading(true)
    setResults(null)
    // Defer to next tick so React renders the spinner first
    setTimeout(() => {
      try {
        const r = bwConvert(imageData, threshold, despeckle)
        setResults(r)
      } finally {
        setLoading(false)
      }
    }, 20)
  }, [imageData, threshold, despeckle])

  // Auto-run when imageData first arrives
  useEffect(() => {
    if (imageData) run()
  }, [imageData]) // eslint-disable-line react-hooks/exhaustive-deps

  if (!imageData) {
    return (
      <div className="text-center py-16 text-white/30">
        <p className="text-4xl mb-3">⬛</p>
        <p>Drop an image above to get started</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Controls */}
      <div className="bg-white/5 rounded-2xl p-5 flex flex-col gap-4 border border-white/10">
        <Slider
          label="Darkness threshold"
          value={threshold}
          min={1}
          max={99}
          onChange={setThreshold}
          accent={ACCENT}
          unit="%"
        />

        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-white/70">Despeckle (median filter)</span>
          <button
            onClick={() => setDespeckle(v => !v)}
            className={`relative w-11 h-6 rounded-full transition-colors duration-200 ${despeckle ? 'bg-violet-500' : 'bg-white/20'}`}
          >
            <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform duration-200 ${despeckle ? 'translate-x-5' : ''}`} />
          </button>
        </div>

        <button
          onClick={run}
          disabled={loading}
          className="mt-1 w-full py-2.5 rounded-xl font-semibold text-sm transition-all active:scale-[0.98] disabled:opacity-50"
          style={{ background: 'linear-gradient(135deg, #7c3aed, #a855f7)' }}
        >
          {loading ? 'Converting…' : 'Convert'}
        </button>
      </div>

      {/* Output */}
      {loading && <Spinner color={ACCENT} />}
      {results && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <ImageTile src={results.plain}       label="Plain BW"         accentColor={ACCENT} />
          <ImageTile src={results.transparent} label="Black on clear"   accentColor={ACCENT} />
          <ImageTile src={results.inverted}    label="White on clear"   accentColor={ACCENT} />
        </div>
      )}
    </div>
  )
}
