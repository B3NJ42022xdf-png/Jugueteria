import { createContext, useContext } from 'react'

/**
 * Contexto del carrito global.
 *
 * Se mantiene en un archivo sin componentes para que el refresco en caliente
 * (Fast Refresh) siga funcionando y para que cualquier página pueda consumir
 * el estado con el hook `useCart`.
 */
export const CartContext = createContext(null)

export function useCart() {
  const context = useContext(CartContext)

  if (!context) {
    throw new Error('useCart debe usarse dentro de <CartProvider>.')
  }

  return context
}
