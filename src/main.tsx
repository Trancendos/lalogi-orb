import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import { useOrbStore } from './hooks/useOrbStore'

// Hydrate durable state from IndexedDB before rendering
useOrbStore
  .getState()
  .hydrateFromDb()
  .finally(() => {
    createRoot(document.getElementById('root')!).render(
      <StrictMode>
        <App />
      </StrictMode>
    )
  })
