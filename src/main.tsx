import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import WebsiteApp from './WebsiteApp'
import './styles.css'

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    void navigator.serviceWorker.getRegistrations()
      .then(registrations => Promise.all(registrations
        .filter(registration => [registration.active, registration.installing, registration.waiting]
          .some(worker => worker !== null && new URL(worker.scriptURL).pathname === '/sw.js'))
        .map(registration => registration.unregister())))
      .catch(() => undefined)
  })
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <WebsiteApp />
  </StrictMode>,
)
