import { useEffect, useState } from 'react'

/**
 * Soft PWA update banner. Never crashes the app if the virtual SW module is unavailable.
 */
export default function ReloadPrompt() {
  const [offlineReady, setOfflineReady] = useState(false)
  const [needRefresh, setNeedRefresh] = useState(false)
  const [updateFn, setUpdateFn] = useState<((reload?: boolean) => Promise<void>) | null>(null)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const mod = await import('virtual:pwa-register/react')
        if (cancelled) return
        // Hook must run in a component — fall back to imperative registerSW
        const { registerSW } = await import('virtual:pwa-register')
        const updateSW = registerSW({
          immediate: true,
          onOfflineReady() {
            if (!cancelled) setOfflineReady(true)
          },
          onNeedRefresh() {
            if (!cancelled) setNeedRefresh(true)
          },
          onRegistered() {},
          onRegisterError() {},
        })
        setUpdateFn(() => updateSW)
        void mod
      } catch {
        // PWA virtual module missing or failed — app still works online
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  if (!offlineReady && !needRefresh) return null

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 20,
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 1000,
        background: 'rgba(8, 12, 24, 0.95)',
        backdropFilter: 'blur(12px)',
        border: '1px solid rgba(125, 211, 252, 0.25)',
        borderRadius: 14,
        padding: '12px 18px',
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        color: '#e2e8f0',
        fontSize: 14,
        boxShadow: '0 12px 32px rgba(0,0,0,0.45)',
        maxWidth: '90vw',
      }}
    >
      <span>
        {offlineReady
          ? 'Ready to work offline'
          : 'A new version of Lalogi Orb is available'}
      </span>
      <div style={{ display: 'flex', gap: 8 }}>
        {needRefresh && (
          <button
            onClick={() => updateFn?.(true)}
            style={{
              background: 'linear-gradient(135deg, #0ea5e9, #6366f1)',
              color: 'white',
              border: 'none',
              borderRadius: 8,
              padding: '6px 14px',
              fontWeight: 600,
              cursor: 'pointer',
              fontSize: 13,
            }}
          >
            Reload
          </button>
        )}
        <button
          onClick={() => {
            setOfflineReady(false)
            setNeedRefresh(false)
          }}
          style={{
            background: 'transparent',
            color: '#94a3b8',
            border: '1px solid rgba(255,255,255,0.15)',
            borderRadius: 8,
            padding: '6px 12px',
            cursor: 'pointer',
            fontSize: 13,
          }}
        >
          Close
        </button>
      </div>
    </div>
  )
}
