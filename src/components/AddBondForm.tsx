import { useState } from 'react'
import { useOrbStore } from '../hooks/useOrbStore'
import type { BondType } from '../types/orb'

const BOND_TYPES: { id: BondType; label: string }[] = [
  { id: 'chosen_family', label: 'Chosen family' },
  { id: 'life_partner', label: 'Life partner' },
  { id: 'bond_of_trust', label: 'Bond of trust' },
  { id: 'shared_life', label: 'Shared life' },
]

export default function AddBondForm({
  fromPersonId,
  onClose,
}: {
  fromPersonId: string
  onClose: () => void
}) {
  const { data, addBond } = useOrbStore()
  const [toId, setToId] = useState('')
  const [type, setType] = useState<BondType>('bond_of_trust')
  const [label, setLabel] = useState('')
  const [story, setStory] = useState('')
  const [since, setSince] = useState('')

  const others = data.persons.filter((p) => p.id !== fromPersonId)

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!toId) return
    addBond({
      id: `bond-${Date.now()}`,
      from: fromPersonId,
      to: toId,
      type,
      label: label || undefined,
      story: story || undefined,
      since: since || undefined,
      strength: 0.9,
    })
    onClose()
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.6)',
        zIndex: 50,
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'center',
      }}
      onClick={onClose}
    >
      <form
        onClick={(e) => e.stopPropagation()}
        onSubmit={submit}
        style={{
          width: '100%',
          maxWidth: 420,
          background: 'rgba(8, 12, 24, 0.98)',
          borderRadius: '16px 16px 0 0',
          padding: 20,
          color: '#e2e8f0',
          border: '1px solid rgba(255,255,255,0.1)',
        }}
      >
        <h3 style={{ marginTop: 0 }}>Add a Bond</h3>
        <label style={{ display: 'block', marginBottom: 12, fontSize: 13 }}>
          With
          <select
            value={toId}
            onChange={(e) => setToId(e.target.value)}
            required
            style={{
              display: 'block',
              width: '100%',
              marginTop: 4,
              padding: 10,
              borderRadius: 8,
              border: '1px solid rgba(255,255,255,0.15)',
              background: '#0f172a',
              color: '#e2e8f0',
            }}
          >
            <option value="">Select person…</option>
            {others.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </label>
        <label style={{ display: 'block', marginBottom: 12, fontSize: 13 }}>
          Type
          <select
            value={type}
            onChange={(e) => setType(e.target.value as BondType)}
            style={{
              display: 'block',
              width: '100%',
              marginTop: 4,
              padding: 10,
              borderRadius: 8,
              border: '1px solid rgba(255,255,255,0.15)',
              background: '#0f172a',
              color: '#e2e8f0',
            }}
          >
            {BOND_TYPES.map((t) => (
              <option key={t.id} value={t.id}>
                {t.label}
              </option>
            ))}
          </select>
        </label>
        <label style={{ display: 'block', marginBottom: 12, fontSize: 13 }}>
          Label (optional)
          <input
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="Auntie by choice"
            style={{
              display: 'block',
              width: '100%',
              marginTop: 4,
              padding: 10,
              borderRadius: 8,
              border: '1px solid rgba(255,255,255,0.15)',
              background: '#0f172a',
              color: '#e2e8f0',
              boxSizing: 'border-box',
            }}
          />
        </label>
        <label style={{ display: 'block', marginBottom: 12, fontSize: 13 }}>
          Since (optional)
          <input
            value={since}
            onChange={(e) => setSince(e.target.value)}
            placeholder="2012"
            style={{
              display: 'block',
              width: '100%',
              marginTop: 4,
              padding: 10,
              borderRadius: 8,
              border: '1px solid rgba(255,255,255,0.15)',
              background: '#0f172a',
              color: '#e2e8f0',
              boxSizing: 'border-box',
            }}
          />
        </label>
        <label style={{ display: 'block', marginBottom: 16, fontSize: 13 }}>
          Story (optional)
          <textarea
            value={story}
            onChange={(e) => setStory(e.target.value)}
            rows={3}
            style={{
              display: 'block',
              width: '100%',
              marginTop: 4,
              padding: 10,
              borderRadius: 8,
              border: '1px solid rgba(255,255,255,0.15)',
              background: '#0f172a',
              color: '#e2e8f0',
              boxSizing: 'border-box',
            }}
          />
        </label>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            type="submit"
            style={{
              flex: 1,
              padding: 12,
              borderRadius: 10,
              border: 'none',
              background: 'linear-gradient(135deg, #0ea5e9, #6366f1)',
              color: 'white',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Save Bond
          </button>
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: 12,
              borderRadius: 10,
              border: '1px solid rgba(255,255,255,0.2)',
              background: 'transparent',
              color: '#94a3b8',
              cursor: 'pointer',
            }}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  )
}
