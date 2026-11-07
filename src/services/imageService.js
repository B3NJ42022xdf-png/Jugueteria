/**
 * Optimización de imágenes en el navegador.
 *
 * Las fotos que sube el administrador (JPG, PNG, etc.) se redimensionan y se
 * convierten a WebP con `canvas.toBlob`. El resultado se compara con el archivo
 * original: si WebP no reduce el peso, se conserva el original para no perder
 * calidad. Los SVG se mantienen intactos porque ya son vectoriales y pesan
 * menos que cualquier versión rasterizada.
 *
 * En producción esta conversión debería ocurrir en el servidor (o en un CDN de
 * imágenes) antes de guardar el archivo definitivo.
 */

import { recordImageOptimization } from './performanceService.js'

const MAX_DIMENSION = 1200
const WEBP_QUALITY = 0.82

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(new Error('No pudimos leer la imagen.'))
    reader.readAsDataURL(file)
  })
}

function loadImage(source) {
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.onload = () => resolve(image)
    image.onerror = () => reject(new Error('No pudimos procesar la imagen.'))
    image.src = source
  })
}

function canvasToBlob(canvas, type, quality) {
  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), type, quality)
  })
}

function blobToDataUrl(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(new Error('No pudimos convertir la imagen.'))
    reader.readAsDataURL(blob)
  })
}

export function formatBytes(bytes) {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 B'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
}

/**
 * Convierte un archivo de imagen a WebP.
 * Devuelve `{ dataUrl, bytesBefore, bytesAfter, savedPercent, optimized,
 * width, height }`.
 */
export async function optimizeImageFile(
  file,
  { maxDimension = MAX_DIMENSION, quality = WEBP_QUALITY } = {},
) {
  if (!file || !String(file.type).startsWith('image/')) {
    throw new Error('Selecciona un archivo de imagen válido.')
  }

  const original = await fileToDataUrl(file)

  // Los SVG ya son vectoriales: convertirlos a WebP solo empeora la calidad.
  if (file.type === 'image/svg+xml') {
    return {
      dataUrl: original,
      bytesBefore: file.size,
      bytesAfter: file.size,
      savedPercent: 0,
      optimized: false,
      width: 0,
      height: 0,
    }
  }

  const image = await loadImage(original)
  const scale = Math.min(
    1,
    maxDimension / Math.max(image.naturalWidth || 1, image.naturalHeight || 1),
  )
  const width = Math.max(1, Math.round((image.naturalWidth || 1) * scale))
  const height = Math.max(1, Math.round((image.naturalHeight || 1) * scale))

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const context = canvas.getContext('2d')

  if (!context) {
    return {
      dataUrl: original,
      bytesBefore: file.size,
      bytesAfter: file.size,
      savedPercent: 0,
      optimized: false,
      width,
      height,
    }
  }

  context.imageSmoothingEnabled = true
  context.imageSmoothingQuality = 'high'
  context.drawImage(image, 0, 0, width, height)

  const blob = await canvasToBlob(canvas, 'image/webp', quality)

  // Navegadores sin soporte de WebP devuelven PNG: conservamos el original.
  if (!blob || blob.type !== 'image/webp' || blob.size >= file.size) {
    return {
      dataUrl: original,
      bytesBefore: file.size,
      bytesAfter: file.size,
      savedPercent: 0,
      optimized: false,
      width,
      height,
    }
  }

  const dataUrl = await blobToDataUrl(blob)
  recordImageOptimization({
    beforeBytes: file.size,
    afterBytes: blob.size,
    sourceType: file.type,
  })

  return {
    dataUrl,
    bytesBefore: file.size,
    bytesAfter: blob.size,
    savedPercent: Math.round((1 - blob.size / file.size) * 100),
    optimized: true,
    width,
    height,
  }
}
