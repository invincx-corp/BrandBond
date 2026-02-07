import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Sparkles, Shield, Lock, Unlock, RefreshCw, X } from 'lucide-react';

import { supabase } from '../lib/supabase';

type DyadRow = {
  id: string;
  user_low: string;
  user_high: string;
  status: string;
  stage: string;
  intimacy_mode: boolean;
  activated_at: string | null;
};

type AgreementRow = {
  id: string;
  dyad_id: string;
  agreement_type: string;
  requested_by: string;
  requested_at: string;
  accepted_at: string | null;
  revoked_at: string | null;
};

type PromptRow = {
  id: string;
  prompt: string;
  stage_min: string;
};

type RitualThreadRow = {
  id: string;
  dyad_id: string;
  prompt_id: string | null;
  status: string;
  issued_at: string;
  revealed_at: string | null;
  archived_at: string | null;
  prompt?: PromptRow | null;
};

type RitualResponseRow = {
  id: string;
  thread_id: string;
  user_id: string;
  response: string;
  created_at: string;
};

const formatTimeAgo = (iso: string) => {
  const d = new Date(iso);
  const ms = Date.now() - d.getTime();
  const min = Math.floor(ms / 60000);
  if (min < 1) return 'just now';
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.floor(hr / 24);
  return `${day}d ago`;
};

const LoveDyadSpacePage: React.FC = () => {
  const navigate = useNavigate();
  const { otherId } = useParams();

  const [me, setMe] = useState<string>('');
  const [dyadId, setDyadId] = useState<string>('');
  const [dyad, setDyad] = useState<DyadRow | null>(null);
  const [agreement, setAgreement] = useState<AgreementRow | null>(null);

  const [ritualThread, setRitualThread] = useState<RitualThreadRow | null>(null);
  const [ritualResponses, setRitualResponses] = useState<RitualResponseRow[]>([]);
  const [draftResponse, setDraftResponse] = useState('');
  const [mySavedResponse, setMySavedResponse] = useState('');
  const [activeThreadId, setActiveThreadId] = useState<string>('');

  const [ritualHistoryThreads, setRitualHistoryThreads] = useState<RitualThreadRow[]>([]);
  const [ritualHistoryResponses, setRitualHistoryResponses] = useState<Record<string, RitualResponseRow[]>>({});

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const canAct = useMemo(() => Boolean(otherId), [otherId]);

  useEffect(() => {
    let cancelled = false;
    const loadMe = async () => {
      try {
        const { data, error } = await supabase.auth.getUser();
        if (cancelled) return;
        if (error) throw error;
        setMe(data.user?.id || '');
      } catch {
        if (cancelled) return;
        setMe('');
      }
    };
    loadMe();
    return () => {
      cancelled = true;
    };
  }, []);

  const loadAll = useCallback(async () => {
    if (!otherId) return;
    setLoading(true);
    setError(null);
    setNotice(null);
    try {
      const { data: userData, error: userErr } = await supabase.auth.getUser();
      if (userErr) throw userErr;
      const meNow = userData.user?.id || '';
      setMe(meNow);

      const { data: did, error: didErr } = await supabase.rpc('love_get_or_create_dyad', { other_id: otherId });
      if (didErr) throw didErr;
      const dyadId = String(did);
      setDyadId(dyadId);

      const { data: dyadRow, error: dyadErr } = await supabase
        .from('love_dyads')
        .select('id, user_low, user_high, status, stage, intimacy_mode, activated_at')
        .eq('id', dyadId)
        .maybeSingle();
      if (dyadErr) throw dyadErr;
      setDyad((dyadRow as DyadRow) || null);

      const { data: agreements, error: agrErr } = await supabase
        .from('love_dyad_agreements')
        .select('id, dyad_id, agreement_type, requested_by, requested_at, accepted_at, revoked_at')
        .eq('dyad_id', dyadId)
        .eq('agreement_type', 'exclusive_witnessing')
        .is('revoked_at', null)
        .order('requested_at', { ascending: false })
        .limit(1);
      if (agrErr) throw agrErr;
      setAgreement((agreements && agreements[0] ? (agreements[0] as AgreementRow) : null) || null);

      const { data: threads, error: thErr } = await supabase
        .from('love_ritual_threads')
        .select('id, dyad_id, prompt_id, status, issued_at, revealed_at, archived_at, prompt:love_ritual_prompts(id, prompt, stage_min)')
        .eq('dyad_id', dyadId)
        .is('archived_at', null)
        .order('issued_at', { ascending: false })
        .limit(1);
      if (thErr) throw thErr;
      const t = threads && threads[0] ? (threads[0] as unknown as RitualThreadRow) : null;
      setRitualThread(t);

      const newThreadId = t?.id || '';
      setActiveThreadId((prev) => {
        if (prev !== newThreadId) return newThreadId;
        return prev;
      });

      if (t?.id) {
        const { data: resps, error: respErr } = await supabase
          .from('love_ritual_responses')
          .select('id, thread_id, user_id, response, created_at')
          .eq('thread_id', t.id)
          .order('created_at', { ascending: true });
        if (respErr) throw respErr;
        setRitualResponses((resps as RitualResponseRow[]) || []);

        const mine = (resps as RitualResponseRow[] | null | undefined)?.find((r) => r.user_id === meNow);
        const saved = mine?.response || '';
        setMySavedResponse(saved);
        if (activeThreadId !== t.id) {
          setDraftResponse(saved);
        }
      } else {
        setRitualResponses([]);
        setMySavedResponse('');
        setDraftResponse('');
      }

      const { data: history, error: histErr } = await supabase
        .from('love_ritual_threads')
        .select('id, dyad_id, prompt_id, status, issued_at, revealed_at, archived_at, prompt:love_ritual_prompts(id, prompt, stage_min)')
        .eq('dyad_id', dyadId)
        .or('status.eq.revealed,revealed_at.not.is.null')
        .order('revealed_at', { ascending: false })
        .limit(15);
      if (histErr) throw histErr;
      const histThreads = (history as unknown as RitualThreadRow[]) || [];
      setRitualHistoryThreads(histThreads);

      if (histThreads.length) {
        const ids = histThreads.map((ht) => ht.id);
        const { data: histResps, error: histRespErr } = await supabase
          .from('love_ritual_responses')
          .select('id, thread_id, user_id, response, created_at')
          .in('thread_id', ids)
          .order('created_at', { ascending: true });
        if (histRespErr) throw histRespErr;
        const byThread: Record<string, RitualResponseRow[]> = {};
        ((histResps as RitualResponseRow[]) || []).forEach((r) => {
          if (!byThread[r.thread_id]) byThread[r.thread_id] = [];
          byThread[r.thread_id].push(r);
        });
        setRitualHistoryResponses(byThread);
      } else {
        setRitualHistoryResponses({});
      }
    } catch (e: any) {
      setError(e?.message || 'Failed to load');
    } finally {
      setLoading(false);
    }
  }, [otherId]);

  useEffect(() => {
    if (!dyadId) return;

    const channel = supabase
      .channel(`love-dyad-${dyadId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'love_ritual_threads', filter: `dyad_id=eq.${dyadId}` },
        () => {
          loadAll().catch(() => undefined);
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'love_ritual_responses' },
        () => {
          loadAll().catch(() => undefined);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [dyadId, loadAll]);

  useEffect(() => {
    loadAll().catch(() => undefined);
  }, [loadAll]);

  const setIntimacyMode = useCallback(
    async (enabled: boolean) => {
      if (!otherId) return;
      setLoading(true);
      setError(null);
      try {
        const { error } = await supabase.rpc('love_set_intimacy_mode', { other_id: otherId, enabled });
        if (error) throw error;
        await loadAll();
      } catch (e: any) {
        setError(e?.message || 'Failed');
      } finally {
        setLoading(false);
      }
    },
    [loadAll, otherId]
  );

  const requestExclusive = useCallback(async () => {
    if (!otherId) return;
    setLoading(true);
    setError(null);
    try {
      const { error } = await supabase.rpc('love_request_exclusive_witnessing', { other_id: otherId });
      if (error) throw error;
      await loadAll();
    } catch (e: any) {
      setError(e?.message || 'Failed');
    } finally {
      setLoading(false);
    }
  }, [loadAll, otherId]);

  const acceptExclusive = useCallback(async () => {
    if (!agreement?.id) return;
    setLoading(true);
    setError(null);
    try {
      const { error } = await supabase.rpc('love_accept_exclusive_witnessing', { agreement_id: agreement.id });
      if (error) throw error;
      await loadAll();
    } catch (e: any) {
      setError(e?.message || 'Failed');
    } finally {
      setLoading(false);
    }
  }, [agreement?.id, loadAll]);

  const revokeExclusive = useCallback(async () => {
    if (!agreement?.id) return;
    setLoading(true);
    setError(null);
    try {
      const { error } = await supabase.rpc('love_revoke_exclusive_witnessing', { agreement_id: agreement.id });
      if (error) throw error;
      await loadAll();
    } catch (e: any) {
      setError(e?.message || 'Failed');
    } finally {
      setLoading(false);
    }
  }, [agreement?.id, loadAll]);

  const issueRitual = useCallback(async () => {
    if (!otherId) return;
    setLoading(true);
    setError(null);
    try {
      const { error } = await supabase.rpc('love_issue_ritual_thread', { other_id: otherId, cooldown_hours: 72 });
      if (error) throw error;
      await loadAll();
    } catch (e: any) {
      setError(e?.message || 'Failed');
    } finally {
      setLoading(false);
    }
  }, [loadAll, otherId]);

  const refreshRitualPrompt = useCallback(async () => {
    if (!otherId) return;
    setLoading(true);
    setError(null);
    try {
      const { error } = await supabase.rpc('love_issue_ritual_thread', { other_id: otherId, cooldown_hours: 1 });
      if (error) throw error;
      await loadAll();
    } catch (e: any) {
      setError(e?.message || 'Failed');
    } finally {
      setLoading(false);
    }
  }, [loadAll, otherId]);

  const submitRitual = useCallback(async () => {
    if (!ritualThread?.id) return;
    setLoading(true);
    setError(null);
    setNotice(null);
    try {
      // eslint-disable-next-line no-console
      console.log('[LoveDyadSpace] submitRitual click', { threadId: ritualThread.id, len: draftResponse.length });

      const { data: userData, error: userErr } = await supabase.auth.getUser();
      if (userErr) throw userErr;
      if (!userData.user?.id) throw new Error('not_authenticated');

      const { data, error } = await supabase.rpc('love_submit_ritual_response', {
        thread_uuid: ritualThread.id,
        response_text: draftResponse,
      });
      // eslint-disable-next-line no-console
      console.log('[LoveDyadSpace] love_submit_ritual_response result', { data, error });
      if (error) throw error;
      await loadAll();
      setDraftResponse('');
      setNotice('Submitted. Waiting for the other person to respond.');
    } catch (e: any) {
      const msg = e?.message || e?.error_description || e?.details || 'Failed';
      // eslint-disable-next-line no-console
      console.error('[LoveDyadSpace] submitRitual failed', e);
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [draftResponse, loadAll, ritualThread?.id]);

  const exclusiveState = useMemo(() => {
    if (!agreement) return { label: 'Not requested', tone: 'text-gray-600' };
    if (agreement.revoked_at) return { label: 'Revoked', tone: 'text-gray-600' };
    if (agreement.accepted_at) return { label: 'Exclusive (mutual)', tone: 'text-emerald-700' };
    return { label: 'Pending acceptance', tone: 'text-amber-700' };
  }, [agreement]);

  const canAccept = useMemo(() => {
    if (!agreement || agreement.accepted_at || agreement.revoked_at) return false;
    if (!me) return false;
    return agreement.requested_by !== me;
  }, [agreement, me]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') navigate('/love-dashboard/pulse');
    };
    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [navigate]);

  return (
    <div className="fixed inset-0 z-50">
      <button
        type="button"
        aria-label="Close"
        className="absolute inset-0 w-full h-full bg-black/40 backdrop-blur-sm"
        onClick={() => navigate('/love-dashboard/pulse')}
      />

      <div className="relative h-full w-full p-3 sm:p-6 flex items-center justify-center">
        <div
          className="relative w-full max-w-3xl max-h-[85dvh] rounded-3xl bg-white border border-pink-100 shadow-[0_18px_60px_rgba(0,0,0,0.18)] overflow-hidden flex flex-col"
          role="dialog"
          aria-modal="true"
        >
          <div className="px-5 sm:px-8 py-6 bg-gradient-to-r from-pink-600 via-fuchsia-600 to-purple-600 text-white">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-sm font-semibold text-white/90">Dyad Space</div>
                <div className="text-2xl font-extrabold">Just you two</div>
                <div className="text-sm text-white/90 mt-1">A private room for the intimacy physics. Pulse stays unchanged.</div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className="w-11 h-11 rounded-2xl bg-white/15 border border-white/20 flex items-center justify-center"
                  onClick={() => loadAll()}
                  title="Refresh"
                >
                  <RefreshCw className="w-5 h-5" />
                </button>
                <button
                  type="button"
                  className="w-11 h-11 rounded-2xl bg-white/15 border border-white/20 flex items-center justify-center"
                  onClick={() => navigate('/love-dashboard/pulse')}
                  title="Close"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>

          <div className="p-4 sm:p-5 space-y-4 overflow-y-auto flex-1">
            {!canAct ? (
              <div className="rounded-2xl border border-gray-200 bg-white p-6 text-sm text-gray-700">Missing match id.</div>
            ) : null}

            {error ? (
              <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>
            ) : null}

            {notice ? (
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">{notice}</div>
            ) : null}

            {loading ? (
              <div className="rounded-2xl border border-gray-200 bg-white p-6 text-sm text-gray-700">Loading…</div>
            ) : null}

            <div className="rounded-3xl border border-gray-100 bg-gradient-to-br from-white to-pink-50/40 p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="text-xs font-semibold text-gray-600">Dyad status</div>
                  <div className="text-lg font-extrabold text-gray-900">{dyad ? `${dyad.stage} · ${dyad.status}` : '—'}</div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="inline-flex items-center gap-2 rounded-full bg-white border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-700">
                    <Sparkles className="w-4 h-4 text-pink-600" />
                    Intimacy mode
                  </div>
                  <button
                    type="button"
                    disabled={!dyad}
                    onClick={() => setIntimacyMode(!(dyad?.intimacy_mode || false))}
                    className={`px-4 py-2 rounded-full text-xs font-semibold border transition-colors ${
                      dyad?.intimacy_mode
                        ? 'bg-gray-900 text-white border-gray-900'
                        : 'bg-white text-gray-900 border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    {dyad?.intimacy_mode ? 'On' : 'Off'}
                  </button>
                </div>
              </div>
              <div className="mt-3 text-[11px] text-gray-500">Turning this on unlocks agreements and rituals. Pulse moments still work the same.</div>
            </div>

            <div className="rounded-3xl border border-gray-100 bg-white p-5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-xs font-semibold text-gray-600">Exclusive witnessing</div>
                  <div className={`text-sm font-extrabold ${exclusiveState.tone}`}>{exclusiveState.label}</div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-2xl bg-gray-900 text-white flex items-center justify-center">
                    <Shield className="w-5 h-5" />
                  </div>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  type="button"
                  className="px-4 py-2 rounded-full bg-gray-900 text-white text-xs font-semibold disabled:opacity-50"
                  onClick={requestExclusive}
                  disabled={!dyad?.intimacy_mode || Boolean(agreement && !agreement.revoked_at)}
                >
                  Request
                </button>
                <button
                  type="button"
                  className="px-4 py-2 rounded-full bg-white border border-gray-200 text-gray-900 text-xs font-semibold disabled:opacity-50"
                  onClick={acceptExclusive}
                  disabled={!canAccept}
                >
                  Accept
                </button>
                <button
                  type="button"
                  className="px-4 py-2 rounded-full bg-white border border-gray-200 text-gray-900 text-xs font-semibold disabled:opacity-50"
                  onClick={revokeExclusive}
                  disabled={!agreement || Boolean(agreement.revoked_at)}
                >
                  Revoke
                </button>
              </div>

              {!dyad?.intimacy_mode ? (
                <div className="mt-3 text-[11px] text-gray-500">Enable Intimacy mode to request exclusivity.</div>
              ) : null}

              {agreement ? (
                <div className="mt-3 text-[11px] text-gray-500">
                  Requested {formatTimeAgo(agreement.requested_at)}
                  {agreement.accepted_at ? ` · Accepted ${formatTimeAgo(agreement.accepted_at)}` : ''}
                </div>
              ) : null}
            </div>

            <div className="rounded-3xl border border-gray-100 bg-white p-5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-xs font-semibold text-gray-600">Mutual ritual</div>
                  <div className="text-sm font-extrabold text-gray-900">A slower reveal, only unlocked when both answer.</div>
                </div>
                <div className="w-10 h-10 rounded-2xl bg-pink-50 border border-pink-100 text-pink-700 flex items-center justify-center">
                  {ritualThread?.status === 'revealed' ? <Unlock className="w-5 h-5" /> : <Lock className="w-5 h-5" />}
                </div>
              </div>

              <div className="mt-4">
                {ritualThread ? (
                  <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
                    <div className="text-[11px] text-gray-500">
                      Status: <span className="font-semibold text-gray-800">{ritualThread.status}</span>
                    </div>
                    <div className="mt-2 text-sm font-semibold text-gray-900">{ritualThread.prompt?.prompt || 'Prompt'}</div>
                    <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                      <div className="text-[11px] text-gray-500">Issued {formatTimeAgo(ritualThread.issued_at)}</div>
                      <button
                        type="button"
                        onClick={refreshRitualPrompt}
                        disabled={!dyad?.intimacy_mode || ritualThread.status === 'revealed'}
                        className="px-3 py-1.5 rounded-full bg-white border border-gray-200 text-gray-900 text-[11px] font-semibold disabled:opacity-50"
                        title={ritualThread.status === 'revealed' ? 'This ritual is already revealed' : 'Generate a new prompt'}
                      >
                        Refresh prompt
                      </button>
                    </div>

                    <div className="mt-4">
                      <div className="text-[11px] font-semibold text-gray-700">Your response</div>
                      <textarea
                        value={draftResponse}
                        onChange={(e) => setDraftResponse(e.target.value.slice(0, 600))}
                        rows={4}
                        className="mt-2 w-full rounded-2xl border border-gray-200 bg-white p-3 text-sm"
                        placeholder="Write gently. No performance."
                      />
                      <div className="mt-2 flex items-center justify-between gap-2">
                        <div className="text-[11px] text-gray-500">{draftResponse.length}/600</div>
                        <button
                          type="button"
                          onClick={submitRitual}
                          disabled={!dyad?.intimacy_mode || draftResponse.trim().length === 0}
                          className="px-4 py-2 rounded-full bg-gray-900 text-white text-xs font-semibold disabled:opacity-50"
                        >
                          Submit
                        </button>
                      </div>
                    </div>

                    {ritualThread.status === 'revealed' ? (
                      <div className="mt-4">
                        <div className="text-[11px] font-semibold text-gray-700">Unlocked responses</div>
                        <div className="mt-2 space-y-2">
                          {ritualResponses.map((r) => (
                            <div key={r.id} className="rounded-2xl border border-gray-100 bg-white p-3">
                              <div className="text-[11px] text-gray-500">
                                {r.user_id === me ? 'You' : 'Them'} · {formatTimeAgo(r.created_at)}
                              </div>
                              <div className="mt-1 text-sm font-semibold text-gray-900">{r.response}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="mt-4">
                        {ritualResponses.find((r) => r.user_id === me) ? (
                          <div className="rounded-2xl border border-gray-100 bg-white p-3">
                            <div className="text-[11px] text-gray-500">You · sent</div>
                            <div className="mt-1 text-sm font-semibold text-gray-900">
                              {mySavedResponse || ritualResponses.find((r) => r.user_id === me)?.response}
                            </div>
                          </div>
                        ) : null}

                        {ritualThread.status === 'awaiting_other' && !ritualResponses.find((r) => r.user_id === me) ? (
                          <div className="mt-3 text-[11px] text-gray-700">
                            They’ve responded. Add yours to unlock the reveal.
                          </div>
                        ) : ritualThread.status === 'awaiting_other' && ritualResponses.find((r) => r.user_id === me) ? (
                          <div className="mt-3 text-[11px] text-gray-700">Waiting for them to respond.</div>
                        ) : (
                          <div className="mt-3 text-[11px] text-gray-500">Their response will unlock once both of you submit.</div>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
                    <div className="text-sm text-gray-700">No ritual thread yet.</div>
                    <div className="mt-3">
                      <button
                        type="button"
                        onClick={issueRitual}
                        disabled={!dyad?.intimacy_mode}
                        className="px-4 py-2 rounded-full bg-gradient-to-r from-pink-500 via-fuchsia-500 to-purple-500 text-white text-xs font-semibold disabled:opacity-50"
                      >
                        Issue a prompt
                      </button>
                      {!dyad?.intimacy_mode ? (
                        <div className="mt-2 text-[11px] text-gray-500">Enable Intimacy mode to issue rituals.</div>
                      ) : null}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {ritualHistoryThreads.length ? (
              <div className="rounded-3xl border border-gray-100 bg-white p-5">
                <div className="text-xs font-semibold text-gray-600">Ritual history</div>
                <div className="mt-3 space-y-3">
                  {ritualHistoryThreads.map((ht) => (
                    <div key={ht.id} className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
                      <div className="text-[11px] text-gray-500">
                        Revealed {ht.revealed_at ? formatTimeAgo(ht.revealed_at) : '—'}
                      </div>
                      <div className="mt-2 text-sm font-semibold text-gray-900">{ht.prompt?.prompt || 'Prompt'}</div>
                      <div className="mt-3 space-y-2">
                        {(ritualHistoryResponses[ht.id] || []).map((r) => (
                          <div key={r.id} className="rounded-2xl border border-gray-100 bg-white p-3">
                            <div className="text-[11px] text-gray-500">
                              {r.user_id === me ? 'You' : 'Them'} · {formatTimeAgo(r.created_at)}
                            </div>
                            <div className="mt-1 text-sm font-semibold text-gray-900">{r.response}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            <div className="text-[11px] text-gray-500 px-1">
              This page is additive. It does not replace Pulse. It gives the dyad a place to hold agreements, pacing, and deeper rituals.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoveDyadSpacePage;
