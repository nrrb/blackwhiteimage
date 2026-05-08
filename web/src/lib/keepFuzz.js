import { enhanceImage, hexToRgb, imageDataToDataURL } from './imageUtils.js'

/**
 * Keep only pixels within `fuzz` Euclidean RGB distance of `keepHex`.
 * Everything else becomes transparent.
 * Matches color_cluster.py `keep_color()`.
 */
export function keepColor(imageData, keepHex, fuzz, saturation = 3.0, contrast = 1.5) {
  const { width, height } = imageData
  const keepRgb = hexToRgb(keepHex)

  // Clone and enhance
  const enhanced = new ImageData(
    new Uint8ClampedArray(imageData.data),
    width,
    height,
  )
  enhanceImage(enhanced, saturation, contrast)

  // Build RGBA output: mask pixels far from keepRgb
  const out = new Uint8ClampedArray(width * height * 4)
  for (let i = 0; i < width * height; i++) {
    const o = i * 4
    const dr = enhanced.data[o]     - keepRgb[0]
    const dg = enhanced.data[o + 1] - keepRgb[1]
    const db = enhanced.data[o + 2] - keepRgb[2]
    const dist = Math.sqrt(dr * dr + dg * dg + db * db)

    out[o]     = enhanced.data[o]
    out[o + 1] = enhanced.data[o + 1]
    out[o + 2] = enhanced.data[o + 2]
    out[o + 3] = dist > fuzz ? 0 : 255
  }

  return imageDataToDataURL(new ImageData(out, width, height))
}
