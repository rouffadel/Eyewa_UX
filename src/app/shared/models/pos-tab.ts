export type PosTab = 'sell' | 'prescription' | 'reports' | 'insurance' | 'more' | 'deliveries';

export const POS_TABS: PosTab[] = [
  'sell',
  'prescription',
  'reports',
  'insurance',
  'deliveries',
];

export function posTabFromUrlSegment(segment: string | undefined): PosTab | null {
  if (!segment) {
    return null;
  }

  return POS_TABS.includes(segment as PosTab) ? (segment as PosTab) : null;
}
