/**
 * Convierte el JSON completo de Lighthouse en el resumen que consume el panel
 * de administración (pestaña "Rendimiento").
 *
 * Uso:
 *   npx --yes lighthouse http://localhost:4173/catalogo \
 *     --chrome-flags="--headless=new" --only-categories=performance,accessibility,best-practices,seo \
 *     --output=json --output-path=./lighthouse-report.json
 *   npm run lighthouse:merge
 */

import fs from 'node:fs'
import path from 'node:path'

const INPUT = path.resolve('lighthouse-report.json')
const REPORT_PATH = path.resolve('public/performance-report.json')

if (!fs.existsSync(INPUT)) {
  console.error(`No encontramos ${INPUT}. Ejecuta primero Lighthouse.`)
  process.exit(1)
}

const lighthouse = JSON.parse(fs.readFileSync(INPUT, 'utf8'))
const categories = {}

Object.entries(lighthouse.categories ?? {}).forEach(([key, value]) => {
  categories[key] = Math.round((value.score ?? 0) * 100)
})

const audits = lighthouse.audits ?? {}
const metrics = {
  'First Contentful Paint': audits['first-contentful-paint']?.displayValue ?? '—',
  'Largest Contentful Paint': audits['largest-contentful-paint']?.displayValue ?? '—',
  'Total Blocking Time': audits['total-blocking-time']?.displayValue ?? '—',
  'Cumulative Layout Shift': audits['cumulative-layout-shift']?.displayValue ?? '—',
  'Speed Index': audits['speed-index']?.displayValue ?? '—',
}

let report = {}
try {
  report = JSON.parse(fs.readFileSync(REPORT_PATH, 'utf8'))
} catch {
  report = { generatedAt: new Date().toISOString() }
}

report.lighthouse = {
  tool: `Lighthouse ${lighthouse.lighthouseVersion ?? ''}`.trim(),
  url: lighthouse.finalDisplayedUrl ?? lighthouse.requestedUrl ?? '',
  fetchedAt: lighthouse.fetchTime ?? new Date().toISOString(),
  categories,
  metrics,
}

fs.mkdirSync(path.dirname(REPORT_PATH), { recursive: true })
fs.writeFileSync(REPORT_PATH, `${JSON.stringify(report, null, 2)}\n`)

console.log(JSON.stringify(report.lighthouse, null, 2))
