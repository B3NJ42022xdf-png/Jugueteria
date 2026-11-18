import { useCallback, useEffect, useMemo, useState } from 'react'
import { safeGetJson, safeSetItem } from '../lib/security.js'
import { SnowContext } from './snowContext.js'

export const SNOW_STORAGE_KEY = 'jugueteria.snow.v1'

function readSnowPreference() {
  const stored = safeGetJson(SNOW_STORAGE_KEY, null)
  return stored === null ? true : Boolean(stored)
}

/**
 * Preferencia opcional de nieve.
 *
 * Por defecto está activa para conservar el ambiente navideño actual. El
 * usuario puede desactivarla desde el encabezado y la decisión se recuerda en
 * este dispositivo.
 */
export default function SnowProvider({ children }) {
  const [snowEnabled, setSnowEnabled] = useState(() => readSnowPreference())

  useEffect(() => {
    function handleStorage(event) {
      if (event.key && event.key !== SNOW_STORAGE_KEY) return
      setSnowEnabled(readSnowPreference())
    }

    window.addEventListener('storage', handleStorage)
    return () => window.removeEventListener('storage', handleStorage)
  }, [])

  const setSnow = useCallback((enabled) => {
    const next = Boolean(enabled)
    safeSetItem(SNOW_STORAGE_KEY, next)
    setSnowEnabled(next)
  }, [])

  const toggleSnow = useCallback(() => {
    const next = !snowEnabled
    safeSetItem(SNOW_STORAGE_KEY, next)
    setSnowEnabled(next)
  }, [snowEnabled])

  const value = useMemo(
    () => ({ snowEnabled, setSnow, toggleSnow }),
    [snowEnabled, setSnow, toggleSnow],
  )

  return <SnowContext.Provider value={value}>{children}</SnowContext.Provider>
}
