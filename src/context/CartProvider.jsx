import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  addToCart,
  commitPurchase,
  getCart,
  removeCartItem,
  updateCartItemQuantity,
} from '../services/storeService.js'
import { getProductById } from '../services/productService.js'
import { CartContext } from './cartContext.js'

/** Convierte el carrito persistido en artículos listos para la interfaz. */
function buildItems(cart) {
  return Object.entries(cart)
    .map(([productId, entry]) => {
      const product = getProductById(productId)

      if (!product) return null

      return {
        id: productId,
        quantity: entry.quantity,
        stockAtAdd: entry.stockAtAdd,
        product,
        unitPrice: product.price,
        subtotal: product.price * entry.quantity,
      }
    })
    .filter(Boolean)
}

/**
 * Proveedor global del carrito.
 *
 * Cualquier cambio (agregar, cambiar cantidad o eliminar) se persiste a través
 * del servicio y luego se refleja en el estado de React. Así el contador del
 * encabezado se actualiza de inmediato en todas las páginas.
 */
export default function CartProvider({ children }) {
  const [cart, setCart] = useState(() => getCart())

  const refresh = useCallback(() => {
    setCart(getCart())
  }, [])

  useEffect(() => {
    function handleStorage(event) {
      if (event.key === 'jugueteria.cart.v1') {
        setCart(getCart())
      }
    }

    function handleCatalogChange() {
      setCart(getCart())
    }

    window.addEventListener('storage', handleStorage)
    window.addEventListener('jugueteria:catalog-updated', handleCatalogChange)

    return () => {
      window.removeEventListener('storage', handleStorage)
      window.removeEventListener('jugueteria:catalog-updated', handleCatalogChange)
    }
  }, [])

  const addItem = useCallback(async (productId, quantity = 1) => {
    const result = await addToCart(productId, quantity)
    setCart(getCart())
    return result
  }, [])

  const changeQuantity = useCallback(async (productId, quantity) => {
    const result = await updateCartItemQuantity(productId, quantity)
    setCart(getCart())
    return result
  }, [])

  const removeItem = useCallback(async (productId) => {
    const result = await removeCartItem(productId)
    setCart(getCart())
    return result
  }, [])

  const completePurchase = useCallback((snapshot) => {
    commitPurchase(snapshot)
    setCart({})
  }, [])

  const items = useMemo(() => buildItems(cart), [cart])

  const itemCount = useMemo(
    () => items.reduce((total, item) => total + item.quantity, 0),
    [items],
  )

  const subtotal = useMemo(
    () => items.reduce((total, item) => total + item.subtotal, 0),
    [items],
  )

  const value = useMemo(
    () => ({
      items,
      itemCount,
      subtotal,
      addItem,
      changeQuantity,
      setQuantity: changeQuantity,
      removeItem,
      completePurchase,
      refresh,
    }),
    [
      items,
      itemCount,
      subtotal,
      addItem,
      changeQuantity,
      removeItem,
      completePurchase,
      refresh,
    ],
  )

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}
