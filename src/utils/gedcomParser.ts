/**
 * Lightweight GEDCOM parser for Lalogi Orb (INDI + FAM + basic ASSO).
 */
import type { Person, BloodRelation, OrbData, Bond } from '../types/orb'
import { assoLinesToBond } from './assoMapper'

interface RawIndi {
  id: string
  name?: string
  birthDate?: string
  deathDate?: string
  sex?: string
  famc?: string[]
  fams?: string[]
}

interface RawFam {
  id: string
  husb?: string
  wife?: string
  children: string[]
}

function cleanId(raw: string): string {
  return raw.replace(/@/g, '').trim()
}

export function parseGedcom(gedcomText: string): Partial<OrbData> {
  const lines = gedcomText.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n').map((l) => l.trimEnd())
  const individuals = new Map<string, RawIndi>()
  const families = new Map<string, RawFam>()
  let current: { type: 'INDI' | 'FAM'; id: string } | null = null
  let currentEvent: 'BIRT' | 'DEAT' | null = null

  for (const rawLine of lines) {
    if (!rawLine.trim()) continue
    const match = rawLine.match(/^(\d+)\s+(@[^@]+@)?\s*(\w+)(?:\s+(.*))?$/)
    if (!match) continue
    const level = parseInt(match[1], 10)
    const pointer = match[2]
    const tag = match[3]
    const value = (match[4] || '').trim()

    if (level === 0) {
      currentEvent = null
      if (tag === 'INDI' && pointer) {
        const id = cleanId(pointer)
        current = { type: 'INDI', id }
        individuals.set(id, { id, famc: [], fams: [] })
      } else if (tag === 'FAM' && pointer) {
        const id = cleanId(pointer)
        current = { type: 'FAM', id }
        families.set(id, { id, children: [] })
      } else {
        current = null
      }
      continue
    }
    if (!current) continue

    if (current.type === 'INDI') {
      const indi = individuals.get(current.id)!
      if (level === 1 && tag === 'NAME') indi.name = value.replace(/\//g, '').replace(/\s+/g, ' ').trim()
      else if (level === 1 && tag === 'SEX') indi.sex = value
      else if (level === 1 && (tag === 'BIRT' || tag === 'DEAT')) currentEvent = tag as 'BIRT' | 'DEAT'
      else if (level === 2 && tag === 'DATE' && currentEvent === 'BIRT') indi.birthDate = value
      else if (level === 2 && tag === 'DATE' && currentEvent === 'DEAT') indi.deathDate = value
      else if (level === 1 && tag === 'FAMC') indi.famc = [...(indi.famc || []), cleanId(value)]
      else if (level === 1 && tag === 'FAMS') indi.fams = [...(indi.fams || []), cleanId(value)]
    } else if (current.type === 'FAM') {
      const fam = families.get(current.id)!
      if (level === 1 && tag === 'HUSB') fam.husb = cleanId(value)
      else if (level === 1 && tag === 'WIFE') fam.wife = cleanId(value)
      else if (level === 1 && tag === 'CHIL') fam.children.push(cleanId(value))
    }
  }

  const persons: Person[] = [...individuals.values()].map((i) => ({
    id: i.id,
    name: i.name || i.id,
    birthDate: i.birthDate || null,
    deathDate: i.deathDate || null,
    gender: (i.sex as Person['gender']) || 'U',
    metadata: { gedcomId: i.id, source: 'gedcom' as const },
  }))

  const bloodRelations: BloodRelation[] = []
  let br = 0
  for (const fam of families.values()) {
    for (const child of fam.children) {
      if (fam.husb) {
        bloodRelations.push({
          id: `br-${++br}`,
          from: fam.husb,
          to: child,
          type: 'birth',
          direction: 'parent-to-child',
        })
      }
      if (fam.wife) {
        bloodRelations.push({
          id: `br-${++br}`,
          from: fam.wife,
          to: child,
          type: 'birth',
          direction: 'parent-to-child',
        })
      }
    }
  }

  return { version: '1.0', persons, bloodRelations, bonds: [] }
}

export async function loadGedcomFile(file: File): Promise<Partial<OrbData>> {
  const text = await file.text()
  return parseGedcom(text)
}

export function extractBondsFromGedcom(gedcomText: string, persons: { id: string }[]): Bond[] {
  const lines = gedcomText.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n').map((l) => l.trimEnd())
  const bonds: Bond[] = []
  let currentIndiId: string | null = null
  let assoBuffer: string[] = []
  let inAsso = false
  let idCounter = 0
  const nextId = () => `bond-gedcom-${++idCounter}`
  const flushAsso = () => {
    if (assoBuffer.length && currentIndiId) {
      const bond = assoLinesToBond(assoBuffer, currentIndiId, nextId)
      if (bond) bonds.push(bond)
    }
    assoBuffer = []
    inAsso = false
  }
  for (const raw of lines) {
    if (!raw.trim()) continue
    const match = raw.match(/^(\d+)\s+(@[^@]+@)?\s*(\w+)(?:\s+(.*))?$/)
    if (!match) continue
    const level = parseInt(match[1], 10)
    const pointer = match[2]
    const tag = match[3]
    if (level === 0) {
      flushAsso()
      currentIndiId = tag === 'INDI' && pointer ? pointer.replace(/@/g, '') : null
      continue
    }
    if (level === 1 && tag === 'ASSO') {
      flushAsso()
      inAsso = true
      assoBuffer = [raw]
      continue
    }
    if (inAsso && level >= 2) assoBuffer.push(raw)
    else if (inAsso && level === 1) flushAsso()
  }
  flushAsso()
  const personIds = new Set(persons.map((p) => p.id))
  return bonds.filter((b) => personIds.has(b.from) && personIds.has(b.to))
}
