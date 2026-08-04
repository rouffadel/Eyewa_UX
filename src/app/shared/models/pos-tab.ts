export type PosTab = 'sell' | 'prescription' | 'reports' | 'insurance' | 'more' | 'deliveries' | 'status';

export const POS_TABS: PosTab[] = [
  'sell',
  'prescription',
  'reports',
  'insurance',
  'deliveries',
  'status',
];

export function posTabFromUrlSegment(segment: string | undefined): PosTab | null {
  if (!segment) {
    return null;
  }

  return POS_TABS.includes(segment as PosTab) ? (segment as PosTab) : null;
}
