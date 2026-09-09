import { useRef } from 'react'
import { useOrbStore } from '../hooks/useOrbStore'
import type { ViewMode } from '../types/orb'
import { loadGedcomFile } from '../utils/gedcomParser'

const modes: { id: ViewMode; label: string }[] = [
  { id: 'full', label: 'Full Constellation' },
  { id: 'blood', label: 'Blood Only' },
  { id: 'bonds', label: 'Bonds Only' },
]

const btn: React.CSSProperties = {
  background: 'rgba(10, 12, 20, 0.75)',
  backdropFilter: 'blur(8px)',
  color: '#94a3b8',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: 10,
  padding: '8px 14px',
  fontSize: 13,
  cursor: 'pointer',
}

export default function Controls() {
  const {
    viewMode,
    setViewMode,
    resetToSample,
    startEmpty,
    exportJson,
    importOrbData,
  } = useOrbStore()
  const fileRef = useRef<HTMLInputElement>(null)
  const jsonRef = useRef<HTMLInputElement>(null)

  const handleGedcom = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const data = await loadGedcomFile(file)
      importOrbData(data)
    } catch (err) {
      console.error('GEDCOM import failed', err)
      alert('Could not parse that GEDCOM file.')
    }
    e.target.value = ''
  }

  const handleJson = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const text = await file.text()
      const data = JSON.parse(text)
      importOrbData(data)
    } catch (err) {
      console.error('JSON import failed', err)
      alert('Could not import that backup file.')
    }
    e.target.value = ''
  }

  return (
    <div
      style={{
        position: 'absolute',
        top: 16,
        left: 16,
        zIndex: 10,
        display: 'flex',
        gap: 8,
        flexWrap: 'wrap',
        alignItems: 'center',
      }}
    >
      <div
        style={{
          background: 'rgba(10, 12, 20, 0.75)',
          backdropFilter: 'blur(8px)',
          borderRadius: 12,
          padding: '6px 8px',
          display: 'flex',
          gap: 4,
          border: '1px solid rgba(255,255,255,0.08)',
        }}
      >
        {modes.map((m) => (
          <button
            key={m.id}
            onClick={() => setViewMode(m.id)}
            style={{
              background: viewMode === m.id ? 'rgba(125, 211, 252, 0.25)' : 'transparent',
              color: viewMode === m.id ? '#e0f2fe' : '#94a3b8',
              border: 'none',
              borderRadius: 8,
              padding: '6px 12px',
              fontSize: 13,
              fontWeight: 500,
              cursor: 'pointer',
            }}
          >
            {m.label}
          </button>
        ))}
      </div>

      <button onClick={() => fileRef.current?.click()} style={btn}>
        Import GEDCOM
      </button>
      <input
        ref={fileRef}
        type="file"
        accept=".ged,.gedcom,text/plain"
        style={{ display: 'none' }}
        onChange={handleGedcom}
      />

      <button onClick={() => jsonRef.current?.click()} style={btn}>
        Import Backup
      </button>
      <input
        ref={jsonRef}
        type="file"
        accept=".json,application/json"
        style={{ display: 'none' }}
        onChange={handleJson}
      />

      <button onClick={exportJson} style={btn}>
        Export Backup
      </button>

      <button
        onClick={() => {
          if (confirm('Clear the constellation so you can build your own from scratch?')) {
            startEmpty()
          }
        }}
        style={btn}
      >
        Start Empty
      </button>

      <button onClick={resetToSample} style={btn}>
        Sample Demo
      </button>
    </div>
  )
}
