import Dexie, { type Table } from 'dexie'
import type { Person, BloodRelation, Bond, OrbData } from '../types/orb'

export interface OrbMeta {
  id: string
  version: string
  updatedAt: number
}

class OrbDatabase extends Dexie {
  persons!: Table<Person, string>
  bloodRelations!: Table<BloodRelation, string>
  bonds!: Table<Bond, string>
  meta!: Table<OrbMeta, string>

  constructor() {
    super('LalogiOrbDB')
    this.version(1).stores({
      persons: 'id, name',
      bloodRelations: 'id, from, to, type',
      bonds: 'id, from, to, type',
      meta: 'id',
    })
  }
}

export const orbDb = new OrbDatabase()

export async function loadOrbData(): Promise<OrbData | null> {
  const [persons, bloodRelations, bonds, meta] = await Promise.all([
    orbDb.persons.toArray(),
    orbDb.bloodRelations.toArray(),
    orbDb.bonds.toArray(),
    orbDb.meta.get('current'),
  ])
  if (!meta && persons.length === 0) return null
  return {
    version: meta?.version ?? '1.0',
    persons,
    bloodRelations,
    bonds,
  }
}

export async function saveOrbData(data: OrbData): Promise<void> {
  await orbDb.transaction('rw', orbDb.persons, orbDb.bloodRelations, orbDb.bonds, orbDb.meta, async () => {
    await orbDb.persons.clear()
    await orbDb.bloodRelations.clear()
    await orbDb.bonds.clear()
    await orbDb.persons.bulkPut(data.persons)
    await orbDb.bloodRelations.bulkPut(data.bloodRelations)
    await orbDb.bonds.bulkPut(data.bonds)
    await orbDb.meta.put({ id: 'current', version: data.version, updatedAt: Date.now() })
  })
}

export async function saveBonds(bonds: Bond[]): Promise<void> {
  await orbDb.transaction('rw', orbDb.bonds, async () => {
    await orbDb.bonds.clear()
    await orbDb.bonds.bulkPut(bonds)
  })
}
