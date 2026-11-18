import { createContext, useContext } from 'react'

/** Contexto de la preferencia de nieve animada. */
export const SnowContext = createContext(null)

export function useSnow() {
  const context = useContext(SnowContext)

  if (!context) {
    throw new Error('useSnow debe usarse dentro de <SnowProvider>.')
  }

  return context
}
