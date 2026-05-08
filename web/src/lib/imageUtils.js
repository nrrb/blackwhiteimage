function isHeic(file) {
  if (file.type === 'image/heic' || file.type === 'image/heif') return true
  const name = file.name.toLowerCase()
  return name.endsWith('.heic') || name.endsWith('.heif')
}

async function normalizeFile(file) {
  if (!isHeic(file)) return file
  const heic2any = (await import('heic2any')).default
  const blob = await heic2any({ blob: file, toType: 'image/jpeg', quality: 0.95 })
  return new File([blob], file.name.replace(/\.(heic|heif)$/i, '.jpg'), { type: 'image/jpeg' })
}

/**
 * Load an image File/Blob into an ImageData object via an offscreen canvas.
 * Handles RGBA by compositing onto white (matching Python behavior for BW conversion).
 * Automatically converts HEIC/HEIF files (common iPhone format) to JPEG first.
 */
export async function fileToImageData(file) {
  file = await normalizeFile(file)
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = img.naturalWidth
      canvas.height = img.naturalHeight
      const ctx = canvas.getContext('2d')
      ctx.drawImage(img, 0, 0)
      URL.revokeObjectURL(url)
      resolve(ctx.getImageData(0, 0, canvas.width, canvas.height))
    }
    img.onerror = reject
    img.src = url
  })
}

/**
 * Composite an RGBA ImageData onto a white background, return as RGB ImageData.
 * Matches PIL's `bg.paste(img, mask=img.split()[3])` behavior.
 */
export function compositeOnWhite(imageData) {
  const { data, width, height } = imageData
  const out = new Uint8ClampedArray(width * height * 4)
  for (let i = 0; i < width * height; i++) {
    const o = i * 4
    const a = data[o + 3] / 255
    out[o]     = Math.round(data[o]     * a + 255 * (1 - a))
    out[o + 1] = Math.round(data[o + 1] * a + 255 * (1 - a))
    out[o + 2] = Math.round(data[o + 2] * a + 255 * (1 - a))
    out[o + 3] = 255
  }
  return new ImageData(out, width, height)
}

/** Convert ImageData to a PNG data URL. */
export function imageDataToDataURL(imageData) {
  const canvas = document.createElement('canvas')
  canvas.width = imageData.width
  canvas.height = imageData.height
  canvas.getContext('2d').putImageData(imageData, 0, 0)
  return canvas.toDataURL('image/png')
}

/**
 * Enhance saturation and contrast of an RGB ImageData in place.
 * Matches PIL ImageEnhance.Color (saturation) and ImageEnhance.Contrast (contrast).
 */
export function enhanceImage(imageData, saturation = 3.0, contrast = 1.5) {
  const { data } = imageData
  for (let i = 0; i < data.length; i += 4) {
    let r = data[i] / 255
    let g = data[i + 1] / 255
    let b = data[i + 2] / 255

    // Saturation: blend between grayscale and color
    const gray = 0.299 * r + 0.587 * g + 0.114 * b
    r = gray + (r - gray) * saturation
    g = gray + (g - gray) * saturation
    b = gray + (b - gray) * saturation

    // Contrast: blend between mid-gray (0.5) and color
    r = 0.5 + (r - 0.5) * contrast
    g = 0.5 + (g - 0.5) * contrast
    b = 0.5 + (b - 0.5) * contrast

    data[i]     = Math.min(255, Math.max(0, Math.round(r * 255)))
    data[i + 1] = Math.min(255, Math.max(0, Math.round(g * 255)))
    data[i + 2] = Math.min(255, Math.max(0, Math.round(b * 255)))
  }
  return imageData
}

/**
 * Compute perceived lightness of an RGB triplet (0–100).
 * Matches color_cluster.py `lightness()`.
 */
export function lightness([r, g, b]) {
  return ((0.299 * r + 0.587 * g + 0.114 * b) / 255) * 100
}

export function rgbToHex([r, g, b]) {
  return '#' + [r, g, b].map(v => v.toString(16).padStart(2, '0').toUpperCase()).join('')
}

export function hexToRgb(hex) {
  const h = hex.replace('#', '')
  return [
    parseInt(h.slice(0, 2), 16),
    parseInt(h.slice(2, 4), 16),
    parseInt(h.slice(4, 6), 16),
  ]
}
