import { useState, useCallback } from 'react'
import Dropzone from './components/Dropzone.jsx'
import BWConverter from './components/BWConverter.jsx'
import DominantColors from './components/DominantColors.jsx'
import KeepFuzz from './components/KeepFuzz.jsx'
import { fileToImageData } from './lib/imageUtils.js'

const TABS = [
  { id: 'bw',     label: 'BW Converter',    emoji: '⬛', activeClass: 'bg-violet-600 text-white' },
  { id: 'colors', label: 'Dominant Colors',  emoji: '🎨', activeClass: 'bg-amber-500 text-white' },
  { id: 'keep',   label: 'Keep + Fuzz',      emoji: '🎯', activeClass: 'bg-teal-600 text-white' },
]

export default function App() {
  const [file, setFile] = useState(null)
  const [imageData, setImageData] = useState(null)
  const [activeTab, setActiveTab] = useState('bw')
  const [preselectedColor, setPreselectedColor] = useState(null)

  const handleImage = useCallback(async (f) => {
    setFile(f)
    setImageData(null)
    const id = await fileToImageData(f)
    setImageData(id)
  }, [])

  const handleColorSelect = (hex) => {
    setPreselectedColor(hex)
    setActiveTab('keep')
  }

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(160deg, #0f0a1e 0%, #1a0f2e 50%, #0a1a1e 100%)' }}>
      {/* Header */}
      <header className="text-center py-10 px-4">
        <div className="inline-flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center text-sm font-bold text-white">
            ◆
          </div>
          <span className="text-white/40 text-sm font-medium tracking-widest uppercase">Image Studio</span>
        </div>
        <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-white mb-3">
          <span className="bg-clip-text text-transparent" style={{ backgroundImage: 'linear-gradient(135deg, #c4b5fd 0%, #f0abfc 40%, #fcd34d 100%)' }}>
            Black &amp; White
          </span>
          <br />
          <span className="text-white/90">Image Tools</span>
        </h1>
        <p className="text-white/40 text-base max-w-sm mx-auto">
          Convert, cluster, and isolate colors — all in your browser.
        </p>
      </header>

      {/* Main */}
      <main className="px-4 pb-16 max-w-2xl mx-auto flex flex-col gap-6">
        {/* Dropzone */}
        <Dropzone onImage={handleImage} currentFile={file} />

        {/* Tab bar */}
        <div className="flex bg-white/5 rounded-2xl p-1 gap-1 border border-white/10">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                flex-1 flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-xl
                text-sm font-semibold transition-all duration-200
                ${activeTab === tab.id
                  ? tab.activeClass + ' shadow-lg'
                  : 'text-white/50 hover:text-white/80 hover:bg-white/5'
                }
              `}
            >
              <span className="text-base leading-none">{tab.emoji}</span>
              <span className="hidden sm:inline">{tab.label}</span>
              <span className="sm:hidden">{tab.label.split(' ')[0]}</span>
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div>
          {activeTab === 'bw'     && <BWConverter   imageData={imageData} />}
          {activeTab === 'colors' && <DominantColors imageData={imageData} onColorSelect={handleColorSelect} />}
          {activeTab === 'keep'   && <KeepFuzz       imageData={imageData} preselectedColor={preselectedColor} />}
        </div>
      </main>
    </div>
  )
}
