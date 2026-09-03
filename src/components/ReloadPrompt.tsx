import { useRegisterSW } from 'virtual:pwa-register/react'

export default function ReloadPrompt() {
  const {
    offlineReady: [offlineReady, setOfflineReady],
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r) {
      console.log('Service Worker registered:', r)
    },
    onRegisterError(error) {
      console.error('Service Worker registration error:', error)
    },
  })

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
            onClick={() => updateServiceWorker(true)}
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
