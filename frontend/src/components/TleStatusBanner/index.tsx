import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const MotionDiv = motion.div as React.FC<any>;
import { getTleStatus, forceRefreshTle } from '../../services/api';

/**
 * TleStatusBanner
 *
 * A live-updating status bar that shows:
 *  - How fresh the CelesTrak TLE data is (age in minutes/hours)
 *  - A countdown to the next scheduled auto-refresh (every 6 hrs)
 *  - A pulsing dot indicating whether a refresh is in progress
 *  - A "Refresh Now" button to immediately trigger a new pull from CelesTrak
 *
 * The component polls /api/tle-status every 30 seconds, and every 1 second
 * when a refresh is in progress (to detect completion quickly).
 */
const TleStatusBanner = () => {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [countdown, setCountdown] = useState('');
  const [error, setError] = useState(null);
  const [justRefreshed, setJustRefreshed] = useState(false);

  // ── Fetch status from backend ──────────────────────────────────────────────
  const fetchStatus = useCallback(async () => {
    try {
      const data = await getTleStatus();
      setStatus(data);
      setError(null);
    } catch (err) {
      setError('Backend offline');
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial fetch + polling interval
  useEffect(() => {
    fetchStatus();
    // Poll faster (every 5 s) when a refresh is in progress, else every 30 s
    const interval = setInterval(fetchStatus, status?.refresh_in_progress ? 5000 : 30000);
    return () => clearInterval(interval);
  }, [fetchStatus, status?.refresh_in_progress]);

  // ── Live countdown to next scheduled refresh ───────────────────────────────
  useEffect(() => {
    if (!status?.next_update) {
      setCountdown('—');
      return;
    }
    const tick = () => {
      const diff = new Date(status.next_update).getTime() - new Date().getTime();
      if (diff <= 0) { setCountdown('Now'); return; }
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setCountdown(`${h > 0 ? h + 'h ' : ''}${m}m ${s}s`);
    };
    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, [status?.next_update]);

  // ── Trigger manual refresh ─────────────────────────────────────────────────
  const handleForceRefresh = async () => {
    if (refreshing || status?.refresh_in_progress) return;
    setRefreshing(true);
    try {
      await forceRefreshTle();
      // Poll quickly after triggering
      const poll = setInterval(async () => {
        await fetchStatus();
        if (!status?.refresh_in_progress) {
          clearInterval(poll);
          setRefreshing(false);
          setJustRefreshed(true);
          setTimeout(() => setJustRefreshed(false), 4000);
        }
      }, 3000);
    } catch (err) {
      console.error('Force refresh failed:', err);
      setRefreshing(false);
    }
  };

  // ── Helper: format age ─────────────────────────────────────────────────────
  const formatAge = (minutes) => {
    if (minutes === null || minutes === undefined) return '—';
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${Math.floor(minutes)}m ago`;
    const h = Math.floor(minutes / 60);
    const m = Math.floor(minutes % 60);
    return `${h}h ${m}m ago`;
  };

  const isInProgress = status?.refresh_in_progress || refreshing;
  const isStale = status?.is_stale;

  // Status colour
  const statusColor = error
    ? 'text-red-400'
    : isInProgress
    ? 'text-blue-400'
    : isStale
    ? 'text-amber-400'
    : justRefreshed
    ? 'text-emerald-400'
    : 'text-emerald-400';

  const dotColor = error
    ? 'bg-red-500'
    : isInProgress
    ? 'bg-blue-400'
    : isStale
    ? 'bg-amber-400'
    : 'bg-emerald-500';

  const statusLabel = error
    ? 'Backend Offline'
    : isInProgress
    ? 'Fetching from CelesTrak…'
    : isStale
    ? 'TLE Data Stale'
    : justRefreshed
    ? 'Data Updated!'
    : 'TLE Data Live';

  if (loading) return null; // silent while loading

  return (
    <MotionDiv
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full bg-black/40 border-b border-gray-800/60 backdrop-blur-md"
    >
      <div className="max-w-7xl mx-auto px-6 py-2 flex flex-wrap items-center justify-between gap-3">

        {/* Left: Status dot + label */}
        <div className="flex items-center gap-3">
          {/* Animated pulsing dot */}
          <span className="relative flex h-2.5 w-2.5">
            {isInProgress && (
              <span
                className={`animate-ping absolute inline-flex h-full w-full rounded-full ${dotColor} opacity-75`}
              />
            )}
            <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${dotColor}`} />
          </span>

          <span className={`text-xs font-normal tracking-widest uppercase ${statusColor}`}>
            {statusLabel}
          </span>

          {/* Source badges */}
          {status?.sources && (
            <div className="hidden sm:flex items-center gap-1 ml-1">
              {status.sources.map((src) => (
                <span
                  key={src}
                  className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-gray-800 text-gray-400 border border-gray-700"
                >
                  {src}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Centre: Stats pills */}
        <div className="flex items-center gap-4 text-xs text-gray-400">
          <div className="flex items-center gap-1.5">
            <svg className="w-3 h-3 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>Updated: <strong className="text-gray-200">{formatAge(status?.age_minutes)}</strong></span>
          </div>

          <div className="flex items-center gap-1.5">
            <svg className="w-3 h-3 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span>
              Next refresh:{' '}
              <strong className="text-gray-200 font-mono">{isInProgress ? 'In progress' : countdown}</strong>
            </span>
          </div>

          <div className="hidden md:flex items-center gap-1.5">
            <svg className="w-3 h-3 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
            </svg>
            <span>
              <strong className="text-emerald-500">{(status?.satellite_count || 0).toLocaleString()}</strong> sats ·{' '}
              <strong className="text-amber-500">{(status?.debris_count || 0).toLocaleString()}</strong> debris
            </span>
          </div>
        </div>

        {/* Right: Refresh button */}
        <button
          onClick={handleForceRefresh}
          disabled={isInProgress || !!error}
          className={`
            flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-normal
            transition-all duration-200 border select-none
            ${isInProgress || error
              ? 'opacity-40 cursor-not-allowed bg-gray-800 border-gray-700 text-gray-500'
              : 'bg-gray-900 hover:bg-gray-800 border-gray-700 hover:border-gray-500 text-gray-300 hover:text-white cursor-pointer'
            }
          `}
        >
          <svg
            className={`w-3.5 h-3.5 ${isInProgress ? 'animate-spin' : ''}`}
            fill="none" viewBox="0 0 24 24" stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          {isInProgress ? 'Refreshing…' : 'Refresh Now'}
        </button>

      </div>

      {/* Progress bar when refresh is in progress */}
      <AnimatePresence>
        {isInProgress && (
          <MotionDiv
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            exit={{ scaleX: 0, opacity: 0 }}
            transition={{ duration: 30, ease: 'linear' }}
            style={{ originX: 0 }}
            className="h-0.5 bg-gradient-to-r from-blue-600 via-cyan-400 to-emerald-500"
          />
        )}
      </AnimatePresence>
    </MotionDiv>
  );
};

export default TleStatusBanner;
