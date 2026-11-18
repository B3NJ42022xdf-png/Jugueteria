import { useCallback, useEffect, useMemo, useState } from 'react'
import { safeGetJson, safeRemoveItem, safeSetItem } from '../lib/security.js'
import { getProductById } from '../services/productService.js'
import { FavoritesContext } from './favoritesContext.js'

export const FAVORITES_STORAGE_KEY = 'jugueteria.favorites.v1'
export const FAVORITES_CHANGED_EVENT = 'jugueteria:favorites-changed'

/** Lee la lista persistida y descarta IDs que ya no existen en el catálogo. */
function readFavorites() {
  const stored = safeGetJson(FAVORITES_STORAGE_KEY, [])

  if (!Array.isArray(stored)) return []

  return [...new Set(stored.filter((id) => typeof id === 'string'))].filter(
    (id) => Boolean(getProductById(id)),
  )
}

function persistFavorites(ids) {
  if (ids.length === 0) {
    safeRemoveItem(FAVORITES_STORAGE_KEY)
    return
  }

  safeSetItem(FAVORITES_STORAGE_KEY, ids)
}

/**
 * Proveedor global de favoritos.
 *
 * El estado se guarda en localStorage y se sincroniza entre pestañas. El
 * contador del encabezado y la página `/favoritos` consumen el mismo contexto.
 */
export default function FavoritesProvider({ children }) {
  const [favoriteIds, setFavoriteIds] = useState(() => readFavorites())

  useEffect(() => {
    function syncFavorites() {
      setFavoriteIds(readFavorites())
    }

    function handleStorage(event) {
      if (event.key && event.key !== FAVORITES_STORAGE_KEY) return
      syncFavorites()
    }

    window.addEventListener('storage', handleStorage)
    window.addEventListener(FAVORITES_CHANGED_EVENT, syncFavorites)

    return () => {
      window.removeEventListener('storage', handleStorage)
      window.removeEventListener(FAVORITES_CHANGED_EVENT, syncFavorites)
    }
  }, [])

  const toggleFavorite = useCallback(
    (productId) => {
      if (!productId) return false

      const exists = favoriteIds.includes(productId)
      const next = exists
        ? favoriteIds.filter((id) => id !== productId)
        : [...favoriteIds, productId]

      persistFavorites(next)
      setFavoriteIds(next)
      window.dispatchEvent(new CustomEvent(FAVORITES_CHANGED_EVENT))
      return !exists
    },
    [favoriteIds],
  )

  const removeFavorite = useCallback(
    (productId) => {
      if (!favoriteIds.includes(productId)) return

      const next = favoriteIds.filter((id) => id !== productId)
      persistFavorites(next)
      setFavoriteIds(next)
      window.dispatchEvent(new CustomEvent(FAVORITES_CHANGED_EVENT))
    },
    [favoriteIds],
  )

  const clearFavorites = useCallback(() => {
    safeRemoveItem(FAVORITES_STORAGE_KEY)
    setFavoriteIds([])
    window.dispatchEvent(new CustomEvent(FAVORITES_CHANGED_EVENT))
  }, [])

  const isFavorite = useCallback(
    (productId) => favoriteIds.includes(productId),
    [favoriteIds],
  )

  const favorites = useMemo(
    () => favoriteIds.map((id) => getProductById(id)).filter(Boolean),
    [favoriteIds],
  )

  const value = useMemo(
    () => ({
      favoriteIds,
      favorites,
      count: favoriteIds.length,
      isFavorite,
      toggleFavorite,
      removeFavorite,
      clearFavorites,
    }),
    [
      favoriteIds,
      favorites,
      isFavorite,
      toggleFavorite,
      removeFavorite,
      clearFavorites,
    ],
  )

  return (
    <FavoritesContext.Provider value={value}>
      {children}
    </FavoritesContext.Provider>
  )
}
