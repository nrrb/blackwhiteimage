import { compositeOnWhite, imageDataToDataURL } from './imageUtils.js'

/**
 * Apply a 3×3 median filter to a grayscale Uint8ClampedArray.
 * Matches PIL.ImageFilter.MedianFilter(size=3).
 */
function medianFilter3(gray, width, height) {
  const out = new Uint8ClampedArray(gray.length)
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const neighbors = []
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          const ny = Math.min(height - 1, Math.max(0, y + dy))
          const nx = Math.min(width - 1, Math.max(0, x + dx))
          neighbors.push(gray[ny * width + nx])
        }
      }
      neighbors.sort((a, b) => a - b)
      out[y * width + x] = neighbors[4] // median of 9
    }
  }
  return out
}

/**
 * Convert an ImageData to BW using a darkness threshold (0–100).
 * Returns { plain, transparent, inverted } as data URLs.
 * Matches bw_convert.py behavior exactly.
 */
export function bwConvert(imageData, threshold, despeckle = true) {
  const { width, height } = imageData

  // Composite onto white if needed
  const rgb = compositeOnWhite(imageData)
  const src = rgb.data

  // Grayscale
  const gray = new Uint8ClampedArray(width * height)
  for (let i = 0; i < width * height; i++) {
    const o = i * 4
    gray[i] = Math.round(0.299 * src[o] + 0.587 * src[o + 1] + 0.114 * src[o + 2])
  }

  // Threshold: cutoff = 255 * (1 - threshold/100)
  const cutoff = 255 * (1 - threshold / 100)
  let bw = new Uint8ClampedArray(width * height)
  for (let i = 0; i < gray.length; i++) {
    bw[i] = gray[i] < cutoff ? 0 : 255
  }

  if (despeckle) {
    bw = medianFilter3(bw, width, height)
  }

  // 1. Plain BW (RGB)
  const plainData = new Uint8ClampedArray(width * height * 4)
  for (let i = 0; i < width * height; i++) {
    const o = i * 4
    plainData[o] = plainData[o + 1] = plainData[o + 2] = bw[i]
    plainData[o + 3] = 255
  }
  const plain = imageDataToDataURL(new ImageData(plainData, width, height))

  // 2. BW with white → transparent (black visible on clear)
  const transData = new Uint8ClampedArray(width * height * 4)
  for (let i = 0; i < width * height; i++) {
    const o = i * 4
    transData[o] = transData[o + 1] = transData[o + 2] = bw[i]
    transData[o + 3] = bw[i] === 255 ? 0 : 255
  }
  const transparent = imageDataToDataURL(new ImageData(transData, width, height))

  // 3. Inverted BW with black → transparent (white visible on clear)
  const invData = new Uint8ClampedArray(width * height * 4)
  for (let i = 0; i < width * height; i++) {
    const o = i * 4
    const v = 255 - bw[i]
    invData[o] = invData[o + 1] = invData[o + 2] = v
    invData[o + 3] = v === 0 ? 0 : 255
  }
  const inverted = imageDataToDataURL(new ImageData(invData, width, height))

  return { plain, transparent, inverted }
}
