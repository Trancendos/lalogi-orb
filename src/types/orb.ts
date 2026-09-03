/** Core data model for the Lalogi Orb */

export type BloodRelationType =
  | 'birth'
  | 'adopted'
  | 'foster'
  | 'step'
  | 'sponsored'

export type BondType =
  | 'chosen_family'
  | 'life_partner'
  | 'bond_of_trust'
  | 'shared_life'

export interface Person {
  id: string
  name: string
  birthDate?: string | null
  deathDate?: string | null
  photo?: string | null
  biography?: string
  gender?: 'M' | 'F' | 'X' | 'U'
  metadata?: {
    gedcomId?: string
    source?: 'gedcom' | 'manual' | 'import'
  }
}

export interface BloodRelation {
  id: string
  from: string
  to: string
  type: BloodRelationType
  direction: 'parent-to-child'
}

export interface Bond {
  id: string
  from: string
  to: string
  type: BondType
  label?: string
  since?: string
  story?: string
  strength: number
  color?: string
}

export interface OrbData {
  version: string
  persons: Person[]
  bloodRelations: BloodRelation[]
  bonds: Bond[]
}

export interface GraphNode {
  id: string
  name: string
  photo?: string | null
  birthDate?: string | null
  deathDate?: string | null
  biography?: string
  val?: number
}

export interface GraphLink {
  source: string
  target: string
  type: 'blood' | BondType
  bloodType?: BloodRelationType
  label?: string
  strength?: number
  story?: string
}

export type ViewMode = 'full' | 'blood' | 'bonds'
