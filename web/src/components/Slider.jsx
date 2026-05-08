export default function Slider({ label, value, min, max, step = 1, onChange, accent = '#7c3aed', unit = '' }) {
  const pct = ((value - min) / (max - min)) * 100

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex justify-between items-center">
        <label className="text-sm font-medium text-white/70">{label}</label>
        <span className="text-sm font-bold tabular-nums" style={{ color: accent === '#7c3aed' ? '#c4b5fd' : accent === '#d97706' ? '#fcd34d' : '#5eead4' }}>
          {value}{unit}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={e => onChange(Number(e.target.value))}
        style={{
          background: `linear-gradient(to right, ${accent} ${pct}%, rgba(255,255,255,0.15) ${pct}%)`,
          color: accent,
        }}
        className="w-full"
      />
    </div>
  )
}
