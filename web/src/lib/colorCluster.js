import { enhanceImage, lightness, rgbToHex, imageDataToDataURL } from './imageUtils.js'

let colorDb = null

async function loadColorDb() {
  if (colorDb) return colorDb
  const res = await fetch('/colornames.json')
  const payload = await res.json()
  const entries = payload.colors
  colorDb = {
    rgb: entries.map(e => [e.rgb.r, e.rgb.g, e.rgb.b]),
    names: entries.map(e => e.name),
  }
  return colorDb
}

export async function nearestColorName(rgb) {
  const db = await loadColorDb()
  let best = 0
  let bestDist = Infinity
  for (let i = 0; i < db.rgb.length; i++) {
    const dr = db.rgb[i][0] - rgb[0]
    const dg = db.rgb[i][1] - rgb[1]
    const db2 = db.rgb[i][2] - rgb[2]
    const d = dr * dr + dg * dg + db2 * db2
    if (d < bestDist) { bestDist = d; best = i }
  }
  return db.names[best]
}

/**
 * Simple Lloyd's k-means on a Float32Array of shape (N, 3).
 * Returns { centers: number[][], labels: Int32Array }.
 */
function kMeans(pixels, k, maxIter = 20) {
  const n = pixels.length / 3

  // K-means++ seeding
  const usedIdx = new Set()
  const centers = []
  const firstIdx = Math.floor(Math.random() * n)
  usedIdx.add(firstIdx)
  centers.push([pixels[firstIdx * 3], pixels[firstIdx * 3 + 1], pixels[firstIdx * 3 + 2]])

  while (centers.length < k) {
    const dists = new Float32Array(n)
    for (let i = 0; i < n; i++) {
      let minD = Infinity
      for (const c of centers) {
        const dr = pixels[i * 3] - c[0]
        const dg = pixels[i * 3 + 1] - c[1]
        const db = pixels[i * 3 + 2] - c[2]
        const d = dr * dr + dg * dg + db * db
        if (d < minD) minD = d
      }
      dists[i] = minD
    }
    let sum = 0
    for (let i = 0; i < n; i++) sum += dists[i]
    let r = Math.random() * sum
    let chosen = n - 1
    for (let i = 0; i < n; i++) {
      r -= dists[i]
      if (r <= 0) { chosen = i; break }
    }
    centers.push([pixels[chosen * 3], pixels[chosen * 3 + 1], pixels[chosen * 3 + 2]])
  }

  const labels = new Int32Array(n)

  for (let iter = 0; iter < maxIter; iter++) {
    // Assign
    let changed = false
    for (let i = 0; i < n; i++) {
      let bestC = 0, bestD = Infinity
      for (let c = 0; c < k; c++) {
        const dr = pixels[i * 3] - centers[c][0]
        const dg = pixels[i * 3 + 1] - centers[c][1]
        const db = pixels[i * 3 + 2] - centers[c][2]
        const d = dr * dr + dg * dg + db * db
        if (d < bestD) { bestD = d; bestC = c }
      }
      if (labels[i] !== bestC) { labels[i] = bestC; changed = true }
    }
    if (!changed) break

    // Update centers
    const sums = Array.from({ length: k }, () => [0, 0, 0])
    const counts = new Int32Array(k)
    for (let i = 0; i < n; i++) {
      const c = labels[i]
      sums[c][0] += pixels[i * 3]
      sums[c][1] += pixels[i * 3 + 1]
      sums[c][2] += pixels[i * 3 + 2]
      counts[c]++
    }
    for (let c = 0; c < k; c++) {
      if (counts[c] > 0) {
        centers[c] = [sums[c][0] / counts[c], sums[c][1] / counts[c], sums[c][2] / counts[c]]
      }
    }
  }

  return { centers, labels }
}

/**
 * Find dominant colors in an ImageData.
 * Returns array of { rgb, hex, name, count, pct, lightness } sorted by count desc.
 */
export async function findDominantColors(imageData, nColors = 2, saturation = 3.0, contrast = 1.5) {
  const { width, height } = imageData

  // Clone and enhance
  const enhanced = new ImageData(
    new Uint8ClampedArray(imageData.data),
    width,
    height,
  )
  enhanceImage(enhanced, saturation, contrast)

  // Downsample to ~10k pixels for speed
  const total = width * height
  const step = Math.max(1, Math.floor(total / 10000))
  const sampled = []
  for (let i = 0; i < total; i += step) {
    const o = i * 4
    sampled.push(enhanced.data[o], enhanced.data[o + 1], enhanced.data[o + 2])
  }
  const pixels = new Float32Array(sampled)

  const { centers, labels } = kMeans(pixels, nColors)

  // Count pixels per cluster
  const counts = new Int32Array(nColors)
  for (let i = 0; i < labels.length; i++) counts[labels[i]]++

  // Sort by count descending
  const indices = Array.from({ length: nColors }, (_, i) => i)
    .sort((a, b) => counts[b] - counts[a])

  const totalSampled = labels.length
  const results = await Promise.all(
    indices.map(async (ci) => {
      const rgb = centers[ci].map(v => Math.min(255, Math.max(0, Math.round(v))))
      const name = await nearestColorName(rgb)
      return {
        rgb,
        hex: rgbToHex(rgb),
        name,
        count: counts[ci],
        pct: (counts[ci] / totalSampled) * 100,
        lightness: lightness(rgb),
      }
    })
  )

  return results
}
