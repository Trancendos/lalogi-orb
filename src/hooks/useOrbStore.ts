import { create } from 'zustand'
import type { OrbData, Person, Bond, ViewMode, GraphNode, GraphLink } from '../types/orb'
import { sampleOrbData } from '../data/sampleData'
import { loadOrbData, saveOrbData } from '../db/orbDb'

interface OrbState {
  data: OrbData
  viewMode: ViewMode
  selectedPersonId: string | null
  hydrated: boolean
  setViewMode: (mode: ViewMode) => void
  selectPerson: (id: string | null) => void
  addBond: (bond: Bond) => void
  updatePerson: (id: string, updates: Partial<Person>) => void
  resetToSample: () => void
  importOrbData: (partial: Partial<OrbData>) => void
  hydrateFromDb: () => Promise<void>
  getGraphData: () => { nodes: GraphNode[]; links: GraphLink[] }
}

function persist(data: OrbData) {
  saveOrbData(data).catch((err) =>
    console.error('Failed to persist OrbData to IndexedDB', err)
  )
}

export const useOrbStore = create<OrbState>()((set, get) => ({
  data: sampleOrbData,
  viewMode: 'full',
  selectedPersonId: null,
  hydrated: false,

  setViewMode: (mode) => set({ viewMode: mode }),
  selectPerson: (id) => set({ selectedPersonId: id }),

  addBond: (bond) => {
    const next = { ...get().data, bonds: [...get().data.bonds, bond] }
    set({ data: next })
    persist(next)
  },

  updatePerson: (id, updates) => {
    const next = {
      ...get().data,
      persons: get().data.persons.map((p) => (p.id === id ? { ...p, ...updates } : p)),
    }
    set({ data: next })
    persist(next)
  },

  resetToSample: () => {
    set({ data: sampleOrbData, selectedPersonId: null })
    persist(sampleOrbData)
  },

  importOrbData: (partial) => {
    const current = get().data
    const next: OrbData = {
      version: partial.version || current.version,
      persons: partial.persons || current.persons,
      bloodRelations: partial.bloodRelations || current.bloodRelations,
      bonds: partial.bonds !== undefined ? partial.bonds : current.bonds,
    }
    set({ data: next, selectedPersonId: null })
    persist(next)
  },

  hydrateFromDb: async () => {
    try {
      const stored = await loadOrbData()
      if (stored && stored.persons.length > 0) {
        set({ data: stored, hydrated: true })
      } else {
        await saveOrbData(sampleOrbData)
        set({ data: sampleOrbData, hydrated: true })
      }
    } catch (err) {
      console.error('Hydration failed, falling back to sample', err)
      set({ data: sampleOrbData, hydrated: true })
    }
  },

  getGraphData: () => {
    const { data, viewMode } = get()
    const nodes: GraphNode[] = data.persons.map((p) => ({
      id: p.id,
      name: p.name,
      photo: p.photo,
      birthDate: p.birthDate,
      deathDate: p.deathDate,
      biography: p.biography,
      val: 1,
    }))
    const bloodLinks: GraphLink[] =
      viewMode === 'bonds'
        ? []
        : data.bloodRelations.map((rel) => ({
            source: rel.from,
            target: rel.to,
            type: 'blood' as const,
            bloodType: rel.type,
          }))
    const bondLinks: GraphLink[] =
      viewMode === 'blood'
        ? []
        : data.bonds.map((b) => ({
            source: b.from,
            target: b.to,
            type: b.type,
            label: b.label,
            strength: b.strength,
            story: b.story,
          }))
    return { nodes, links: [...bloodLinks, ...bondLinks] }
  },
}))
