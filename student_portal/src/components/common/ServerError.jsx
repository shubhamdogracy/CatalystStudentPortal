import { useState, useEffect, useRef, useCallback } from 'react';
import { RefreshCw, ServerCrash } from 'lucide-react';

const BASE_URL = import.meta.env.VITE_API_URL || '/api';
const RETRY_INTERVAL = 5;

const TIPS = [
  'Top scorers stay calm under pressure. Your prep is waiting right here.',
  'Even a 60-second break sharpens focus. You\'ve got this.',
  'The SAT rewards persistence. So does a good connection.',
  'Deep breath. Your score progress is fully saved.',
];

export default function ServerError({ onRetry, message }) {
  const [countdown, setCountdown]   = useState(RETRY_INTERVAL);
  const [checking, setChecking]     = useState(false);
  const [attempts, setAttempts]     = useState(0);
  const [recovered, setRecovered]   = useState(false);
  const tipRef                      = useRef(TIPS[Math.floor(Math.random() * TIPS.length)]);

  const check = useCallback(async () => {
    setChecking(true);
    try {
      const res = await fetch(`${BASE_URL}/auth/me`, { credentials: 'include' });
      if (res.status < 500) {
        setRecovered(true);
        setTimeout(() => {
          if (onRetry) onRetry();
          else window.location.reload();
        }, 900);
        return;
      }
    } catch {
      // Server unreachable — keep retrying
    }
    setChecking(false);
    setAttempts((a) => a + 1);
  }, [onRetry]);

  useEffect(() => {
    const id = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) {
          check();
          return RETRY_INTERVAL;
        }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [check]);

  const handleManualRetry = () => {
    setCountdown(RETRY_INTERVAL);
    check();
  };

  // SVG countdown ring
  const r          = 30;
  const circ       = 2 * Math.PI * r;
  const dashOffset = ((RETRY_INTERVAL - countdown) / RETRY_INTERVAL) * circ;

  if (recovered) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-[#0f172a] z-50">
        <div className="text-center animate-pulse">
          <div className="w-16 h-16 rounded-full bg-emerald-900/60 border border-emerald-500/40 flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <p className="text-lg font-semibold text-white">Connected! Resuming your session…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-[#0f172a] via-[#1a2744] to-[#0f172a] px-6 py-12">

      {/* Animated icon */}
      <div className="relative mb-10">
        <div className="w-24 h-24 rounded-full bg-indigo-950 border border-indigo-700/40 flex items-center justify-center shadow-[0_0_40px_rgba(99,102,241,0.15)]">
          <ServerCrash size={38} className="text-indigo-400" />
        </div>
        <span className="absolute inset-0 rounded-full border-2 border-indigo-500/20 animate-ping" />
      </div>

      {/* Heading */}
      <h1 className="text-[32px] font-bold text-white text-center mb-3 tracking-tight">
        We hit a snag.
      </h1>
      <p className="text-slate-400 text-center text-[15px] max-w-sm leading-relaxed mb-2">
        {message || 'Our server ran into an issue. Your progress and all your data are completely safe.'}
      </p>
      <p className="text-indigo-400 text-sm mb-12 text-center">
        Reconnecting automatically in the background.
      </p>

      {/* Countdown ring */}
      <div className="relative flex items-center justify-center mb-8">
        <svg width="84" height="84" className="-rotate-90">
          {/* Track */}
          <circle cx="42" cy="42" r={r} fill="none" stroke="#1e2d4a" strokeWidth="5" />
          {/* Progress */}
          <circle
            cx="42" cy="42" r={r}
            fill="none"
            stroke={checking ? '#10b981' : '#6366f1'}
            strokeWidth="5"
            strokeLinecap="round"
            strokeDasharray={circ}
            strokeDashoffset={checking ? circ : dashOffset}
            style={{ transition: checking ? 'none' : 'stroke-dashoffset 1s linear, stroke 0.3s ease' }}
          />
        </svg>
        <div className="absolute flex flex-col items-center justify-center">
          {checking
            ? <RefreshCw size={18} className="text-emerald-400 animate-spin" />
            : <>
                <span className="text-2xl font-bold text-white leading-none">{countdown}</span>
                <span className="text-[10px] text-slate-500 mt-0.5">sec</span>
              </>
          }
        </div>
      </div>

      {/* Label under ring */}
      <p className="text-slate-500 text-xs mb-8 text-center">
        {checking ? 'Checking server…' : `Retrying in ${countdown}s`}
        {attempts > 0 && ` · ${attempts} attempt${attempts !== 1 ? 's' : ''} made`}
      </p>

      {/* Manual retry button */}
      <button
        onClick={handleManualRetry}
        disabled={checking}
        className="flex items-center gap-2.5 px-7 py-3.5 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 disabled:opacity-50 text-white text-[15px] font-semibold rounded-xl transition-all shadow-lg shadow-indigo-900/40 mb-12"
      >
        <RefreshCw size={15} className={checking ? 'animate-spin' : ''} />
        {checking ? 'Checking…' : 'Try Again Now'}
      </button>

      {/* Divider */}
      <div className="w-64 border-t border-slate-700/50 mb-8" />

      {/* SAT tip */}
      <div className="max-w-xs text-center">
        <p className="text-[11px] font-semibold text-indigo-500 uppercase tracking-widest mb-2">
          While you wait
        </p>
        <p className="text-slate-500 text-[13px] leading-relaxed italic">
          "{tipRef.current}"
        </p>
      </div>

    </div>
  );
}
