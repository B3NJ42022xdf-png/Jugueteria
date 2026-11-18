import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  addToCart,
  commitPurchase,
  getCart,
  removeCartItem,
  updateCartItemQuantity,
} from '../services/storeService.js'
import { getProductById } from '../services/productService.js'
import { calculateCouponTotals, findCoupon } from '../lib/coupons.js'
import {
  safeGetJson,
  safeRemoveItem,
  safeSetItem,
} from '../lib/security.js'
import { CartContext } from './cartContext.js'

export const COUPON_STORAGE_KEY = 'jugueteria.coupon.v1'

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

/** Recupera el cupón guardado; si ya no existe en la configuración, lo ignora. */
function readCoupon() {
  const stored = safeGetJson(COUPON_STORAGE_KEY, null)
  return findCoupon(stored)
}

/**
 * Proveedor global del carrito.
 *
 * Cualquier cambio (agregar, cambiar cantidad o eliminar) se persiste a través
 * del servicio y luego se refleja en el estado de React. Así el contador del
 * encabezado se actualiza de inmediato en todas las páginas.
 *
 * También centraliza el cupón activo y los totales (descuento, envío y total)
 * para que el carrito, el checkout y el comprobante muestren las mismas cifras.
 */
export default function CartProvider({ children }) {
  const [cart, setCart] = useState(() => getCart())
  const [coupon, setCoupon] = useState(() => readCoupon())

  const refresh = useCallback(() => {
    setCart(getCart())
  }, [])

  useEffect(() => {
    function handleStorage(event) {
      if (event.key === 'jugueteria.cart.v1') {
        setCart(getCart())
      }

      if (event.key === COUPON_STORAGE_KEY) {
        setCoupon(readCoupon())
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

  const applyCoupon = useCallback((code) => {
    const found = findCoupon(code)

    if (!found) {
      return {
        ok: false,
        message: 'Ese código no es válido. Revisa la ortografía e inténtalo otra vez.',
      }
    }

    safeSetItem(COUPON_STORAGE_KEY, found.code)
    setCoupon(found)

    return {
      ok: true,
      coupon: found,
      message: `Cupón ${found.code} aplicado: ${found.label}.`,
    }
  }, [])

  const removeCoupon = useCallback(() => {
    safeRemoveItem(COUPON_STORAGE_KEY)
    setCoupon(null)
  }, [])

  const completePurchase = useCallback((snapshot) => {
    commitPurchase(snapshot)
    safeRemoveItem(COUPON_STORAGE_KEY)
    setCoupon(null)
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

  const totals = useMemo(
    () => calculateCouponTotals({ coupon, subtotal, itemCount }),
    [coupon, subtotal, itemCount],
  )

  const value = useMemo(
    () => ({
      items,
      itemCount,
      subtotal,
      coupon,
      couponCode: coupon?.code ?? '',
      discount: totals.discount,
      shipping: totals.shipping,
      total: totals.total,
      savings: totals.savings,
      applyCoupon,
      removeCoupon,
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
      coupon,
      totals,
      applyCoupon,
      removeCoupon,
      addItem,
      changeQuantity,
      removeItem,
      completePurchase,
      refresh,
    ],
  )

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}
