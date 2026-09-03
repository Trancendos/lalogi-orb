import type { Bond, BondType, Person } from '../types/orb'

export type GedcomRole = 'FRIEND' | 'GODP' | 'WITN' | 'CLERGY' | 'PARENT' | 'OTHER'

const BOND_TO_ROLE: Record<BondType, { role: GedcomRole; phrase?: string }> = {
  bond_of_trust: { role: 'FRIEND' },
  chosen_family: { role: 'OTHER', phrase: 'Chosen family' },
  life_partner: { role: 'OTHER', phrase: 'Life partner' },
  shared_life: { role: 'OTHER', phrase: 'Shared life' },
}

const ROLE_TO_BOND: Record<string, BondType> = {
  FRIEND: 'bond_of_trust',
  GODP: 'chosen_family',
}

export function bondToAssoLines(bond: Bond, persons: Person[]): string[] {
  const target = persons.find((p) => p.id === bond.to)
  const xref = target?.metadata?.gedcomId ?? `@${bond.to}@`
  const mapping = BOND_TO_ROLE[bond.type] ?? { role: 'OTHER' as GedcomRole }
  const lines: string[] = [`1 ASSO ${xref}`, `2 ROLE ${mapping.role}`]
  if (mapping.phrase || bond.label) {
    lines.push(`3 PHRASE ${bond.label || mapping.phrase || ''}`)
  }
  if (bond.story) lines.push(`2 NOTE ${bond.story.replace(/\n/g, ' ')}`)
  if (bond.since) lines.push(`2 NOTE Since: ${bond.since}`)
  return lines
}

export function assoLinesToBond(
  lines: string[],
  fromPersonId: string,
  idGenerator: () => string
): Bond | null {
  let toId = ''
  let role = 'OTHER'
  let phrase = ''
  let note = ''
  for (const line of lines) {
    const m = line.match(/^(\d+)\s+(\w+)(?:\s+(.*))?$/)
    if (!m) continue
    const level = parseInt(m[1], 10)
    const tag = m[2]
    const value = (m[3] || '').trim()
    if (level === 1 && tag === 'ASSO') toId = value.replace(/@/g, '')
    else if (level === 2 && tag === 'ROLE') role = value
    else if (level === 3 && tag === 'PHRASE') phrase = value
    else if (level === 2 && tag === 'NOTE') note = value
  }
  if (!toId) return null
  let type: BondType = 'bond_of_trust'
  if (ROLE_TO_BOND[role]) type = ROLE_TO_BOND[role]
  else if (role === 'OTHER') {
    const lower = phrase.toLowerCase()
    if (lower.includes('partner') || lower.includes('spouse')) type = 'life_partner'
    else if (lower.includes('chosen') || lower.includes('aunt') || lower.includes('uncle')) type = 'chosen_family'
    else if (lower.includes('shared') || lower.includes('housemate')) type = 'shared_life'
    else type = 'chosen_family'
  }
  return {
    id: idGenerator(),
    from: fromPersonId,
    to: toId,
    type,
    label: phrase || undefined,
    story: note || undefined,
    strength: 0.85,
  }
}

export function exportPersonBondsAsAsso(
  personId: string,
  bonds: Bond[],
  persons: Person[]
): string[] {
  const relevant = bonds.filter((b) => b.from === personId || b.to === personId)
  const lines: string[] = []
  for (const bond of relevant) {
    const normalised: Bond =
      bond.from === personId ? bond : { ...bond, from: personId, to: bond.from }
    lines.push(...bondToAssoLines(normalised, persons))
  }
  return lines
}
