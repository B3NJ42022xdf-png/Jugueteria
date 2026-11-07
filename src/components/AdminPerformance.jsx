import { useEffect, useState } from 'react'
import { formatBytes } from '../services/imageService.js'
import {
  PERFORMANCE_BUDGETS,
  clearMetrics,
  getNavigationTiming,
  getPerformanceSnapshot,
  runPerformanceBenchmark,
} from '../services/performanceService.js'

const dateTimeFormatter = new Intl.DateTimeFormat('es-CO', {
  dateStyle: 'medium',
  timeStyle: 'short',
})

function formatMs(value) {
  if (!Number.isFinite(value)) return '—'
  if (value >= 1000) return `${(value / 1000).toFixed(2)} s`
  return `${value.toFixed(1)} ms`
}

function formatDateTime(value) {
  if (!value) return '—'
  try {
    return dateTimeFormatter.format(new Date(value))
  } catch {
    return '—'
  }
}

function CheckIcon({ className = 'h-4 w-4' }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="m5 12 4 4L19 6" />
    </svg>
  )
}

function AlertIcon({ className = 'h-4 w-4' }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="M12 3 2.5 20h19L12 3Z" />
      <path d="M12 9v5" />
      <path d="M12 17.5h.01" />
    </svg>
  )
}

function GaugeIcon({ className = 'h-4 w-4' }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="M4 19a9 9 0 1 1 16 0" />
      <path d="m12 13 4-4" />
      <circle cx="12" cy="13" r="1.4" />
    </svg>
  )
}

function BudgetCard({ label, value, budget, passed, detail }) {
  return (
    <div
      className={`rounded-2xl border p-4 shadow-sm ${
        passed
          ? 'border-emerald-200 bg-emerald-50'
          : 'border-rose-200 bg-rose-50'
      }`}
    >
      <p className="text-[10px] font-black uppercase tracking-wide text-slate-500">
        {label}
      </p>
      <p
        className={`mt-1 text-2xl font-black ${
          passed ? 'text-emerald-700' : 'text-rose-700'
        }`}
      >
        {value}
      </p>
      <p className="mt-0.5 text-[10px] font-semibold text-slate-500">
        Presupuesto ≤ {budget}
      </p>
      {detail && (
        <p className="mt-1 text-[10px] text-slate-400">{detail}</p>
      )}
    </div>
  )
}

export default function AdminPerformance() {
  const [snapshot, setSnapshot] = useState(() => getPerformanceSnapshot())
  const [benchmark, setBenchmark] = useState(null)
  const [running, setRunning] = useState(false)
  const [error, setError] = useState('')
  const [report, setReport] = useState(null)
  const [reportError, setReportError] = useState('')
  const navigation = getNavigationTiming()

  useEffect(() => {
    let active = true

    fetch('/performance-report.json', { cache: 'no-store' })
      .then((response) => {
        if (!response.ok) throw new Error('Sin reporte')
        return response.json()
      })
      .then((data) => {
        if (active) setReport(data)
      })
      .catch(() => {
        if (active) setReportError('Todavía no hay un reporte de Lighthouse.')
      })

    return () => {
      active = false
    }
  }, [])

  async function handleBenchmark() {
    setRunning(true)
    setError('')

    try {
      const result = await runPerformanceBenchmark({ iterations: 5 })
      setBenchmark(result)
      setSnapshot(getPerformanceSnapshot())
    } catch (benchmarkError) {
      setError(
        benchmarkError instanceof Error
          ? benchmarkError.message
          : 'No pudimos ejecutar el benchmark.',
      )
    } finally {
      setRunning(false)
    }
  }

  function handleClear() {
    clearMetrics()
    setBenchmark(null)
    setSnapshot(getPerformanceSnapshot())
  }

  const { budgetStatus, catalog, request, search, images } = snapshot
  const lighthouse = report?.lighthouse

  return (
    <section aria-labelledby="rendimiento-title">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2
            id="rendimiento-title"
            className="flex items-center gap-2 text-xl font-black tracking-tight text-slate-900"
          >
            <GaugeIcon className="h-5 w-5 text-violet-600" />
            Rendimiento y caché
          </h2>
          <p className="text-xs text-slate-500">
            Evidencia en vivo de los presupuestos: catálogo ≤ 2 s, peticiones
            asíncronas ≤ 1 s y búsquedas ≤ 250 ms.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={handleBenchmark}
            disabled={running}
            className="rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-500 px-4 py-2.5 text-xs font-black text-white shadow-lg shadow-fuchsia-500/20 transition hover:from-violet-700 hover:to-fuchsia-600 disabled:cursor-wait disabled:opacity-60"
          >
            {running ? 'Midiendo…' : 'Ejecutar benchmark'}
          </button>
          <button
            type="button"
            onClick={handleClear}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-black text-slate-600 shadow-sm transition hover:bg-slate-50"
          >
            Limpiar métricas
          </button>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <BudgetCard
          label="Catálogo (p95)"
          value={catalog.count ? formatMs(catalog.p95) : 'Sin datos'}
          budget={formatMs(PERFORMANCE_BUDGETS.catalogLoadMs)}
          passed={budgetStatus.catalog}
          detail={`${catalog.count} carga(s) · máx ${formatMs(catalog.max)}`}
        />
        <BudgetCard
          label="API asíncrona (p95)"
          value={request.count ? formatMs(request.p95) : 'Sin datos'}
          budget={formatMs(PERFORMANCE_BUDGETS.asyncRequestMs)}
          passed={budgetStatus.request}
          detail={`${request.count} petición(es) · máx ${formatMs(request.max)}`}
        />
        <BudgetCard
          label="Búsqueda (p95)"
          value={search.count ? formatMs(search.p95) : 'Sin datos'}
          budget={formatMs(PERFORMANCE_BUDGETS.searchMs)}
          passed={budgetStatus.search}
          detail={`${search.count} búsqueda(s) · máx ${formatMs(search.max)}`}
        />
        <BudgetCard
          label="Ahorro WebP"
          value={images.count ? `${images.savedPercent.toFixed(0)} %` : 'Sin datos'}
          budget="imágenes visibles"
          passed={images.count === 0 || images.savedPercent >= 0}
          detail={
            images.count
              ? `${images.count} imagen(es) · ${formatBytes(
                  images.savedBytes,
                )} ahorrados`
              : 'Sube una foto JPG/PNG desde Inventario'
          }
        />
      </div>

      {error && (
        <p
          role="alert"
          className="mt-3 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700"
        >
          {error}
        </p>
      )}

      {benchmark && (
        <div
          className={`mt-4 rounded-2xl border p-4 ${
            benchmark.passed
              ? 'border-emerald-200 bg-emerald-50'
              : 'border-amber-200 bg-amber-50'
          }`}
        >
          <p className="flex items-center gap-1.5 text-sm font-black text-slate-800">
            {benchmark.passed ? (
              <CheckIcon className="h-4 w-4 text-emerald-700" />
            ) : (
              <AlertIcon className="h-4 w-4 text-amber-700" />
            )}
            {benchmark.passed
              ? 'Todos los presupuestos se cumplen'
              : 'Algún presupuesto quedó por encima del límite'}
          </p>
          <div className="mt-2 grid gap-1.5 sm:grid-cols-2">
            {benchmark.runs.map((run, index) => (
              <p
                key={`${run.name}-${index}`}
                className="flex items-center justify-between gap-2 rounded-lg bg-white/70 px-2.5 py-1.5 text-[11px] font-semibold text-slate-600"
              >
                <span className="truncate">{run.name}</span>
                <span
                  className={`shrink-0 font-black ${
                    run.passed ? 'text-emerald-700' : 'text-rose-700'
                  }`}
                >
                  {formatMs(run.durationMs)}
                </span>
              </p>
            ))}
          </div>
          <p className="mt-2 text-[10px] text-slate-500">
            Caché: {benchmark.cache.memoryHits} aciertos en memoria ·{' '}
            {benchmark.cache.sessionHits} en sessionStorage ·{' '}
            {benchmark.cache.loads} carga(s) reales · benchmark ejecutado el{' '}
            {formatDateTime(benchmark.ranAt)}.
          </p>
        </div>
      )}

      <div className="mt-5 grid gap-4 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-4 py-3">
            <h3 className="text-sm font-black text-slate-900">
              Últimas mediciones
            </h3>
            <p className="text-[10px] text-slate-500">
              Cada carga, búsqueda y cambio de vista queda registrado en
              sessionStorage.
            </p>
          </div>
          {snapshot.metrics.length === 0 ? (
            <p className="px-4 py-8 text-center text-xs text-slate-500">
              Aún no hay mediciones. Navega por el catálogo o pulsa “Ejecutar
              benchmark”.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[520px] text-left text-[11px]">
                <thead>
                  <tr className="border-b border-slate-200 text-[9px] uppercase tracking-wide text-slate-400">
                    <th className="px-4 py-2 font-black">Tipo</th>
                    <th className="px-2 py-2 font-black">Operación</th>
                    <th className="px-2 py-2 font-black">Duración</th>
                    <th className="px-4 py-2 font-black">Hora</th>
                  </tr>
                </thead>
                <tbody>
                  {snapshot.metrics.map((metric) => (
                    <tr
                      key={metric.id}
                      className="border-b border-slate-100 last:border-0"
                    >
                      <td className="px-4 py-2 font-bold uppercase text-violet-600">
                        {metric.type}
                      </td>
                      <td className="max-w-[220px] truncate px-2 py-2 text-slate-600">
                        {metric.label}
                        {metric.meta?.cached && (
                          <span className="ml-1 rounded bg-slate-100 px-1 text-[9px] font-bold text-slate-500">
                            caché {metric.meta.cached}
                          </span>
                        )}
                      </td>
                      <td className="px-2 py-2 font-black tabular-nums text-slate-700">
                        {formatMs(metric.durationMs)}
                      </td>
                      <td className="px-4 py-2 text-slate-400">
                        {formatDateTime(metric.at)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <h3 className="text-sm font-black text-slate-900">
              Navegación actual
            </h3>
            {navigation ? (
              <dl className="mt-2 space-y-1.5 text-[11px]">
                <div className="flex justify-between gap-2">
                  <dt className="text-slate-500">TTFB</dt>
                  <dd className="font-black text-slate-700">
                    {formatMs(navigation.ttfb)}
                  </dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt className="text-slate-500">DOM Content Loaded</dt>
                  <dd className="font-black text-slate-700">
                    {formatMs(navigation.domContentLoaded)}
                  </dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt className="text-slate-500">Load completo</dt>
                  <dd className="font-black text-slate-700">
                    {formatMs(navigation.load)}
                  </dd>
                </div>
              </dl>
            ) : (
              <p className="mt-2 text-[11px] text-slate-500">
                El navegador no expone Navigation Timing en esta vista.
              </p>
            )}
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <h3 className="text-sm font-black text-slate-900">
              Certificación Lighthouse
            </h3>
            {lighthouse ? (
              <>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  {Object.entries(lighthouse.categories).map(([key, value]) => (
                    <div
                      key={key}
                      className="rounded-xl bg-slate-50 px-2.5 py-2 text-center"
                    >
                      <p className="text-[9px] font-black uppercase tracking-wide text-slate-400">
                        {key}
                      </p>
                      <p
                        className={`text-xl font-black ${
                          value >= 90
                            ? 'text-emerald-700'
                            : value >= 50
                              ? 'text-amber-700'
                              : 'text-rose-700'
                        }`}
                      >
                        {value}
                      </p>
                    </div>
                  ))}
                </div>
                <dl className="mt-3 space-y-1 text-[10px]">
                  {Object.entries(lighthouse.metrics).map(([key, value]) => (
                    <div key={key} className="flex justify-between gap-2">
                      <dt className="text-slate-500">{key}</dt>
                      <dd className="font-bold text-slate-700">{value}</dd>
                    </div>
                  ))}
                </dl>
                <p className="mt-2 text-[9px] text-slate-400">
                  {lighthouse.tool} · {formatDateTime(report.generatedAt)}
                </p>
              </>
            ) : (
              <p className="mt-2 text-[11px] text-slate-500">
                {reportError} Ejecuta <code>npm run lighthouse</code> con el
                preview de producción para generar el reporte.
              </p>
            )}
          </div>
        </div>
      </div>

      <p className="mt-4 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-[11px] leading-relaxed text-slate-500">
        <strong className="text-slate-700">Cómo funciona la caché:</strong> las
        visitas repetidas usan la memoria del módulo, luego sessionStorage y,
        en producción, el service worker + las cabeceras <code>Cache-Control</code>{' '}
        del servidor. Los assets de Vite llevan hash, por lo que se pueden
        cachear un año sin riesgo de servir una versión vieja.
      </p>
    </section>
  )
}
