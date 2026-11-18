import { createContext, useContext } from 'react'

/**
 * Contexto de la lista de deseos.
 *
 * Vive en un archivo sin componentes para conservar Fast Refresh y permitir
 * que cualquier página use `useFavorites`.
 */
export const FavoritesContext = createContext(null)

export function useFavorites() {
  const context = useContext(FavoritesContext)

  if (!context) {
    throw new Error('useFavorites debe usarse dentro de <FavoritesProvider>.')
  }

  return context
}
