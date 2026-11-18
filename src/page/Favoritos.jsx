import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import ProductCard from '../components/ProductCard.jsx'
import StoreFooter from '../components/StoreFooter.jsx'
import StoreHeader from '../components/StoreHeader.jsx'
import {
  Gift,
  Heart,
  HeartFilled,
  Sparkles,
  WhatsApp,
} from '../components/icons.jsx'
import { useFavorites } from '../context/favoritesContext.js'
import { buildWhatsAppLetterUrl } from '../lib/wishlistLetter.js'

/**
 * Lista de deseos del cliente.
 *
 * Los favoritos se guardan en localStorage, por lo que sobreviven a recargas y
 * se comparten entre pestañas. El corazón de cada tarjeta permite quitarlos
 * sin salir de esta página.
 */
export default function Favoritos() {
  const { favorites, count, clearFavorites } = useFavorites()
  const letterUrl = useMemo(
    () => buildWhatsAppLetterUrl(favorites),
    [favorites],
  )

  return (
    <div className="toy-dots flex min-h-screen flex-col bg-toy-cream text-toy-ink">
      <StoreHeader />

      <main className="flex-1">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <nav
            aria-label="Ruta de navegación"
            className="mb-4 flex items-center gap-1.5 text-xs text-slate-500 sm:text-sm"
          >
            <Link
              to="/catalogo"
              className="font-semibold transition hover:text-red-700"
            >
              Catálogo
            </Link>
            <span aria-hidden="true">/</span>
            <span className="font-semibold text-slate-700" aria-current="page">
              Mis favoritos
            </span>
          </nav>

          <section className="relative overflow-hidden rounded-[30px] border-[3px] border-amber-200 bg-gradient-to-br from-[#7f1d1d] via-[#b91c1c] to-[#14532d] px-6 py-8 text-white shadow-[0_24px_60px_-32px_rgba(127,29,29,0.7)] sm:px-9">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -right-12 -top-16 h-56 w-56 rounded-full bg-rose-300/20 blur-2xl"
            />
            <div className="relative flex flex-wrap items-center justify-between gap-4">
              <div>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-300 px-2.5 py-1 text-[10px] font-black uppercase tracking-wide text-red-900">
                  <Sparkles className="h-3.5 w-3.5" /> Tu lista de deseos
                </span>
                <h1 className="mt-2 font-festive text-3xl font-bold tracking-wide text-white sm:text-5xl">
                  Mis Favoritos
                </h1>
                <p className="mt-2 max-w-xl text-sm font-semibold leading-relaxed text-amber-50/90">
                  Guarda los juguetes que más te gusten y vuelve por ellos cuando
                  estés listo. La magia sigue aquí.
                </p>
              </div>

              <span className="grid h-20 w-20 shrink-0 place-items-center rounded-full bg-white/15 text-rose-200 ring-4 ring-white/20">
                <HeartFilled className="h-10 w-10" />
              </span>
            </div>
          </section>

          {count > 0 ? (
            <div className="mt-7">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm font-bold text-slate-600" aria-live="polite">
                  {count} {count === 1 ? 'juguete guardado' : 'juguetes guardados'}
                </p>

                <div className="flex flex-wrap items-center gap-2">
                  <a
                    href={letterUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    title="Abrir WhatsApp con tu lista de deseos y el total estimado"
                    className="inline-flex min-h-10 items-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-2 text-xs font-extrabold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-emerald-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-300"
                  >
                    <WhatsApp className="h-4 w-4" />
                    Enviar carta por WhatsApp
                  </a>
                  <button
                    type="button"
                    onClick={clearFavorites}
                    className="inline-flex min-h-10 items-center gap-1.5 rounded-xl border-2 border-rose-200 bg-white px-3 py-2 text-xs font-extrabold text-rose-700 transition hover:-translate-y-0.5 hover:bg-rose-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-rose-200"
                  >
                    <Heart className="h-3.5 w-3.5" /> Vaciar lista
                  </button>
                </div>
              </div>

              <p className="mb-4 flex items-start gap-1.5 rounded-xl bg-emerald-50 px-3 py-2 text-[11px] font-semibold leading-relaxed text-emerald-800 ring-1 ring-emerald-100">
                <WhatsApp className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                La carta incluye cada juguete con su precio en Soles y el monto
                total estimado. Se abrirá WhatsApp para elegir el destinatario.
              </p>

              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                {favorites.map((product, index) => (
                  <div
                    key={product.id}
                    className="animate-pop-in"
                    style={{ animationDelay: `${Math.min(index, 9) * 70}ms` }}
                  >
                    <ProductCard product={product} priority={index < 3} />
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <section className="mt-7 rounded-[30px] border-[3px] border-dashed border-[#ffd9a8] bg-white px-6 py-14 text-center">
              <span className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-rose-50 text-rose-500 ring-4 ring-rose-100">
                <Heart className="h-10 w-10" />
              </span>
              <h2 className="mt-5 font-display text-2xl font-extrabold tracking-tight text-toy-ink">
                Tu lista está esperando magia
              </h2>
              <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-slate-500">
                Toca el corazón de cualquier juguete para guardarlo aquí. Así no
                pierdes de vista el regalo perfecto para esta Navidad.
              </p>
              <Link
                to="/catalogo"
                className="toy-btn mt-6 inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl px-6 py-3 text-sm font-extrabold focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-toy-sun/60"
              >
                <Gift className="h-4 w-4" /> Explorar juguetes
              </Link>
            </section>
          )}
        </div>
      </main>

      <StoreFooter />
    </div>
  )
}
