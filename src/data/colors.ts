import type { BloodRelationType, BondType } from '../types/orb'

export const BLOOD_COLORS: Record<BloodRelationType, string> = {
  birth: '#ffd700',
  adopted: '#ffbf00',
  foster: '#ffa500',
  step: '#ffe4b5',
  sponsored: '#f0e68c',
}

export const BOND_COLORS: Record<BondType, string> = {
  chosen_family: '#00bfff',
  life_partner: '#ff69b4',
  bond_of_trust: '#40e0d0',
  shared_life: '#9370db',
}

export function getLinkColor(
  linkOrType: string | { type: string; bloodType?: string },
  bloodType?: string
): string {
  if (typeof linkOrType === 'object' && linkOrType !== null) {
    const link = linkOrType
    if (link.type === 'blood' && link.bloodType && link.bloodType in BLOOD_COLORS) {
      return BLOOD_COLORS[link.bloodType as BloodRelationType]
    }
    if (link.type in BOND_COLORS) {
      return BOND_COLORS[link.type as BondType]
    }
    return 'rgba(180, 180, 180, 0.6)'
  }
  const type = linkOrType
  if (type === 'blood' && bloodType && bloodType in BLOOD_COLORS) {
    return BLOOD_COLORS[bloodType as BloodRelationType]
  }
  if (type in BOND_COLORS) {
    return BOND_COLORS[type as BondType]
  }
  return 'rgba(180, 180, 180, 0.6)'
}
