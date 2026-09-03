import { useState, useEffect } from 'react'
import { useOrbStore } from '../hooks/useOrbStore'
import { BOND_COLORS, BLOOD_COLORS } from '../data/colors'
import type { BondType, BloodRelationType } from '../types/orb'
import AddBondForm from './AddBondForm'

function useIsMobile(breakpoint = 768) {
  const [isMobile, setIsMobile] = useState(
    typeof window !== 'undefined' ? window.innerWidth < breakpoint : false
  )
  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < breakpoint)
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [breakpoint])
  return isMobile
}

export default function MemoryPanel() {
  const { data, selectedPersonId, selectPerson } = useOrbStore()
  const [showAddBond, setShowAddBond] = useState(false)
  const isMobile = useIsMobile()

  if (!selectedPersonId) return null
  const person = data.persons.find((p) => p.id === selectedPersonId)
  if (!person) return null

  const bloodRels = data.bloodRelations.filter(
    (r) => r.from === selectedPersonId || r.to === selectedPersonId
  )
  const bonds = data.bonds.filter(
    (b) => b.from === selectedPersonId || b.to === selectedPersonId
  )
  const getOtherName = (id: string) => data.persons.find((p) => p.id === id)?.name ?? id

  const panelStyle: React.CSSProperties = isMobile
    ? {
        position: 'fixed',
        left: 0,
        right: 0,
        bottom: 0,
        maxHeight: '70vh',
        width: '100%',
        borderRadius: '20px 20px 0 0',
        zIndex: 30,
      }
    : {
        position: 'absolute',
        top: 16,
        right: 16,
        bottom: 16,
        width: 340,
        maxWidth: '90vw',
        borderRadius: 16,
        zIndex: 20,
      }

  return (
    <>
      {isMobile && (
        <div
          onClick={() => selectPerson(null)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 25 }}
        />
      )}
      <div
        style={{
          ...panelStyle,
          background: 'rgba(8, 10, 18, 0.96)',
          backdropFilter: 'blur(16px)',
          border: '1px solid rgba(255,255,255,0.08)',
          color: '#e2e8f0',
          padding: 20,
          overflowY: 'auto',
          boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
        }}
      >
        {isMobile && (
          <div
            style={{
              width: 40,
              height: 4,
              borderRadius: 2,
              background: 'rgba(255,255,255,0.25)',
              margin: '0 auto 12px',
            }}
          />
        )}
        <button
          onClick={() => selectPerson(null)}
          style={{
            position: 'absolute',
            top: 12,
            right: 12,
            background: 'transparent',
            border: 'none',
            color: '#94a3b8',
            fontSize: 22,
            cursor: 'pointer',
          }}
        >
          ×
        </button>
        <div style={{ marginBottom: 16 }}>
          <div
            style={{
              width: 72,
              height: 72,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #0ea5e9, #6366f1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 28,
              fontWeight: 600,
              marginBottom: 12,
            }}
          >
            {person.name.charAt(0)}
          </div>
          <h2 style={{ margin: '0 0 4px', fontSize: 22 }}>{person.name}</h2>
          <p style={{ margin: 0, color: '#94a3b8', fontSize: 14 }}>
            {person.birthDate ?? '?'} — {person.deathDate ?? 'present'}
          </p>
        </div>
        {person.biography && (
          <p style={{ fontSize: 14, lineHeight: 1.5, color: '#cbd5e1' }}>{person.biography}</p>
        )}
        <section style={{ marginTop: 20 }}>
          <h3 style={{ fontSize: 13, textTransform: 'uppercase', letterSpacing: 1, color: '#94a3b8' }}>
            Blood Relations
          </h3>
          {bloodRels.length === 0 ? (
            <p style={{ fontSize: 13, color: '#64748b' }}>None recorded</p>
          ) : (
            <ul style={{ listStyle: 'none', padding: 0, margin: '8px 0 0' }}>
              {bloodRels.map((rel) => {
                const otherId = rel.from === selectedPersonId ? rel.to : rel.from
                const color = BLOOD_COLORS[rel.type as BloodRelationType] ?? '#ffd700'
                return (
                  <li
                    key={rel.id}
                    style={{
                      padding: '10px 12px',
                      marginBottom: 6,
                      background: 'rgba(255,255,255,0.03)',
                      borderRadius: 8,
                      borderLeft: `3px solid ${color}`,
                      fontSize: 14,
                    }}
                  >
                    <strong>{getOtherName(otherId)}</strong>
                    <div style={{ fontSize: 12, color: '#94a3b8' }}>{rel.type}</div>
                  </li>
                )
              })}
            </ul>
          )}
        </section>
        <section style={{ marginTop: 16 }}>
          <h3 style={{ fontSize: 13, textTransform: 'uppercase', letterSpacing: 1, color: '#94a3b8' }}>
            Bonds by Love &amp; Trust
          </h3>
          {bonds.length === 0 ? (
            <p style={{ fontSize: 13, color: '#64748b' }}>None yet</p>
          ) : (
            <ul style={{ listStyle: 'none', padding: 0, margin: '8px 0 0' }}>
              {bonds.map((b) => {
                const otherId = b.from === selectedPersonId ? b.to : b.from
                const color = BOND_COLORS[b.type as BondType] ?? '#00bfff'
                return (
                  <li
                    key={b.id}
                    style={{
                      padding: '10px 12px',
                      marginBottom: 6,
                      background: 'rgba(255,255,255,0.03)',
                      borderRadius: 8,
                      borderLeft: `3px solid ${color}`,
                      fontSize: 14,
                    }}
                  >
                    <strong>{getOtherName(otherId)}</strong>
                    {b.label && <div style={{ fontSize: 12 }}>{b.label}</div>}
                    <div style={{ fontSize: 12, color: '#94a3b8' }}>
                      {b.type.replace(/_/g, ' ')}
                      {b.since ? ` · since ${b.since}` : ''}
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </section>
        <button
          onClick={() => setShowAddBond(true)}
          style={{
            marginTop: 24,
            width: '100%',
            padding: '14px',
            borderRadius: 12,
            border: 'none',
            background: 'linear-gradient(135deg, #0ea5e9, #6366f1)',
            color: 'white',
            fontWeight: 600,
            fontSize: 15,
            cursor: 'pointer',
          }}
        >
          + Add a Bond of Love / Trust
        </button>
      </div>
      {showAddBond && (
        <AddBondForm fromPersonId={selectedPersonId} onClose={() => setShowAddBond(false)} />
      )}
    </>
  )
}
