import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Heart, Sparkles } from 'lucide-react';

import { useMyMatchesRealtime } from '../hooks/useMyMatchesRealtime';
import { supabase } from '../lib/supabase';

type DyadPoint = { day: string; score: number };

type MatchItem = {
  other_user_id: string;
  other_profile: { full_name: string | null } | null;
};

type ResonanceRpcRow = {
  day: string;
  score: number;
};

type DyadRow = {
  otherId: string;
  otherName: string;
};

const clamp = (n: number, a: number, b: number) => Math.max(a, Math.min(b, n));

const LoveSoulGraphPage: React.FC<{ userId: string }> = ({ userId }) => {
  const myMatchesRealtime = useMyMatchesRealtime(userId, 50);
  const acceptedMatches = useMemo(() => myMatchesRealtime.acceptedMatches || [], [myMatchesRealtime.acceptedMatches]);

  const dyads: DyadRow[] = useMemo(() => {
    return acceptedMatches
      .map((m) => {
        const row = m as unknown as MatchItem;
        return {
          otherId: String(row.other_user_id),
          otherName: row.other_profile?.full_name || 'Someone',
        };
      })
      .filter((d) => d.otherId);
  }, [acceptedMatches]);

  const [selectedOtherId, setSelectedOtherId] = useState<string>('');
  const [points, setPoints] = useState<DyadPoint[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!selectedOtherId && dyads.length) setSelectedOtherId(dyads[0].otherId);
  }, [dyads, selectedOtherId]);

  const selectedName = useMemo(() => {
    return dyads.find((d) => d.otherId === selectedOtherId)?.otherName || '';
  }, [dyads, selectedOtherId]);

  const load = useCallback(async () => {
    if (!userId || !selectedOtherId) return;
    setLoading(true);
    setError(null);
    try {
      const { data, error: rpcErr } = await supabase.rpc('get_love_dyad_resonance', {
        other_id: selectedOtherId,
        days_back: 30,
      });
      if (rpcErr) throw rpcErr;

      const rows = Array.isArray(data) ? (data as unknown as ResonanceRpcRow[]) : [];
      const parsed: DyadPoint[] = rows
        .map((r) => ({
          day: String(r.day),
          score: clamp(Number(r.score) || 0, 0, 100),
        }))
        .filter((p) => p.day);

      setPoints(parsed);
    } catch (e: any) {
      setError(e?.message || 'Failed to load');
      setPoints([]);
    } finally {
      setLoading(false);
    }
  }, [selectedOtherId, userId]);

  useEffect(() => {
    load().catch(() => undefined);
  }, [load]);

  const maxScore = useMemo(() => {
    return points.reduce((m, p) => Math.max(m, p.score), 0);
  }, [points]);

  const avgScore = useMemo(() => {
    if (!points.length) return 0;
    const sum = points.reduce((s, p) => s + p.score, 0);
    return Math.round(sum / points.length);
  }, [points]);

  return (
    <div className="max-w-5xl mx-auto">
      <div className="rounded-3xl bg-white border border-pink-100 shadow-[0_18px_60px_rgba(0,0,0,0.10)] overflow-hidden">
        <div className="px-5 sm:px-8 py-6 bg-gradient-to-r from-pink-600 via-fuchsia-600 to-purple-600 text-white">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-sm font-semibold text-white/90">Soul Graph</div>
              <div className="text-2xl font-extrabold">Just you two</div>
              <div className="text-sm text-white/90 mt-1">A simple 30‑day picture of connection. No comparisons.</div>
            </div>
            <div className="w-11 h-11 rounded-2xl bg-white/15 border border-white/20 flex items-center justify-center">
              <Sparkles className="w-6 h-6" />
            </div>
          </div>
        </div>

        <div className="p-4 sm:p-6">
          {!userId && (
            <div className="rounded-2xl border border-gray-200 bg-white p-6 text-sm text-gray-700">Please sign in.</div>
          )}

          {userId && myMatchesRealtime.loading && (
            <div className="rounded-2xl border border-gray-200 bg-white p-6 text-sm text-gray-700">Loading matches…</div>
          )}

          {userId && !myMatchesRealtime.loading && !dyads.length && (
            <div className="rounded-2xl border border-gray-200 bg-white p-6 text-sm text-gray-700">No romantic matches yet.</div>
          )}

          {userId && dyads.length > 0 && (
            <div className="flex flex-col gap-4">
              <div className="rounded-2xl border border-gray-100 bg-white p-4">
                <div className="text-xs font-semibold text-gray-700">Choose your person</div>
                <select
                  value={selectedOtherId}
                  onChange={(e) => setSelectedOtherId(e.target.value)}
                  className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm"
                >
                  {dyads.map((d) => (
                    <option key={d.otherId} value={d.otherId}>
                      {d.otherName}
                    </option>
                  ))}
                </select>
              </div>

              {error && <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>}

              <div className="rounded-3xl border border-gray-100 bg-white p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-sm font-extrabold text-gray-900">{selectedName || 'Dyad'}</div>
                    <div className="text-xs text-gray-600 mt-1">Last 30 days</div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-gray-600">Average</div>
                    <div className="text-lg font-extrabold text-gray-900">{avgScore}</div>
                  </div>
                </div>

                {loading && (
                  <div className="mt-4 rounded-2xl border border-gray-200 bg-white p-6 text-sm text-gray-700">Loading…</div>
                )}

                {!loading && points.length > 0 && (
                  <div className="mt-5 grid grid-cols-30 gap-1 items-end" style={{ gridTemplateColumns: `repeat(${points.length}, minmax(0, 1fr))` }}>
                    {points.map((p) => {
                      const h = maxScore > 0 ? Math.round((p.score / maxScore) * 100) : 0;
                      return (
                        <div key={p.day} className="flex flex-col items-center gap-2">
                          <div
                            className="w-full rounded-full bg-gradient-to-t from-pink-400 via-fuchsia-400 to-purple-400"
                            style={{ height: `${Math.max(6, h)}px` }}
                            title={`${p.day}: ${p.score}`}
                          />
                        </div>
                      );
                    })}
                  </div>
                )}

                {!loading && points.length === 0 && !error && (
                  <div className="mt-4 rounded-2xl border border-gray-100 bg-gray-50 p-6 text-sm text-gray-700">
                    No data yet. Use Pulse a little and it’ll start to show.
                  </div>
                )}

                <div className="mt-4 flex items-center gap-2 text-[11px] text-gray-500">
                  <Heart className="w-3.5 h-3.5" />
                  This is just a private signal for you two.
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LoveSoulGraphPage;
