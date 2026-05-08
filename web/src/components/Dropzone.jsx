import { useRef, useState, useCallback, useEffect } from 'react'

const ACCEPT = ['image/png', 'image/jpeg', 'image/webp', 'image/gif', 'image/heic', 'image/heif']

export default function Dropzone({ onImage, currentFile }) {
  const [dragging, setDragging] = useState(false)
  const [previewUrl, setPreviewUrl] = useState(null)
  const inputRef = useRef(null)

  useEffect(() => {
    if (!currentFile) { setPreviewUrl(null); return }
    const url = URL.createObjectURL(currentFile)
    setPreviewUrl(url)
    return () => URL.revokeObjectURL(url)
  }, [currentFile])

  const handleFile = useCallback((file) => {
    if (!file || !ACCEPT.includes(file.type)) return
    onImage(file)
  }, [onImage])

  const onDrop = (e) => {
    e.preventDefault()
    setDragging(false)
    handleFile(e.dataTransfer.files[0])
  }

  const onDragOver = (e) => { e.preventDefault(); setDragging(true) }
  const onDragLeave = () => setDragging(false)
  const onInputChange = (e) => handleFile(e.target.files[0])

  if (currentFile && previewUrl) {
    return (
      <div
        onDrop={onDrop}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        className={`
          relative rounded-2xl border-2 overflow-hidden transition-all duration-200
          ${dragging ? 'border-violet-400 scale-[1.01]' : 'border-violet-500/40'}
        `}
      >
        <img
          src={previewUrl}
          alt={currentFile.name}
          className="w-full object-contain max-h-64 block"
        />
        <button
          onClick={() => inputRef.current?.click()}
          className="absolute top-2 right-2 bg-black/60 hover:bg-black/80 text-white text-xs font-semibold px-3 py-1.5 rounded-xl backdrop-blur-sm border border-white/20 transition-all"
        >
          Replace
        </button>
        {dragging && (
          <div className="absolute inset-0 bg-violet-500/30 flex items-center justify-center">
            <p className="text-white font-semibold text-lg">Drop to replace</p>
          </div>
        )}
        <input ref={inputRef} type="file" accept={ACCEPT.join(',')} onChange={onInputChange} className="sr-only" />
      </div>
    )
  }

  return (
    <div
      onClick={() => inputRef.current?.click()}
      onDrop={onDrop}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      className={`
        relative cursor-pointer rounded-2xl border-2 border-dashed transition-all duration-200
        flex flex-col items-center justify-center gap-3 p-8 text-center select-none
        ${dragging
          ? 'border-violet-400 bg-violet-500/10 scale-[1.01]'
          : 'border-white/20 bg-white/3 hover:border-white/40 hover:bg-white/5'
        }
      `}
      style={{ minHeight: 140 }}
    >
      <input ref={inputRef} type="file" accept={ACCEPT.join(',')} onChange={onInputChange} className="sr-only" />
      <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-500/30 to-fuchsia-500/30 flex items-center justify-center text-3xl">
        ↑
      </div>
      <div>
        <p className="font-semibold text-white text-lg">Drop an image here</p>
        <p className="text-sm text-white/50 mt-1">PNG, JPG, WebP, HEIC — or click to browse</p>
      </div>
    </div>
  )
}
