export type MatchPercentResolverInputs = {
  myMatches?: any[];
  userId: string;
  otherUserId: string;
  compatibilityScoreByPair?: Map<string, number>;
};

function makePairKey(a: string, b: string): string {
  const sa = String(a);
  const sb = String(b);
  return sa < sb ? `${sa}|${sb}` : `${sb}|${sa}`;
}

export function resolveMatchPercentage({ myMatches, userId, otherUserId, compatibilityScoreByPair }: MatchPercentResolverInputs): number {
  const otherId = String(otherUserId);

  // Prefer matches metadata (0..1) if present.
  const matchRow =
    (myMatches || []).find((m: any) => String(m?.other_user_id) === otherId) ||
    (myMatches || []).find((m: any) => String(m?.other_profile?.id) === otherId) ||
    null;
  const raw = matchRow && typeof matchRow?.metadata?.match_percentage === 'number' ? matchRow.metadata.match_percentage : null;
  if (typeof raw === 'number' && Number.isFinite(raw)) {
    return Math.max(0, Math.min(100, Math.round(raw * 100)));
  }

  // Fallback to compatibility score (already 0..100).
  const score = compatibilityScoreByPair?.get(makePairKey(userId, otherId));
  if (typeof score === 'number' && Number.isFinite(score)) {
    return Math.max(0, Math.min(100, Math.round(score)));
  }

  return 0;
}

export function mapDatePlanStatusToLabel(status: string | null | undefined): { label: string; pillClass: string } {
  const s = String(status || '').toLowerCase();

  if (s === 'accepted') {
    return { label: 'Accepted', pillClass: 'bg-green-100 text-green-800' };
  }

  if (s === 'declined' || s === 'rejected') {
    return { label: 'Rejected', pillClass: 'bg-red-100 text-red-800' };
  }

  if (s === 'planned') {
    return { label: 'Planned', pillClass: 'bg-indigo-100 text-indigo-800' };
  }

  return { label: 'Pending', pillClass: 'bg-gray-100 text-gray-800' };
}
