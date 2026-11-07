import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.jsx'
import SessionGuard from './components/SessionGuard.jsx'
import CartProvider from './context/CartProvider.jsx'
import {
  auditLocalStorageForPaymentData,
  enforceHttps,
} from './lib/security.js'

// 1) HTTPS obligatorio fuera de localhost. Si la página se abrió por HTTP en
//    un dominio real, se reemplaza por HTTPS antes de montar React.
enforceHttps()

// 2) Auditoría de arranque: elimina cualquier PAN/CVV heredado de versiones
//    anteriores o de un localStorage manipulado.
const storageAudit = auditLocalStorageForPaymentData()

if (!storageAudit.clean) {
  console.warn(
    '[seguridad] Se eliminaron datos de pago del almacenamiento local:',
    storageAudit.removed,
  )
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <SessionGuard />
      <CartProvider>
        <App />
      </CartProvider>
    </BrowserRouter>
  </StrictMode>,
)

// La caché de navegador solo aplica al build de producción: en desarrollo
// interferiría con el hot reload de Vite.
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {
      // Si el navegador bloquea el service worker, la app sigue funcionando.
    })
  })
}
